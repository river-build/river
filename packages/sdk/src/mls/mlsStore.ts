import { bin_toString } from '@river-build/dlog'
import Dexie, { Table } from 'dexie'

interface Key {
    streamId: string
    epoch: string
    bytes: Uint8Array
}

interface Group {
    streamId: string
    bytes: Uint8Array
}

interface EpochSecret {
    streamId: string
    epoch: string
    bytes: Uint8Array
}

export class MlsStore extends Dexie {
    secretKeys!: Table<Key>
    publicKeys!: Table<Key>
    groups!: Table<Group>
    epochSecrets!: Table<EpochSecret>

    constructor(deviceKey: Uint8Array) {
        const databaseName = `mlsStore-${bin_toString(deviceKey)}`
        super(databaseName)

        this.version(1).stores({
            secretKeys: '[streamId+epoch]',
            publicKeys: '[streamId+epoch]',
            groups: 'streamId',
            epochSecrets: '[streamId+epoch]',
        })
    }

    async saveSecretKey(streamId: string, epoch: bigint, secretKey: Uint8Array): Promise<void> {
        await this.secretKeys.put({ streamId, epoch: epoch.toString(), bytes: secretKey })
    }

    async getSecretKey(streamId: string, epoch: bigint): Promise<Uint8Array | undefined> {
        // this could either throw or return undefined
        const record = await this.secretKeys.get([streamId, epoch.toString()])
        return record?.bytes
    }

    async savePublicKey(streamId: string, epoch: bigint, secretKey: Uint8Array): Promise<void> {
        await this.publicKeys.put({ streamId, epoch: epoch.toString(), bytes: secretKey })
    }

    async getPublicKey(streamId: string, epoch: bigint): Promise<Uint8Array | undefined> {
        // this could either throw or return undefined
        const record = await this.publicKeys.get([streamId, epoch.toString()])
        return record?.bytes
    }

    async saveGroup(streamId: string, group: Uint8Array): Promise<void> {
        await this.groups.put({ streamId, bytes: group })
    }

    async getGroup(streamId: string): Promise<Uint8Array | undefined> {
        // this could either throw or return undefined
        const record = await this.groups.get(streamId)
        return record?.bytes
    }

    async saveEpochSecret(streamId: string, epoch: bigint, secret: Uint8Array): Promise<void> {
        await this.epochSecrets.put({ streamId, epoch: epoch.toString(), bytes: secret })
    }

    async getEpochSecret(streamId: string, epoch: bigint): Promise<Uint8Array | undefined> {
        // this could either throw or return undefined
        const record = await this.epochSecrets.get([streamId, epoch.toString()])
        return record?.bytes
    }
}
