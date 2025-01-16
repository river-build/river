/// Adapter to hook MLS Coordinator to the client

import { Message } from '@bufbuild/protobuf'
import { EncryptedData } from '@river-build/proto'
import { DLogger, dlog } from '@river-build/dlog'
import { isMobileSafari } from '../utils'
import { IQueueService } from './queue'
import { StreamEncryptionEvents } from '../streamEvents'
import TypedEmitter from 'typed-emitter'
import { EncryptedContent } from '../encryptedContentTypes'
import { ICoordinator } from './coordinator'

const defaultLogger = dlog('csb:mls:adapter')

export class MlsAdapter {
    private encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>
    private queueService?: IQueueService
    private coordinator?: ICoordinator
    private log!: {
        error: DLogger
        debug: DLogger
    }

    public constructor(
        coordinator?: ICoordinator,
        queueService?: IQueueService,
        encryptionEmitter?: TypedEmitter<StreamEncryptionEvents>,
        opts?: { log: DLogger },
    ) {
        this.coordinator = coordinator
        this.queueService = queueService
        this.encryptionEmitter = encryptionEmitter

        const logger = opts?.log ?? defaultLogger
        this.log = {
            debug: logger.extend('debug'),
            error: logger.extend('error'),
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
}
