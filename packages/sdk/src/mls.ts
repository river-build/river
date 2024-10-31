import {
    CipherSuite,
    ExternalClient,
    HpkeCiphertext,
    Client as MlsClient,
    Group as MlsGroup,
    MlsMessage,
    Secret,
} from '@river-build/mls-rs-wasm'
import { EncryptedData } from '@river-build/proto'
import { hexToBytes } from 'ethereum-cryptography/utils'

export class MlsCrypto {
    private client!: MlsClient
    private userAddress: string
    private groups: Map<string, MlsGroup> = new Map()
    // temp, same for all groups for now // not encrypted for now
    public keys: { epoch: bigint; key: Uint8Array }[] = []
    public deviceKey: Uint8Array

    constructor(userAddress: string) {
        this.userAddress = userAddress
        this.deviceKey = hexToBytes(userAddress)
    }

    async initialize() {
        this.client = await MlsClient.create(this.userAddress)
    }

    public async createGroup(streamId: string): Promise<Uint8Array> {
        const group = await this.client.createGroup()
        this.groups.set(streamId, group)
        const epochSecret = await group.currentEpochSecret()
        this.keys.push({ epoch: group.currentEpoch, key: epochSecret.toBytes() })
        return (await group.groupInfoMessageAllowingExtCommit(true)).toBytes()
    }

    public async encrypt(streamId: string, message: Uint8Array): Promise<EncryptedData> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('MLS group not found')
        }

        const cipherSuite = new CipherSuite()
        const epochSecret = await group.currentEpochSecret()
        const keys = await cipherSuite.kemDerive(epochSecret)
        const ciphertext = await cipherSuite.seal(keys.publicKey, message)

        console.log(`ENCRYPTING USING ${group.currentEpoch} ${keys.secretKey.toBytes()}`)
        return new EncryptedData({ algorithm: 'mls', mlsPayload: ciphertext.toBytes() })
    }

    public async decrypt(streamId: string, encryptedData: EncryptedData): Promise<Uint8Array> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('MLS group not found')
        }

        if (!encryptedData.mlsPayload) {
            throw new Error('Not an MLS payload')
        }

        for (const key of this.keys) {
            try {
                const cipherSuite = new CipherSuite()
                const keys = await cipherSuite.kemDerive(Secret.fromBytes(key.key))
                const ciphertext = HpkeCiphertext.fromBytes(encryptedData.mlsPayload)
                return await cipherSuite.open(ciphertext, keys.secretKey, keys.publicKey)
            } catch (e) {
                console.log(`error decrypting using epoch ${key.epoch}`)
            }
        }
        throw new Error('Failed to decrypt')
    }

    public async externalJoin(
        streamId: string,
        groupInfo: Uint8Array,
    ): Promise<{ groupInfo: Uint8Array; commit: Uint8Array; epoch: bigint }> {
        if (this.groups.has(streamId)) {
            throw new Error('Group already exists')
        }

        const { group, commit } = await this.client.commitExternal(MlsMessage.fromBytes(groupInfo))
        this.groups.set(streamId, group)
        const epochSecret = await group.currentEpochSecret()
        this.keys.push({ epoch: group.currentEpoch, key: epochSecret.toBytes() })
        const updatedGroupInfo = await group.groupInfoMessageAllowingExtCommit(true)
        return {
            groupInfo: updatedGroupInfo.toBytes(),
            commit: commit.toBytes(),
            epoch: group.currentEpoch,
        }
    }

    public async externalJoinFailed(streamId: string) {
        this.groups.delete(streamId)
    }

    public async handleCommit(
        streamId: string,
        commit: Uint8Array,
    ): Promise<{ key: Uint8Array; epoch: bigint } | undefined> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        await group.processIncomingMessage(MlsMessage.fromBytes(commit))
        const secret = await group.currentEpochSecret()
        const epoch = group.currentEpoch
        this.keys.push({ epoch, key: secret.toBytes() })
        console.log('COMMIT PROCESSED', epoch)
        return { key: secret.toBytes(), epoch: epoch }
    }

    public hasGroup(streamId: string): boolean {
        return this.groups.has(streamId)
    }

    public async handleKeyAnnouncement(
        streamId: string,
        keys: { epoch: bigint; key: Uint8Array }[],
    ) {
        console.log('GOT KEY ANNOUNCEMENT', keys)
        this.keys.push(...keys)
    }

    public epochFor(streamId: string): bigint {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        return group.currentEpoch
    }
}
