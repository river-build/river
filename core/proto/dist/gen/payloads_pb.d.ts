import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Empty, Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message river.ChannelMessage
 */
export declare class ChannelMessage extends Message<ChannelMessage> {
    /**
     * @generated from oneof river.ChannelMessage.payload
     */
    payload: {
        /**
         * @generated from field: river.ChannelMessage.Post post = 1;
         */
        value: ChannelMessage_Post;
        case: "post";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Reaction reaction = 2;
         */
        value: ChannelMessage_Reaction;
        case: "reaction";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Edit edit = 3;
         */
        value: ChannelMessage_Edit;
        case: "edit";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Redaction redaction = 4;
         */
        value: ChannelMessage_Redaction;
        case: "redaction";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<ChannelMessage>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage;
    static equals(a: ChannelMessage | PlainMessage<ChannelMessage> | undefined, b: ChannelMessage | PlainMessage<ChannelMessage> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Reaction
 */
export declare class ChannelMessage_Reaction extends Message<ChannelMessage_Reaction> {
    /**
     * @generated from field: string ref_event_id = 1;
     */
    refEventId: string;
    /**
     * @generated from field: string reaction = 2;
     */
    reaction: string;
    constructor(data?: PartialMessage<ChannelMessage_Reaction>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Reaction";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Reaction;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Reaction;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Reaction;
    static equals(a: ChannelMessage_Reaction | PlainMessage<ChannelMessage_Reaction> | undefined, b: ChannelMessage_Reaction | PlainMessage<ChannelMessage_Reaction> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Edit
 */
export declare class ChannelMessage_Edit extends Message<ChannelMessage_Edit> {
    /**
     * @generated from field: string ref_event_id = 1;
     */
    refEventId: string;
    /**
     * @generated from field: river.ChannelMessage.Post post = 2;
     */
    post?: ChannelMessage_Post;
    constructor(data?: PartialMessage<ChannelMessage_Edit>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Edit";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Edit;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Edit;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Edit;
    static equals(a: ChannelMessage_Edit | PlainMessage<ChannelMessage_Edit> | undefined, b: ChannelMessage_Edit | PlainMessage<ChannelMessage_Edit> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Redaction
 */
export declare class ChannelMessage_Redaction extends Message<ChannelMessage_Redaction> {
    /**
     * @generated from field: string ref_event_id = 1;
     */
    refEventId: string;
    /**
     * @generated from field: optional string reason = 2;
     */
    reason?: string;
    constructor(data?: PartialMessage<ChannelMessage_Redaction>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Redaction";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Redaction;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Redaction;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Redaction;
    static equals(a: ChannelMessage_Redaction | PlainMessage<ChannelMessage_Redaction> | undefined, b: ChannelMessage_Redaction | PlainMessage<ChannelMessage_Redaction> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post
 */
export declare class ChannelMessage_Post extends Message<ChannelMessage_Post> {
    /**
     * @generated from field: optional string thread_id = 1;
     */
    threadId?: string;
    /**
     * @generated from field: optional string thread_preview = 2;
     */
    threadPreview?: string;
    /**
     * @generated from field: optional string reply_id = 3;
     */
    replyId?: string;
    /**
     * @generated from field: optional string reply_preview = 4;
     */
    replyPreview?: string;
    /**
     * @generated from oneof river.ChannelMessage.Post.content
     */
    content: {
        /**
         * @generated from field: river.ChannelMessage.Post.Content.Text text = 101;
         */
        value: ChannelMessage_Post_Content_Text;
        case: "text";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Post.Content.Image image = 102;
         */
        value: ChannelMessage_Post_Content_Image;
        case: "image";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Post.Content.GM gm = 103;
         */
        value: ChannelMessage_Post_Content_GM;
        case: "gm";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<ChannelMessage_Post>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post;
    static equals(a: ChannelMessage_Post | PlainMessage<ChannelMessage_Post> | undefined, b: ChannelMessage_Post | PlainMessage<ChannelMessage_Post> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Mention
 */
export declare class ChannelMessage_Post_Mention extends Message<ChannelMessage_Post_Mention> {
    /**
     * @generated from field: string user_id = 1;
     */
    userId: string;
    /**
     * @generated from field: string display_name = 2;
     */
    displayName: string;
    /**
     * @generated from oneof river.ChannelMessage.Post.Mention.mentionBehavior
     */
    mentionBehavior: {
        /**
         * @generated from field: google.protobuf.Empty at_channel = 100;
         */
        value: Empty;
        case: "atChannel";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Post.RoleMention at_role = 101;
         */
        value: ChannelMessage_Post_RoleMention;
        case: "atRole";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<ChannelMessage_Post_Mention>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Mention";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Mention;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Mention;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Mention;
    static equals(a: ChannelMessage_Post_Mention | PlainMessage<ChannelMessage_Post_Mention> | undefined, b: ChannelMessage_Post_Mention | PlainMessage<ChannelMessage_Post_Mention> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.RoleMention
 */
export declare class ChannelMessage_Post_RoleMention extends Message<ChannelMessage_Post_RoleMention> {
    /**
     * @generated from field: int32 role_id = 1;
     */
    roleId: number;
    constructor(data?: PartialMessage<ChannelMessage_Post_RoleMention>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.RoleMention";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_RoleMention;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_RoleMention;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_RoleMention;
    static equals(a: ChannelMessage_Post_RoleMention | PlainMessage<ChannelMessage_Post_RoleMention> | undefined, b: ChannelMessage_Post_RoleMention | PlainMessage<ChannelMessage_Post_RoleMention> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Attachment
 */
export declare class ChannelMessage_Post_Attachment extends Message<ChannelMessage_Post_Attachment> {
    /**
     * @generated from oneof river.ChannelMessage.Post.Attachment.content
     */
    content: {
        /**
         * @generated from field: river.ChannelMessage.Post.Content.Image image = 101;
         */
        value: ChannelMessage_Post_Content_Image;
        case: "image";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Post.Content.EmbeddedMedia embeddedMedia = 102;
         */
        value: ChannelMessage_Post_Content_EmbeddedMedia;
        case: "embeddedMedia";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Post.Content.ChunkedMedia chunkedMedia = 103;
         */
        value: ChannelMessage_Post_Content_ChunkedMedia;
        case: "chunkedMedia";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Post.Content.EmbeddedMessage embeddedMessage = 104;
         */
        value: ChannelMessage_Post_Content_EmbeddedMessage;
        case: "embeddedMessage";
    } | {
        /**
         * @generated from field: river.ChannelMessage.Post.Content.UnfurledURL unfurledUrl = 105;
         */
        value: ChannelMessage_Post_Content_UnfurledURL;
        case: "unfurledUrl";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<ChannelMessage_Post_Attachment>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Attachment";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Attachment;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Attachment;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Attachment;
    static equals(a: ChannelMessage_Post_Attachment | PlainMessage<ChannelMessage_Post_Attachment> | undefined, b: ChannelMessage_Post_Attachment | PlainMessage<ChannelMessage_Post_Attachment> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content
 */
export declare class ChannelMessage_Post_Content extends Message<ChannelMessage_Post_Content> {
    constructor(data?: PartialMessage<ChannelMessage_Post_Content>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content;
    static equals(a: ChannelMessage_Post_Content | PlainMessage<ChannelMessage_Post_Content> | undefined, b: ChannelMessage_Post_Content | PlainMessage<ChannelMessage_Post_Content> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.Text
 */
export declare class ChannelMessage_Post_Content_Text extends Message<ChannelMessage_Post_Content_Text> {
    /**
     * @generated from field: string body = 1;
     */
    body: string;
    /**
     * @generated from field: repeated river.ChannelMessage.Post.Mention mentions = 2;
     */
    mentions: ChannelMessage_Post_Mention[];
    /**
     * @generated from field: repeated river.ChannelMessage.Post.Attachment attachments = 3;
     */
    attachments: ChannelMessage_Post_Attachment[];
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_Text>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.Text";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_Text;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_Text;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_Text;
    static equals(a: ChannelMessage_Post_Content_Text | PlainMessage<ChannelMessage_Post_Content_Text> | undefined, b: ChannelMessage_Post_Content_Text | PlainMessage<ChannelMessage_Post_Content_Text> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.Image
 */
export declare class ChannelMessage_Post_Content_Image extends Message<ChannelMessage_Post_Content_Image> {
    /**
     * @generated from field: string title = 1;
     */
    title: string;
    /**
     * @generated from field: river.ChannelMessage.Post.Content.Image.Info info = 2;
     */
    info?: ChannelMessage_Post_Content_Image_Info;
    /**
     * @generated from field: optional river.ChannelMessage.Post.Content.Image.Info thumbnail = 3;
     */
    thumbnail?: ChannelMessage_Post_Content_Image_Info;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_Image>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.Image";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_Image;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_Image;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_Image;
    static equals(a: ChannelMessage_Post_Content_Image | PlainMessage<ChannelMessage_Post_Content_Image> | undefined, b: ChannelMessage_Post_Content_Image | PlainMessage<ChannelMessage_Post_Content_Image> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.Image.Info
 */
export declare class ChannelMessage_Post_Content_Image_Info extends Message<ChannelMessage_Post_Content_Image_Info> {
    /**
     * @generated from field: string url = 1;
     */
    url: string;
    /**
     * @generated from field: string mimetype = 2;
     */
    mimetype: string;
    /**
     * @generated from field: optional int32 size = 3;
     */
    size?: number;
    /**
     * @generated from field: optional int32 width = 4;
     */
    width?: number;
    /**
     * @generated from field: optional int32 height = 5;
     */
    height?: number;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_Image_Info>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.Image.Info";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_Image_Info;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_Image_Info;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_Image_Info;
    static equals(a: ChannelMessage_Post_Content_Image_Info | PlainMessage<ChannelMessage_Post_Content_Image_Info> | undefined, b: ChannelMessage_Post_Content_Image_Info | PlainMessage<ChannelMessage_Post_Content_Image_Info> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.GM
 */
export declare class ChannelMessage_Post_Content_GM extends Message<ChannelMessage_Post_Content_GM> {
    /**
     * @generated from field: string type_url = 1;
     */
    typeUrl: string;
    /**
     * @generated from field: optional bytes value = 2;
     */
    value?: Uint8Array;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_GM>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.GM";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_GM;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_GM;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_GM;
    static equals(a: ChannelMessage_Post_Content_GM | PlainMessage<ChannelMessage_Post_Content_GM> | undefined, b: ChannelMessage_Post_Content_GM | PlainMessage<ChannelMessage_Post_Content_GM> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.MediaInfo
 */
export declare class ChannelMessage_Post_Content_MediaInfo extends Message<ChannelMessage_Post_Content_MediaInfo> {
    /**
     * @generated from field: string mimetype = 1;
     */
    mimetype: string;
    /**
     * @generated from field: int64 sizeBytes = 2;
     */
    sizeBytes: bigint;
    /**
     * @generated from field: int32 widthPixels = 3;
     */
    widthPixels: number;
    /**
     * @generated from field: int32 heightPixels = 4;
     */
    heightPixels: number;
    /**
     * @generated from field: string filename = 5;
     */
    filename: string;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_MediaInfo>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.MediaInfo";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_MediaInfo;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_MediaInfo;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_MediaInfo;
    static equals(a: ChannelMessage_Post_Content_MediaInfo | PlainMessage<ChannelMessage_Post_Content_MediaInfo> | undefined, b: ChannelMessage_Post_Content_MediaInfo | PlainMessage<ChannelMessage_Post_Content_MediaInfo> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.EmbeddedMedia
 */
export declare class ChannelMessage_Post_Content_EmbeddedMedia extends Message<ChannelMessage_Post_Content_EmbeddedMedia> {
    /**
     * @generated from field: river.ChannelMessage.Post.Content.MediaInfo info = 1;
     */
    info?: ChannelMessage_Post_Content_MediaInfo;
    /**
     * @generated from field: bytes content = 2;
     */
    content: Uint8Array;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_EmbeddedMedia>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.EmbeddedMedia";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_EmbeddedMedia;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_EmbeddedMedia;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_EmbeddedMedia;
    static equals(a: ChannelMessage_Post_Content_EmbeddedMedia | PlainMessage<ChannelMessage_Post_Content_EmbeddedMedia> | undefined, b: ChannelMessage_Post_Content_EmbeddedMedia | PlainMessage<ChannelMessage_Post_Content_EmbeddedMedia> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.ChunkedMedia
 */
export declare class ChannelMessage_Post_Content_ChunkedMedia extends Message<ChannelMessage_Post_Content_ChunkedMedia> {
    /**
     * @generated from field: river.ChannelMessage.Post.Content.MediaInfo info = 1;
     */
    info?: ChannelMessage_Post_Content_MediaInfo;
    /**
     * @generated from field: string streamId = 2;
     */
    streamId: string;
    /**
     * @generated from field: river.ChannelMessage.Post.Content.EmbeddedMedia thumbnail = 3;
     */
    thumbnail?: ChannelMessage_Post_Content_EmbeddedMedia;
    /**
     * @generated from oneof river.ChannelMessage.Post.Content.ChunkedMedia.encryption
     */
    encryption: {
        /**
         * @generated from field: river.ChannelMessage.Post.Content.ChunkedMedia.AESGCM aesgcm = 101;
         */
        value: ChannelMessage_Post_Content_ChunkedMedia_AESGCM;
        case: "aesgcm";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_ChunkedMedia>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.ChunkedMedia";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_ChunkedMedia;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_ChunkedMedia;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_ChunkedMedia;
    static equals(a: ChannelMessage_Post_Content_ChunkedMedia | PlainMessage<ChannelMessage_Post_Content_ChunkedMedia> | undefined, b: ChannelMessage_Post_Content_ChunkedMedia | PlainMessage<ChannelMessage_Post_Content_ChunkedMedia> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.ChunkedMedia.AESGCM
 */
export declare class ChannelMessage_Post_Content_ChunkedMedia_AESGCM extends Message<ChannelMessage_Post_Content_ChunkedMedia_AESGCM> {
    /**
     * @generated from field: bytes iv = 1;
     */
    iv: Uint8Array;
    /**
     * @generated from field: bytes secretKey = 2;
     */
    secretKey: Uint8Array;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_ChunkedMedia_AESGCM>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.ChunkedMedia.AESGCM";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_ChunkedMedia_AESGCM;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_ChunkedMedia_AESGCM;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_ChunkedMedia_AESGCM;
    static equals(a: ChannelMessage_Post_Content_ChunkedMedia_AESGCM | PlainMessage<ChannelMessage_Post_Content_ChunkedMedia_AESGCM> | undefined, b: ChannelMessage_Post_Content_ChunkedMedia_AESGCM | PlainMessage<ChannelMessage_Post_Content_ChunkedMedia_AESGCM> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.EmbeddedMessage
 */
export declare class ChannelMessage_Post_Content_EmbeddedMessage extends Message<ChannelMessage_Post_Content_EmbeddedMessage> {
    /**
     * @generated from field: string url = 1;
     */
    url: string;
    /**
     * @generated from field: river.ChannelMessage.Post post = 2;
     */
    post?: ChannelMessage_Post;
    /**
     * @generated from field: river.ChannelMessage.Post.Content.EmbeddedMessage.Info info = 3;
     */
    info?: ChannelMessage_Post_Content_EmbeddedMessage_Info;
    /**
     * @generated from field: river.ChannelMessage.Post.Content.EmbeddedMessage.StaticInfo staticInfo = 4;
     */
    staticInfo?: ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_EmbeddedMessage>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.EmbeddedMessage";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_EmbeddedMessage;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_EmbeddedMessage;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_EmbeddedMessage;
    static equals(a: ChannelMessage_Post_Content_EmbeddedMessage | PlainMessage<ChannelMessage_Post_Content_EmbeddedMessage> | undefined, b: ChannelMessage_Post_Content_EmbeddedMessage | PlainMessage<ChannelMessage_Post_Content_EmbeddedMessage> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.EmbeddedMessage.Info
 */
export declare class ChannelMessage_Post_Content_EmbeddedMessage_Info extends Message<ChannelMessage_Post_Content_EmbeddedMessage_Info> {
    /**
     * @generated from field: string userId = 1;
     */
    userId: string;
    /**
     * @generated from field: int64 createdAtEpochMs = 2;
     */
    createdAtEpochMs: bigint;
    /**
     * @generated from field: string spaceId = 3;
     */
    spaceId: string;
    /**
     * @generated from field: string channelId = 4;
     */
    channelId: string;
    /**
     * @generated from field: string messageId = 5;
     */
    messageId: string;
    /**
     * @generated from field: optional string replyId = 6;
     */
    replyId?: string;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_EmbeddedMessage_Info>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.EmbeddedMessage.Info";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_EmbeddedMessage_Info;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_EmbeddedMessage_Info;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_EmbeddedMessage_Info;
    static equals(a: ChannelMessage_Post_Content_EmbeddedMessage_Info | PlainMessage<ChannelMessage_Post_Content_EmbeddedMessage_Info> | undefined, b: ChannelMessage_Post_Content_EmbeddedMessage_Info | PlainMessage<ChannelMessage_Post_Content_EmbeddedMessage_Info> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.EmbeddedMessage.StaticInfo
 */
export declare class ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo extends Message<ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo> {
    /**
     * @generated from field: optional string userName = 1;
     */
    userName?: string;
    /**
     * @generated from field: optional string displayName = 2;
     */
    displayName?: string;
    /**
     * @generated from field: optional string channelName = 3;
     */
    channelName?: string;
    /**
     * @generated from field: optional string spaceName = 4;
     */
    spaceName?: string;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.EmbeddedMessage.StaticInfo";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo;
    static equals(a: ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo | PlainMessage<ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo> | undefined, b: ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo | PlainMessage<ChannelMessage_Post_Content_EmbeddedMessage_StaticInfo> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.UnfurledURL
 */
export declare class ChannelMessage_Post_Content_UnfurledURL extends Message<ChannelMessage_Post_Content_UnfurledURL> {
    /**
     * @generated from field: string url = 1;
     */
    url: string;
    /**
     * @generated from field: string description = 2;
     */
    description: string;
    /**
     * @generated from field: string title = 3;
     */
    title: string;
    /**
     * @generated from field: optional river.ChannelMessage.Post.Content.UnfurledURL.Image image = 4;
     */
    image?: ChannelMessage_Post_Content_UnfurledURL_Image;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_UnfurledURL>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.UnfurledURL";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_UnfurledURL;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_UnfurledURL;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_UnfurledURL;
    static equals(a: ChannelMessage_Post_Content_UnfurledURL | PlainMessage<ChannelMessage_Post_Content_UnfurledURL> | undefined, b: ChannelMessage_Post_Content_UnfurledURL | PlainMessage<ChannelMessage_Post_Content_UnfurledURL> | undefined): boolean;
}
/**
 * @generated from message river.ChannelMessage.Post.Content.UnfurledURL.Image
 */
export declare class ChannelMessage_Post_Content_UnfurledURL_Image extends Message<ChannelMessage_Post_Content_UnfurledURL_Image> {
    /**
     * @generated from field: int32 height = 1;
     */
    height: number;
    /**
     * @generated from field: int32 width = 2;
     */
    width: number;
    /**
     * @generated from field: string url = 3;
     */
    url: string;
    constructor(data?: PartialMessage<ChannelMessage_Post_Content_UnfurledURL_Image>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelMessage.Post.Content.UnfurledURL.Image";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelMessage_Post_Content_UnfurledURL_Image;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_UnfurledURL_Image;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelMessage_Post_Content_UnfurledURL_Image;
    static equals(a: ChannelMessage_Post_Content_UnfurledURL_Image | PlainMessage<ChannelMessage_Post_Content_UnfurledURL_Image> | undefined, b: ChannelMessage_Post_Content_UnfurledURL_Image | PlainMessage<ChannelMessage_Post_Content_UnfurledURL_Image> | undefined): boolean;
}
/**
 * @generated from message river.ChannelProperties
 */
export declare class ChannelProperties extends Message<ChannelProperties> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: string topic = 2;
     */
    topic: string;
    constructor(data?: PartialMessage<ChannelProperties>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelProperties";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelProperties;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelProperties;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelProperties;
    static equals(a: ChannelProperties | PlainMessage<ChannelProperties> | undefined, b: ChannelProperties | PlainMessage<ChannelProperties> | undefined): boolean;
}
/**
 * @generated from message river.UserMetadataProperties
 */
export declare class UserMetadataProperties extends Message<UserMetadataProperties> {
    /**
     * @generated from field: optional string username = 1;
     */
    username?: string;
    /**
     * @generated from field: optional string display_name = 2;
     */
    displayName?: string;
    constructor(data?: PartialMessage<UserMetadataProperties>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserMetadataProperties";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserMetadataProperties;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserMetadataProperties;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserMetadataProperties;
    static equals(a: UserMetadataProperties | PlainMessage<UserMetadataProperties> | undefined, b: UserMetadataProperties | PlainMessage<UserMetadataProperties> | undefined): boolean;
}
/**
 * @generated from message river.FullyReadMarkers
 */
export declare class FullyReadMarkers extends Message<FullyReadMarkers> {
    /**
     * map of ThreadId to Content
     *
     * @generated from field: map<string, river.FullyReadMarkers.Content> markers = 1;
     */
    markers: {
        [key: string]: FullyReadMarkers_Content;
    };
    constructor(data?: PartialMessage<FullyReadMarkers>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.FullyReadMarkers";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FullyReadMarkers;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FullyReadMarkers;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FullyReadMarkers;
    static equals(a: FullyReadMarkers | PlainMessage<FullyReadMarkers> | undefined, b: FullyReadMarkers | PlainMessage<FullyReadMarkers> | undefined): boolean;
}
/**
 * @generated from message river.FullyReadMarkers.Content
 */
export declare class FullyReadMarkers_Content extends Message<FullyReadMarkers_Content> {
    /**
     * @generated from field: string channel_id = 1;
     */
    channelId: string;
    /**
     * @generated from field: optional string thread_parent_id = 2;
     */
    threadParentId?: string;
    /**
     * id of the first unread event in the stream
     *
     * @generated from field: string event_id = 3;
     */
    eventId: string;
    /**
     * event number of the first unread event in the stream
     *
     * @generated from field: int64 event_num = 4;
     */
    eventNum: bigint;
    /**
     * begining of the unread window, on marking as read, number is set to end+1
     *
     * @generated from field: int64 begin_unread_window = 5;
     */
    beginUnreadWindow: bigint;
    /**
     * latest event seen by the code
     *
     * @generated from field: int64 end_unread_window = 6;
     */
    endUnreadWindow: bigint;
    /**
     * @generated from field: bool is_unread = 7;
     */
    isUnread: boolean;
    /**
     * timestamp when the event was marked as read
     *
     * @generated from field: int64 markedReadAtTs = 8;
     */
    markedReadAtTs: bigint;
    /**
     * @generated from field: int32 mentions = 9;
     */
    mentions: number;
    constructor(data?: PartialMessage<FullyReadMarkers_Content>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.FullyReadMarkers.Content";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FullyReadMarkers_Content;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FullyReadMarkers_Content;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FullyReadMarkers_Content;
    static equals(a: FullyReadMarkers_Content | PlainMessage<FullyReadMarkers_Content> | undefined, b: FullyReadMarkers_Content | PlainMessage<FullyReadMarkers_Content> | undefined): boolean;
}
/**
 * *
 * UserInboxMessage payload for group session key sharing.
 *
 * @generated from message river.SessionKeys
 */
export declare class SessionKeys extends Message<SessionKeys> {
    /**
     * @generated from field: repeated string keys = 1;
     */
    keys: string[];
    constructor(data?: PartialMessage<SessionKeys>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.SessionKeys";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SessionKeys;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SessionKeys;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SessionKeys;
    static equals(a: SessionKeys | PlainMessage<SessionKeys> | undefined, b: SessionKeys | PlainMessage<SessionKeys> | undefined): boolean;
}
//# sourceMappingURL=payloads_pb.d.ts.map