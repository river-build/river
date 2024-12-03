import { bin_toString, DLogger } from '@river-build/dlog'
import Dexie, { Table } from 'dexie'
import { IEpochKeyStore } from './epochKeyStore'
import { EpochKey, EpochKeyState } from './epochKey'
import {
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    Secret as MlsSecret,
} from '@river-build/mls-rs-wasm'

interface EpochKeyDTO {
    streamId: string
    epoch: string
    announced: boolean
    status: string
    openEpochSecret?: Uint8Array
    sealedEpochSecret?: Uint8Array
    secretKey?: Uint8Array
    publicKey?: Uint8Array
}

export class MlsStore extends Dexie implements IEpochKeyStore {
    epochKeys!: Table<EpochKeyDTO>
    log: DLogger

    constructor(deviceKey: Uint8Array, log: DLogger) {
        const databaseName = `mlsStore-${bin_toString(deviceKey)}`
        super(databaseName)

        this.log = log

        this.version(1).stores({
            epochKeys: '[streamId+epoch]',
        })
    }

    async getEpochKey(streamId: string, epoch: bigint): Promise<EpochKey | undefined> {
        const epochKeyDTO = await this.epochKeys.get([streamId, epoch.toString()])
        if (epochKeyDTO === undefined) {
            return undefined
        }

        if (
            epochKeyDTO.status === 'EPOCH_KEY_SEALED' &&
            epochKeyDTO.sealedEpochSecret !== undefined
        ) {
            const sealedEpochSecret = HpkeCiphertext.fromBytes(epochKeyDTO.sealedEpochSecret)
            const state: EpochKeyState = {
                status: 'EPOCH_KEY_SEALED',
                announced: epochKeyDTO.announced,
                sealedEpochSecret,
            }
            return new EpochKey(streamId, epoch, state)
        }
        if (
            epochKeyDTO.status === 'EPOCH_KEY_OPEN' &&
            epochKeyDTO.openEpochSecret !== undefined &&
            epochKeyDTO.secretKey !== undefined &&
            epochKeyDTO.publicKey !== undefined
        ) {
            const openEpochSecret = MlsSecret.fromBytes(epochKeyDTO.openEpochSecret)
            const secretKey = HpkeSecretKey.fromBytes(epochKeyDTO.secretKey)
            const publicKey = HpkePublicKey.fromBytes(epochKeyDTO.publicKey)
            const state: EpochKeyState = {
                status: 'EPOCH_KEY_OPEN',
                openEpochSecret,
                secretKey,
                publicKey,
                announced: epochKeyDTO.announced,
            }
            if (epochKeyDTO.sealedEpochSecret !== undefined) {
                state.sealedEpochSecret = HpkeCiphertext.fromBytes(epochKeyDTO.sealedEpochSecret)
            }
            return new EpochKey(streamId, epoch, state)
        }

        throw new Error(`Invalid epoch key state: ${streamId} ${epoch} ${epochKeyDTO.status}`)
    }
    async setEpochKeyState(epochKey: EpochKey): Promise<void> {
        const streamId = epochKey.streamId
        const epoch = epochKey.epoch.toString()
        let announced: boolean
        let openEpochSecret: Uint8Array | undefined
        let sealedEpochSecret: Uint8Array | undefined
        let epochKeyDTO: EpochKeyDTO
        let publicKey: Uint8Array | undefined
        let secretKey: Uint8Array | undefined

        switch (epochKey.state.status) {
            case 'EPOCH_KEY_SEALED':
                sealedEpochSecret = epochKey.state.sealedEpochSecret.toBytes()
                announced = epochKey.state.announced
                epochKeyDTO = {
                    streamId,
                    epoch,
                    announced,
                    status: 'EPOCH_KEY_SEALED',
                    sealedEpochSecret,
                }

                return this.epochKeys.put(epochKeyDTO)
            case 'EPOCH_KEY_OPEN':
                openEpochSecret = epochKey.state.openEpochSecret.toBytes()
                announced = epochKey.state.announced
                publicKey = epochKey.state.publicKey.toBytes()
                secretKey = epochKey.state.secretKey.toBytes()
                if (epochKey.state.sealedEpochSecret !== undefined) {
                    sealedEpochSecret = epochKey.state.sealedEpochSecret.toBytes()
                }
                epochKeyDTO = {
                    streamId,
                    epoch,
                    announced,
                    status: 'EPOCH_KEY_OPEN',
                    openEpochSecret,
                    sealedEpochSecret,
                    secretKey,
                    publicKey,
                }
                return this.epochKeys.put(epochKeyDTO)
        }
    }
}
