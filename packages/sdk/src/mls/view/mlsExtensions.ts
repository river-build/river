import TypedEmitter from 'typed-emitter'
import { StreamEncryptionEvents } from '../../streamEvents'
import { MlsQueue } from './mlsQueue'
import { dlog, DLogger } from '@river-build/dlog'

const defaultLogger = dlog('csb:mls:extensions')

export type MlsExtensionsOpts = {
    log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }
}

const defaultMlsExtensionsOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
    delayMs: 15,
    sendingOptions: {},
}

export class MlsExtensions {
    // private readonly client: Client
    // private readonly mlsClient: MlsClient
    // private readonly persistenceStore?: IPersistenceStore
    private readonly encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>

    // private viewAdapter: ViewAdapter
    // private processor: MlsProcessor
    private queue: MlsQueue

    private log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }

    public constructor(
        // client: Client,
        // mlsClient: MlsClient,
        // viewAdapter: ViewAdapter,
        // processor: MlsProcessor,
        queue: MlsQueue,
        // persistenceStore: IPersistenceStore,
        encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>,
        opts: MlsExtensionsOpts = defaultMlsExtensionsOpts,
    ) {
        // this.client = client
        // this.mlsClient = mlsClient
        // this.persistenceStore = persistenceStore
        this.encryptionEmitter = encryptionEmitter
        // this.viewAdapter = viewAdapter
        // this.processor = processor
        this.queue = queue
        this.log = opts.log
    }

    public start(): void {
        this.encryptionEmitter?.on('mlsInitializeGroup', this.onStreamUpdated)
        this.encryptionEmitter?.on('mlsExternalJoin', this.onStreamUpdated)
        this.encryptionEmitter?.on('mlsEpochSecrets', this.onStreamUpdated)
        this.encryptionEmitter?.on('mlsNewEncryptedContent', this.onStreamUpdated)
    }

    public stop(): void {
        this.encryptionEmitter?.off('mlsInitializeGroup', this.onStreamUpdated)
        this.encryptionEmitter?.off('mlsExternalJoin', this.onStreamUpdated)
        this.encryptionEmitter?.off('mlsEpochSecrets', this.onStreamUpdated)
        this.encryptionEmitter?.off('mlsNewEncryptedContent', this.onStreamUpdated)
    }

    public readonly onStreamUpdated = (streamId: string): void => {
        this.queue.enqueueUpdatedStream(streamId)
    }
}
