import TypedEmitter from 'typed-emitter'
import { ConfirmedTimelineEvent, RemoteTimelineEvent } from './types'
import {
    ChannelOp,
    ChunkedMedia,
    EncryptedData,
    Err,
    Snapshot,
    SpacePayload,
    SpacePayload_ChannelUpdate,
    SpacePayload_ChannelMetadata,
    SpacePayload_Snapshot,
    SpacePayload_UpdateChannelAutojoin,
    SpacePayload_UpdateChannelHideUserJoinLeaveEvents,
} from '@river-build/proto'
import { StreamEncryptionEvents, StreamEvents, StreamStateEvents } from './streamEvents'
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent'
import { DecryptedContent } from './encryptedContentTypes'
import { check, throwWithCode } from '@river-build/dlog'
import { logNever } from './check'
import { contractAddressFromSpaceId, isDefaultChannelId, streamIdAsString } from './id'
import { decryptDerivedAESGCM } from './crypto_utils'

export type ParsedChannelProperties = {
    isDefault: boolean
    updatedAtEventNum: bigint
    isAutojoin: boolean
    hideUserJoinLeaveEvents: boolean
}

export class StreamStateView_Space extends StreamStateView_AbstractContent {
    readonly streamId: string
    readonly spaceChannelsMetadata = new Map<string, ParsedChannelProperties>()
    private spaceImage: ChunkedMedia | undefined
    private encryptedSpaceImage: EncryptedData | undefined

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

        if (content.spaceImage?.data) {
            this.encryptedSpaceImage = content.spaceImage.data
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
        const payload: SpacePayload = event.remoteEvent.event.payload.value
        switch (payload.content.case) {
            case 'inception':
                break
            case 'channel':
                // nothing to do, channel data was conveyed in the snapshot
                break
            case 'updateChannelAutojoin':
                // likewise, this data was conveyed in the snapshot
                break
            case 'updateChannelHideUserJoinLeaveEvents':
                // likewise, this data was conveyed in the snapshot
                break
            case 'spaceImage':
                // nothing to do, spaceImage is set in the snapshot
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
        const payload: SpacePayload = event.remoteEvent.event.payload.value
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
            case 'updateChannelHideUserJoinLeaveEvents':
                this.addSpacePayload_UpdateChannelHideUserJoinLeaveEvents(
                    payload.content.value,
                    stateEmitter,
                )
                break
            case 'spaceImage':
                this.encryptedSpaceImage = payload.content.value
                break
            case undefined:
                break
            default:
                logNever(payload.content)
        }
    }

    private decryptionInProgress: Promise<ChunkedMedia | undefined> | undefined
    private imageBeingDecrypted: EncryptedData | undefined

    public async getSpaceImage(): Promise<ChunkedMedia | undefined> {
        // Take a snapshot of the current encrypted image
        const currentEncryptedImage = this.encryptedSpaceImage

        // If the current image is already being decrypted, return the ongoing decryption promise
        if (this.decryptionInProgress && currentEncryptedImage === this.imageBeingDecrypted) {
            return this.decryptionInProgress
        }

        if (currentEncryptedImage) {
            const spaceAddress = contractAddressFromSpaceId(this.streamId)
            const context = spaceAddress.toLowerCase()

            // the encrypted image that will be decrypted
            this.imageBeingDecrypted = currentEncryptedImage

            // Assign the decryption process to decryptionInProgress
            this.decryptionInProgress = this.decryptSpaceImage(context, currentEncryptedImage)
            return this.decryptionInProgress
        }

        // Always return the last known good state of spaceImage, even if it wasn't updated
        return this.spaceImage
    }

    private async decryptSpaceImage(
        context: string,
        currentEncryptedImage: EncryptedData,
    ): Promise<ChunkedMedia | undefined> {
        try {
            const plaintext = await decryptDerivedAESGCM(context, currentEncryptedImage)
            const decryptedChunkedMedia = ChunkedMedia.fromBinary(plaintext)

            // Ensure the state is still relevant before updating
            if (this.encryptedSpaceImage === currentEncryptedImage) {
                this.spaceImage = decryptedChunkedMedia
                this.encryptedSpaceImage = undefined
            }

            return decryptedChunkedMedia
        } finally {
            // Clear the in-progress promise once it resolves or rejects
            this.decryptionInProgress = undefined

            // Reset this.imageBeingDecrypted only if the current image is still relevant
            if (this.encryptedSpaceImage === currentEncryptedImage) {
                this.imageBeingDecrypted = undefined
            }
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
            ...channel,
            isAutojoin: autojoin,
        })
        stateEmitter?.emit('spaceChannelAutojoinUpdated', this.streamId, channelId, autojoin)
    }

    private addSpacePayload_UpdateChannelHideUserJoinLeaveEvents(
        payload: SpacePayload_UpdateChannelHideUserJoinLeaveEvents,
        stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        const { channelId: channelIdBytes, hideUserJoinLeaveEvents } = payload
        const channelId = streamIdAsString(channelIdBytes)
        const channel = this.spaceChannelsMetadata.get(channelId)
        if (!channel) {
            throwWithCode(`Channel not found: ${channelId}`, Err.STREAM_BAD_EVENT)
        }
        this.spaceChannelsMetadata.set(channelId, {
            ...channel,
            hideUserJoinLeaveEvents,
        })
        stateEmitter?.emit(
            'spaceChannelHideUserJoinLeaveEventsUpdated',
            this.streamId,
            channelId,
            hideUserJoinLeaveEvents,
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
                const isDefault = isDefaultChannelId(channelId)
                const isAutojoin = payload.settings?.autojoin ?? isDefault
                const hideUserJoinLeaveEvents = payload.settings?.hideUserJoinLeaveEvents ?? false
                this.spaceChannelsMetadata.set(channelId, {
                    isDefault,
                    updatedAtEventNum,
                    isAutojoin,
                    hideUserJoinLeaveEvents,
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
                // first take settings from payload, then from local channel, then defaults
                const channel = this.spaceChannelsMetadata.get(channelId)
                const isDefault = isDefaultChannelId(channelId)
                const isAutojoin = payload.settings?.autojoin ?? channel?.isAutojoin ?? isDefault
                const hideUserJoinLeaveEvents =
                    payload.settings?.hideUserJoinLeaveEvents ?? channel?.isAutojoin ?? false
                this.spaceChannelsMetadata.set(channelId, {
                    isDefault,
                    updatedAtEventNum,
                    isAutojoin,
                    hideUserJoinLeaveEvents,
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
