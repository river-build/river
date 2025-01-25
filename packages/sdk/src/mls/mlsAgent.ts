import TypedEmitter from 'typed-emitter'
import { StreamEncryptionEvents, StreamStateEvents, SyncedStreamEvents } from '../streamEvents'
import { MlsQueue, MlsQueueDelegate, StreamUpdate } from './mlsQueue'
import { dlog } from '@river-build/dlog'
import { MlsLogger } from './logger'
import { MlsStream } from './mlsStream'
import { MlsProcessor } from './mlsProcessor'
import { Client } from '../client'
import { MLS_ALGORITHM } from './constants'
import { EncryptedContent } from '../encryptedContentTypes'
import { Stream } from '../stream'

const defaultLogger = dlog('csb:mls:agent')

export type MlsAgentOpts = {
    log: MlsLogger
    mlsAlwaysEnabled: boolean
}

const defaultMlsAgentOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
    mlsAlwaysEnabled: false,
    delayMs: 15,
    sendingOptions: {},
}

export class MlsAgent implements MlsQueueDelegate {
    private readonly client: Client
    // private readonly mlsClient: MlsClient
    // private readonly persistenceStore?: IPersistenceStore
    private readonly encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>
    private readonly stateEmitter?: TypedEmitter<StreamStateEvents>

    public readonly streams: Map<string, MlsStream> = new Map()
    public readonly processor: MlsProcessor
    public readonly queue: MlsQueue

    private log: MlsLogger
    private started: boolean = false
    public mlsAlwaysEnabled: boolean = false

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
        this.mlsAlwaysEnabled = opts.mlsAlwaysEnabled
    }

    public start(): void {
        this.encryptionEmitter?.on('mlsQueueConfirmedEvent', this.onConfirmedEvent)
        this.encryptionEmitter?.on('mlsQueueSnapshot', this.onSnapshot)
        this.encryptionEmitter?.on('mlsNewEncryptedContent', this.onNewEncryptedContent)
        this.stateEmitter?.on(
            'streamEncryptionAlgorithmUpdated',
            this.onStreamEncryptionAlgorithmUpdated,
        )
        this.stateEmitter?.on('streamInitialized', this.onStreamInitialized)
        this.started = true
    }

    public stop(): void {
        this.encryptionEmitter?.off('mlsQueueConfirmedEvent', this.onConfirmedEvent)
        this.encryptionEmitter?.off('mlsQueueSnapshot', this.onSnapshot)
        this.encryptionEmitter?.off('mlsNewEncryptedContent', this.onNewEncryptedContent)
        this.stateEmitter?.off('streamInitialized', this.onStreamInitialized)
        this.stateEmitter?.off(
            'streamEncryptionAlgorithmUpdated',
            this.onStreamEncryptionAlgorithmUpdated,
        )
        this.started = false
    }

    public readonly onStreamInitialized: StreamStateEvents['streamInitialized'] = (
        streamId: string,
    ): void => {
        this.log.debug?.('agent: onStreamInitialized', streamId)
        this.queue.enqueueStreamUpdate(streamId)
    }

    public readonly onConfirmedEvent: StreamEncryptionEvents['mlsQueueConfirmedEvent'] = (
        ...args
    ): void => {
        this.log.debug?.('agent: onConfirmedEvent', args)
        this.queue.enqueueConfirmedEvent(...args)
    }

    public readonly onSnapshot: StreamEncryptionEvents['mlsQueueSnapshot'] = (...args): void => {
        this.log.debug?.('agent: onSnapshot', args)
        this.queue.enqueueConfirmedSnapshot(...args)
    }

    public readonly onStreamEncryptionAlgorithmUpdated = (
        streamId: string,
        encryptionAlgorithm?: string,
    ): void => {
        this.log.debug?.('agent: onStreamEncryptionAlgorithmUpdated', streamId, encryptionAlgorithm)
        if (encryptionAlgorithm === MLS_ALGORITHM) {
            this.queue.enqueueStreamUpdate(streamId)
        }
    }

    public readonly onNewEncryptedContent: StreamEncryptionEvents['mlsNewEncryptedContent'] = (
        streamId: string,
        eventId: string,
        content: EncryptedContent,
    ): void => {
        this.log.debug?.('agent: onNewEncryptedContent', streamId, eventId, content)
        this.queue.enqueueNewEncryptedContent(streamId, eventId, content)
    }

    public readonly onStreamRemovedFromSync: SyncedStreamEvents['streamRemovedFromSync'] = (
        streamId: string,
    ): void => {
        this.log.debug?.('agent: onStreamRemovedFromSync', streamId)
        // TODO: Persist MLS stuff
        this.streams.delete(streamId)
    }

    // This potentially involves loading from storage
    private async initMlsStream(stream: Stream): Promise<MlsStream> {
        this.log.debug?.('agent: initStream', stream.streamId)

        if (this.streams.has(stream.streamId)) {
            throw new Error('stream already initialized')
        }

        const mlsStream = new MlsStream(stream.streamId, stream)
        this.streams.set(stream.streamId, mlsStream)

        return mlsStream
    }

    public async getMlsStream(stream: Stream): Promise<MlsStream> {
        const mlsStream = this.streams.get(stream.streamId)
        if (mlsStream !== undefined) {
            return mlsStream
        }
        return this.initMlsStream(stream)
    }

    public async handleStreamUpdate(streamUpdate: StreamUpdate): Promise<void> {
        // this.log.debug?.('agent: handleStreamUpdate', streamId, snapshots, confirmedEvents)
        // const mlsStream = this.streams.get(streamId)
        // const mlsEnabled =
        //     mlsStream?.stream.view.snapshot?.members?.encryptionAlgorithm?.algorithm ===
        //         MLS_ALGORITHM || this.mlsAlwaysEnabled
        const streamId = streamUpdate.streamId
        const stream = this.client.streams.get(streamId)
        if (stream === undefined) {
            throw new Error('stream not initialized')
        }

        const encryptionAlgorithm = stream.view.membershipContent.encryptionAlgorithm
        this.log.debug?.('algorithm', encryptionAlgorithm)

        const mlsEnabled = encryptionAlgorithm === MLS_ALGORITHM || this.mlsAlwaysEnabled

        const mlsStream = await this.getMlsStream(stream)

        this.log.debug?.('agent: mlsEnabled', streamId, mlsEnabled)

        if (mlsEnabled) {
            // this.log.debug?.('agent: updated onchain view', streamId, mlsStream.onChainView)
            await mlsStream.handleStreamUpdate(streamUpdate)
            // TODO: this is potentially slow
            await mlsStream.retryDecryptionFailures()

            this.log.debug?.('agent: ', {
                status: mlsStream.localView?.status ?? 'missing',
                onChain: {
                    accepted: mlsStream.onChainView.accepted.size,
                    rejected: mlsStream.onChainView.rejected.size,
                    commits: mlsStream.onChainView.commits.size,
                    sealed: mlsStream.onChainView.sealedEpochSecrets.keys(),
                },
                local: {
                    secrets: mlsStream.localView?.epochSecrets.keys() ?? [],
                },
            })

            if (mlsStream.localView?.status === 'active') {
                this.log.debug?.('agent: active', streamId)
                // TODO: welcome new Clients
            } else {
                this.log.debug?.('agent: inactive', streamId)
                // are there any pending encrypts or decrypts?
                const areTherePendingEncryptsOrDecrypts =
                    mlsStream.decryptionFailures.size > 0 ||
                    mlsStream.awaitingActiveLocalView !== undefined
                if (mlsEnabled || areTherePendingEncryptsOrDecrypts) {
                    this.log.debug?.('agent: initializeOrJoinGroup', streamId)
                    try {
                        await this.processor.initializeOrJoinGroup(mlsStream)
                    } catch (e) {
                        this.log.error?.('agent: initializeOrJoinGroup error', streamId)
                        this.log.error?.('enqueue retry')
                        this.queue.enqueueStreamUpdate(streamId)
                    }
                }
            }
            await this.processor.announceEpochSecrets(mlsStream)
        }
    }
}
