import TypedEmitter from 'typed-emitter'
import { StreamEncryptionEvents, StreamStateEvents, SyncedStreamEvents } from '../streamEvents'
import { MlsLoop } from './mlsLoop'
import { bin_toHexString, elogger, ELogger, shortenHexString } from '@river-build/dlog'
import { DEFAULT_MLS_TIMEOUT, MlsStream, MlsStreamOpts } from './mlsStream'
import { MlsProcessor } from './mlsProcessor'
import { Client } from '../client'
import { MLS_ALGORITHM } from './constants'
import { EncryptedContent } from '../encryptedContentTypes'
import { Stream } from '../stream'
import { IPersistenceStore } from '../persistenceStore'
import { MlsCryptoStore, toLocalEpochSecretDTO, toLocalViewDTO } from './mlsCryptoStore'
import { LocalView } from './view/local'
import { IndefiniteValueAwaiter } from './awaiter'
import { StreamUpdate, StreamUpdateDelegate } from './types'

const defaultLogger = elogger('csb:mls:agent')

export type MlsAgentOpts = {
    log?: ELogger
    mlsAlwaysEnabled?: boolean
} & MlsStreamOpts

const defaultMlsAgentOpts = {
    log: defaultLogger,
    mlsAlwaysEnabled: false,
    delayMs: 15,
    sendingOptions: {},
    awaitLocalViewTimeout: DEFAULT_MLS_TIMEOUT,
}

export class MlsAgent implements StreamUpdateDelegate {
    private readonly client: Client
    // private readonly mlsClient: MlsClient
    private readonly persistenceStore: IPersistenceStore
    private readonly encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>
    private readonly stateEmitter?: TypedEmitter<StreamStateEvents>

    public readonly streams: Map<string, MlsStream> = new Map()
    public readonly processor: MlsProcessor
    public readonly loop: MlsLoop
    public readonly store: MlsCryptoStore

    private initRequests: Map<string, IndefiniteValueAwaiter<MlsStream>> = new Map()

    private log: ELogger
    public mlsAlwaysEnabled: boolean = false
    private readonly awaitLocaViewTimeout

    public constructor(
        client: Client,
        processor: MlsProcessor,
        loop: MlsLoop,
        store: MlsCryptoStore,
        persistenceStore: IPersistenceStore,
        encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>,
        stateEmitter?: TypedEmitter<StreamStateEvents>,
        opts?: MlsAgentOpts,
    ) {
        this.client = client
        this.persistenceStore = persistenceStore
        this.encryptionEmitter = encryptionEmitter
        this.stateEmitter = stateEmitter
        this.processor = processor
        this.loop = loop
        this.store = store

        const mlsAgentOpts = {
            ...defaultMlsAgentOpts,
            ...opts,
        }
        this.log = mlsAgentOpts.log
        this.mlsAlwaysEnabled = mlsAgentOpts.mlsAlwaysEnabled
        this.awaitLocaViewTimeout = mlsAgentOpts.awaitLocalViewTimeout
    }

    public start(): void {
        this.encryptionEmitter?.on('mlsNewEncryptedContent', this.onNewEncryptedContent)
        this.encryptionEmitter?.on('mlsNewConfirmedEvent', this.onConfirmedEvent)
        this.stateEmitter?.on(
            'streamEncryptionAlgorithmUpdated',
            this.onStreamEncryptionAlgorithmUpdated,
        )
        this.stateEmitter?.on('streamInitialized', this.onStreamInitialized)
    }

    public stop(): void {
        this.encryptionEmitter?.off('mlsNewEncryptedContent', this.onNewEncryptedContent)
        this.encryptionEmitter?.off('mlsNewConfirmedEvent', this.onConfirmedEvent)
        this.stateEmitter?.off('streamInitialized', this.onStreamInitialized)
        this.stateEmitter?.off(
            'streamEncryptionAlgorithmUpdated',
            this.onStreamEncryptionAlgorithmUpdated,
        )
    }

    public readonly onStreamInitialized: StreamStateEvents['streamInitialized'] = (
        streamId: string,
    ): void => {
        this.log.log('onStreamInitialized', streamId)
        this.loop.enqueueStreamUpdate(streamId)
    }

    public readonly onConfirmedEvent: StreamEncryptionEvents['mlsNewConfirmedEvent'] = (
        ...args
    ): void => {
        this.log.log('agent: onConfirmedEvent', {
            confirmedEventNum: args[1].confirmedEventNum,
            case: args[1].case,
        })
        this.loop.enqueueConfirmedEvent(...args)
    }

    public readonly onStreamEncryptionAlgorithmUpdated = (
        streamId: string,
        encryptionAlgorithm?: string,
    ): void => {
        this.log.log('agent: onStreamEncryptionAlgorithmUpdated', streamId, encryptionAlgorithm)
        if (encryptionAlgorithm === MLS_ALGORITHM) {
            this.loop.enqueueStreamUpdate(streamId)
        }
    }

    public readonly onNewEncryptedContent: StreamEncryptionEvents['mlsNewEncryptedContent'] = (
        streamId: string,
        eventId: string,
        content: EncryptedContent,
    ): void => {
        this.log.log('onNewEncryptedContent', streamId, eventId, content.content.mls?.epoch)
        this.loop.enqueueNewEncryptedContent(streamId, eventId, content)
    }

    public readonly onStreamRemovedFromSync: SyncedStreamEvents['streamRemovedFromSync'] = (
        streamId: string,
    ): void => {
        this.log.log('agent: onStreamRemovedFromSync', streamId)
        // TODO: Persist MLS stuff
        this.streams.delete(streamId)
    }

    // This potentially involves loading from storage
    public async initMlsStream(stream: Stream): Promise<MlsStream> {
        this.log.log('initStream', stream.streamId)

        let mlsStream = this.streams.get(stream.streamId)

        if (mlsStream !== undefined) {
            this.log.log('stream already initialized', stream.streamId)
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
            this.log.log('loading local view', stream.streamId)
            this.log.log('loading group', bin_toHexString(dtos.viewDTO.groupId))
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

        const mlsStreamOpts = {
            log: this.log.extend(shortenHexString(stream.streamId)),
            awaitLocalViewTimeout: this.awaitLocaViewTimeout,
        }
        mlsStream = new MlsStream(
            stream.streamId,
            stream,
            this.persistenceStore,
            localView,
            mlsStreamOpts,
        )
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
        const streamId = streamUpdate.streamId
        const stream = this.client.streams.get(streamId)
        if (stream === undefined) {
            throw new Error('stream not initialized')
        }

        const encryptionAlgorithm = stream.view.membershipContent.encryptionAlgorithm
        this.log.log('algorithm', encryptionAlgorithm)

        const mlsEnabled = encryptionAlgorithm === MLS_ALGORITHM || this.mlsAlwaysEnabled

        const mlsStream = await this.getMlsStream(stream)

        this.log.log('agent: mlsEnabled', streamId, mlsEnabled)

        if (mlsEnabled) {
            // this.log.debug?.('agent: updated onchain view', streamId, mlsStream.onChainView)
            await mlsStream.handleStreamUpdate(streamUpdate)
            // TODO: this is potentially slow
            await mlsStream.retryDecryptionFailures()

            this.log.log('agent: ', {
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
                this.log.log('agent: active', streamId)
                // TODO: welcome new Clients
            } else {
                this.log.log('agent: inactive', streamId)
                // are there any pending encrypts or decrypts?
                const areTherePendingEncryptsOrDecrypts =
                    mlsStream.decryptionFailures.size > 0 ||
                    mlsStream.awaitingActiveLocalView !== undefined
                if (mlsEnabled || areTherePendingEncryptsOrDecrypts) {
                    this.log.log('agent: initializeOrJoinGroup', streamId)
                    try {
                        await this.processor.initializeOrJoinGroup(mlsStream)
                    } catch (e) {
                        this.log.error?.('agent: initializeOrJoinGroup error', streamId)
                        this.log.error?.('enqueue retry')
                        this.loop.enqueueStreamUpdate(streamId)
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
                this.log.log('saving group', bin_toHexString(mlsStream.localView.group.groupId))
                await mlsStream.localView.group.writeToStorage()
            }
        }
    }
}
