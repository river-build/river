import { PlainMessage } from '@bufbuild/protobuf'
import {
    MemberPayload_Mls_EpochSecrets,
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'
import { GroupServiceDelegate } from '../group'
import { EpochSecret, EpochSecretServiceDelegate } from '../epoch'
import { dlog, DLogger } from '@river-build/dlog'
import { logNever } from '../../check'
import { EncryptedContent } from '../../encryptedContentTypes'
import { Coordinator, CoordinatorDelegate } from '../coordinator'

type InitializeGroupMessage = PlainMessage<MemberPayload_Mls_InitializeGroup>
type ExternalJoinMessage = PlainMessage<MemberPayload_Mls_ExternalJoin>
type EpochSecretsMessage = PlainMessage<MemberPayload_Mls_EpochSecrets>

// Commands, which are internal commands of the Queue

type JoinOrCreateGroupCommand = {
    tag: 'joinOrCreateGroup'
    streamId: string
}

type GroupActiveCommand = {
    tag: 'groupActive'
    streamId: string
}

type NewEpochCommand = {
    tag: 'newEpoch'
    streamId: string
    epoch: bigint
    epochSecret: Uint8Array
}

type NewOpenEpochSecretCommand = {
    tag: 'newOpenEpochSecret'
    openEpochSecret: EpochSecret
}

type NewSealedEpochSecretCommand = {
    tag: 'newSealedEpochSecret'
    sealedEpochSecret: EpochSecret
}

type AnnounceEpochSecretCommand = {
    tag: 'announceEpochSecret'
    streamId: string
    epoch: bigint
    sealedEpochSecret: Uint8Array
}

type QueueCommand =
    | JoinOrCreateGroupCommand
    | GroupActiveCommand
    | NewEpochCommand
    | NewOpenEpochSecretCommand
    | NewSealedEpochSecretCommand
    | AnnounceEpochSecretCommand

// Events, which we are processing from outside
type InitializeGroupEvent = {
    tag: 'initializeGroup'
    streamId: string
    message: InitializeGroupMessage
}

type ExternalJoinEvent = {
    tag: 'externalJoin'
    streamId: string
    message: ExternalJoinMessage
}

type EpochSecretsEvent = {
    tag: 'epochSecrets'
    streamId: string
    message: EpochSecretsMessage
}

// TODO: Should encrypted content get its own queue?
type EncryptedContentEvent = {
    tag: 'encryptedContent'
    streamId: string
    eventId: string
    message: EncryptedContent
}

type EncryptionAlgorithmUpdated = {
    tag: 'encryptionAlgorithmUpdated'
    streamId: string
    encryptionAlgorithm?: string
}

type QueueEvent =
    | InitializeGroupEvent
    | ExternalJoinEvent
    | EpochSecretsEvent
    | EncryptedContentEvent
    | EncryptionAlgorithmUpdated

const defaultLogger = dlog('csb:mls:queue')

export class QueueService {
    private coordinator: Coordinator

    private log: {
        error: DLogger
        debug: DLogger
    }

    constructor(coordinator: Coordinator, opts?: { log: DLogger }) {
        this.coordinator = coordinator
        // nop
        const logger = opts?.log ?? defaultLogger
        this.log = {
            debug: logger.extend('debug'),
            error: logger.extend('error'),
        }
    }

    // # Queue-related operations #

    // Queue-related fields
    private commandQueue: QueueCommand[] = []
    private eventQueue: QueueEvent[] = []
    private delayMs = 15
    private started: boolean = false
    private stopping: boolean = false
    private timeoutId?: NodeJS.Timeout
    private inProgressTick?: Promise<void>
    private isMobileSafariBackgrounded = false

    public enqueueCommand(command: QueueCommand) {
        this.log.debug('enqueueCommand', command)

        this.commandQueue.push(command)
        // TODO: Is this needed when we tick after start
        this.checkStartTicking()
    }

    private dequeueCommand(): QueueCommand | undefined {
        return this.commandQueue.shift()
    }

    public enqueueEvent(event: QueueEvent) {
        this.log.debug('enqueueEvent', event)

        this.eventQueue.push(event)
        // TODO: Is this needed when we tick after start
        this.checkStartTicking()
    }

    private dequeueEvent(): QueueEvent | undefined {
        return this.eventQueue.shift()
    }

    getDelayMs(): number {
        return this.delayMs
    }

    public start() {
        this.log.debug('start')

        // nop
        this.started = true
        this.checkStartTicking()
    }

    public async stop(): Promise<void> {
        this.log.debug('stop')

        this.started = false
        await this.stopTicking()
        // nop
    }

    private shouldPauseTicking(): boolean {
        return this.isMobileSafariBackgrounded
    }

    private checkStartTicking() {
        if (this.stopping) {
            // this.log.debug('ticking is being stopped')
            return
        }

        if (!this.started || this.timeoutId) {
            // this.log.debug('previous tick is still running')
            return
        }

        if (this.shouldPauseTicking()) {
            return
        }

        // TODO: should this have any timeout?
        this.timeoutId = setTimeout(() => {
            this.inProgressTick = this.tick()
                .catch((e) => this.log.error('MLS ProcessTick Error', e))
                .finally(() => {
                    this.timeoutId = undefined
                    this.checkStartTicking()
                })
        }, this.getDelayMs())
    }

    private async stopTicking() {
        if (this.stopping) {
            return
        }
        this.stopping = true

        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = undefined
        }
        if (this.inProgressTick) {
            try {
                await this.inProgressTick
            } catch (e) {
                this.log.error('ProcessTick Error while stopping', e)
            } finally {
                this.inProgressTick = undefined
            }
        }
        this.stopping = false
    }

    public async tick(): Promise<void> {
        // noop
        const command = this.dequeueCommand()
        if (command !== undefined) {
            return this.processCommand(command)
        }

        const event = this.dequeueEvent()
        if (event !== undefined) {
            return this.processEvent(event)
        }
    }

    public async processCommand(command: QueueCommand): Promise<void> {
        this.log.debug('processCommand', command)

        switch (command.tag) {
            case 'joinOrCreateGroup':
                return this.coordinator.joinOrCreateGroup(command.streamId)
            case 'groupActive':
                return this.coordinator.groupActive(command.streamId)
            case 'newEpoch':
                return this.coordinator.newEpoch(
                    command.streamId,
                    command.epoch,
                    command.epochSecret,
                )
            case 'newOpenEpochSecret':
                return this.coordinator.newOpenEpochSecret(command.openEpochSecret)
            case 'newSealedEpochSecret':
                return this.coordinator.newSealedEpochSecret(command.sealedEpochSecret)
            case 'announceEpochSecret':
                return this.coordinator.announceEpochSecret(
                    command.streamId,
                    command.epoch,
                    command.sealedEpochSecret,
                )
            default:
                logNever(command)
        }
    }

    public async processEvent(event: QueueEvent): Promise<void> {
        this.log.debug('processEvent', event)

        switch (event.tag) {
            case 'initializeGroup':
                return this.coordinator.handleInitializeGroup(event.streamId, event.message)
            case 'externalJoin':
                return this.coordinator.handleExternalJoin(event.streamId, event.message)
            case 'epochSecrets':
                return this.coordinator.handleEpochSecrets(event.streamId, event.message)
            case 'encryptedContent':
                return this.coordinator.handleEncryptedContent(
                    event.streamId,
                    event.eventId,
                    event.message,
                )
            case 'encryptionAlgorithmUpdated':
                return this.coordinator.handleAlgorithmUpdated(
                    event.streamId,
                    event.encryptionAlgorithm,
                )
            default:
                logNever(event)
        }
    }

    public readonly onMobileSafariPageVisibilityChanged = () => {
        this.log.debug('onMobileSafariBackgrounded', this.isMobileSafariBackgrounded)
        this.isMobileSafariBackgrounded = document.visibilityState === 'hidden'
        if (!this.isMobileSafariBackgrounded) {
            this.checkStartTicking()
        }
    }
}

export class CoordinatorDelegateAdapter implements CoordinatorDelegate {
    private queueService: QueueService

    constructor(queueService: QueueService) {
        this.queueService = queueService
    }

    scheduleJoinOrCreateGroup(streamId: string): void {
        this.queueService.enqueueCommand({ tag: 'joinOrCreateGroup', streamId })
    }

    scheduleAnnounceEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecret: Uint8Array,
    ): void {
        this.queueService.enqueueCommand({
            tag: 'announceEpochSecret',
            streamId,
            epoch,
            sealedEpochSecret,
        })
    }
}

export class GroupServiceCoordinatorAdapter implements GroupServiceDelegate {
    public queueService: QueueService

    constructor(queueService: QueueService) {
        this.queueService = queueService
    }

    public joinOrCreateGroup(streamId: string): void {
        this.queueService.enqueueCommand({ tag: 'joinOrCreateGroup', streamId })
    }
    public groupActive(streamId: string): void {
        this.queueService.enqueueCommand({ tag: 'groupActive', streamId })
    }
    public newEpoch(streamId: string, epoch: bigint, epochSecret: Uint8Array): void {
        this.queueService.enqueueCommand({ tag: 'newEpoch', streamId, epoch, epochSecret })
    }
}

export class EpochSecretServiceCoordinatorAdapter implements EpochSecretServiceDelegate {
    public queueService: QueueService

    constructor(queueService: QueueService) {
        this.queueService = queueService
    }

    public newOpenEpochSecret(openEpochSecret: EpochSecret): void {
        this.queueService.enqueueCommand({
            tag: 'newOpenEpochSecret',
            openEpochSecret,
        })
    }
    public newSealedEpochSecret(sealedEpochSecret: EpochSecret): void {
        this.queueService.enqueueCommand({
            tag: 'newSealedEpochSecret',
            sealedEpochSecret,
        })
    }
}
