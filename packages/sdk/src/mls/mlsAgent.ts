import TypedEmitter from 'typed-emitter'
import { StreamEncryptionEvents, StreamStateEvents } from '../streamEvents'
import { MlsQueue } from './mlsQueue'
import { dlog } from '@river-build/dlog'
import { MlsLogger } from './logger'
import { MlsStream } from './mlsStream'
import { MlsProcessor } from './mlsProcessor'
import { Client } from '../client'
import { MLS_ALGORITHM } from './constants'

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
    private readonly client: Client
    // private readonly mlsClient: MlsClient
    // private readonly persistenceStore?: IPersistenceStore
    private readonly encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>
    private readonly stateEmitter?: TypedEmitter<StreamStateEvents>

    public readonly streams: Map<string, MlsStream> = new Map()
    public readonly processor: MlsProcessor
    public readonly queue: MlsQueue
    private readonly enabledStreams: Set<string> = new Set<string>()

    private log: MlsLogger

    public constructor(
        client: Client,
        // mlsClient: MlsClient,
        processor: MlsProcessor,
        queue: MlsQueue,
        // persistenceStore: IPersistenceStore,
        encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>,
        stateEmitter?: TypedEmitter<StreamStateEvents>,
        opts: MlsAgentOpts = defaultMlsAgentOpts,
    ) {
        this.client = client
        // this.mlsClient = mlsClient
        // this.persistenceStore = persistenceStore
        this.encryptionEmitter = encryptionEmitter
        this.stateEmitter = stateEmitter
        this.processor = processor
        this.queue = queue
        this.log = opts.log
    }

    public start(): void {
        this.encryptionEmitter?.on('mlsQueueConfirmedEvent', this.onStreamUpdated)
        this.encryptionEmitter?.on('mlsQueueSnapshot', this.onStreamUpdated)
        this.stateEmitter?.on(
            'streamEncryptionAlgorithmUpdated',
            this.onStreamEncryptionAlgorithmUpdated,
        )
    }

    public stop(): void {
        this.encryptionEmitter?.off('mlsQueueConfirmedEvent', this.onStreamUpdated)
        this.encryptionEmitter?.off('mlsQueueSnapshot', this.onStreamUpdated)
        this.stateEmitter?.off(
            'streamEncryptionAlgorithmUpdated',
            this.onStreamEncryptionAlgorithmUpdated,
        )
    }

    public enableAndParticipate(streamId: string): Promise<void> {
        this.enableStream(streamId)
        return this.handleStreamUpdate(streamId)
    }

    public enableStream(streamId: string) {
        this.enabledStreams.add(streamId)
        if (!this.streams.has(streamId)) {
            this.streams.set(streamId, new MlsStream(streamId, this.client))
        }
    }

    public disableStream(streamId: string) {
        this.enabledStreams.delete(streamId)
    }

    public readonly onStreamUpdated = (streamId: string): void => {
        this.queue.enqueueUpdatedStream(streamId)
    }

    public readonly onStreamEncryptionAlgorithmUpdated = (
        streamId: string,
        encryptionAlgorithm?: string,
    ): void => {
        if (encryptionAlgorithm === MLS_ALGORITHM) {
            this.enableStream(streamId)
        } else {
            this.disableStream(streamId)
        }
    }

    public async handleStreamUpdate(streamId: string): Promise<void> {
        const mlsStream = this.streams.get(streamId)
        if (this.enabledStreams.has(streamId) && mlsStream !== undefined) {
            await mlsStream.handleStreamUpdate()
            await this.processor.initializeOrJoinGroup(mlsStream)
            await this.processor.announceEpochSecrets(mlsStream)
        }
    }
}
