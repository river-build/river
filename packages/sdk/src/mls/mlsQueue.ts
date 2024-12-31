import { EncryptedContentItem, EntitlementsDelegate } from '@river-build/encryption'
import { Client } from '../client'
import {
    bin_toHexString,
    check,
    dlog,
    dlogError,
    DLogger,
    shortenHexString,
} from '@river-build/dlog'
import { isDefined, logNever } from '../check'
import { make_MemberPayload_Mls } from '../types'
import { MlsCrypto } from './index'
import { EncryptedData, MembershipOp, StreamEvent } from '@river-build/proto'
import { Message, PlainMessage } from '@bufbuild/protobuf'
import { addressFromUserId } from '../id'
import {
    EncryptedContent,
    isEncryptedContentKind,
    toDecryptedContent,
} from '../encryptedContentTypes'
import { IPersistenceStore } from '../persistenceStore'
import TypedEmitter from 'typed-emitter'
import { StreamMlsEvents } from '../streamEvents'

interface MlsQueueItem {
    respondAfter: Date
    event: MlsEncryptionEvent
}

export interface MlsGroupInfo {
    tag: 'MlsGroupInfo'
    streamId: string
    groupInfo: Uint8Array
}

export interface MlsCommit {
    tag: 'MlsCommit'
    streamId: string
    commit: Uint8Array
}

export interface MlsInitializeGroup {
    tag: 'MlsInitializeGroup'
    streamId: string
    userAddress: Uint8Array
    deviceKey: Uint8Array
    groupInfoWithExternalKey: Uint8Array
}

export interface MlsExternalJoin {
    tag: 'MlsExternalJoin'
    streamId: string
    userAddress: Uint8Array
    deviceKey: Uint8Array
    commit: Uint8Array
    groupInfoWithExternalKey: Uint8Array
    epoch: bigint
}

export interface MlsKeyAnnouncement {
    tag: 'MlsKeyAnnouncement'
    streamId: string
    key: { epoch: bigint; key: Uint8Array }
}

export interface MlsJoinGroupEvent {
    tag: 'MlsJoinGroupEvent'
    streamId: string
}

export type MlsEncryptionEvent = MlsInitializeGroup | MlsExternalJoin | MlsKeyAnnouncement

type MlsEncryptedContentItem = {
    streamId: string
    eventId: string
    kind: string
    encryptedData: EncryptedData
}

/// MlsQueue mimics how DecryptionExtensions handles encrypted content
export class MlsQueue {
    private started: boolean = false
    private inProgressTick?: Promise<void>
    private timeoutId?: NodeJS.Timeout
    // TODO: Rename those in a similar fashion to clientDecryptionExtensions
    private queue = new Array<MlsQueueItem>()
    private pendingDecryption: MlsEncryptedContentItem[] = []
    // streamId: epochId: EncryptedContentItem[]
    private decryptionFailures: Map<string, Map<bigint, EncryptedContentItem[]>> = new Map()

    protected log: {
        debug: DLogger
        info: DLogger
        error: DLogger
    }

    constructor(
        private readonly client: Client,
        private readonly mlsEventEmitter: TypedEmitter<StreamMlsEvents>,
        public readonly mlsCrypto: MlsCrypto,
        private readonly persistenceStore: IPersistenceStore,
        _delegate: EntitlementsDelegate,
    ) {
        this.log = {
            debug: dlog('csb:mls:debug'),
            info: dlog('csb:mls'),
            error: dlogError('csb:mls:error'),
        }
        // to subscribe, call something like :
        // client.on('mls...') and add corresponding event
        // TODO: when the subscription should start?

        this.mlsEventEmitter.on('mlsInitializeGroup', this.onMlsInitializeGroup)
        this.mlsEventEmitter.on('mlsExternalJoin', this.onMlsExternalJoin)
        this.mlsEventEmitter.on('mlsKeyAnnouncement', this.onMlsKeyAnnouncement)
        this.mlsEventEmitter.on('mlsNewEncryptedContent', this.onNewEncryptedContent)
    }
    /// Enqueue Mls Events
    private enqueueMls(mlsEvent: MlsEncryptionEvent): void {
        this.insertMlsEncryptionEvent(mlsEvent)
        this.checkStartTicking()
    }

    /// Receive MlsInitializeGroup and store it in a queue
    private readonly onMlsInitializeGroup = (
        streamId: string,
        userAddress: Uint8Array,
        deviceKey: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ) => {
        this.enqueueMls({
            tag: 'MlsInitializeGroup',
            streamId,
            userAddress,
            deviceKey,
            groupInfoWithExternalKey,
        })
    }

    /// Receive MlsExternalJoin and store it in a queue
    private readonly onMlsExternalJoin = (
        streamId: string,
        userAddress: Uint8Array,
        deviceKey: Uint8Array,
        commit: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
        epoch: bigint,
    ) => {
        this.enqueueMls({
            tag: 'MlsExternalJoin',
            streamId,
            userAddress,
            deviceKey,
            commit,
            groupInfoWithExternalKey,
            epoch,
        })
    }

    /// Receive MlsKeyAnnouncement and store it in a queue
    private readonly onMlsKeyAnnouncement = (
        streamId: string,
        keys: { epoch: bigint; key: Uint8Array },
    ) => {
        this.enqueueMls({
            tag: 'MlsKeyAnnouncement',
            streamId,
            key: keys,
        })
    }

    /// Receive request to decrypt message encrypted with MLS and store it
    // in a queue
    private readonly onNewEncryptedContent = (
        streamId: string,
        eventId: string,
        encryptedContent: EncryptedContent,
    ) => {
        const kind = encryptedContent.kind
        // TODO: Add check
        const encryptedData = encryptedContent.content

        this.pendingDecryption.push({
            streamId,
            eventId,
            kind,
            encryptedData,
        })
    }

    public start() {
        check(!this.started, 'start() called twice, please re-instantiate instead')
        this.started = true
    }

    public stop() {
        this.mlsEventEmitter.off('mlsInitializeGroup', this.onMlsInitializeGroup)
        this.mlsEventEmitter.off('mlsExternalJoin', this.onMlsExternalJoin)
        this.mlsEventEmitter.off('mlsKeyAnnouncement', this.onMlsKeyAnnouncement)
        this.mlsEventEmitter.off('mlsNewEncryptedContent', this.onNewEncryptedContent)
        return
    }

    checkStartTicking() {
        // TODO: pause if take mobile safari is backgrounded (idb issue)
        if (!this.started || this.timeoutId) {
            return
        }

        this.timeoutId = setTimeout(() => {
            this.inProgressTick = this.tick()
            this.inProgressTick
                .catch((e) => this.log.error('MLS ProcessTick Error', e))
                .finally(() => {
                    this.timeoutId = undefined
                    this.checkStartTicking()
                })
        }, 0)
    }

    stopTicking() {
        return
    }

    async tick() {
        // process first mlsEncryptionEvent
        const mlsEvent = this.dequeueMlsEncryptionEvent()
        if (mlsEvent !== undefined) {
            return this.processMlsEncryptionEvent(mlsEvent)
        }

        // if not try decrypting an encrypted content
        const encryptedItem = this.dequeueEncryptedItem()
        if (encryptedItem !== undefined) {
            return this.processEncryptedItem(encryptedItem)
        }

        // try decrypting a past message that we know have a key
        const decryptionFailure = this.dequeueDecryptionFailure()
        if (decryptionFailure !== undefined) {
            return this.processEncryptedItem(decryptionFailure)
        }

        // try opening an epoch key that we can now open
        const availableEpochKey = this.dequeueAvailableEpochKey()
        if (availableEpochKey !== undefined) {
            return this.processAvailableEpochKey(availableEpochKey)
        }
    }

    /// Process items when ticking
    async processMlsEncryptionEvent(mlsEvent: MlsEncryptionEvent) {
        switch (mlsEvent.tag) {
            case 'MlsInitializeGroup':
                return this.didReceiveMlsInitializeGroup(mlsEvent)
            case 'MlsExternalJoin':
                return this.didReceiveMlsExternalJoin(mlsEvent)
            case 'MlsKeyAnnouncement':
                return this.didReceiveMlsKeyAnnouncement(mlsEvent)
            default:
                logNever(mlsEvent, `Unhandled MLS event ${mlsEvent}`)
        }
    }

    dequeueMlsEncryptionEvent(): MlsEncryptionEvent | undefined {
        if (this.queue.length === 0) {
            return undefined
        }
        const now = new Date()
        if (this.queue[0].respondAfter > now) {
            return undefined
        }
        const index = this.queue.findIndex((x) => x.respondAfter <= now)
        if (index === -1) {
            return undefined
        }
        return this.queue.splice(index, 1)[0].event
    }

    insertMlsEncryptionEvent(event: MlsEncryptionEvent, respondAfter?: Date) {
        let position = this.queue.length
        const workItem: MlsQueueItem = {
            respondAfter: respondAfter ?? new Date(),
            event: event,
        }
        // Iterate backwards to find the correct position
        for (let i = this.queue.length - 1; i >= 0; i--) {
            if (this.queue[i].respondAfter <= workItem.respondAfter) {
                position = i + 1
                break
            }
        }
        this.queue.splice(position, 0, workItem)
    }

    private dequeueEncryptedItem(): MlsEncryptedContentItem | undefined {
        return this.pendingDecryption.shift()
    }

    private async didReceiveMlsInitializeGroup(item: MlsInitializeGroup) {
        const before = this.mlsCrypto.groupStore.getGroup(item.streamId)
        const after = await this.mlsCrypto.handleInitializeGroup(
            item.streamId,
            item.userAddress,
            item.deviceKey,
            item.groupInfoWithExternalKey,
        )
        this.mlsCrypto.log('handleInitializeGroup', before, after)
        if (!after) {
            // Try rejoining the group
            this.mlsCrypto.log('trying to join group')
            await this.joinOrCreateGroup(item.streamId)
        }
    }

    private async didReceiveMlsExternalJoin(externalJoin: MlsExternalJoin) {
        const before = this.mlsCrypto.groupStore.getGroup(externalJoin.streamId)
        const after = await this.mlsCrypto?.handleExternalJoin(
            externalJoin.streamId,
            externalJoin.userAddress,
            externalJoin.deviceKey,
            externalJoin.commit,
            externalJoin.groupInfoWithExternalKey,
            externalJoin.epoch,
        )
        this.mlsCrypto.log('handleExternalJoin', before, after)
        if (!after) {
            // Try rejoining the group
            this.mlsCrypto.log('trying to rejoin group')
            await this.joinOrCreateGroup(externalJoin.streamId)
        } else {
            // We can announce the group key now that we are switching to a different epoch.
            // NOTE: we need to await this, otherwise weird stuff will happen
            await this.announceKeys(externalJoin.streamId, after.state.group.currentEpoch)
        }
    }

    private async didReceiveMlsKeyAnnouncement(keyAnnouncement: MlsKeyAnnouncement) {
        this.mlsCrypto.log('didReceiveKeyAnnouncement', {
            epoch: keyAnnouncement.key.epoch,
            key: shortenHexString(bin_toHexString(keyAnnouncement.key.key)),
        })
        await this.mlsCrypto.handleKeyAnnouncement(keyAnnouncement.streamId, keyAnnouncement.key)
        // Eagerly try to decrypt messages
        // TODO: Try decrypting messages
        await this.retryMls(keyAnnouncement.streamId)
    }

    private async retryMls(_streamId: string) {
        throw new Error('Method not implemented.')
    }

    private async announceKeys(
        streamId: string,
        currentEpoch: bigint,
        maxDelayMS: number = 3000,
    ): Promise<void> {
        if (!this.mlsCrypto) {
            throw new Error('mls backend not initialized')
        }

        // Wait random delay to give others a chance to share the key
        const delay = Math.random() * maxDelayMS
        await new Promise((resolve) => setTimeout(resolve, delay))

        const previousEpoch = currentEpoch - 1n
        let previousEpochKey = await this.mlsCrypto.epochKeyService.getEpochKey(
            streamId,
            previousEpoch,
        )

        if (previousEpochKey?.state.announced) {
            this.mlsCrypto.log(`Epoch ${previousEpoch} key announcement already received`)
            return
        }

        const currentEpochKey = await this.mlsCrypto.epochKeyService.getEpochKey(
            streamId,
            currentEpoch,
        )

        if (
            currentEpochKey?.state.status === 'EPOCH_KEY_OPEN' &&
            previousEpochKey?.state.status === 'EPOCH_KEY_OPEN'
        ) {
            if (!previousEpochKey.state.sealedEpochSecret) {
                this.mlsCrypto.log('sealing previous epoch', {
                    epoch: currentEpoch,
                })
                await this.mlsCrypto.epochKeyService.sealEpochSecret(
                    streamId,
                    previousEpoch,
                    currentEpochKey.state,
                )
                previousEpochKey = await this.mlsCrypto.epochKeyService.getEpochKey(
                    streamId,
                    previousEpoch,
                )
            }

            if (
                previousEpochKey?.state.status !== 'EPOCH_KEY_OPEN' ||
                previousEpochKey?.state.sealedEpochSecret === undefined
            ) {
                throw new Error('Previous key not sealed (programmer error)')
            }
            // Announcing previous epoch secret
            try {
                const sealedEpochSecret = previousEpochKey.state.sealedEpochSecret.toBytes()
                this.mlsCrypto.log('announcing key', {
                    epoch: previousEpoch,
                    key: shortenHexString(bin_toHexString(sealedEpochSecret)),
                })
                await this.client.makeEventAndAddToStream(
                    streamId,
                    make_MemberPayload_Mls({
                        content: {
                            case: 'keyAnnouncement',
                            value: {
                                key: sealedEpochSecret,
                                epoch: previousEpoch,
                            },
                        },
                    }),
                )
            } catch (error) {
                this.mlsCrypto.log('error announcing key', error)
            }
        }
    }

    // Sends an event
    private async joinOrCreateGroup(streamId: string): Promise<void> {
        if (!this.mlsCrypto) {
            throw new Error('mls backend not initialized')
        }

        if (await this.mlsCrypto.groupStore.hasGroup(streamId)) {
            this.mlsCrypto.log('Group already exists')
            return
        }

        const stream = this.client.streams.get(streamId)
        if (!stream) {
            throw new Error('stream not found')
        }
        await stream.waitForMembership(MembershipOp.SO_JOIN)
        const latestGroupInfo = stream.view.membershipContent.mls.latestGroupInfo
        let joinOrCreateEvent: PlainMessage<StreamEvent>['payload']
        if (!latestGroupInfo) {
            // join via group create
            const groupInfoWithExternalKey = await this.mlsCrypto.createGroup(streamId)
            const deviceKey = this.mlsCrypto.deviceKey
            this.mlsCrypto.log('trying to initialize a group', {
                groupInfo: shortenHexString(bin_toHexString(groupInfoWithExternalKey)),
            })
            joinOrCreateEvent = make_MemberPayload_Mls({
                content: {
                    case: 'initializeGroup',
                    value: {
                        groupInfoWithExternalKey: groupInfoWithExternalKey,
                        userAddress: addressFromUserId(this.client.userId),
                        deviceKey: deviceKey,
                    },
                },
            })
        } else {
            // join via external join
            const groupJoinResult = await this.mlsCrypto.externalJoin(streamId, latestGroupInfo)
            this.mlsCrypto.log('trying to externally add', {
                epoch: groupJoinResult.epoch,
                commit: shortenHexString(bin_toHexString(groupJoinResult.commit)),
                groupInfo: shortenHexString(bin_toHexString(groupJoinResult.groupInfo)),
            })
            joinOrCreateEvent = make_MemberPayload_Mls({
                content: {
                    case: 'externalJoin',
                    value: {
                        userAddress: addressFromUserId(this.client.userId),
                        deviceKey: this.mlsCrypto.deviceKey,
                        groupInfoWithExternalKey: groupJoinResult.groupInfo,
                        commit: groupJoinResult.commit,
                        epoch: groupJoinResult.epoch,
                    },
                },
            })
        }
        await this.client.makeEventAndAddToStream(streamId, joinOrCreateEvent)
    }

    // Encrypt event using MLS.
    public async encryptGroupEventMls(event: Message, streamId: string): Promise<EncryptedData> {
        if (!this.mlsCrypto) {
            throw new Error('mls backend not initialized')
        }
        if (!(await this.mlsCrypto.groupStore.hasGroup(streamId))) {
            await this.joinOrCreateGroup(streamId)
        }
        // NOTE: We recheck the group status
        let group = await this.mlsCrypto.groupStore.getGroup(streamId)
        if (group?.state.status !== 'GROUP_ACTIVE') {
            this.mlsCrypto.log('waiting for group to become active')
            await this.mlsCrypto.awaitGroupActive(streamId)
            // Reload the group
            group = await this.mlsCrypto.groupStore.getGroup(streamId)
        }

        if (!group) {
            throw new Error(
                `Programmer error: group not found after becoming active for streamId ${streamId}`,
            )
        }

        // Ensure epoch keys are derived
        const epochKey = await this.mlsCrypto.epochKeyService.getEpochKey(
            streamId,
            group.state.group.currentEpoch,
        )
        if (epochKey?.state.status !== 'EPOCH_KEY_OPEN') {
            throw new Error('epoch keys not derived')
        }

        const plaintext = event.toJsonString()
        const binary = new TextEncoder().encode(plaintext)
        return this.mlsCrypto.encrypt(streamId, binary)
    }

    /**
     * Decrypts and updates events
     */
    private async decryptGroupEvent(
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
        const cleartext = await this.cleartextForGroupEvent(streamId, eventId, encryptedData)
        const decryptedContent = toDecryptedContent(kind, cleartext)
        stream.updateDecryptedContent(eventId, decryptedContent)
    }

    private async cleartextForGroupEvent(
        streamId: string,
        eventId: string,
        encryptedData: EncryptedData,
    ): Promise<string> {
        const cached = await this.persistenceStore.getCleartext(eventId)
        if (cached) {
            // this.logDebug('Cache hit for cleartext', eventId)
            return cached
        }
        // this.logDebug('Cache miss for cleartext', eventId)

        const cleartext = await this.mlsCrypto.decrypt(streamId, encryptedData)
        const string = new TextDecoder().decode(cleartext)
        this.mlsCrypto.log('decrypted', string)
        return string
    }

    private async processEncryptedItem(item: MlsEncryptedContentItem) {
        // check if the epoch key is open
        const epochKey = await this.mlsCrypto.epochKeyService.getEpochKey(
            item.streamId,
            item.encryptedData.mlsEpoch ?? -1n,
        )

        if (epochKey?.state.status === 'EPOCH_KEY_OPEN') {
            // Decrypt ze message
            return this.decryptGroupEvent(
                item.streamId,
                item.eventId,
                item.kind,
                item.encryptedData,
            )
        }

        // Enqueue it for decryption later
        this.enqueueDecryptionFailure(item)
    }

    private enqueueDecryptionFailure(item: MlsEncryptedContentItem) {
        const streamId = item.streamId
        const epoch = item.encryptedData.mlsEpoch ?? -1n

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

    private dequeueDecryptionFailure(): MlsEncryptedContentItem | undefined {
        let result: MlsEncryptedContentItem | undefined = undefined

        for (const [streamId, perStream] of this.decryptionFailures) {
            for (const [epoch, perEpoch] of perStream) {
                if (perEpoch.length > 0) {
                    result = perEpoch.shift()!

                    // if perEpoch queue is empty, remove it
                    if (perEpoch.length === 0) {
                        perStream.delete(epoch)
                    }
                    break
                }
            }
            if (result) {
                // if perStream Map is empty, remove it
                if (perStream.size === 0) {
                    this.decryptionFailures.delete(streamId)
                }
                break
            }
        }

        return result
    }

    private processAvailableEpochKey(_availableEpochKey: bigint) {
        throw new Error('Method not implemented.')
    }

    private dequeueAvailableEpochKey(): bigint | undefined {
        throw new Error('Method not implemented.')
    }
}
