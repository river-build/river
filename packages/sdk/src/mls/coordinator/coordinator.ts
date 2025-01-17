import { Message, PlainMessage } from '@bufbuild/protobuf'
import {
    EncryptedData,
    MemberPayload_Mls_EpochSecrets,
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
    StreamEvent,
} from '@river-build/proto'
import { GroupService } from '../group'
import { EpochSecret, EpochSecretService } from '../epoch'
import { ExternalGroupService } from '../externalGroup'
import { check, dlog, DLogger } from '@river-build/dlog'
import { isDefined } from '../../check'
import { EncryptedContentItem } from '@river-build/encryption'
import {
    EncryptedContent,
    isEncryptedContentKind,
    toDecryptedContent,
} from '../../encryptedContentTypes'
import { Client } from '../../client'
import { IPersistenceStore } from '../../persistenceStore'
import { IAwaiter, IndefiniteAwaiter } from './awaiter'
import { make_MemberPayload_Mls } from '../../types'

type InitializeGroupMessage = PlainMessage<MemberPayload_Mls_InitializeGroup>
type ExternalJoinMessage = PlainMessage<MemberPayload_Mls_ExternalJoin>
type EpochSecretsMessage = PlainMessage<MemberPayload_Mls_EpochSecrets>

type MlsEncryptedContentItem = {
    streamId: string
    eventId: string
    kind: string
    encryptedData: EncryptedData
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function encode(text: string): Uint8Array {
    return encoder.encode(text)
}

function decode(bytes: Uint8Array): string {
    return decoder.decode(bytes)
}

const defaultLogger = dlog('csb:mls:coordinator')

type EpochId = string & { __brand: 'EpochId' }

function createEpochId(streamId: string, epoch: bigint): EpochId {
    return `${streamId}/${epoch}` as EpochId
}

export interface CoordinatorDelegate {
    scheduleJoinOrCreateGroup(streamId: string): void
    scheduleAnnounceEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecret: Uint8Array,
    ): void
}

export class Coordinator {
    private readonly userAddress: Uint8Array
    private readonly deviceKey: Uint8Array
    private client: Client
    private persistenceStore: IPersistenceStore

    private decryptionFailures: Map<string, Map<bigint, MlsEncryptedContentItem[]>> = new Map()
    private awaitingGroupActive: Map<string, IAwaiter> = new Map()
    private awaitingEpochOpen: Map<EpochId, IAwaiter> = new Map()

    private epochSecretService: EpochSecretService
    private groupService: GroupService
    private externalGroupService: ExternalGroupService
    public delegate?: CoordinatorDelegate

    private log: {
        error: DLogger
        debug: DLogger
    }

    constructor(
        userAddress: Uint8Array,
        deviceKey: Uint8Array,
        client: Client,
        persistenceStore: IPersistenceStore,
        externalGroupService: ExternalGroupService,
        groupService: GroupService,
        epochSecretService: EpochSecretService,
        delegate?: CoordinatorDelegate,
        opts?: { log: DLogger },
    ) {
        this.userAddress = userAddress
        this.deviceKey = deviceKey

        this.client = client
        this.persistenceStore = persistenceStore
        this.externalGroupService = externalGroupService
        this.groupService = groupService
        this.epochSecretService = epochSecretService
        this.delegate = delegate

        const logger = opts?.log ?? defaultLogger
        this.log = {
            debug: logger.extend('debug'),
            error: logger.extend('error'),
        }
    }

    public async initialize(): Promise<void> {
        await this.groupService.initialize()
    }

    // API needed by the client
    // TODO: How long will be the timeout here?
    public async encryptGroupEventEpochSecret(
        streamId: string,
        event: Message,
    ): Promise<EncryptedData> {
        this.log.debug('encryptGroupEventEpochSecret', { streamId, event })

        const hasGroup = this.groupService.getGroup(streamId) !== undefined
        if (!hasGroup) {
            // No group so we request joining
            // NOTE: We are enqueueing command instead of doing the async call
            this.delegate?.scheduleJoinOrCreateGroup(streamId)
        }
        // TODO: Refactor this to return group
        await this.awaitGroupActive(streamId)
        const activeGroup = this.groupService.getGroup(streamId)
        if (activeGroup === undefined) {
            throw new Error('Fatal: no group after awaitGroupActive')
        }

        if (activeGroup.status !== 'GROUP_ACTIVE') {
            throw new Error('Fatal: group is not active')
        }

        const epoch = this.groupService.currentEpoch(activeGroup)
        // TODO: Refactor this to return EpochSecret
        await this.awaitEpochOpen(streamId, epoch)
        const epochSecret = this.epochSecretService.getEpochSecret(streamId, epoch)

        if (epochSecret === undefined) {
            throw new Error('Fatal: no epoch secret after awaitEpochOpen')
        }

        if (epochSecret.openEpochSecret === undefined) {
            throw new Error('Fatal: epoch secret not open after awaitEpochOpen')
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
        this.log.debug('decryptGroupEvent', { streamId, eventId, kind, encryptedData })

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
        this.log.debug('handleInitializeGroup', { streamId, message })

        const group = this.groupService.getGroup(streamId)
        if (group !== undefined) {
            await this.groupService.handleInitializeGroup(group, message)
        }

        const tryJoiningAgain = this.groupService.getGroup(streamId) === undefined
        if (tryJoiningAgain) {
            this.delegate?.scheduleJoinOrCreateGroup(streamId)
        }
    }

    public async handleExternalJoin(streamId: string, message: ExternalJoinMessage) {
        this.log.debug('handleExternalJoin', { streamId, message })

        const group = this.groupService.getGroup(streamId)
        if (group !== undefined) {
            await this.groupService.handleExternalJoin(group, message)
        }

        const tryJoiningAgain = this.groupService.getGroup(streamId) === undefined
        if (tryJoiningAgain) {
            this.delegate?.scheduleJoinOrCreateGroup(streamId)
        }
    }

    public async handleEpochSecrets(streamId: string, message: EpochSecretsMessage) {
        this.log.debug('handleEpochSecrets', { streamId, message })

        return this.epochSecretService.handleEpochSecrets(streamId, message)
    }

    public async handleEncryptedContent(
        streamId: string,
        eventId: string,
        message: EncryptedContent,
    ) {
        this.log.debug('handleEncryptedContent', { streamId, eventId, message })

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
        this.log.debug('enqueueDecryptionFailure', { streamId, epoch, item })

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

    private async initializeGroupMessage(streamId: string): Promise<InitializeGroupMessage> {
        this.log.debug('initializeGroupMessage', { streamId })

        // TODO: Check preconditions
        // TODO: Catch the error
        return this.groupService.initializeGroupMessage(streamId)
    }

    private async externalJoinMessage(
        streamId: string,
        externalInfo: {
            externalGroupSnapshot: Uint8Array
            groupInfoMessage: Uint8Array
            commits: { commit: Uint8Array; groupInfoMessage: Uint8Array }[]
        },
    ): Promise<ExternalJoinMessage> {
        this.log.debug('externalJoinMessage', { streamId })

        const externalGroup = await this.externalGroupService.loadSnapshot(
            streamId,
            externalInfo.externalGroupSnapshot,
        )
        for (const commit of externalInfo.commits) {
            await this.externalGroupService.processCommit(externalGroup, commit.commit)
        }
        const exportedTree = this.externalGroupService.exportTree(externalGroup)
        const latestGroupInfo = externalInfo.groupInfoMessage

        return this.groupService.externalJoinMessage(streamId, latestGroupInfo, exportedTree)
    }

    private async epochSecretsMessage(epochSecret: EpochSecret): Promise<EpochSecretsMessage> {
        this.log.debug('epochSecretsMessage', { epochSecret })

        // TODO: Check preconditions
        return this.epochSecretService.epochSecretMessage(epochSecret)
    }

    public async joinOrCreateGroup(streamId: string): Promise<void> {
        this.log.debug('joinOrCreateGroup', { streamId })

        const hasGroup = this.groupService.getGroup(streamId) !== undefined
        if (hasGroup) {
            this.log.debug('Already have group', { streamId })
            return
        }
        const externalInfo = await this.client.getMlsExternalGroupInfo(streamId)
        this.log.debug('externalInfo', { externalInfo })

        let joinOrCreateGroupMessage: PlainMessage<StreamEvent>['payload']

        const shouldWeInitializeMlsGroup =
            externalInfo === undefined ||
            externalInfo.externalGroupSnapshot.length === 0 ||
            externalInfo.groupInfoMessage.length === 0

        if (shouldWeInitializeMlsGroup) {
            const initializeGroupMessage = await this.initializeGroupMessage(streamId)
            joinOrCreateGroupMessage = make_MemberPayload_Mls({
                content: {
                    case: 'initializeGroup',
                    value: initializeGroupMessage,
                },
            })
        } else {
            const externalJoinMessage = await this.externalJoinMessage(streamId, externalInfo)
            joinOrCreateGroupMessage = make_MemberPayload_Mls({
                content: {
                    case: 'externalJoin',
                    value: externalJoinMessage,
                },
            })
        }

        // Send message to the node
        try {
            await this.client.makeEventAndAddToStream(streamId, joinOrCreateGroupMessage)
        } catch (e) {
            this.log.error('Failed to join or create group', { streamId, error: e })
            if (this.groupService.getGroup(streamId) !== undefined) {
                await this.groupService.clearGroup(streamId)
            }
        }
    }

    // NOTE: Critical section, no awaits permitted
    public awaitGroupActive(streamId: string): Promise<void> {
        this.log.debug('awaitGroupActive', { streamId })

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
        this.log.debug('groupActive', { streamId })

        const awaiter = this.awaitingGroupActive.get(streamId)
        if (awaiter !== undefined) {
            awaiter.resolve()
        }
    }

    private awaitEpochOpen(streamId: string, epoch: bigint): Promise<void> {
        this.log.debug('awaitEpochOpen', { streamId, epoch })

        if (
            this.epochSecretService.getEpochSecret(streamId, epoch)?.openEpochSecret !== undefined
        ) {
            return Promise.resolve()
        }

        const epochId = createEpochId(streamId, epoch)
        let awaiter = this.awaitingEpochOpen.get(epochId)
        if (awaiter === undefined) {
            const internalAwaiter = new IndefiniteAwaiter()
            const promise = internalAwaiter.promise.finally(() => {
                this.awaitingEpochOpen.delete(epochId)
            })
            awaiter = {
                promise,
                resolve: internalAwaiter.resolve,
            }
            this.awaitingEpochOpen.set(epochId, awaiter)
        }

        return awaiter.promise
    }

    private epochOpen(streamId: string, epoch: bigint): void {
        this.log.debug('epochOpen', { streamId, epoch })

        const epochId = createEpochId(streamId, epoch)
        const awaiter = this.awaitingEpochOpen.get(epochId)
        if (awaiter !== undefined) {
            awaiter.resolve()
        }
    }

    // Derive new epoch secret, add it to epochSecretService.
    public async newEpoch(streamId: string, epoch: bigint, epochSecret: Uint8Array): Promise<void> {
        this.log.debug('newEpoch', { streamId, epoch })

        const epochAlreadyProcessed =
            this.epochSecretService.getEpochSecret(streamId, epoch) !== undefined
        if (epochAlreadyProcessed) {
            return
        }

        const group = this.groupService.getGroup(streamId)
        if (group === undefined) {
            throw new Error('Fatal: newEpoch called for missing group')
        }

        if (group.status !== 'GROUP_ACTIVE') {
            throw new Error('Fatal: newEpoch called for non-active group')
        }

        if (this.groupService.currentEpoch(group) !== epoch) {
            throw new Error('Fatal: newEpoch called for wrong epoch')
        }

        return await this.epochSecretService.addOpenEpochSecret(streamId, epoch, epochSecret)
    }

    public async newOpenEpochSecret(openEpochSecret: EpochSecret): Promise<void> {
        const streamId = openEpochSecret.streamId
        const epoch = openEpochSecret.epoch

        this.log.debug('newOpenEpochSecret', { streamId, epoch })

        if (openEpochSecret.openEpochSecret === undefined) {
            throw new Error('newOpenEpochSecret called for EpochSecret missing open epoch secret')
        }

        if (openEpochSecret.derivedKeys === undefined) {
            throw new Error('newOpenEpochSecret called for EpochSecret missing derived keys')
        }

        // Mark the epoch as open
        this.epochOpen(streamId, epoch)

        // Process decryption failures
        const perStream = this.decryptionFailures.get(streamId)
        if (perStream !== undefined) {
            const perEpoch = perStream.get(epoch)
            if (perEpoch !== undefined) {
                perStream.delete(epoch)
                // TODO: Can this be Promise.all?
                for (const decryptionFailure of perEpoch) {
                    await this.decryptGroupEvent(
                        openEpochSecret,
                        decryptionFailure.streamId,
                        decryptionFailure.eventId,
                        decryptionFailure.kind,
                        decryptionFailure.encryptedData,
                    )
                }
            }
        }

        // TODO: Check if we do have previous epoch
        const previousEpochSecret = this.epochSecretService.getEpochSecret(streamId, epoch - 1n)

        if (
            previousEpochSecret !== undefined &&
            this.epochSecretService.canBeOpened(previousEpochSecret)
        ) {
            await this.epochSecretService.openSealedEpochSecret(
                previousEpochSecret,
                openEpochSecret.derivedKeys,
            )
        } else if (
            previousEpochSecret !== undefined &&
            this.epochSecretService.canBeSealed(previousEpochSecret)
        ) {
            await this.epochSecretService.sealEpochSecret(
                previousEpochSecret,
                openEpochSecret.derivedKeys,
            )
        }
    }

    // TODO: Differentiate between announced epoch secret and freshly sealed epoch secret
    public async newSealedEpochSecret(sealedEpochSecret: EpochSecret): Promise<void> {
        const streamId = sealedEpochSecret.streamId
        const epoch = sealedEpochSecret.epoch
        this.log.debug('newSealedEpochSecret', { streamId, epoch })

        if (sealedEpochSecret.sealedEpochSecret === undefined) {
            throw new Error('Fatal: newSealedEpochSecret called for missing sealed secret')
        }

        if (this.epochSecretService.canBeOpened(sealedEpochSecret)) {
            const nextEpochSecret = this.epochSecretService.getEpochSecret(streamId, epoch + 1n)
            if (nextEpochSecret !== undefined && nextEpochSecret.derivedKeys !== undefined) {
                await this.epochSecretService.openSealedEpochSecret(
                    sealedEpochSecret,
                    nextEpochSecret.derivedKeys,
                )
            }
        }

        if (this.epochSecretService.canBeAnnounced(sealedEpochSecret)) {
            await this.announceEpochSecret(streamId, epoch, sealedEpochSecret.sealedEpochSecret)
        }
    }

    public async announceEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecret: Uint8Array,
    ): Promise<void> {
        this.log.debug('announceEpochSecret', { streamId: streamId, epoch: epoch })

        // TODO: check if the epoch is already announced in the stream view
        // TODO: move this to epoch secret service
        try {
            await this.client.makeEventAndAddToStream(
                streamId,
                make_MemberPayload_Mls({
                    content: {
                        case: 'epochSecrets',
                        value: {
                            secrets: [
                                {
                                    epoch,
                                    secret: sealedEpochSecret,
                                },
                            ],
                        },
                    },
                }),
            )
        } catch (e) {
            this.log.error('Failed to announce epoch secret', { streamId, epoch, error: e })
            this.delegate?.scheduleAnnounceEpochSecret(streamId, epoch, sealedEpochSecret)
        }
    }
}
