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
    ChunkedMedia,
    EncryptedData,
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
        snapshot: Snapshot,
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
        cleartext: string | undefined,
        encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
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
    private decryptionQueue: Promise<void> = Promise.resolve()
    private latestEncryptedImage: EncryptedData | undefined

    public async getSpaceImage(): Promise<ChunkedMedia | undefined> {
        // Take a snapshot of the current encrypted image
        const currentEncryptedImage = this.encryptedSpaceImage

        // If the current image is already being decrypted, return the ongoing decryption promise
        if (this.decryptionInProgress && currentEncryptedImage === this.latestEncryptedImage) {
            return this.decryptionInProgress
        }

        if (currentEncryptedImage) {
            const spaceAddress = contractAddressFromSpaceId(this.streamId)
            const context = spaceAddress.toLowerCase()

            // Update the latest encrypted image
            this.latestEncryptedImage = currentEncryptedImage

            // Chain the decryption operations sequentially
            this.decryptionQueue = this.decryptionQueue.then(() => {
                // Assign the decryption process to decryptionInProgress and return void to avoid ESLint warnings
                this.decryptionInProgress = this.performDecryption(context, currentEncryptedImage)
                return this.decryptionInProgress.then(() => undefined) // Ensure void return
            })

            await this.decryptionQueue

            // Always return the last known good state of spaceImage, even if it wasn't updated
            return this.spaceImage
        }

        return this.spaceImage
    }

    private async performDecryption(
        context: string,
        currentEncryptedImage: EncryptedData,
    ): Promise<ChunkedMedia | undefined> {
        try {
            const plaintext = await decryptDerivedAESGCM(context, currentEncryptedImage)

            // Ensure the state is still relevant before updating
            if (this.encryptedSpaceImage === currentEncryptedImage) {
                this.spaceImage = ChunkedMedia.fromBinary(plaintext)
                this.encryptedSpaceImage = undefined
            }

            return this.spaceImage
        } finally {
            // Clear the in-progress promise once it resolves or rejects
            this.decryptionInProgress = undefined
        }
    }

    private addSpacePayload_Channel(
        eventHash: string,
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
