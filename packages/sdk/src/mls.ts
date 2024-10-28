import { Client as MlsClient, Group as MlsGroup } from '@river-build/mls-rs-wasm'
import { EncryptedData } from '@river-build/proto'

export class MlsCrypto {
    private client!: MlsClient
    private userAddress: string
    private groups: Map<string, MlsGroup> = new Map()

    constructor(userAddress: string) {
        this.userAddress = userAddress
    }

    async initialize() {
        this.client = await MlsClient.create(this.userAddress)
    }

    public async createGroup(streamId: string): Promise<Uint8Array> {
        const group = await this.client.createGroup()
        this.groups.set(streamId, group)
        return (await group.groupInfoMessage(true)).toBytes()
    }

    public async encrypt(streamId: string, message: Uint8Array): Promise<EncryptedData> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        const ciphertext = (await group.encryptApplicationMessage(message)).toBytes()
        return new EncryptedData({ algorithm: 'mls', mlsPayload: ciphertext })
    }

    public hasGroup(streamId: string): boolean {
        return this.groups.has(streamId)
    }
}
