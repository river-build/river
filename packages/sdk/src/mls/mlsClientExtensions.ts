import { Message } from '@bufbuild/protobuf'
import { EncryptedData } from '@river-build/proto'
import { MlsAgent, MlsAgentOpts } from './mlsAgent'
import { Client as MlsClient, ClientOptions as MlsClientOptions } from '@river-build/mls-rs-wasm'
import { MlsQueue, MlsQueueOpts } from './mlsQueue'
import { Client } from '../client'
import { MlsProcessor, MlsProcessorOpts } from './mlsProcessor'
import { IPersistenceStore } from '../persistenceStore'
import { fromSingle, MlsLogger } from './logger'
import { dlog, DLogger } from '@river-build/dlog'

const mlsClientOptions: MlsClientOptions = {
    withAllowExternalCommit: true,
    withRatchetTreeExtension: false,
}

export type MlsClientExtensionsOpts = {
    nickname?: string
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
    private client: Client
    private persistenceStore?: IPersistenceStore
    public agent?: MlsAgent
    private mlsClient?: MlsClient
    private opts: MlsClientExtensionsOpts = { log: defaultLogger }
    private log: MlsLogger

    constructor(
        client: Client,
        persistenceStore?: IPersistenceStore,
        mlsClientOptions?: MlsClientExtensionsOpts,
    ) {
        this.client = client
        this.persistenceStore = persistenceStore
        if (mlsClientOptions !== undefined) {
            this.opts = mlsClientOptions
        }
        this.log = fromSingle(this.opts.log)
    }

    public start(): void {
        this.agent?.start()
        this.agent?.queue.start()
        // nop
    }

    public async stop(): Promise<void> {
        await this.agent?.queue.stop()
        this.agent?.stop()
        // nop
    }

    public async initialize(deviceKey: Uint8Array): Promise<void> {
        // nop
        this.mlsClient = await MlsClient.create(deviceKey, mlsClientOptions)
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
            this.client,
            this.client,
            makeMlsAgentOpts(this.opts.log, this.opts.mlsAlwaysEnabled ?? false),
        )
        this.agent.queue.delegate = this.agent
    }

    public async encryptMessage(streamId: string, message: Message): Promise<EncryptedData> {
        if (this.agent === undefined) {
            throw new Error('agent not initialized')
        }
        const mlsStream = this.agent.streams.get(streamId)
        if (mlsStream === undefined) {
            throw new Error('stream not initialized')
        }
        return this.agent.processor.encryptMessage(mlsStream, message)
    }
}
