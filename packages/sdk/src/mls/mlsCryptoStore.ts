import { LocalEpochSecret, LocalView } from './view/local'
import Dexie from 'dexie'
import { EpochRecord, IGroupStateStorage } from '@river-build/mls-rs-wasm'

export type LocalViewDTO = {
    streamId: string
    groupId: Uint8Array
    pendingInfo: LocalView['pendingInfo']
    rejectedEpoch: LocalView['rejectedEpoch']
}

export type LocalEpochSecretDTO = {
    streamId: string
    epoch: string
    secret: Uint8Array
    derivedKeys: {
        publicKey: Uint8Array
        secretKey: Uint8Array
    }
}

type GroupStateDTO = {
    groupId: string
    data: Uint8Array
    maxEpochId: bigint
}

type EpochRecordDTO = {
    groupId: string
    epochId: string
    data: Uint8Array
}

type UserDeviceDTO = {
    userId: string
    deviceKey: Uint8Array
}

/// GroupStateId is a branded string to avoid accidental use of an ordinary
/// string as a group state id. Brand exists only during compile-time and
// does not occur any run-time cost.
type GroupStateId = string & { __brand: 'GroupStateId' }

/// Convert uint8Array to Base64 string
function uint8ArrayToBase64(arr: Uint8Array): string {
    // Convert Uint8Array to a raw binary string
    const binaryString = Array.from(arr, (byte) => String.fromCharCode(byte)).join('')
    // Encode the binary string as Base64
    return btoa(binaryString)
}

/// Convert uint8Array to GroupStateId
function groupStateId(groupId: Uint8Array): GroupStateId {
    const base64GroupId = uint8ArrayToBase64(groupId)
    return base64GroupId as GroupStateId
}

export function toLocalEpochSecretDTO(
    streamId: string,
    epochSecret: LocalEpochSecret,
): LocalEpochSecretDTO {
    return {
        streamId,
        epoch: epochSecret.epoch.toString(),
        secret: epochSecret.secret,
        derivedKeys: {
            publicKey: epochSecret.derivedKeys.publicKey,
            secretKey: epochSecret.derivedKeys.secretKey,
        },
    }
}

export function toLocalViewDTO(streamId: string, localView: LocalView): LocalViewDTO {
    return {
        streamId,
        groupId: localView.group.groupId,
        pendingInfo: localView.pendingInfo,
        rejectedEpoch: localView.rejectedEpoch,
    }
}

export class MlsCryptoStore extends Dexie implements IGroupStateStorage {
    localViews!: Dexie.Table<LocalViewDTO>
    epochSecrets!: Dexie.Table<LocalEpochSecretDTO>
    groupStates!: Dexie.Table<GroupStateDTO>
    epochRecords!: Dexie.Table<EpochRecordDTO>
    devices!: Dexie.Table<UserDeviceDTO>
    // TODO: not sure if needed
    userId: string
    private maxEpochRetention

    constructor(databaseName: string, userId: string, maxEpochRetention: bigint = 3n) {
        super(databaseName)
        this.userId = userId
        this.maxEpochRetention = maxEpochRetention
        this.version(1).stores({
            localViews: 'streamId',
            epochSecrets: '[streamId+epoch],streamId',
            groupStates: 'groupId',
            epochRecords: '[groupId+epochId],groupId',
            devices: 'userId',
        })
    }

    public async saveLocalViewDTO(
        viewDTO: LocalViewDTO,
        epochSecretDTOs: LocalEpochSecretDTO[],
    ): Promise<void> {
        return this.transaction('rw', this.localViews, this.epochSecrets, async () => {
            await this.localViews.put(viewDTO)
            await this.epochSecrets.bulkPut(epochSecretDTOs)
        })
    }

    public async getLocalViewDTO(
        streamId: string,
    ): Promise<{ viewDTO: LocalViewDTO; epochSecretDTOs: LocalEpochSecretDTO[] } | undefined> {
        return this.transaction('r', this.localViews, this.epochSecrets, async () => {
            const viewDTO = await this.localViews.get(streamId)
            if (viewDTO !== undefined) {
                const epochSecretDTOs = await this.epochSecrets
                    .where('streamId')
                    .equals(streamId)
                    .toArray()
                return {
                    viewDTO,
                    epochSecretDTOs,
                }
            }
            return undefined
        })
    }

    async state(groupId: Uint8Array): Promise<Uint8Array | undefined> {
        const groupId_ = groupStateId(groupId)
        const groupState = await this.groupStates.get(groupId_)
        return groupState?.data
    }

    async epoch(groupId: Uint8Array, epochId: bigint): Promise<Uint8Array | undefined> {
        const groupId_ = groupStateId(groupId)
        const epochId_ = epochId.toString()
        const epoch = await this.epochRecords.get({ groupId: groupId_, epochId: epochId_ })
        return epoch?.data
    }

    async write(
        stateId: Uint8Array,
        stateData: Uint8Array,
        epochInserts: EpochRecord[],
        epochUpdates: EpochRecord[],
    ): Promise<void> {
        await this.transaction('rw', this.groupStates, this.epochRecords, async () => {
            const groupId_ = groupStateId(stateId)
            let maxEpochId = -1n
            // process inserts
            const epochInserts_ = epochInserts.map((e) => {
                const epochId_ = e.id.toString()
                maxEpochId = e.id

                return {
                    groupId: groupId_,
                    epochId: epochId_,
                    data: e.data,
                }
            })
            await this.epochRecords.bulkAdd(epochInserts_)

            const epochUpdates_ = epochUpdates.map((e) => {
                const epochId_ = e.id.toString()

                return {
                    groupId: groupId_,
                    epochId: epochId_,
                    data: e.data,
                }
            })
            await this.epochRecords.bulkPut(epochUpdates_)

            // Remove epochs below maxEpochRetention
            // Unfortunately has to go over all epochs
            if (maxEpochId > this.maxEpochRetention) {
                const deleteUnder = maxEpochId - this.maxEpochRetention
                await this.epochRecords
                    .where('groupId')
                    .equals(groupId_)
                    .filter((e) => BigInt(e.epochId) <= deleteUnder)
                    .delete()
            }

            // update group state
            await this.groupStates.put({
                groupId: groupId_,
                data: stateData,
                maxEpochId: maxEpochId,
            })
        })
    }

    async maxEpochId(groupId: Uint8Array): Promise<bigint | undefined> {
        const groupId_ = groupStateId(groupId)
        const groupState = await this.groupStates.get(groupId_)
        const maxEpochId = groupState?.maxEpochId

        if (maxEpochId === undefined) {
            return undefined
        }

        // guard against incorrect values
        if (maxEpochId < 0n) {
            return undefined
        }

        return maxEpochId
    }

    async getDeviceKey(userId: string): Promise<Uint8Array | undefined> {
        const device = await this.devices.get(userId)
        return device?.deviceKey
    }

    async setDeviceKey(userId: string, deviceKey: Uint8Array): Promise<void> {
        await this.devices.put({ userId, deviceKey })
    }
}
