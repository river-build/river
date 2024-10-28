import { Client as MlsClient, Group as MlsGroup } from '@river-build/mls-rs-wasm'

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
}
