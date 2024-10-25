import { Client, ExternalClient, Group, MlsMessage } from '@river-build/mls-rs-wasm'
import { MlsEvent_Welcome } from '@river-build/proto'

export class MlsCrypto {
    private client!: Client
    private externalClient!: ExternalClient
    private userAddress: string
    private groups: Map<string, Group> = new Map()
    private _keyPackage!: Uint8Array

    get keyPackage() {
        return this._keyPackage
    }

    constructor(userAddress: string) {
        this.userAddress = userAddress
    }

    async initialize() {
        this.client = await Client.create(this.userAddress)
        this._keyPackage = (await this.client.generateKeyPackageMessage()).toBytes()
    }

    async bootstrap(streamId: string): Promise<Uint8Array> {
        const group = await this.client.createGroup()
        this.groups.set(streamId, group)
        return (await group.groupInfoMessage(true)).toBytes()
    }

    async encrypt(streamId: string, bytes: Uint8Array): Promise<Uint8Array> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('No group')
        }
        return (await group.encryptApplicationMessage(bytes)).toBytes()
    }

    // We know that this is an MLS message
    async decrypt(streamId: string, bytes: Uint8Array): Promise<Uint8Array> {
        // this can throw exceptions
        const group = this.groups.get(streamId)
        if (!group) {
            // how to defend ourselves against the case where 1 undecryptable message doesn't cause all clients to request keys
            throw new Error('No group')
        }

        // TODO: This can throw exceptions
        const receivedMessage = await group.processIncomingMessage(MlsMessage.fromBytes(bytes))
        const applicationMessage = receivedMessage.asApplicationMessage()
        if (!applicationMessage) {
            // how to defend ourselves against the case where 1 undecryptable message doesn't cause all clients to request keys
            // TODO: What about unprocessed commits
            throw new Error('Could not decrypt message (Programmer error)')
        }
        return applicationMessage.data()
    }

    async join(streamId: string, welcome: Uint8Array): Promise<Group> {
        const welcomeMessage = MlsMessage.fromBytes(welcome)
        const { group } = await this.client.joinGroup(welcomeMessage)
        this.groups.set(streamId, group)
        return group
    }

    async processCommit(streamId: string, commit: Uint8Array) {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('No group')
        }
        const x = await group.processIncomingMessage(MlsMessage.fromBytes(commit))
        const y = x.asCommitMessage()

        if (!y) {
            throw new Error('Not a commit message (Programmer error)')
        }
    }

    async addMember(
        streamId: string,
        keyPackage: Uint8Array,
    ): Promise<{
        commit: Uint8Array
        welcome: Uint8Array
    }> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('No group')
        }
        const {
            commitMessage: commit,
            welcomeMessages: [welcome],
        } = await group.addMember(MlsMessage.fromBytes(keyPackage))

        return { commit: commit.toBytes(), welcome: welcome.toBytes() }
    }
}
