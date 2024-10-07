import type {
    ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo,
    ChannelMessage_Post,
    ChannelMessage_Post_Content_EmbeddedMessage_Info,
    FullyReadMarker,
    ChunkedMedia_AESGCM,
    ChannelMessage_Post_Content_Image_Info,
    MediaInfo as MediaInfoStruct,
    MiniblockHeader,
    PayloadCaseType,
    ChannelOp,
    SpacePayload_ChannelSettings,
    ChannelProperties,
} from '@river-build/proto'
import type { PlainMessage } from '@bufbuild/protobuf'
import type { DecryptionSessionError } from '@river-build/encryption'

export enum EventStatus {
    /** The event was not sent and will no longer be retried. */
    NOT_SENT = 'not_sent',
    /** The message is being encrypted */
    ENCRYPTING = 'encrypting',
    /** The event is in the process of being sent. */
    SENDING = 'sending',
    /** The event is in a queue waiting to be sent. */
    QUEUED = 'queued',
    /** The event has been sent to the server, but we have not yet received the echo. */
    SENT = 'sent',
    /** The event was cancelled before it was successfully sent. */
    CANCELLED = 'cancelled',
    /** We received this event */
    RECEIVED = 'received',
}

export interface TimelineEvent {
    eventId: string
    localEventId?: string // if this event was created locally and appended before addEvent, this will be set
    eventNum: bigint
    latestEventId: string // if a message was edited or deleted, this will be set to the latest event id
    latestEventNum: bigint // if a message was edited or deleted, this will be set to the latest event id
    status: EventStatus
    createdAtEpochMs: number // created at times are generated client side, do not trust them
    updatedAtEpochMs?: number // updated at times are generated client side, do not trust them
    content: TimelineEvent_OneOf | undefined // TODO: would be great to have this non optional
    fallbackContent: string
    isEncrypting: boolean // local only, isLocalPending should also be true
    // isLocalPending: boolean /// true if we're waiting for the event to get sent back from the server
    // isSendFailed: boolean
    confirmedEventNum?: bigint
    confirmedInBlockNum?: bigint
    threadParentId?: string
    replyParentId?: string
    reactionParentId?: string
    isMentioned: boolean
    isRedacted: boolean
    sender: {
        id: string
    }
    sessionId?: string
}

/// a timeline event should have one or none of the following fields set
export type TimelineEvent_OneOf =
    | MiniblockHeaderEvent
    // | NoticeEvent // TODO: understand
    | ReactionEvent
    | FulfillmentEvent
    | KeySolicitationEvent
    | PinEvent
    | RedactedEvent
    | RedactionActionEvent
    // | RoomCanonicalAliasEvent // TODO: understand
    // | RoomEncryptionEvent // TODO: understand
    // | RoomAvatarEvent // TODO: understand
    | RoomCreateEvent
    | RoomMessageEncryptedEvent
    // | RoomMessageMissingEvent // TODO: understand
    | RoomMemberEvent // TODO: understand
    | RoomMessageEvent
    // | RoomNameEvent // TODO: understand
    | RoomPropertiesEvent // TODO: understand (can we change the name to ChannelPropertiesEvent?)
    // | RoomTopicEvent // TODO: understand
    | ChannelCreateEvent // NOTE: prev SpaceChild
    // | SpaceUpdateAutojoinEvent  // TODO: implement
    // | SpaceUpdateHideUserJoinLeavesEvent // TODO: implement
    // | SpaceImageEvent // TODO: implement
    // | SpaceParentEvent // TODO: understand
    | SpaceUsernameEvent
    | SpaceDisplayNameEvent
    | SpaceEnsAddressEvent
    | SpaceNftEvent
    | RoomMessageEncryptedRefEvent
    | UnpinEvent

export enum Event {
    BlockchainTransaction = 'blockchain.transaction',
    MiniblockHeader = 'm.miniblockheader',
    Notice = 'm.notice',
    Reaction = 'm.reaction',
    Fulfillment = 'm.fulfillment',
    KeySolicitation = 'm.key_solicitation',
    Pin = 'm.pin',
    RedactedEvent = 'm.redacted_event',
    RedactionActionEvent = 'm.redaction_action',
    RoomAvatar = 'm.room.avatar',
    RoomCanonicalAlias = 'm.room.canonical_alias',
    RoomCreate = 'm.room.create', // TODO: would be great to name this after space / channel name
    RoomEncryption = 'm.room.encryption',
    RoomHistoryVisibility = 'm.room.history_visibility',
    RoomJoinRules = 'm.room.join_rules',
    RoomMember = 'm.room.member',
    RoomMessage = 'm.room.message',
    RoomMessageEncrypted = 'm.room.encrypted',
    RoomMessageEncryptedWithRef = 'm.room.encrypted_with_ref',
    RoomMessageMissing = 'm.room.missing',
    RoomName = 'm.room.name',
    RoomProperties = 'm.room.properties',
    RoomTopic = 'm.room.topic',
    ChannelCreate = 'm.space.child',
    SpaceUpdateAutojoin = 'm.space.update_autojoin',
    SpaceUpdateHideUserJoinLeaves = 'm.space.update_channel_hide_user_join_leaves',
    SpaceImage = 'm.space.image',
    SpaceParent = 'm.space.parent',
    SpaceUsername = 'm.space.username',
    SpaceDisplayName = 'm.space.display_name',
    SpaceEnsAddress = 'm.space.ens_name',
    SpaceNft = 'm.space.nft',
    Unpin = 'm.unpin',
}

export interface MiniblockHeaderEvent {
    kind: Event.MiniblockHeader
    message: MiniblockHeader
}

export interface FulfillmentEvent {
    kind: Event.Fulfillment
    sessionIds: string[]
    deviceKey: string
    to: string
    from: string
}

export interface KeySolicitationEvent {
    kind: Event.KeySolicitation
    sessionIds: string[]
    deviceKey: string
    isNewDevice: boolean
}

export interface RoomCreateEvent {
    kind: Event.RoomCreate
    creatorId: string
    type?: PayloadCaseType
    spaceId?: string // valid on casablanca channel streams
}

export interface ChannelCreateEvent {
    kind: Event.ChannelCreate
    creatorId: string
    channelId: string
    channelOp?: ChannelOp
    channelSettings?: SpacePayload_ChannelSettings
}
export interface ReactionEvent {
    kind: Event.Reaction
    targetEventId: string
    reaction: string
}

export interface SpaceUsernameEvent {
    kind: Event.SpaceUsername
    userId: string
    username: string
}

export interface SpaceDisplayNameEvent {
    kind: Event.SpaceDisplayName
    userId: string
    displayName: string
}

export interface SpaceEnsAddressEvent {
    kind: Event.SpaceEnsAddress
    userId: string
    ensAddress: Uint8Array
}

export interface SpaceNftEvent {
    kind: Event.SpaceNft
    userId: string
    contractAddress: string
    tokenId: string
    chainId: number
}

export interface PinEvent {
    kind: Event.Pin
    userId: string
    pinnedEventId: string
}

export interface UnpinEvent {
    kind: Event.Unpin
    userId: string
    unpinnedEventId: string
}

export interface RoomMessageEncryptedEvent {
    kind: Event.RoomMessageEncrypted
    error?: DecryptionSessionError
}

export interface RoomMessageEncryptedRefEvent {
    kind: Event.RoomMessageEncryptedWithRef
    refEventId: string
}

export interface RoomPropertiesEvent {
    kind: Event.RoomProperties
    properties: ChannelProperties
}

// TODO: membership here doenst map 1-1 to MembershipOp
export enum Membership {
    Join = 'join',
    Invite = 'invite',
    Leave = 'leave',
    Ban = 'ban',
    // NOTE: 'Knock' got removed, isnt used anywhere
    None = '',
}

export interface RoomMemberEvent {
    kind: Event.RoomMember
    userId: string
    initiatorId: string
    membership: Membership
    streamId?: string // in a case of an invitation to a channel with a streamId
}

// TODO: understand, what is Message.GM?
// TODO: better naming maybe?
export enum MessageType {
    Text = 'm.text',
    // GM = 'm.gm',
    Image = 'm.Image',
}

export interface RoomMessageEventContent_Image {
    msgType: MessageType.Image
    info?:
        | ChannelMessage_Post_Content_Image_Info
        | PlainMessage<ChannelMessage_Post_Content_Image_Info>
    thumbnail?:
        | ChannelMessage_Post_Content_Image_Info
        | PlainMessage<ChannelMessage_Post_Content_Image_Info>
}

// export interface RoomMessageEventContent_GM {
//     msgType: MessageType.GM
//     data?: Uint8Array
// }

export interface RoomMessageEventContent_Text {
    msgType: MessageType.Text
}

export type RoomMessageEventContentOneOf =
    | RoomMessageEventContent_Image
    // | RoomMessageEventContent_GM // TODO: add it back, need to understand
    | RoomMessageEventContent_Text

export interface RoomMessageEvent {
    kind: Event.RoomMessage
    threadId?: string
    threadPreview?: string
    replyId?: string
    replyPreview?: string
    body: string
    mentions: {
        // TODO: would be great to remove undefined from here
        userId: string | undefined
    }[]
    editsEventId?: string
    content: RoomMessageEventContentOneOf
    attachments?: Attachment[]
}

// original event: the event that was redacted
export interface RedactedEvent {
    kind: Event.RedactedEvent
    isAdminRedaction: boolean
}

// the event that redacted the original event
export interface RedactionActionEvent {
    kind: Event.RedactionActionEvent
    refEventId: string
    adminRedaction: boolean
}

export interface TimelineEventConfirmation {
    eventId: string
    confirmedEventNum: bigint
    confirmedInBlockNum: bigint
}

export interface ThreadStats {
    /// Thread Parent
    replyEventIds: Set<string>
    userIds: Set<string>
    latestTs: number
    parentId: string
    parentEvent?: TimelineEvent
    parentMessageContent?: RoomMessageEvent
    isParticipating: boolean
}

export interface ThreadResult {
    type: 'thread'
    isNew: boolean
    isUnread: boolean
    fullyReadMarker?: FullyReadMarker
    thread: ThreadStats
    channelId: string // NOTE: dispreancy with useCasablancaTimeline, where channel is ChannelData
    timestamp: number
}

/// MessageReactions: { reactionName: { userId: { eventId: string } } }
export type MessageReactions = Record<string, Record<string, { eventId: string }>>

export type MentionResult = {
    type: 'mention'
    unread: boolean
    channelId: string // NOTE: dispreancy with useCasablancaTimeline, where channel is ChannelData
    timestamp: number
    event: TimelineEvent
    thread?: TimelineEvent
}

export type MediaInfo = Pick<
    MediaInfoStruct,
    'filename' | 'mimetype' | 'sizeBytes' | 'widthPixels' | 'heightPixels'
>

export type ImageInfo = Pick<ChannelMessage_Post_Content_Image_Info, 'url' | 'width' | 'height'>

export type ImageAttachment = {
    type: 'image'
    info: ImageInfo
    id: string
}

export type ChunkedMediaAttachment = {
    type: 'chunked_media'
    streamId: string
    encryption: PlainMessage<ChunkedMedia_AESGCM>
    info: MediaInfo
    id: string
    thumbnail?: { content: Uint8Array; info: MediaInfo }
}

export type EmbeddedMediaAttachment = {
    type: 'embedded_media'
    info: MediaInfo
    content: Uint8Array
    id: string
}

export type EmbeddedMessageAttachment = {
    type: 'embedded_message'
    url: string
    post?: ChannelMessage_Post | PlainMessage<ChannelMessage_Post>
    roomMessageEvent?: RoomMessageEvent
    info: PlainMessage<ChannelMessage_Post_Content_EmbeddedMessage_Info>
    staticInfo?: PlainMessage<ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo>
    id: string
}

export type UnfurledLinkAttachment = {
    type: 'unfurled_link'
    url: string
    description?: string
    title?: string
    image?: { height?: number; width?: number; url?: string }
    id: string
    info?: string
}

export type Attachment =
    | ImageAttachment
    | ChunkedMediaAttachment
    | EmbeddedMediaAttachment
    | EmbeddedMessageAttachment
    | UnfurledLinkAttachment
