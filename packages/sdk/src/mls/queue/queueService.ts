import { Message, PlainMessage } from '@bufbuild/protobuf'
import {
    EncryptedData,
    MemberPayload_Mls_EpochSecrets,
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'
import { GroupService, IGroupServiceCoordinator } from '../group'
import { EpochSecretService } from '../epoch'
import { ExternalGroupService } from '../externalGroup'
import { DLogger } from '@river-build/dlog'

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

type NewEpochSecretCommand = {
    tag: 'newEpochSecrets'
    streamId: string
    epoch: bigint
}

type QueueCommand = JoinOrCreateGroupCommand | GroupActiveCommand | NewEpochSecretCommand

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
    message: EncryptedData
}

type QueueEvent =
    | InitializeGroupEvent
    | ExternalJoinEvent
    | EpochSecretsEvent
    | EncryptedContentEvent

// This feels more like a coordinator
export class QueueService {
    private epochSecretService!: EpochSecretService
    private groupService!: GroupService
    private externalGroupService!: ExternalGroupService
    private log!: {
        error: DLogger
        debug: DLogger
    }


    constructor() {
        // nop
    }

    // API needed by the client
    // TODO: How long will be the timeout here?
    public encryptGroupEventEpochSecret(
        _streamId: string,
        _event: Message,
    ): Promise<EncryptedData> {
        throw new Error('Not implemented')
    }

    // # MLS Coordinator #

    public async handleInitializeGroup(_streamId: string, _message: InitializeGroupMessage) {
        const group = this.groupService.getGroup(_streamId)
        if (group !== undefined) {
            await this.groupService.handleInitializeGroup(group, _message)
        }
    }

    public async handleExternalJoin(_streamId: string, _message: ExternalJoinMessage) {
        const group = this.groupService.getGroup(_streamId)
        if (group !== undefined) {
            await this.groupService.handleExternalJoin(group, _message)
        }
    }

    public async handleEpochSecrets(_streamId: string, _message: EpochSecretsMessage) {
        return this.epochSecretService.handleEpochSecrets(_streamId, _message)
    }

    public async initializeGroupMessage(streamId: string): Promise<InitializeGroupMessage> {
        // TODO: Check preconditions
        // TODO: Catch the error
        return this.groupService.initializeGroupMessage(streamId)
    }

    public async externalJoinMessage(streamId: string): Promise<ExternalJoinMessage> {
        const externalGroup = await this.externalGroupService.getExternalGroup('streamId')
        if (externalGroup === undefined) {
            this.log.error('External group not found', { streamId })
            throw new Error('External group not found')
        }

        const exportedTree = this.externalGroupService.exportTree(externalGroup)
        const latestGroupInfo = this.externalGroupService.latestGroupInfo(externalGroup)

        return this.groupService.externalJoinMessage(streamId, latestGroupInfo, exportedTree)
    }

    public epochSecretsMessage(streamId: string): EpochSecretsMessage {
        // TODO: Check preconditions
        return this.epochSecretService.epochSecretMessage(streamId)
    }

    public async joinOrCreateGroup(_streamId: string): Promise<void> {
        throw new Error('Not implemented')
    }

    public async groupActive(_streamId: string): Promise<void> {
        throw new Error('Not implemented')
    }

    public async newEpochSecrets(_streamId: string, _epoch: bigint): Promise<void> {
        throw new Error('Not implemented')
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

    public enqueueCommand(command: QueueCommand) {
        this.commandQueue.push(command)
    }

    private dequeueCommand(): QueueCommand | undefined {
        return this.commandQueue.shift()
    }

    public enqueueEvent(event: QueueEvent) {
        this.eventQueue.push(event)
    }

    private dequeueEvent(): QueueEvent | undefined {
        return this.eventQueue.shift()
    }

    getDelayMs(): number {
        return this.delayMs
    }

    public start() {
        // nop
        this.started = true
        this.checkStartTicking()
    }

    public async stop(): Promise<void> {
        this.started = false
        await this.stopTicking()
        // nop
    }

    private checkStartTicking() {
        // TODO: pause if take mobile safari is backgrounded (idb issue)

        if (this.stopping) {
            this.log.debug('ticking is being stopped')
            return
        }

        if (!this.started || this.timeoutId) {
            this.log.debug('previous tick is still running')
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

    public async tick() {
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
        switch (command.tag) {
            case 'joinOrCreateGroup':
                return this.joinOrCreateGroup(command.streamId)
            case 'groupActive':
                return this.groupActive(command.streamId)
            case 'newEpochSecrets':
                return this.newEpochSecrets(command.streamId, command.epoch)
        }
    }

    public async processEvent(event: QueueEvent): Promise<void> {
        switch (event.tag) {
            case 'initializeGroup':
                return this.handleInitializeGroup(event.streamId, event.message)
            case 'externalJoin':
                return this.handleExternalJoin(event.streamId, event.message)
            case 'epochSecrets':
                return this.handleEpochSecrets(event.streamId, event.message)
        }
    }
}

export class GroupServiceCoordinatorAdapter implements IGroupServiceCoordinator {
    public readonly queueService: QueueService

    constructor(queueService: QueueService) {
        this.queueService = queueService
    }

    joinOrCreateGroup(streamId: string): void {
        this.queueService.enqueueCommand({ tag: 'joinOrCreateGroup', streamId })
    }
    groupActive(streamId: string): void {
        this.queueService.enqueueCommand({ tag: 'groupActive', streamId })
    }
    newEpochSecret(streamId: string, epoch: bigint): void {
        this.queueService.enqueueCommand({ tag: 'newEpochSecrets', streamId, epoch })
    }
}
