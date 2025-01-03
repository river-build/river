import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent'
import TypedEmitter from 'typed-emitter'
import { RemoteTimelineEvent } from './types'
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents'
import { MemberPayload_Snapshot_Mls } from '@river-build/proto'

export class StreamStateView_Mls extends StreamStateView_AbstractContent {
    readonly streamId: string
    externalGroupSnapshot?: Uint8Array
    groupInfoMessage?: Uint8Array

    constructor(streamId: string) {
        super()
        this.streamId = streamId
    }

    applySnapshot(content: MemberPayload_Snapshot_Mls): void {
        this.externalGroupSnapshot = content.externalGroupSnapshot
        this.groupInfoMessage = content.groupInfoMessage
    }

    appendEvent(
        _event: RemoteTimelineEvent,
        _cleartext: string | undefined,
        _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
        _stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        //
    }

    prependEvent(
        _event: RemoteTimelineEvent,
        _cleartext: string | undefined,
        _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
        _stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        //
    }
}
