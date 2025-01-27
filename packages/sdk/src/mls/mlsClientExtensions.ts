import { Message } from '@bufbuild/protobuf'
import { EncryptedData } from '@river-build/proto'
import { MlsAgent, MlsAgentOpts } from './mlsAgent'
import { Client as MlsClient, ClientOptions as MlsClientOptions } from '@river-build/mls-rs-wasm'
import { MlsQueue, MlsQueueOpts } from './mlsQueue'
import { Client } from '../client'
import { MlsProcessor, MlsProcessorOpts } from './mlsProcessor'
import { IPersistenceStore } from '../persistenceStore'
import { fromSingle, MlsLogger } from './logger'
import { bin_fromHexString, bin_toHexString, dlog, DLogger } from '@river-build/dlog'
import { Stream } from '../stream'
import { MlsCryptoStore } from './mlsCryptoStore'
import { randomBytes } from 'crypto'

const defaultMlsClientOpts: MlsClientOptions = {
    withAllowExternalCommit: true,
    withRatchetTreeExtension: false,
}

export type MlsClientExtensionsOpts = {
    mlsAlwaysEnabled?: boolean
    delayMs?: number
    log: DLogger
}

function makeMlsProcessorOpts(log: DLogger): MlsProcessorOpts {
    return {
        log: fromSingle(log.extend('mlsProcessor')),
        sendingOptions: {
            method: 'mls',
        },
    }
}

function makeMlsAgentOpts(log: DLogger, mlsAlwaysEnabled: boolean): MlsAgentOpts {
    return {
        log: fromSingle(log.extend('mlsAgent')),
        mlsAlwaysEnabled,
    }
}

function makeMlsQueueOpts(log: DLogger, delayMs: number): MlsQueueOpts {
    return {
        log: fromSingle(log.extend('mlsQueue')),
        delayMs,
    }
}

const defaultLogger = dlog('csb:mls:client')

export class MlsClientExtensions {
    private readonly client: Client
    private readonly persistenceStore: IPersistenceStore
    public agent?: MlsAgent
    private mlsClient?: MlsClient
    private opts: MlsClientExtensionsOpts = { log: defaultLogger }
    private readonly mlsClientOptions: MlsClientOptions
    private log: MlsLogger
    private readonly store: MlsCryptoStore

    constructor(
        client: Client,
        store: MlsCryptoStore,
        persistenceStore: IPersistenceStore,
        mlsClientExtensionsOpts?: MlsClientExtensionsOpts,
    ) {
        this.client = client
        this.persistenceStore = persistenceStore
        if (mlsClientExtensionsOpts !== undefined) {
            this.opts = mlsClientExtensionsOpts
        }
        this.log = fromSingle(this.opts.log)
        this.store = store

        this.mlsClientOptions = { ...defaultMlsClientOpts, storage: this.store }
    }

    public start(): void {
        this.agent?.start()
        this.agent?.queue.start()
    }

    public async stop(): Promise<void> {
        await this.agent?.queue.stop()
        this.agent?.stop()
    }

    public async initialize(): Promise<void> {
        let deviceKey = await this.store.getDeviceKey(this.client.userId)
        if (deviceKey === undefined) {
            deviceKey = randomBytes(16)
            this.log.debug?.('deviceKey not found, generating new one')
            await this.store.setDeviceKey(this.client.userId, deviceKey)
        }
        this.log.debug?.('deviceKey', bin_toHexString(deviceKey))
        const userIdBytes = bin_fromHexString(this.client.userId)
        const name = new Uint8Array(userIdBytes.length + deviceKey.length)
        name.set(userIdBytes)
        name.set(deviceKey, userIdBytes.length)
        this.log.debug?.('name', bin_toHexString(name))
        this.mlsClient = await MlsClient.create(name, this.mlsClientOptions)
        const queue = new MlsQueue(
            undefined,
            makeMlsQueueOpts(this.opts.log, this.opts.delayMs ?? 15),
        )
        const processor = new MlsProcessor(
            this.client,
            this.mlsClient,
            this.persistenceStore,
            makeMlsProcessorOpts(this.opts.log),
        )
        this.agent = new MlsAgent(
            this.client,
            processor,
            queue,
            this.store,
            this.persistenceStore,
            this.client,
            this.client,
            makeMlsAgentOpts(this.opts.log, this.opts.mlsAlwaysEnabled ?? false),
        )
        this.agent.queue.delegate = this.agent
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
            this.agent.queue.enqueueStreamUpdate(streamId)
        }
        return this.agent.processor.encryptMessage(mlsStream, message)
    }
}
