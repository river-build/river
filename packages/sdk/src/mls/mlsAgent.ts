import TypedEmitter from 'typed-emitter'
import { StreamEncryptionEvents } from '../streamEvents'
import { MlsQueue } from './mlsQueue'
import { dlog } from '@river-build/dlog'
import { MlsLogger } from './logger'
import { ViewAdapter } from './viewAdapter'
import { MlsProcessor } from './mlsProcessor'

const defaultLogger = dlog('csb:mls:agent')

export type MlsAgentOpts = {
    log: MlsLogger
}

const defaultMlsAgentOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
    delayMs: 15,
    sendingOptions: {},
}

export class MlsAgent {
    // private readonly client: Client
    // private readonly mlsClient: MlsClient
    // private readonly persistenceStore?: IPersistenceStore
    private readonly encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>

    public readonly viewAdapter: ViewAdapter
    public readonly processor: MlsProcessor
    public readonly queue: MlsQueue
    private readonly enabledStreams: Set<string> = new Set<string>()

    private log: MlsLogger

    public constructor(
        // client: Client,
        // mlsClient: MlsClient,
        viewAdapter: ViewAdapter,
        processor: MlsProcessor,
        queue: MlsQueue,
        // persistenceStore: IPersistenceStore,
        encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>,
        opts: MlsAgentOpts = defaultMlsAgentOpts,
    ) {
        // this.client = client
        // this.mlsClient = mlsClient
        // this.persistenceStore = persistenceStore
        this.encryptionEmitter = encryptionEmitter
        this.viewAdapter = viewAdapter
        this.processor = processor
        this.queue = queue
        this.log = opts.log
    }

    public start(): void {
        this.encryptionEmitter?.on('mlsQueueConfirmedEvent', this.onStreamUpdated)
        this.encryptionEmitter?.on('mlsQueueSnapshot', this.onStreamUpdated)
    }

    public stop(): void {
        this.encryptionEmitter?.off('mlsQueueConfirmedEvent', this.onStreamUpdated)
        this.encryptionEmitter?.off('mlsQueueSnapshot', this.onStreamUpdated)
    }

    public enableAndParticipate(streamId: string): Promise<void> {
        this.enableStream(streamId)
        return this.handleStreamUpdate(streamId)
    }

    public enableStream(streamId: string) {
        this.enabledStreams.add(streamId)
    }

    public disableStream(streamId: string) {
        this.enabledStreams.delete(streamId)
    }

    public readonly onStreamUpdated = (streamId: string): void => {
        this.queue.enqueueUpdatedStream(streamId)
    }

    public async handleStreamUpdate(streamId: string): Promise<void> {
        await this.viewAdapter.handleStreamUpdate(streamId)
        if (this.enabledStreams.has(streamId)) {
            await this.processor.initializeOrJoinGroup(streamId)
        }
    }
}
