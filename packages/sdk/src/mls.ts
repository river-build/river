import {
    CipherSuite,
    ExternalClient,
    HpkeCiphertext,
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

        const cipherSuite = new CipherSuite()
        const epochSecret = await group.currentEpochSecret()
        const keys = await cipherSuite.kemDerive(epochSecret)
        const ciphertext = await cipherSuite.seal(keys.publicKey, message)
        return new EncryptedData({ algorithm: 'mls', mlsPayload: ciphertext.toBytes() })
    }

    public async decrypt(streamId: string, encryptedData: EncryptedData): Promise<Uint8Array> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }

        if (!encryptedData.mlsPayload) {
            throw new Error('Not an MLS payload')
        }

        const cipherSuite = new CipherSuite()
        const epochSecret = await group.currentEpochSecret()
        const keys = await cipherSuite.kemDerive(epochSecret)
        const ciphertext = HpkeCiphertext.fromBytes(encryptedData.mlsPayload)
        const plaintext = await cipherSuite.open(ciphertext, keys.secretKey, keys.publicKey)
        return plaintext
    }

    public async externalJoin(
        streamId: string,
        groupInfo: Uint8Array,
    ): Promise<{ groupInfo: Uint8Array; commit: Uint8Array }> {
        if (this.groups.has(streamId)) {
            throw new Error('Group already exists')
        }

        const { group, commit } = await this.client.commitExternal(MlsMessage.fromBytes(groupInfo))
        this.groups.set(streamId, group)
        const updatedGroupInfo = await group.groupInfoMessageAllowingExtCommit(true)
        return {
            groupInfo: updatedGroupInfo.toBytes(),
            commit: commit.toBytes(),
        }
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
        return { key: secret.toBytes(), epoch: epoch }
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

    public async handleKeyAnnouncement(
        streamId: string,
        keys: { epoch: bigint; key: Uint8Array }[],
    ) {
        //
    }
}
