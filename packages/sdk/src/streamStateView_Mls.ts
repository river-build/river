import TypedEmitter from 'typed-emitter'
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents'
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent'
import { RemoteTimelineEvent } from './types'
import {
    MemberPayload_MlsPayload,
    MemberPayload_Snapshot_MlsGroup,
    MemberPayload_Snapshot_MlsGroup_DeviceKeys,
} from '@river-build/proto'
import { check } from '@river-build/dlog'
import { userIdFromAddress } from './id'
import { logNever } from './check'

export class StreamStateView_Mls extends StreamStateView_AbstractContent {
    readonly streamId: string
    public initialGroupInfo: Uint8Array | undefined
    public latestGroupInfo: Uint8Array | undefined
    private pendingLeaves: Set<Uint8Array> = new Set()
    public keys: Map<bigint, Uint8Array> = new Map()
    private commits: Uint8Array[] = []
    private deviceKeys: { [key: string]: MemberPayload_Snapshot_MlsGroup_DeviceKeys } = {}

    constructor(streamId: string) {
        super()
        this.streamId = streamId
    }

    applySnapshot(
        snapshot: MemberPayload_Snapshot_MlsGroup,
        encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
    ) {
        this.initialGroupInfo = snapshot.initialGroupInfo
        this.latestGroupInfo = snapshot.latestGroupInfo
        this.pendingLeaves = new Set(snapshot.pendingLeaves.map((leave) => leave.userAddress))
        this.commits = snapshot.commits
        this.deviceKeys = snapshot.deviceKeys

        for (const commit of snapshot.commits) {
            encryptionEmitter?.emit('mlsCommit', this.streamId, commit)
        }

        console.log('GOT KEYVALS', snapshot.epochKeys)
    }

    appendEvent(
        event: RemoteTimelineEvent,
        _cleartext: string | undefined,
        encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
        _stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        check(event.remoteEvent.event.payload.case === 'memberPayload')
        check(event.remoteEvent.event.payload.value.content.case === 'mls')
        const payload: MemberPayload_MlsPayload =
            event.remoteEvent.event.payload.value.content.value
        switch (payload.content.case) {
            case 'initializeGroup':
                this.initialGroupInfo = payload.content.value.groupInfoWithExternalKey
                this.latestGroupInfo = payload.content.value.groupInfoWithExternalKey
                break
            case 'commitLeave': {
                const userId = userIdFromAddress(payload.content.value.userAddress)
                delete this.deviceKeys[userId]
                this.pendingLeaves.delete(payload.content.value.userAddress)
                this.commits.push(payload.content.value.commit)
                this.latestGroupInfo = payload.content.value.groupInfoWithExternalKey
                this.emitCommit(payload.content.value.commit, encryptionEmitter)
                break
            }
            case 'proposeLeave':
                this.pendingLeaves.add(payload.content.value.userAddress)
                // should this have a commit?
                break
            case 'externalJoin': {
                const userId = userIdFromAddress(payload.content.value.userAddress)
                if (this.deviceKeys[userId] === undefined) {
                    this.deviceKeys[userId] = new MemberPayload_Snapshot_MlsGroup_DeviceKeys()
                }
                this.deviceKeys[userId].deviceKeys.push(payload.content.value.deviceKey)
                this.commits.push(payload.content.value.commit)
                this.latestGroupInfo = payload.content.value.groupInfoWithExternalKey
                this.emitCommit(payload.content.value.commit, encryptionEmitter)
                break
            }
            case 'keyAnnouncement':
                this.keys.set(payload.content.value.epoch, payload.content.value.key)
                encryptionEmitter?.emit('mlsKeyAnnouncement', this.streamId, payload.content.value)
                break
            case undefined:
                break
            default:
                logNever(payload.content)
        }
    }

    prependEvent(
        _event: RemoteTimelineEvent,
        _cleartext: string | undefined,
        _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
        _stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        //
    }

    private emitCommit(
        commit: Uint8Array,
        encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
    ) {
        encryptionEmitter?.emit('mlsCommit', this.streamId, commit)
    }
}
