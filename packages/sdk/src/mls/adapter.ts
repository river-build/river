/// Adapter to hook MLS Coordinator to the client

import { Message } from '@bufbuild/protobuf'
import { EncryptedData } from '@river-build/proto'
import { DLogger, dlog } from '@river-build/dlog'
import { isMobileSafari } from '../utils'
import {
    CoordinatorDelegateAdapter,
    EpochSecretServiceCoordinatorAdapter,
    GroupServiceCoordinatorAdapter,
    QueueService,
} from './queue'
import { StreamEncryptionEvents } from '../streamEvents'
import TypedEmitter from 'typed-emitter'
import { EncryptedContent } from '../encryptedContentTypes'
import { Coordinator } from './coordinator'
import { IPersistenceStore } from '../persistenceStore'
import { Client } from '../client'
import { addressFromUserId } from '../id'
import { ExternalCrypto, ExternalGroupService } from './externalGroup'
import { GroupService, Crypto, IGroupStore, InMemoryGroupStore } from './group'
import { EpochSecretService, IEpochSecretStore, InMemoryEpochSecretStore } from './epoch'
import { CipherSuite as MlsCipherSuite } from '@river-build/mls-rs-wasm'

const defaultLogger = dlog('csb:mls')

export class MlsAdapter {
    protected readonly userId: string
    protected readonly userAddress: Uint8Array
    protected readonly deviceKey: Uint8Array
    protected readonly client: Client
    protected readonly persistenceStore: IPersistenceStore
    protected readonly encryptionEmitter: TypedEmitter<StreamEncryptionEvents>

    protected externalCrypto: ExternalCrypto
    protected externalGroupService: ExternalGroupService
    protected crypto: Crypto
    protected groupStore: IGroupStore
    protected groupService: GroupService
    protected cipherSuite: MlsCipherSuite
    protected epochSecretStore: IEpochSecretStore
    protected epochSecretService: EpochSecretService
    protected coordinator: Coordinator
    protected queueService: QueueService

    protected log!: {
        error: DLogger
        debug: DLogger
    }

    // TODO: Refactor this to a separate factory class
    public constructor(
        userId: string,
        deviceKey: Uint8Array,
        client: Client,
        persistenceStore: IPersistenceStore,
        encryptionEmitter: TypedEmitter<StreamEncryptionEvents>,
        opts?: { log: DLogger },
    ) {
        const logger = opts?.log ?? defaultLogger
        this.userId = userId
        this.userAddress = addressFromUserId(userId)
        this.deviceKey = deviceKey
        this.client = client
        this.persistenceStore = persistenceStore
        this.encryptionEmitter = encryptionEmitter

        // External Group Service
        this.externalCrypto = new ExternalCrypto()
        this.externalGroupService = new ExternalGroupService(this.externalCrypto, {
            log: logger.extend('egs'),
        })

        // Group Service
        this.crypto = new Crypto(this.userAddress, deviceKey, { log: logger.extend('crypto') })
        this.groupStore = new InMemoryGroupStore()
        this.groupService = new GroupService(this.groupStore, this.crypto, undefined, {
            log: logger.extend('gs'),
        })

        // Epoch Secret Service
        this.cipherSuite = new MlsCipherSuite()
        this.epochSecretStore = new InMemoryEpochSecretStore()
        this.epochSecretService = new EpochSecretService(
            this.cipherSuite,
            this.epochSecretStore,
            undefined,
            { log: logger.extend('ess') },
        )

        // Coordinator
        this.coordinator = new Coordinator(
            this.userAddress,
            this.deviceKey,
            this.client,
            this.persistenceStore,
            this.externalGroupService,
            this.groupService,
            this.epochSecretService,
            undefined,
            { log: logger.extend('coordinator') },
        )

        // Queue
        this.queueService = new QueueService(this.coordinator, { log: logger.extend('queue') })

        // Hook up delegates
        this.coordinator.delegate = new CoordinatorDelegateAdapter(this.queueService)
        this.groupService.delegate = new GroupServiceCoordinatorAdapter(this.queueService)
        this.epochSecretService.delegate = new EpochSecretServiceCoordinatorAdapter(
            this.queueService,
        )

        const adapterLogger = logger.extend('adapter')
        this.log = {
            debug: adapterLogger.extend('debug'),
            error: adapterLogger.extend('error'),
        }
    }

    // API exposed to the client
    public async initialize(): Promise<void> {
        this.log.debug('initialize')
        await this.coordinator?.initialize()
    }

    public start(): void {
        this.log.debug('start')
        this.queueService?.start()
        if (isMobileSafari() && this.queueService) {
            document.addEventListener(
                'visibilitychange',
                this.queueService.onMobileSafariPageVisibilityChanged,
            )
        }

        this.encryptionEmitter?.on('mlsInitializeGroup', this.onMlsInitializeGroup)
        this.encryptionEmitter?.on('mlsExternalJoin', this.onMlsExternalJoin)
        this.encryptionEmitter?.on('mlsEpochSecrets', this.onMlsEpochSecrets)
        this.encryptionEmitter?.on('mlsNewEncryptedContent', this.onMlsNewEncryptedContent)
    }

    public async stop(): Promise<void> {
        this.log.debug('stop')
        await this.queueService?.stop()
        if (isMobileSafari() && this.queueService) {
            document.removeEventListener(
                'visibilitychange',
                this.queueService.onMobileSafariPageVisibilityChanged,
            )
        }

        this.encryptionEmitter?.off('mlsInitializeGroup', this.onMlsInitializeGroup)
        this.encryptionEmitter?.off('mlsExternalJoin', this.onMlsExternalJoin)
        this.encryptionEmitter?.off('mlsEpochSecrets', this.onMlsEpochSecrets)
        this.encryptionEmitter?.off('mlsNewEncryptedContent', this.onMlsNewEncryptedContent)
    }

    public async encryptGroupEventEpochSecret(
        streamId: string,
        event: Message,
    ): Promise<EncryptedData> {
        this.log.debug('encryptGroupEventEpochSecret')
        if (this.coordinator === undefined) {
            throw new Error('coordinator missing')
        }
        return this.coordinator.encryptGroupEventEpochSecret(streamId, event)
    }

    // Event handlers for encryptionEmitter
    public readonly onMlsInitializeGroup = (
        streamId: string,
        groupInfoMessage: Uint8Array,
        externalGroupSnapshot: Uint8Array,
        signaturePublicKey: Uint8Array,
    ) => {
        this.log.debug('onMlsInitializeGroup')
        this.queueService?.enqueueEvent({
            tag: 'initializeGroup',
            streamId,
            message: {
                groupInfoMessage,
                externalGroupSnapshot,
                signaturePublicKey,
            },
        })
    }

    public readonly onMlsExternalJoin = (
        streamId: string,
        signaturePublicKey: Uint8Array,
        commit: Uint8Array,
        groupInfoMessage: Uint8Array,
    ) => {
        this.log.debug('onMlsExternalJoin')
        this.queueService?.enqueueEvent({
            tag: 'externalJoin',
            streamId,
            message: {
                signaturePublicKey,
                commit,
                groupInfoMessage,
            },
        })
    }

    public readonly onMlsEpochSecrets = (
        streamId: string,
        secrets: { epoch: bigint; secret: Uint8Array }[],
    ) => {
        this.log.debug('onMlsEpochSecrets')
        this.queueService?.enqueueEvent({
            tag: 'epochSecrets',
            streamId,
            message: {
                secrets,
            },
        })
    }

    public readonly onMlsNewEncryptedContent = (
        streamId: string,
        eventId: string,
        content: EncryptedContent,
    ) => {
        this.log.debug('onMlsNewEncryptedContent')
        this.queueService?.enqueueEvent({
            tag: 'encryptedContent',
            streamId,
            eventId,
            message: content,
        })
    }

    // Debug methods
    public _debugCurrentEpoch(streamId: string): bigint | undefined {
        const group = this.groupService.getGroup(streamId)
        return group !== undefined ? this.groupService.currentEpoch(group) : undefined
    }
}
