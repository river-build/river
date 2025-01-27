import TypedEmitter from 'typed-emitter'
import { StreamEncryptionEvents, StreamStateEvents, SyncedStreamEvents } from '../streamEvents'
import { MlsQueue, MlsQueueDelegate, StreamUpdate } from './mlsQueue'
import { bin_toHexString, dlog } from '@river-build/dlog'
import { MlsLogger } from './logger'
import { MlsStream } from './mlsStream'
import { MlsProcessor } from './mlsProcessor'
import { Client } from '../client'
import { MLS_ALGORITHM } from './constants'
import { EncryptedContent } from '../encryptedContentTypes'
import { Stream } from '../stream'
import { IPersistenceStore } from '../persistenceStore'
import { MlsCryptoStore, toLocalEpochSecretDTO, toLocalViewDTO } from './mlsCryptoStore'
import { LocalView } from './localView'
import { IndefiniteValueAwaiter } from './awaiter'

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
    private readonly persistenceStore: IPersistenceStore
    private readonly encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>
    private readonly stateEmitter?: TypedEmitter<StreamStateEvents>

    public readonly streams: Map<string, MlsStream> = new Map()
    public readonly processor: MlsProcessor
    public readonly queue: MlsQueue
    public readonly store: MlsCryptoStore

    private initRequests: Map<string, IndefiniteValueAwaiter<MlsStream>> = new Map()

    private log: MlsLogger
    private started: boolean = false
    public mlsAlwaysEnabled: boolean = false

    public constructor(
        client: Client,
        // mlsClient: MlsClient,
        processor: MlsProcessor,
        queue: MlsQueue,
        store: MlsCryptoStore,
        persistenceStore: IPersistenceStore,
        encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>,
        stateEmitter?: TypedEmitter<StreamStateEvents>,
        opts: MlsAgentOpts = defaultMlsAgentOpts,
    ) {
        this.client = client
        // this.mlsClient = mlsClient
        this.persistenceStore = persistenceStore
        this.encryptionEmitter = encryptionEmitter
        this.stateEmitter = stateEmitter
        this.processor = processor
        this.queue = queue
        this.store = store
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
        this.log.debug?.('onStreamInitialized', streamId)
        this.queue.enqueueStreamUpdate(streamId)
    }

    public readonly onConfirmedEvent: StreamEncryptionEvents['mlsQueueConfirmedEvent'] = (
        ...args
    ): void => {
        this.log.debug?.('agent: onConfirmedEvent', {
            confirmedEventNum: args[1].confirmedEventNum,
            case: args[1].case,
        })
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
        this.log.debug?.('onNewEncryptedContent', streamId, eventId, content.content.mls?.epoch)
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
    public async initMlsStream(stream: Stream): Promise<MlsStream> {
        this.log.debug?.('initStream', stream.streamId)

        let mlsStream = this.streams.get(stream.streamId)

        if (mlsStream !== undefined) {
            this.log.warn?.('agent: stream already initialized', stream.streamId)
            return mlsStream
        }

        const existingAwaiter = this.initRequests.get(stream.streamId)
        if (existingAwaiter !== undefined) {
            return existingAwaiter.promise
        }

        const innerAwaiter = new IndefiniteValueAwaiter<MlsStream>()
        const awaiter = {
            promise: innerAwaiter.promise.then((value) => {
                this.initRequests.delete(stream.streamId)
                return value
            }),
            resolve: innerAwaiter.resolve,
        }

        this.initRequests.set(stream.streamId, awaiter)

        // fetch localview from storage
        let localView: LocalView | undefined
        const dtos = await this.store.getLocalViewDTO(stream.streamId)
        if (dtos !== undefined) {
            this.log.debug?.('loading local view', stream.streamId)
            this.log.debug?.('loading group', bin_toHexString(dtos.viewDTO.groupId))
            try {
                localView = await this.processor.loadLocalView(dtos.viewDTO)
                for (const localEpochSecretDTO of dtos.epochSecretDTOs) {
                    const epochSecret = {
                        epoch: BigInt(localEpochSecretDTO.epoch),
                        secret: localEpochSecretDTO.secret,
                        derivedKeys: {
                            publicKey: localEpochSecretDTO.derivedKeys.publicKey,
                            secretKey: localEpochSecretDTO.derivedKeys.secretKey,
                        },
                    }
                    localView.epochSecrets.set(epochSecret.epoch, epochSecret)
                }
            } catch (e) {
                this.log.error?.('loadLocalView error', stream.streamId, e)
            }
        }

        mlsStream = new MlsStream(stream.streamId, stream, this.persistenceStore, localView)
        this.streams.set(stream.streamId, mlsStream)
        awaiter.resolve(mlsStream)

        return awaiter.promise
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

            // Persisting the group to storage
            if (mlsStream.localView !== undefined) {
                const localViewDTO = toLocalViewDTO(mlsStream.streamId, mlsStream.localView)
                const epochSecretsDTOs = Array.from(mlsStream.localView.epochSecrets.values()).map(
                    (epochSecret) => toLocalEpochSecretDTO(mlsStream.streamId, epochSecret),
                )
                await this.store.saveLocalViewDTO(localViewDTO, epochSecretsDTOs)
                this.log.debug?.('saving group', bin_toHexString(mlsStream.localView.group.groupId))
                await mlsStream.localView.group.writeToStorage()
            }
        }
    }
}
