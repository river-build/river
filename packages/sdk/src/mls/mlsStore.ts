import { bin_toString, DLogger } from '@river-build/dlog'
import Dexie, { Table } from 'dexie'
import { IEpochSecretStore } from './epoch/epochSecretStore'
import { EpochSecret } from './epoch/epochSecret'

// EpochSecretDTO replaces epoch: bigint with epoch: string
type EpochSecretDTO = Omit<EpochSecret, 'epoch'> & { epoch: string }

export class MlsStore extends Dexie implements IEpochSecretStore {
    epochKeys!: Table<EpochSecretDTO>
    log: DLogger

    constructor(deviceKey: Uint8Array, log: DLogger) {
        const databaseName = `mlsStore-${bin_toString(deviceKey)}`
        super(databaseName)

        this.log = log

        this.version(1).stores({
            epochKeys: '[streamId+epoch]',
        })
    }

    async getEpochSecret(streamId: string, epoch: bigint): Promise<EpochSecret | undefined> {
        const epochKeyDTO = await this.epochKeys.get([streamId, epoch.toString()])
        if (epochKeyDTO === undefined) {
            return undefined
        }

        return { ...epochKeyDTO, epoch }
    }
    async setEpochSecret(epochKey: EpochSecret): Promise<void> {
        const epoch = epochKey.epoch.toString()
        await this.epochKeys.put({ ...epochKey, epoch })
    }
}
