import TypedEmitter from 'typed-emitter'
import { ConfirmedTimelineEvent, RemoteTimelineEvent } from './types'
import {
    ChannelOp,
    Err,
    Snapshot,
    SpacePayload,
    SpacePayload_ChannelUpdate,
    SpacePayload_ChannelMetadata,
    SpacePayload_Snapshot,
    SpacePayload_UpdateChannelAutojoin,
    SpacePayload_UpdateChannelShowUserJoinLeaveEvents,
} from '@river-build/proto'
import { StreamEncryptionEvents, StreamEvents, StreamStateEvents } from './streamEvents'
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent'
import { DecryptedContent } from './encryptedContentTypes'
import { check, throwWithCode } from '@river-build/dlog'
import { logNever } from './check'
import { isDefaultChannelId, streamIdAsString } from './id'

export type ParsedChannelProperties = {
    isDefault: boolean
    updatedAtEventNum: bigint
    isAutojoin?: boolean
    showUserJoinLeaveEvents?: boolean
}

export class StreamStateView_Space extends StreamStateView_AbstractContent {
    readonly streamId: string
    readonly spaceChannelsMetadata = new Map<string, ParsedChannelProperties>()

    constructor(streamId: string) {
        super()
        this.streamId = streamId
    }

    applySnapshot(
        eventHash: string,
        _snapshot: Snapshot,
        content: SpacePayload_Snapshot,
        _cleartexts: Record<string, string> | undefined,
        _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
    ): void {
        // loop over content.channels, update space channels metadata
        for (const payload of content.channels) {
            this.addSpacePayload_Channel(eventHash, payload, payload.updatedAtEventNum, undefined)
        }
    }

    onConfirmedEvent(
        _event: ConfirmedTimelineEvent,
        _emitter: TypedEmitter<StreamEvents> | undefined,
    ): void {
        // pass
    }

    prependEvent(
        event: RemoteTimelineEvent,
        _cleartext: string | undefined,
        _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
        _stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        check(event.remoteEvent.event.payload.case === 'spacePayload')
        const payload: SpacePayload = event.remoteEvent.event.payload.value as SpacePayload
        switch (payload.content.case) {
            case 'inception':
                break
            case 'channel':
                // nothing to do, channel data was conveyed in the snapshot
                break
            case 'updateChannelAutojoin':
                // likewise, this data was conveyed in the snapshot
                break
            case 'updateChannelShowUserJoinLeaveEvents':
                // likewise, this data was conveyed in the snapshot
                break
            case undefined:
                break
            default:
                logNever(payload.content)
        }
    }

    appendEvent(
        event: RemoteTimelineEvent,
        _cleartext: string | undefined,
        _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
        stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        check(event.remoteEvent.event.payload.case === 'spacePayload')
        const payload: SpacePayload = event.remoteEvent.event.payload.value as SpacePayload
        switch (payload.content.case) {
            case 'inception':
                break
            case 'channel':
                this.addSpacePayload_Channel(
                    event.hashStr,
                    payload.content.value,
                    event.eventNum,
                    stateEmitter,
                )
                break
            case 'updateChannelAutojoin':
                this.addSpacePayload_UpdateChannelAutojoin(payload.content.value, stateEmitter)
                break
            case 'updateChannelShowUserJoinLeaveEvents':
                this.addSpacePayload_UpdateChannelShowUserJoinLeaveEvents(payload.content.value, stateEmitter)
                break
            case undefined:
                break
            default:
                logNever(payload.content)
        }
    }

    private addSpacePayload_UpdateChannelAutojoin(
        payload: SpacePayload_UpdateChannelAutojoin,
        stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        const { channelId: channelIdBytes, autojoin } = payload
        const channelId = streamIdAsString(channelIdBytes)
        const channel = this.spaceChannelsMetadata.get(channelId)
        if (!channel) {
            throwWithCode(`Channel not found: ${channelId}`, Err.STREAM_BAD_EVENT)
        }
        this.spaceChannelsMetadata.set(channelId, {
            ...channel!,
            isAutojoin: autojoin,
        })
        stateEmitter?.emit('spaceChannelAutojoinUpdated', this.streamId, channelId, autojoin)
    }

    private addSpacePayload_UpdateChannelShowUserJoinLeaveEvents(
        payload: SpacePayload_UpdateChannelShowUserJoinLeaveEvents,
        stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        const { channelId: channelIdBytes, showUserJoinLeaveEvents } = payload
        const channelId = streamIdAsString(channelIdBytes)
        const channel = this.spaceChannelsMetadata.get(channelId)
        if (!channel) {
            throwWithCode(`Channel not found: ${channelId}`, Err.STREAM_BAD_EVENT)
        }
        this.spaceChannelsMetadata.set(channelId, {
            ...channel!,
            showUserJoinLeaveEvents,
        })
        stateEmitter?.emit(
            'spaceChannelShowUserJoinLeaveEventsUpdated',
            this.streamId,
            channelId,
            showUserJoinLeaveEvents,
        )
    }

    private addSpacePayload_Channel(
        _eventHash: string,
        payload: SpacePayload_ChannelMetadata | SpacePayload_ChannelUpdate,
        updatedAtEventNum: bigint,
        stateEmitter?: TypedEmitter<StreamStateEvents>,
    ): void {
        const { op, channelId: channelIdBytes } = payload
        const channelId = streamIdAsString(channelIdBytes)
        switch (op) {
            case ChannelOp.CO_CREATED: {
                this.spaceChannelsMetadata.set(channelId, {
                    isDefault: isDefaultChannelId(channelId),
                    updatedAtEventNum,
                })
                stateEmitter?.emit('spaceChannelCreated', this.streamId, channelId)
                break
            }
            case ChannelOp.CO_DELETED:
                if (this.spaceChannelsMetadata.delete(channelId)) {
                    stateEmitter?.emit('spaceChannelDeleted', this.streamId, channelId)
                }
                break
            case ChannelOp.CO_UPDATED: {
                this.spaceChannelsMetadata.set(channelId, {
                    ...this.spaceChannelsMetadata.get(channelId), // maintain autojoin and showUserJoinLeaveEvents
                    isDefault: isDefaultChannelId(channelId),
                    updatedAtEventNum,
                })
                stateEmitter?.emit(
                    'spaceChannelUpdated',
                    this.streamId,
                    channelId,
                    updatedAtEventNum,
                )
                break
            }
            default:
                throwWithCode(`Unknown channel ${op}`, Err.STREAM_BAD_EVENT)
        }
    }

    onDecryptedContent(
        _eventId: string,
        _content: DecryptedContent,
        _stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        // pass
    }
}
