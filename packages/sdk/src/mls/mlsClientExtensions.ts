import { Message } from '@bufbuild/protobuf'
import { EncryptedData } from '@river-build/proto'
import { MlsAgent, MlsAgentOpts } from './mlsAgent'
import { Client as MlsClient, ClientOptions as MlsClientOptions } from '@river-build/mls-rs-wasm'
import { MlsLoop, MlsLoopOpts } from './mlsLoop'
import { Client } from '../client'
import { MlsProcessor, MlsProcessorOpts } from './mlsProcessor'
import { IPersistenceStore } from '../persistenceStore'
import { bin_fromHexString, bin_toHexString, elogger, ELogger } from '@river-build/dlog'
import { Stream } from '../stream'
import { MlsCryptoStore } from './mlsCryptoStore'
import { randomBytes } from 'crypto'

const defaultMlsClientOpts: MlsClientOptions = {
    withAllowExternalCommit: true,
    withRatchetTreeExtension: false,
}

export type MlsClientExtensionsOpts = {
    log: ELogger
} & MlsAgentOpts &
    MlsLoopOpts &
    MlsProcessorOpts

const defaultLogger = elogger('csb:mls:client')
const defaultMlsClientExtensionsOpts: MlsClientExtensionsOpts = {
    log: defaultLogger,
    mlsAlwaysEnabled: false,
}

export class MlsClientExtensions {
    private readonly client: Client
    private readonly persistenceStore: IPersistenceStore
    public agent?: MlsAgent
    private mlsClient?: MlsClient
    private opts: MlsClientExtensionsOpts
    private readonly mlsClientOptions: MlsClientOptions
    private log: ELogger
    private readonly store: MlsCryptoStore

    constructor(
        client: Client,
        store: MlsCryptoStore,
        persistenceStore: IPersistenceStore,
        opts?: MlsClientExtensionsOpts,
    ) {
        this.client = client
        this.persistenceStore = persistenceStore
        const mlsClientExtensionsOpts = {
            ...defaultMlsClientExtensionsOpts,
            ...opts,
        }
        this.opts = mlsClientExtensionsOpts

        this.log = mlsClientExtensionsOpts.log
        this.store = store

        this.mlsClientOptions = { ...defaultMlsClientOpts, storage: this.store }
    }

    public start(): void {
        this.agent?.start()
        this.agent?.loop.start()
    }

    public async stop(): Promise<void> {
        await this.agent?.loop.stop()
        this.agent?.stop()
    }

    public async initialize(): Promise<void> {
        let deviceKey = await this.store.getDeviceKey(this.client.userId)
        if (deviceKey === undefined) {
            deviceKey = randomBytes(16)
            this.log.log('deviceKey not found, generating new one')
            await this.store.setDeviceKey(this.client.userId, deviceKey)
        }
        this.log.log('deviceKey', bin_toHexString(deviceKey))
        const userIdBytes = bin_fromHexString(this.client.userId)
        const name = new Uint8Array(userIdBytes.length + deviceKey.length)
        name.set(userIdBytes)
        name.set(deviceKey, userIdBytes.length)
        this.log.log('name', bin_toHexString(name))
        this.mlsClient = await MlsClient.create(name, this.mlsClientOptions)
        const queue = new MlsLoop(undefined, { ...this.opts, log: this.opts.log.extend('loop') })
        const processor = new MlsProcessor(this.client, this.mlsClient, {
            ...this.opts,
            log: this.opts.log.extend('processor'),
        })
        this.agent = new MlsAgent(
            this.client,
            processor,
            queue,
            this.store,
            this.persistenceStore,
            this.client,
            this.client,
            { ...this.opts, log: this.opts.log.extend('agent') },
        )
        this.agent.loop.delegate = this.agent
    }

    public async initMlsStream(stream: Stream): Promise<void> {
        if (this.agent === undefined) {
            throw new Error('agent not initialized')
        }

        await this.agent?.initMlsStream(stream)
    }

    public async encryptMessage(streamId: string, message: Message): Promise<EncryptedData> {
        if (this.agent === undefined) {
            throw new Error('agent not initialized')
        }
        const stream = this.client.streams.get(streamId)
        if (stream === undefined) {
            throw new Error('stream not initialized')
        }

        const mlsStream = await this.agent.getMlsStream(stream)
        // no local view, need to kickstart the queue
        if (mlsStream.localView === undefined) {
            this.agent.loop.enqueueStreamUpdate(streamId)
        }
        return this.agent.processor.encryptMessage(mlsStream, message)
    }
}
