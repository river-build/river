import { Message, PlainMessage } from '@bufbuild/protobuf'
import {
    EncryptedData,
    MemberPayload_Mls_EpochSecrets,
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'
import { GroupService, IGroupServiceCoordinator } from '../group'
import { EpochSecret, EpochSecretService } from '../epoch'
import { ExternalGroupService } from '../externalGroup'
import { check, DLogger } from '@river-build/dlog'
import { isDefined, logNever } from '../../check'
import { EncryptedContentItem } from '@river-build/encryption'
import {
    EncryptedContent,
    isEncryptedContentKind,
    toDecryptedContent,
} from '../../encryptedContentTypes'
import { Client } from '../../client'
import { IPersistenceStore } from '../../persistenceStore'
import { IAwaiter, IndefiniteAwaiter } from './awaiter'

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
    eventId: string
    message: EncryptedContent
}

type QueueEvent =
    | InitializeGroupEvent
    | ExternalJoinEvent
    | EpochSecretsEvent
    | EncryptedContentEvent

type MlsEncryptedContentItem = {
    streamId: string
    eventId: string
    kind: string
    encryptedData: EncryptedData
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function encode(value: string): Uint8Array {
    return textEncoder.encode(value)
}

function decode(value: Uint8Array): string {
    return textDecoder.decode(value)
}

// This feels more like a coordinator
export class QueueService {
    private epochSecretService!: EpochSecretService
    private groupService!: GroupService
    private externalGroupService!: ExternalGroupService
    private decryptionFailures: Map<string, Map<bigint, MlsEncryptedContentItem[]>> = new Map()
    private client!: Client
    private persistenceStore!: IPersistenceStore
    private awaitingGroupActive: Map<string, IAwaiter> = new Map()

    private log!: {
        error: DLogger
        debug: DLogger
    }

    constructor() {
        // nop
    }

    // API needed by the client
    // TODO: How long will be the timeout here?
    public async encryptGroupEventEpochSecret(
        streamId: string,
        event: Message,
    ): Promise<EncryptedData> {
        const hasGroup = this.groupService.getGroup(streamId) !== undefined
        if (!hasGroup) {
            // No group so we request joining
            // NOTE: We are enqueueing command instead of doing the async call
            this.enqueueCommand({ tag: 'joinOrCreateGroup', streamId })
        }
        // Wait for the group to become active
        await this.awaitGroupActive(streamId)
        const activeGroup = this.groupService.getGroup(streamId)
        if (activeGroup === undefined) {
            throw new Error('Fatal: no group after awaitGroupActive')
        }

        if (activeGroup.status !== 'GROUP_ACTIVE') {
            throw new Error('Fatal: group is not active')
        }

        const epoch = this.groupService.currentEpoch(activeGroup)

        const epochSecret = this.epochSecretService.getEpochSecret(streamId, epoch)

        if (epochSecret === undefined) {
            throw new Error('Fatal: no epoch secret for active group current epoch')
        }

        const plaintext_ = event.toJsonString()
        const plaintext = encode(plaintext_)

        return this.epochSecretService.encryptMessage(epochSecret, plaintext)
    }

    // TODO: Maybe this could be refactored into a separate class
    private async decryptGroupEvent(
        epochSecret: EpochSecret,
        streamId: string,
        eventId: string,
        kind: string, // kind of data
        encryptedData: EncryptedData,
    ) {
        // this.logCall('decryptGroupEvent', streamId, eventId, kind,
        // encryptedData)
        const stream = this.client.stream(streamId)
        check(isDefined(stream), 'stream not found')
        check(isEncryptedContentKind(kind), `invalid kind ${kind}`)

        // check cache
        let cleartext = await this.persistenceStore.getCleartext(eventId)
        if (cleartext === undefined) {
            const cleartext_ = await this.epochSecretService.decryptMessage(
                epochSecret,
                encryptedData,
            )
            cleartext = decode(cleartext_)
        }
        const decryptedContent = toDecryptedContent(kind, cleartext)

        stream.updateDecryptedContent(eventId, decryptedContent)
    }

    // # MLS Coordinator #

    public async handleInitializeGroup(streamId: string, message: InitializeGroupMessage) {
        const group = this.groupService.getGroup(streamId)
        if (group !== undefined) {
            await this.groupService.handleInitializeGroup(group, message)
        }
    }

    public async handleExternalJoin(streamId: string, message: ExternalJoinMessage) {
        const group = this.groupService.getGroup(streamId)
        if (group !== undefined) {
            await this.groupService.handleExternalJoin(group, message)
        }
    }

    public async handleEpochSecrets(streamId: string, message: EpochSecretsMessage) {
        return this.epochSecretService.handleEpochSecrets(streamId, message)
    }

    public async handleEncryptedContent(
        streamId: string,
        eventId: string,
        message: EncryptedContent,
    ) {
        const encryptedData = message.content
        // TODO: Check if message was encrypted with MLS
        // const ciphertext = encryptedData.mls!.ciphertext
        const epoch = encryptedData.mls!.epoch
        const kind = message.kind

        const epochSecret = this.epochSecretService.getEpochSecret(streamId, epoch)
        if (epochSecret === undefined) {
            this.log.debug('Epoch secret not found', { streamId, epoch })
            this.enqueueDecryptionFailure(streamId, epoch, {
                streamId,
                eventId,
                kind,
                encryptedData,
            })
            return
        }

        // Decrypt immediately
        return this.decryptGroupEvent(epochSecret, streamId, eventId, kind, encryptedData)
    }

    private enqueueDecryptionFailure(streamId: string, epoch: bigint, item: EncryptedContentItem) {
        let perStream = this.decryptionFailures.get(streamId)
        if (perStream === undefined) {
            perStream = new Map()
            this.decryptionFailures.set(item.streamId, perStream)
        }
        let perEpoch = perStream.get(epoch)
        if (perEpoch === undefined) {
            perEpoch = []
            perStream.set(epoch, perEpoch)
        }
        perEpoch.push(item)
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

    // NOTE: Critical section, no awaits permitted
    public awaitGroupActive(streamId: string): Promise<void> {
        // this.log(`awaitGroupActive ${streamId}`)
        if (this.groupService.getGroup(streamId)?.status === 'GROUP_ACTIVE') {
            return Promise.resolve()
        }

        let awaiter = this.awaitingGroupActive.get(streamId)
        if (awaiter === undefined) {
            const internalAwaiter = new IndefiniteAwaiter()
            // NOTE: we clear after the promise has resolved
            const promise = internalAwaiter.promise.finally(() => {
                this.awaitingGroupActive.delete(streamId)
            })
            awaiter = {
                promise,
                resolve: internalAwaiter.resolve,
            }
            this.awaitingGroupActive.set(streamId, awaiter)
        }

        return awaiter.promise
    }

    public groupActive(streamId: string): void {
        const awaiter = this.awaitingGroupActive.get(streamId)
        if (awaiter !== undefined) {
            awaiter.resolve()
        }
    }

    public async newEpochSecret(_streamId: string, _epoch: bigint): Promise<void> {
        // TODO: Decrypt all messages for that particular epoch secret
        // TODO: Try opening a new epoch
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
                return this.newEpochSecret(command.streamId, command.epoch)
            default:
                logNever(command)
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
            case 'encryptedContent':
                return this.handleEncryptedContent(event.streamId, event.eventId, event.message)
            default:
                logNever(event)
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
