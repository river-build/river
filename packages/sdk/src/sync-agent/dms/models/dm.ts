import { check, dlogger } from '@river-build/dlog'
import { isDefined } from '../../../check'
import { PersistedObservable, persistedObservable } from '../../../observable/persistedObservable'
import { Identifiable, LoadPriority, Store } from '../../../store/store'
import { RiverConnection } from '../../river-connection/riverConnection'
import { Members } from '../../members/members'
import type {
    ChannelMessage_Post_Attachment,
    ChannelMessage_Post_Mention,
    ChannelProperties,
} from '@river-build/proto'
import type { PlainMessage } from '@bufbuild/protobuf'
import { MessageTimeline } from '../../timeline/timeline'
import type { UserReadMarker } from '../../..'

const logger = dlogger('csb:dm')

export interface DmModel extends Identifiable {
    /** The id of the DM. */
    id: string
    /** Whether the SyncAgent has loaded this data. */
    initialized: boolean
    /** Whether the current user has joined the DM. */
    isJoined: boolean
    /** The metadata of the DM. @see {@link ChannelProperties} */
    metadata?: ChannelProperties
}

@persistedObservable({ tableName: 'dm' })
export class Dm extends PersistedObservable<DmModel> {
    timeline: MessageTimeline
    members: Members
    constructor(
        id: string,
        private riverConnection: RiverConnection,
        store: Store,
        fullyReadMarkers: UserReadMarker,
    ) {
        super({ id, isJoined: false, initialized: false }, store, LoadPriority.high)
        this.timeline = new MessageTimeline(
            id,
            riverConnection.userId,
            riverConnection,
            fullyReadMarkers,
        )
        this.members = new Members(id, riverConnection, store)
    }

    protected override onLoaded() {
        this.riverConnection.registerView((client) => {
            if (
                client.streams.has(this.data.id) &&
                client.streams.get(this.data.id)?.view.isInitialized
            ) {
                this.onStreamInitialized(this.data.id)
            }
            client.on('streamInitialized', this.onStreamInitialized)
            client.on('streamNewUserJoined', this.onStreamUserJoined)
            client.on('streamUserLeft', this.onStreamUserLeft)
            return () => {
                client.off('streamInitialized', this.onStreamInitialized)
                client.off('streamNewUserJoined', this.onStreamUserJoined)
                client.off('streamUserLeft', this.onStreamUserLeft)
            }
        })
    }

    async sendMessage(
        message: string,
        options?: {
            threadId?: string
            replyId?: string
            mentions?: PlainMessage<ChannelMessage_Post_Mention>[]
            attachments?: PlainMessage<ChannelMessage_Post_Attachment>[]
        },
    ): Promise<{ eventId: string }> {
        const channelId = this.data.id
        const result = await this.riverConnection.withStream(channelId).call((client) => {
            return client.sendChannelMessage_Text(channelId, {
                threadId: options?.threadId,
                threadPreview: options?.threadId ? '🙉' : undefined,
                replyId: options?.replyId,
                replyPreview: options?.replyId ? '🙈' : undefined,
                content: {
                    body: message,
                    mentions: options?.mentions ?? [],
                    attachments: options?.attachments ?? [],
                },
            })
        })
        return result
    }

    async pin(eventId: string) {
        const channelId = this.data.id
        const result = await this.riverConnection
            .withStream(channelId)
            .call((client) => client.pin(channelId, eventId))
        return result
    }

    async unpin(eventId: string) {
        const channelId = this.data.id
        const result = await this.riverConnection
            .withStream(channelId)
            .call((client) => client.unpin(channelId, eventId))
        return result
    }

    async sendReaction(refEventId: string, reaction: string) {
        const channelId = this.data.id
        const eventId = await this.riverConnection.call((client) =>
            client.sendChannelMessage_Reaction(channelId, {
                reaction,
                refEventId,
            }),
        )
        return eventId
    }

    async redactEvent(eventId: string) {
        const channelId = this.data.id
        const result = await this.riverConnection
            .withStream(channelId)
            .call((client) => client.redactMessage(channelId, eventId))
        return result
    }

    private onStreamInitialized = (streamId: string) => {
        if (this.data.id === streamId) {
            logger.info('Dm stream initialized', streamId)
            const stream = this.riverConnection.client?.stream(streamId)
            check(isDefined(stream), 'stream is not defined')
            const view = stream.view.dmChannelContent
            const hasJoined = stream.view.getMembers().isMemberJoined(this.riverConnection.userId)
            this.setData({
                initialized: true,
                isJoined: hasJoined,
                metadata: view.getChannelMetadata()?.channelProperties,
            })
            this.timeline.initialize(stream)
        }
    }

    private onStreamUserJoined = (streamId: string, userId: string) => {
        if (streamId === this.data.id && userId === this.riverConnection.userId) {
            this.setData({ isJoined: true })
        }
    }

    private onStreamUserLeft = (streamId: string, userId: string) => {
        if (streamId === this.data.id && userId === this.riverConnection.userId) {
            this.setData({ isJoined: false })
        }
    }
}
