import TypedEmitter from 'typed-emitter'
import { Permission } from '@river-build/web3'
import {
    AddEventResponse_Error,
    EncryptedData,
    SessionKeys,
    UserInboxPayload_GroupEncryptionSessions,
} from '@river-build/proto'
import {
    shortenHexString,
    dlog,
    dlogError,
    DLogger,
    check,
    bin_toHexString,
} from '@river-build/dlog'
import { GROUP_ENCRYPTION_ALGORITHM, GroupEncryptionSession, UserDevice } from './olmLib'
import { GroupEncryptionCrypto } from './groupEncryptionCrypto'

function logNever(value: never, message?: string): void {
    // eslint-disable-next-line no-console
    console.warn(message ?? `Unhandled switch value: ${value}`)
}

export interface EntitlementsDelegate {
    isEntitled(
        spaceId: string | undefined,
        channelId: string | undefined,
        user: string,
        permission: Permission,
    ): Promise<boolean>
}

export enum DecryptionStatus {
    initializing = 'initializing',
    updating = 'updating',
    processingNewGroupSessions = 'processingNewGroupSessions',
    decryptingEvents = 'decryptingEvents',
    retryingDecryption = 'retryingDecryption',
    requestingKeys = 'requestingKeys',
    respondingToKeyRequests = 'respondingToKeyRequests',
    idle = 'idle',
}

export type DecryptionEvents = {
    decryptionExtStatusChanged: (status: DecryptionStatus) => void
}

export interface NewGroupSessionItem {
    streamId: string
    sessions: UserInboxPayload_GroupEncryptionSessions
}

export interface EncryptedContentItem {
    streamId: string
    eventId: string
    kind: string // kind of encrypted data
    encryptedData: EncryptedData
}

export interface KeySolicitationContent {
    deviceKey: string
    fallbackKey: string
    isNewDevice: boolean
    sessionIds: string[]
    srcEventId: string
}

export interface KeySolicitationItem {
    streamId: string
    fromUserId: string
    fromUserAddress: Uint8Array
    solicitation: KeySolicitationContent
    respondAfter: Date
}

interface MissingKeysItem {
    streamId: string
    waitUntil: Date
}

export interface KeySolicitationData {
    streamId: string
    isNewDevice: boolean
    missingSessionIds: string[]
}

export interface KeyFulfilmentData {
    streamId: string
    userAddress: Uint8Array
    deviceKey: string
    sessionIds: string[]
}

export interface GroupSessionsData {
    streamId: string
    item: KeySolicitationItem
    sessions: GroupEncryptionSession[]
}

export interface DecryptionSessionError {
    missingSession: boolean
    kind: string
    encryptedData: EncryptedData
    error?: unknown
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

export type MlsEncryptionEvent =
    // | MlsGroupInfo
    // | MlsCommit
    MlsInitializeGroup | MlsExternalJoin | MlsKeyAnnouncement | MlsJoinGroupEvent

/**
 *
 * Responsibilities:
 * 1. Download new to-device messages that happened while we were offline
 * 2. Decrypt new to-device messages
 * 3. Decrypt encrypted content
 * 4. Retry decryption failures, request keys for failed decryption
 * 5. Respond to key solicitations
 *
 *
 * Notes:
 * If in the future we started snapshotting the eventNum of the last message sent by every user,
 * we could use that to determine the order we send out keys, and the order that we reply to key solicitations.
 *
 * It should be easy to introduce a priority stream, where we decrypt messages from that stream first, before
 * anything else, so the messages show up quicky in the ui that the user is looking at.
 *
 * We need code to purge bad sessions (if someones sends us the wrong key, or a key that doesn't decrypt the message)
 */
export abstract class BaseDecryptionExtensions {
    private _status: DecryptionStatus = DecryptionStatus.initializing
    private queues = {
        priorityTasks: new Array<() => Promise<void>>(),
        newGroupSession: new Array<NewGroupSessionItem>(),
        mls: new Array<MlsEncryptionEvent>(),
        encryptedContent: new Array<EncryptedContentItem>(),
        missingKeys: new Array<MissingKeysItem>(),
        keySolicitations: new Array<KeySolicitationItem>(),
    }
    private upToDateStreams = new Set<string>()
    private highPriorityStreams: string[] = []
    private decryptionFailures: Record<string, Record<string, EncryptedContentItem[]>> = {} // streamId: sessionId: EncryptedContentItem[]
    private inProgressTick?: Promise<void>
    private timeoutId?: NodeJS.Timeout
    private delayMs: number = 15
    private started: boolean = false
    private emitter: TypedEmitter<DecryptionEvents>
    private keySolicitationsNeedsSort = false

    protected _onStopFn?: () => void
    protected log: {
        debug: DLogger
        info: DLogger
        error: DLogger
    }

    public readonly crypto: GroupEncryptionCrypto
    public readonly entitlementDelegate: EntitlementsDelegate
    public readonly userDevice: UserDevice
    public readonly userId: string

    public constructor(
        emitter: TypedEmitter<DecryptionEvents>,
        crypto: GroupEncryptionCrypto,
        entitlementDelegate: EntitlementsDelegate,
        userDevice: UserDevice,
        userId: string,
        upToDateStreams: Set<string>,
    ) {
        this.emitter = emitter
        this.crypto = crypto
        this.entitlementDelegate = entitlementDelegate
        this.userDevice = userDevice
        this.userId = userId
        // initialize with a set of up-to-date streams
        // ready for processing
        this.upToDateStreams = upToDateStreams

        const logId = generateLogId(userId, userDevice.deviceKey)
        this.log = {
            debug: dlog('csb:decryption:debug', { defaultEnabled: false }).extend(logId),
            info: dlog('csb:decryption').extend(logId),
            error: dlogError('csb:decryption:error').extend(logId),
        }
        this.log.debug('new DecryptionExtensions', { userDevice })
    }
    // todo: document these abstract methods
    public abstract ackNewGroupSession(
        session: UserInboxPayload_GroupEncryptionSessions,
    ): Promise<void>
    public abstract decryptGroupEvent(
        streamId: string,
        eventId: string,
        kind: string,
        encryptedData: EncryptedData,
    ): Promise<void>
    public abstract downloadNewMessages(): Promise<void>
    public abstract getKeySolicitations(streamId: string): KeySolicitationContent[]
    public abstract hasStream(streamId: string): boolean
    public abstract hasUnprocessedSession(item: EncryptedContentItem): boolean
    public abstract isUserEntitledToKeyExchange(
        streamId: string,
        userId: string,
        opts?: { skipOnChainValidation: boolean },
    ): Promise<boolean>
    public abstract isValidEvent(
        streamId: string,
        eventId: string,
    ): { isValid: boolean; reason?: string }
    public abstract isUserInboxStreamUpToDate(upToDateStreams: Set<string>): boolean
    public abstract onDecryptionError(item: EncryptedContentItem, err: DecryptionSessionError): void
    public abstract sendKeySolicitation(args: KeySolicitationData): Promise<void>
    public abstract sendKeyFulfillment(
        args: KeyFulfilmentData,
    ): Promise<{ error?: AddEventResponse_Error }>
    public abstract encryptAndShareGroupSessions(args: GroupSessionsData): Promise<void>
    // public abstract didReceiveMlsGroupInfo(args: MlsGroupInfo): Promise<void>
    // public abstract didReceiveMlsCommit(args: MlsCommit): Promise<void>
    public abstract didReceiveMlsInitializeGroup(args: MlsInitializeGroup): Promise<void>
    public abstract didReceiveMlsExternalJoin(args: MlsExternalJoin): Promise<void>
    public abstract didReceiveMlsKeyAnnouncement(args: MlsKeyAnnouncement): Promise<void>
    public abstract didReceiveMlsJoinGroupEvent(args: MlsJoinGroupEvent): Promise<void>

    public abstract shouldPauseTicking(): boolean
    /**
     * uploadDeviceKeys
     * upload device keys to the server
     */
    public abstract uploadDeviceKeys(): Promise<void>

    public enqueueNewGroupSessions(
        sessions: UserInboxPayload_GroupEncryptionSessions,
        _senderId: string,
    ): void {
        this.log.info('enqueueNewGroupSessions', sessions)
        const streamId = bin_toHexString(sessions.streamId)
        this.queues.newGroupSession.push({ streamId, sessions })
        this.checkStartTicking()
    }

    public enqueueNewEncryptedContent(
        streamId: string,
        eventId: string,
        kind: string, // kind of encrypted data
        encryptedData: EncryptedData,
    ): void {
        this.queues.encryptedContent.push({
            streamId,
            eventId,
            kind,
            encryptedData,
        })
        this.checkStartTicking()
    }

    public enqueueInitKeySolicitations(
        streamId: string,
        members: {
            userId: string
            userAddress: Uint8Array
            solicitations: KeySolicitationContent[]
        }[],
    ): void {
        this.queues.keySolicitations = this.queues.keySolicitations.filter(
            (x) => x.streamId !== streamId,
        )
        for (const member of members) {
            const { userId: fromUserId, userAddress: fromUserAddress } = member
            for (const keySolicitation of member.solicitations) {
                if (keySolicitation.deviceKey === this.userDevice.deviceKey) {
                    continue
                }
                this.queues.keySolicitations.push({
                    streamId,
                    fromUserId,
                    fromUserAddress,
                    solicitation: keySolicitation,
                    respondAfter: new Date(
                        Date.now() + this.getRespondDelayMSForKeySolicitation(streamId, fromUserId),
                    ),
                } satisfies KeySolicitationItem)
            }
        }
        this.keySolicitationsNeedsSort = true
        this.checkStartTicking()
    }

    public enqueueKeySolicitation(
        streamId: string,
        fromUserId: string,
        fromUserAddress: Uint8Array,
        keySolicitation: KeySolicitationContent,
    ): void {
        if (keySolicitation.deviceKey === this.userDevice.deviceKey) {
            this.log.debug('ignoring key solicitation for our own device')
            return
        }
        const index = this.queues.keySolicitations.findIndex(
            (x) =>
                x.streamId === streamId && x.solicitation.deviceKey === keySolicitation.deviceKey,
        )
        if (index > -1) {
            this.queues.keySolicitations.splice(index, 1)
        }
        if (keySolicitation.sessionIds.length > 0 || keySolicitation.isNewDevice) {
            this.log.debug('new key solicitation', keySolicitation)
            this.keySolicitationsNeedsSort = true
            this.queues.keySolicitations.push({
                streamId,
                fromUserId,
                fromUserAddress,
                solicitation: keySolicitation,
                respondAfter: new Date(
                    Date.now() + this.getRespondDelayMSForKeySolicitation(streamId, fromUserId),
                ),
            } satisfies KeySolicitationItem)
            this.checkStartTicking()
        } else if (index > -1) {
            this.log.debug('cleared key solicitation', keySolicitation)
        }
    }

    public enqueueMls(mls: MlsEncryptionEvent): void {
        this.queues.mls.push(mls)
        this.checkStartTicking()
    }

    public setStreamUpToDate(streamId: string): void {
        this.log.debug('streamUpToDate', streamId)
        this.upToDateStreams.add(streamId)
        this.checkStartTicking()
    }

    public retryDecryptionFailures(streamId: string): void {
        removeItem(this.queues.missingKeys, (x) => x.streamId === streamId)
        if (
            this.decryptionFailures[streamId] &&
            Object.keys(this.decryptionFailures[streamId]).length > 0
        ) {
            this.log.info(
                'membership change, re-enqueuing decryption failures for stream',
                streamId,
            )
            insertSorted(
                this.queues.missingKeys,
                { streamId, waitUntil: new Date(Date.now() + 100) },
                (x) => x.waitUntil,
            )
            this.checkStartTicking()
        }
    }

    public start(): void {
        check(!this.started, 'start() called twice, please re-instantiate instead')
        this.log.debug('starting')
        this.started = true
        // let the subclass override and do any custom startup tasks
        this.onStart()

        // enqueue a task to upload device keys
        this.queues.priorityTasks.push(() => this.uploadDeviceKeys())
        // enqueue a task to download new to-device messages
        this.queues.priorityTasks.push(() => this.downloadNewMessages())
        // start the tick loop
        this.checkStartTicking()
    }

    public onStart(): void {
        // let the subclass override and do any custom startup tasks
    }

    public async stop(): Promise<void> {
        this._onStopFn?.()
        this._onStopFn = undefined
        // let the subclass override and do any custom shutdown tasks
        await this.onStop()
        await this.stopTicking()
    }

    public onStop(): Promise<void> {
        // let the subclass override and do any custom shutdown tasks
        return Promise.resolve()
    }

    public getSizeOfEncryptedСontentQueue() {
        return this.queues.encryptedContent.length
    }

    public get status(): DecryptionStatus {
        return this._status
    }

    private setStatus(status: DecryptionStatus) {
        if (this._status !== status) {
            this.log.info(`status changed ${status}`)
            this._status = status
            this.emitter.emit('decryptionExtStatusChanged', status)
        }
    }

    protected checkStartTicking() {
        if (
            !this.started ||
            this.timeoutId ||
            !this._onStopFn ||
            !this.isUserInboxStreamUpToDate(this.upToDateStreams) ||
            this.shouldPauseTicking()
        ) {
            return
        }

        if (!Object.values(this.queues).find((q) => q.length > 0)) {
            this.setStatus(DecryptionStatus.idle)
            return
        }
        this.timeoutId = setTimeout(() => {
            this.inProgressTick = this.tick()
            this.inProgressTick
                .catch((e) => this.log.error('ProcessTick Error', e))
                .finally(() => {
                    this.timeoutId = undefined
                    this.checkStartTicking()
                })
        }, this.getDelayMs())
    }

    private async stopTicking() {
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
    }

    private getDelayMs() {
        if (this.queues.newGroupSession.length > 0) {
            return 0
        } else {
            return this.delayMs
        }
    }

    // just do one thing then return
    private tick(): Promise<void> {
        const now = new Date()

        const priorityTask = this.queues.priorityTasks.shift()
        if (priorityTask) {
            this.setStatus(DecryptionStatus.updating)
            return priorityTask()
        }

        const mls = this.queues.mls.shift()
        if (mls) {
            return this.processMls(mls)
        }

        // update any new group sessions
        const session = this.queues.newGroupSession.shift()
        if (session) {
            this.setStatus(DecryptionStatus.processingNewGroupSessions)
            return this.processNewGroupSession(session)
        }
        for (const streamId of [...this.highPriorityStreams, undefined]) {
            //
            if (streamId && !this.upToDateStreams.has(streamId)) {
                continue
            }
            //console.log('csb:dec streamId', streamId)

            if (!streamId) {
                // respond to key solicitations from yourself
                const ownKeySolicitationIndex = this.queues.keySolicitations.findIndex(
                    (x) => x.fromUserId === this.userId,
                )
                if (ownKeySolicitationIndex > -1) {
                    const solicitation = this.queues.keySolicitations.splice(
                        ownKeySolicitationIndex,
                        1,
                    )[0]
                    if (solicitation) {
                        this.log.debug(' processing own key solicitation')
                        this.setStatus(DecryptionStatus.respondingToKeyRequests)
                        return this.processKeySolicitation(solicitation)
                    }
                }
            }

            const encryptedContent = streamId
                ? dequeueItemWithStreamId(this.queues.encryptedContent, streamId)
                : this.queues.encryptedContent.shift()
            if (encryptedContent) {
                this.setStatus(DecryptionStatus.decryptingEvents)
                return this.processEncryptedContentItem(encryptedContent)
            }

            const missingKey = streamId
                ? dequeueItemWithStreamId(this.queues.missingKeys, streamId)
                : dequeueUpToDate(
                      this.queues.missingKeys,
                      now,
                      (x) => x.waitUntil,
                      this.upToDateStreams,
                  )
            if (missingKey) {
                this.setStatus(DecryptionStatus.requestingKeys)
                return this.processMissingKeys(missingKey)
            }
        }

        if (this.keySolicitationsNeedsSort) {
            this.sortKeySolicitations()
        }
        const keySolicitation = dequeueUpToDate(
            this.queues.keySolicitations,
            now,
            (x) => x.respondAfter,
            this.upToDateStreams,
        )
        if (keySolicitation) {
            this.setStatus(DecryptionStatus.respondingToKeyRequests)
            return this.processKeySolicitation(keySolicitation)
        }

        this.setStatus(DecryptionStatus.idle)
        return Promise.resolve()
    }

    /**
     * processNewGroupSession
     * process new group sessions that were sent to our to device stream inbox
     * re-enqueue any decryption failures with matching session id
     */
    private async processNewGroupSession(sessionItem: NewGroupSessionItem): Promise<void> {
        const { streamId, sessions: session } = sessionItem
        // check if this message is to our device
        const ciphertext = session.ciphertexts[this.userDevice.deviceKey]
        if (!ciphertext) {
            this.log.debug('skipping, no session for our device')
            return
        }
        this.log.debug('processNewGroupSession', session)
        // check if it contains any keys we need
        const neededKeyIndexs = []
        for (let i = 0; i < session.sessionIds.length; i++) {
            const sessionId = session.sessionIds[i]
            const hasKeys = await this.crypto.encryptionDevice.hasInboundSessionKeys(
                streamId,
                sessionId,
            )
            if (!hasKeys) {
                neededKeyIndexs.push(i)
            }
        }
        if (!neededKeyIndexs.length) {
            this.log.debug('skipping, we have all the keys')
            return
        }
        // decrypt the message
        const cleartext = await this.crypto.decryptWithDeviceKey(ciphertext, session.senderKey)
        const sessionKeys = SessionKeys.fromJsonString(cleartext)
        check(sessionKeys.keys.length === session.sessionIds.length, 'bad sessionKeys')
        // make group sessions
        const sessions = neededKeyIndexs.map(
            (i) =>
                ({
                    streamId: streamId,
                    sessionId: session.sessionIds[i],
                    sessionKey: sessionKeys.keys[i],
                    algorithm: GROUP_ENCRYPTION_ALGORITHM,
                } satisfies GroupEncryptionSession),
        )
        // import the sessions
        this.log.info(
            'importing group sessions streamId:',
            session.streamId,
            'count: ',
            sessions.length,
        )
        await this.crypto.importSessionKeys(streamId, sessions)
        // re-enqueue any decryption failures with these ids
        for (const session of sessions) {
            if (this.decryptionFailures[streamId]?.[session.sessionId]) {
                this.queues.encryptedContent.push(
                    ...this.decryptionFailures[streamId][session.sessionId],
                )
                delete this.decryptionFailures[streamId][session.sessionId]
            }
        }
        // if we processed them all, ack the stream
        if (this.queues.newGroupSession.length === 0) {
            await this.ackNewGroupSession(session)
        }
    }

    /**
     * processEncryptedContentItem
     * try to decrypt encrytped content
     */
    private async processEncryptedContentItem(item: EncryptedContentItem): Promise<void> {
        this.log.debug('processEncryptedContentItem', item)
        try {
            await this.decryptGroupEvent(item.streamId, item.eventId, item.kind, item.encryptedData)
        } catch (err) {
            if (item.encryptedData.mlsCiphertext !== undefined) {
                const streamId = item.streamId
                const sessionId = 'all-the-same'
                if (!this.decryptionFailures[streamId]) {
                    this.decryptionFailures[streamId] = { [sessionId]: [item] }
                } else if (!this.decryptionFailures[streamId][sessionId]) {
                    this.decryptionFailures[streamId][sessionId] = [item]
                } else if (!this.decryptionFailures[streamId][sessionId].includes(item)) {
                    this.decryptionFailures[streamId][sessionId].push(item)
                }
                if (isMlsGroupNotFoundError(err)) {
                    this.queues.mls.push({ tag: 'MlsJoinGroupEvent', streamId: item.streamId })
                } else if (isMlsMissingEpochError(err)) {
                    console.log('Was missing epoch...')
                }
                return
            }
            const sessionNotFound = isSessionNotFoundError(err)

            this.onDecryptionError(item, {
                missingSession: sessionNotFound,
                kind: item.kind,
                encryptedData: item.encryptedData,
                error: err,
            })
            if (sessionNotFound) {
                const streamId = item.streamId
                const sessionId = item.encryptedData.sessionId
                if (!this.decryptionFailures[streamId]) {
                    this.decryptionFailures[streamId] = { [sessionId]: [item] }
                } else if (!this.decryptionFailures[streamId][sessionId]) {
                    this.decryptionFailures[streamId][sessionId] = [item]
                } else if (!this.decryptionFailures[streamId][sessionId].includes(item)) {
                    this.decryptionFailures[streamId][sessionId].push(item)
                }

                removeItem(this.queues.missingKeys, (x) => x.streamId === streamId)
                insertSorted(
                    this.queues.missingKeys,
                    { streamId, waitUntil: new Date(Date.now() + 1000) },
                    (x) => x.waitUntil,
                )
            } else {
                this.log.info('failed to decrypt', err, 'streamId', item.streamId)
            }
        }
    }

    /**
     * processMissingKeys
     * process missing keys and send key solicitations to streams
     */
    private async processMissingKeys(item: MissingKeysItem): Promise<void> {
        this.log.debug('processing missing keys', item)
        const streamId = item.streamId
        const missingSessionIds = takeFirst(
            100,
            Object.keys(this.decryptionFailures[streamId] ?? {}).sort(),
        )
        // limit to 100 keys for now todo revisit https://linear.app/hnt-labs/issue/HNT-3936/revisit-how-we-limit-the-number-of-session-ids-that-we-request
        if (!missingSessionIds.length) {
            this.log.debug('processing missing keys', item.streamId, 'no missing keys')
            return
        }
        if (!this.hasStream(streamId)) {
            this.log.debug('processing missing keys', item.streamId, 'stream not found')
            return
        }
        const isEntitled = await this.isUserEntitledToKeyExchange(streamId, this.userId, {
            skipOnChainValidation: true,
        })
        if (!isEntitled) {
            this.log.debug('processing missing keys', item.streamId, 'user is not member of stream')
            return
        }
        const solicitedEvents = this.getKeySolicitations(streamId)
        const existingKeyRequest = solicitedEvents.find(
            (x) => x.deviceKey === this.userDevice.deviceKey,
        )
        if (
            existingKeyRequest?.isNewDevice ||
            sortedArraysEqual(existingKeyRequest?.sessionIds ?? [], missingSessionIds)
        ) {
            this.log.debug(
                'processing missing keys already requested keys for this session',
                existingKeyRequest,
            )
            return
        }
        const knownSessionIds =
            (await this.crypto.encryptionDevice.getInboundGroupSessionIds(streamId)) ?? []

        const isNewDevice = knownSessionIds.length === 0

        this.log.info(
            'requesting keys',
            item.streamId,
            'isNewDevice',
            isNewDevice,
            'sessionIds:',
            missingSessionIds.length,
        )
        await this.sendKeySolicitation({
            streamId,
            isNewDevice,
            missingSessionIds,
        })
    }

    /**
     * processKeySolicitation
     * process incoming key solicitations and send keys and key fulfillments
     */
    private async processKeySolicitation(item: KeySolicitationItem): Promise<void> {
        this.log.debug('processing key solicitation', item.streamId, item)
        const streamId = item.streamId

        check(this.hasStream(streamId), 'stream not found')
        const knownSessionIds =
            (await this.crypto.encryptionDevice.getInboundGroupSessionIds(streamId)) ?? []

        const { isValid, reason } = this.isValidEvent(streamId, item.solicitation.srcEventId)
        if (!isValid) {
            this.log.error('processing key solicitation: invalid event id', {
                streamId,
                eventId: item.solicitation.srcEventId,
                reason,
            })
            return
        }

        knownSessionIds.sort()
        const requestedSessionIds = new Set(item.solicitation.sessionIds.sort())
        const replySessionIds = item.solicitation.isNewDevice
            ? knownSessionIds
            : knownSessionIds.filter((x) => requestedSessionIds.has(x))
        if (replySessionIds.length === 0) {
            this.log.debug('processing key solicitation: no keys to reply with')
            return
        }

        const isUserEntitledToKeyExchange = await this.isUserEntitledToKeyExchange(
            streamId,
            item.fromUserId,
        )
        if (!isUserEntitledToKeyExchange) {
            return
        }

        const sessions: GroupEncryptionSession[] = []
        for (const sessionId of replySessionIds) {
            const groupSession = await this.crypto.encryptionDevice.exportInboundGroupSession(
                streamId,
                sessionId,
            )
            if (groupSession) {
                sessions.push(groupSession)
            }
        }
        this.log.debug('processing key solicitation with', item.streamId, {
            to: item.fromUserId,
            toDevice: item.solicitation.deviceKey,
            requestedCount: item.solicitation.sessionIds.length,
            replyIds: replySessionIds.length,
            sessions: sessions.length,
        })
        if (sessions.length === 0) {
            return
        }

        const { error } = await this.sendKeyFulfillment({
            streamId,
            userAddress: item.fromUserAddress,
            deviceKey: item.solicitation.deviceKey,
            sessionIds: item.solicitation.isNewDevice
                ? []
                : sessions.map((x) => x.sessionId).sort(),
        })

        if (!error) {
            await this.encryptAndShareGroupSessions({
                streamId,
                item,
                sessions,
            })
        } else if (!error.msg.includes('DUPLICATE_EVENT')) {
            // duplicate events are expected, we can ignore them, others are not
            this.log.error('failed to send key fulfillment', error)
        }
    }

    private async processMls(mls: MlsEncryptionEvent): Promise<void> {
        console.log('PROCESS MLS', mls)
        switch (mls.tag) {
            // case 'MlsCommit':
            //     return this.didReceiveMlsCommit(mls)
            // case 'MlsGroupInfo':
            //     return this.didReceiveMlsGroupInfo(mls)
            case 'MlsInitializeGroup':
                return this.didReceiveMlsInitializeGroup(mls)
            case 'MlsExternalJoin':
                return this.didReceiveMlsExternalJoin(mls)
            case 'MlsKeyAnnouncement': {
                await this.didReceiveMlsKeyAnnouncement(mls)
                for (const item of this.decryptionFailures[mls.streamId]['all-the-same']) {
                    await this.processEncryptedContentItem(item)
                }
                break
            }
            case 'MlsJoinGroupEvent':
                return this.didReceiveMlsJoinGroupEvent(mls)
            default:
                logNever(mls, `Unhandled MLS event ${mls}`)
        }
    }
    /**
     * can be overridden to add a delay to the key solicitation response
     */
    public getRespondDelayMSForKeySolicitation(_streamId: string, _userId: string): number {
        return 0
    }

    public setHighPriorityStreams(streamIds: string[]) {
        this.highPriorityStreams = streamIds
    }

    private sortKeySolicitations() {
        this.queues.keySolicitations.sort(
            (a, b) => a.respondAfter.getTime() - b.respondAfter.getTime(),
        )
        this.keySolicitationsNeedsSort = false
    }
}

export function makeSessionKeys(sessions: GroupEncryptionSession[]): SessionKeys {
    const sessionKeys = sessions.map((s) => s.sessionKey)
    return new SessionKeys({
        keys: sessionKeys,
    })
}

// Insert an item into a sorted array
// maintain the sort order
// optimize for the case where the new item is the largest
function insertSorted<T>(items: T[], newItem: T, dateFn: (x: T) => Date): void {
    let position = items.length

    // Iterate backwards to find the correct position
    for (let i = items.length - 1; i >= 0; i--) {
        if (dateFn(items[i]) <= dateFn(newItem)) {
            position = i + 1
            break
        }
    }

    // Insert the item at the correct position
    items.splice(position, 0, newItem)
}

/// Returns the first item from the array,
/// if dateFn is provided, returns the first item where dateFn(item) <= now
function dequeueUpToDate<T extends { streamId: string }>(
    items: T[],
    now: Date,
    dateFn: (x: T) => Date,
    upToDateStreams: Set<string>,
): T | undefined {
    if (items.length === 0) {
        return undefined
    }
    if (dateFn(items[0]) > now) {
        return undefined
    }
    const index = items.findIndex((x) => dateFn(x) <= now && upToDateStreams.has(x.streamId))
    if (index === -1) {
        return undefined
    }
    return items.splice(index, 1)[0]
}

function dequeueItemWithStreamId<T extends { streamId: string }>(
    items: T[],
    streamId: string,
): T | undefined {
    const index = items.findIndex((x) => x.streamId === streamId)
    if (index === -1) {
        return undefined
    }
    return items.splice(index, 1)[0]
}

function removeItem<T>(items: T[], predicate: (x: T) => boolean) {
    const index = items.findIndex(predicate)
    if (index !== -1) {
        items.splice(index, 1)
    }
}

function sortedArraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
        return false
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false
        }
    }
    return true
}

function takeFirst<T>(count: number, array: T[]): T[] {
    const result: T[] = []
    for (let i = 0; i < count && i < array.length; i++) {
        result.push(array[i])
    }
    return result
}

function isSessionNotFoundError(err: unknown): boolean {
    if (err !== null && typeof err === 'object' && 'message' in err) {
        return (err.message as string).includes('Session not found')
    }
    return false
}

function isMlsGroupNotFoundError(err: unknown): boolean {
    if (err !== null && typeof err === 'object' && 'message' in err) {
        return (err.message as string).includes('MLS group not found')
    }
    return false
}

function isMlsMissingEpochError(err: unknown): boolean {
    if (err !== null && typeof err === 'object' && 'message' in err) {
        return (err.message as string).includes('MLS epoch not found')
    }
    return false
}

function generateLogId(userId: string, deviceKey: string): string {
    const shortId = shortenHexString(userId.startsWith('0x') ? userId.slice(2) : userId)
    const shortKey = shortenHexString(deviceKey)
    const logId = `${shortId}:${shortKey}`
    return logId
}
