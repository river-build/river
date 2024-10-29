import {
    ExternalClient,
    Client as MlsClient,
    Group as MlsGroup,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import { EncryptedData } from '@river-build/proto'
import { hexToBytes } from 'ethereum-cryptography/utils'

export class MlsCrypto {
    private client!: MlsClient
    private userAddress: string
    private groups: Map<string, MlsGroup> = new Map()
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
        return (await group.groupInfoMessageAllowingExtCommit(true)).toBytes()
    }

    public async encrypt(streamId: string, message: Uint8Array): Promise<EncryptedData> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        const ciphertext = (await group.encryptApplicationMessage(message)).toBytes()
        return new EncryptedData({ algorithm: 'mls', mlsPayload: ciphertext })
    }

    public async decrypt(streamId: string, encryptedData: EncryptedData): Promise<Uint8Array> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }

        if (!encryptedData.mlsPayload) {
            throw new Error('Not an MLS payload')
        }

        const message = MlsMessage.fromBytes(encryptedData.mlsPayload)

        const plaintext = (await group.processIncomingMessage(message)).asApplicationMessage()
        if (!plaintext) {
            throw new Error('unable to decrypt message')
        }
        return plaintext.data()
    }

    public async handleGroupInfo(
        streamId: string,
        groupInfo: Uint8Array,
    ): Promise<Uint8Array | undefined> {
        if (this.groups.has(streamId)) {
            return
        }

        const externalClient = new ExternalClient()
        const externalGroup = await externalClient.observeGroup(groupInfo)

        const { group, commit } = await this.client.commitExternal(MlsMessage.fromBytes(groupInfo))
        this.groups.set(streamId, group)
        return commit.toBytes()
    }

    public hasGroup(streamId: string): boolean {
        return this.groups.has(streamId)
    }

    public async processOutstandingEvents(streamId: string) {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }

        // 1. Clear pending leaves -> Commit?
        // look inside stream view, look inside the pending leaves dictionary, clear it
        const commits: Uint8Array[] = []
        for (const commit of commits) {
            await group.processIncomingMessage(MlsMessage.fromBytes(commit))
        }
    }
}
