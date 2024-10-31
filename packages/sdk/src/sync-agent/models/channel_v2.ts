import { ChannelDetails } from '@river-build/web3'
import { Model } from '../model'
import { PlainMessage } from '@bufbuild/protobuf'
import { ChannelMessage_Post_Mention, ChannelMessage_Post_Attachment } from '@river-build/proto'
import { isDefined } from '../../check'
import { check } from '@river-build/dlog'
import type { TimelineEvent } from './timeline/timelineEvent'

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

export const ChannelModel = Model.Recipe.mkPersistent<ChannelDb, ChannelActions>({
    name: 'channel',
    storable: ({ observable, spaceDapp }) => ({
        onLoaded: () => {
            const spaceId = observable.data.spaceId
            const channelId = observable.data.id
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
        onStreamInitialized: (streamId) => {
            const channelId = observable.data.id
            if (streamId === channelId) {
                const stream = riverConnection.client?.stream(streamId)
                check(isDefined(stream), 'stream is not defined')
                const hasJoined = stream.view.getMembers().isMemberJoined(riverConnection.userId)
                observable.setData({ isJoined: hasJoined })
            }
        },
        onStreamNewUserJoined: (streamId) => {
            const channelId = observable.data.id
            if (streamId === channelId) {
                observable.setData({ isJoined: true })
            }
        },
        onStreamUserLeft: (streamId, userId) => {
            const channelId = observable.data.id
            if (streamId === channelId && userId === riverConnection.userId) {
                observable.setData({ isJoined: false })
            }
        },
    }),
    actions: ({ riverConnection, observable }) => {
        const channelId = observable.data.id
        return {
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
        }
    },
})

// We can compose recipes, merging their data and actions.
// This is useful for creating more complex models, while keeping things modular and reusable
// Type of composed is
// ```ts
// Model.Recipe.Persistent<
//     ChannelDb & {
//         id: string
//         streamId: string
//         events: TimelineEvent[]
//     },
//     ChannelActions & {
//         ask: (question: string) => Promise<{
//             answer: string
//         }>
//     }
// >
// ```
const composed = Model.Recipe.compose(
    ChannelModel,
    Model.Recipe.empty<
        {
            id: string
            streamId: string
            events: TimelineEvent[]
        },
        {
            ask: (question: string) => Promise<{ answer: string }>
        }
    >(),
)
