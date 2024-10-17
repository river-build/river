import type { ChannelDetails, SpaceDapp } from '@river-build/web3'
import { Model } from '../model'
import { PlainMessage } from '@bufbuild/protobuf'
import { ChannelMessage_Post_Mention, ChannelMessage_Post_Attachment } from '@river-build/proto'
import { isDefined } from '../../check'
import { check } from '@river-build/dlog'
import { TimelineModel } from './timeline_v2'

type ChannelDb = {
    id: string
    streamId: string
    spaceId: string
    isJoined: boolean
    metadata?: ChannelDetails
}

type ChannelActions = {
    pin: (eventId: string) => Promise<{ eventId: string }>
    unpin: (eventId: string) => Promise<{ eventId: string }>
    sendMessage: (
        message: string,
        options?: {
            threadId?: string
            replyId?: string
            mentions?: PlainMessage<ChannelMessage_Post_Mention>[]
            attachments?: PlainMessage<ChannelMessage_Post_Attachment>[]
        },
    ) => Promise<{ eventId: string }>
    sendReaction: (refEventId: string, reaction: string) => Promise<{ eventId: string }>
}

export const ChannelModel = (channelId: string, spaceId: string, spaceDapp: SpaceDapp) =>
    Model.persistent<ChannelDb, ChannelActions>(
        {
            id: channelId,
            streamId: channelId,
            spaceId,
            metadata: undefined,
            isJoined: false,
        },
        {
            dependencies: [TimelineModel(channelId, [])],
            loadPriority: Model.LoadPriority.high,
            storable: ({ observable }) => ({
                tableName: 'channel',
                onLoaded: () => {
                    if (!observable.data.metadata) {
                        // todo aellis this needs batching and retries, and should be updated on spaceChannelUpdated events
                        spaceDapp
                            .getChannelDetails(spaceId, channelId)
                            .then((metadata) => {
                                if (metadata) {
                                    observable.setData({ metadata })
                                }
                            })
                            .catch(() => {})
                    }
                },
            }),
            syncable: ({ observable, riverConnection }) => ({
                onStreamInitialized: (streamId: string) => {
                    if (streamId === channelId) {
                        const stream = riverConnection.client?.stream(streamId)
                        check(isDefined(stream), 'stream is not defined')
                        const hasJoined = stream.view
                            .getMembers()
                            .isMemberJoined(riverConnection.userId)
                        observable.setData({ isJoined: hasJoined })
                    }
                },
                onStreamNewUserJoined: (streamId: string) => {
                    if (streamId === channelId) {
                        observable.setData({ isJoined: true })
                    }
                },
                onStreamUserLeft: (streamId: string, userId: string) => {
                    if (streamId === channelId && userId === riverConnection.userId) {
                        observable.setData({ isJoined: false })
                    }
                },
            }),
            actions: ({ riverConnection }) => ({
                pin: async (eventId) =>
                    riverConnection
                        .withStream(channelId)
                        .call((client) => client.pin(channelId, eventId)),
                unpin: async (eventId) =>
                    riverConnection
                        .withStream(channelId)
                        .call((client) => client.unpin(channelId, eventId)),
                sendMessage: async (message, options) =>
                    riverConnection.withStream(channelId).call((client) => {
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
                    }),
                sendReaction: async (refEventId, reaction) =>
                    riverConnection.call((client) =>
                        client.sendChannelMessage_Reaction(channelId, {
                            reaction,
                            refEventId,
                        }),
                    ),
            }),
        },
    )
