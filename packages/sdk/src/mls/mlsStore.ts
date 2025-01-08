import { bin_toString, DLogger } from '@river-build/dlog'
import Dexie, { Table } from 'dexie'
import { IEpochKeyStore } from './epochKeyStore'
import { EpochKey } from './epochKey'

// EpochKeyDTO replaces epoch: bigint with epoch: string
type EpochKeyDTO = Omit<EpochKey, 'epoch'> & { epoch: string }

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

        return { ...epochKeyDTO, epoch }
    }
    async setEpochKeyState(epochKey: EpochKey): Promise<void> {
        const epoch = epochKey.epoch.toString()
        await this.epochKeys.put({ ...epochKey, epoch })
    }
}
