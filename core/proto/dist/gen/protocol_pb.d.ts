import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Empty, Message, proto3, Timestamp } from "@bufbuild/protobuf";
/**
 * @generated from enum river.SyncOp
 */
export declare enum SyncOp {
    /**
     * @generated from enum value: SYNC_UNSPECIFIED = 0;
     */
    SYNC_UNSPECIFIED = 0,
    /**
     * new sync
     *
     * @generated from enum value: SYNC_NEW = 1;
     */
    SYNC_NEW = 1,
    /**
     * close the sync
     *
     * @generated from enum value: SYNC_CLOSE = 2;
     */
    SYNC_CLOSE = 2,
    /**
     * update from server
     *
     * @generated from enum value: SYNC_UPDATE = 3;
     */
    SYNC_UPDATE = 3,
    /**
     * respond to the ping message from the client.
     *
     * @generated from enum value: SYNC_PONG = 4;
     */
    SYNC_PONG = 4
}
/**
 * @generated from enum river.MembershipOp
 */
export declare enum MembershipOp {
    /**
     * @generated from enum value: SO_UNSPECIFIED = 0;
     */
    SO_UNSPECIFIED = 0,
    /**
     * @generated from enum value: SO_INVITE = 1;
     */
    SO_INVITE = 1,
    /**
     * @generated from enum value: SO_JOIN = 2;
     */
    SO_JOIN = 2,
    /**
     * @generated from enum value: SO_LEAVE = 3;
     */
    SO_LEAVE = 3
}
/**
 * @generated from enum river.ChannelOp
 */
export declare enum ChannelOp {
    /**
     * @generated from enum value: CO_UNSPECIFIED = 0;
     */
    CO_UNSPECIFIED = 0,
    /**
     * @generated from enum value: CO_CREATED = 1;
     */
    CO_CREATED = 1,
    /**
     * @generated from enum value: CO_DELETED = 2;
     */
    CO_DELETED = 2,
    /**
     * @generated from enum value: CO_UPDATED = 4;
     */
    CO_UPDATED = 4
}
/**
 * Codes from 1 to 16 match gRPC/Connect codes.
 *
 * @generated from enum river.Err
 */
export declare enum Err {
    /**
     * @generated from enum value: ERR_UNSPECIFIED = 0;
     */
    ERR_UNSPECIFIED = 0,
    /**
     * Canceled indicates that the operation was canceled, typically by the
     * caller.
     *
     * @generated from enum value: CANCELED = 1;
     */
    CANCELED = 1,
    /**
     * Unknown indicates that the operation failed for an unknown reason.
     *
     * @generated from enum value: UNKNOWN = 2;
     */
    UNKNOWN = 2,
    /**
     * InvalidArgument indicates that client supplied an invalid argument.
     *
     * @generated from enum value: INVALID_ARGUMENT = 3;
     */
    INVALID_ARGUMENT = 3,
    /**
     * DeadlineExceeded indicates that deadline expired before the operation
     * could complete.
     *
     * @generated from enum value: DEADLINE_EXCEEDED = 4;
     */
    DEADLINE_EXCEEDED = 4,
    /**
     * NotFound indicates that some requested entity (for example, a file or
     * directory) was not found.
     *
     * @generated from enum value: NOT_FOUND = 5;
     */
    NOT_FOUND = 5,
    /**
     * AlreadyExists indicates that client attempted to create an entity (for
     * example, a file or directory) that already exists.
     *
     * @generated from enum value: ALREADY_EXISTS = 6;
     */
    ALREADY_EXISTS = 6,
    /**
     * PermissionDenied indicates that the caller doesn't have permission to
     * execute the specified operation.
     *
     * @generated from enum value: PERMISSION_DENIED = 7;
     */
    PERMISSION_DENIED = 7,
    /**
     * ResourceExhausted indicates that some resource has been exhausted. For
     * example, a per-user quota may be exhausted or the entire file system may
     * be full.
     *
     * @generated from enum value: RESOURCE_EXHAUSTED = 8;
     */
    RESOURCE_EXHAUSTED = 8,
    /**
     * FailedPrecondition indicates that the system is not in a state
     * required for the operation's execution.
     *
     * @generated from enum value: FAILED_PRECONDITION = 9;
     */
    FAILED_PRECONDITION = 9,
    /**
     * Aborted indicates that operation was aborted by the system, usually
     * because of a concurrency issue such as a sequencer check failure or
     * transaction abort.
     *
     * @generated from enum value: ABORTED = 10;
     */
    ABORTED = 10,
    /**
     * OutOfRange indicates that the operation was attempted past the valid
     * range (for example, seeking past end-of-file).
     *
     * @generated from enum value: OUT_OF_RANGE = 11;
     */
    OUT_OF_RANGE = 11,
    /**
     * Unimplemented indicates that the operation isn't implemented,
     * supported, or enabled in this service.
     *
     * @generated from enum value: UNIMPLEMENTED = 12;
     */
    UNIMPLEMENTED = 12,
    /**
     * Internal indicates that some invariants expected by the underlying
     * system have been broken. This code is reserved for serious errors.
     *
     * @generated from enum value: INTERNAL = 13;
     */
    INTERNAL = 13,
    /**
     * Unavailable indicates that the service is currently unavailable. This
     * is usually temporary, so clients can back off and retry idempotent
     * operations.
     *
     * @generated from enum value: UNAVAILABLE = 14;
     */
    UNAVAILABLE = 14,
    /**
     * DataLoss indicates that the operation has resulted in unrecoverable
     * data loss or corruption.
     *
     * @generated from enum value: DATA_LOSS = 15;
     */
    DATA_LOSS = 15,
    /**
     * Unauthenticated indicates that the request does not have valid
     * authentication credentials for the operation.
     *
     * @generated from enum value: UNAUTHENTICATED = 16;
     */
    UNAUTHENTICATED = 16,
    /**
     * @generated from enum value: DEBUG_ERROR = 17;
     */
    DEBUG_ERROR = 17,
    /**
     * @generated from enum value: BAD_STREAM_ID = 18;
     */
    BAD_STREAM_ID = 18,
    /**
     * @generated from enum value: BAD_STREAM_CREATION_PARAMS = 19;
     */
    BAD_STREAM_CREATION_PARAMS = 19,
    /**
     * @generated from enum value: INTERNAL_ERROR_SWITCH = 20;
     */
    INTERNAL_ERROR_SWITCH = 20,
    /**
     * @generated from enum value: BAD_EVENT_ID = 21;
     */
    BAD_EVENT_ID = 21,
    /**
     * @generated from enum value: BAD_EVENT_SIGNATURE = 22;
     */
    BAD_EVENT_SIGNATURE = 22,
    /**
     * @generated from enum value: BAD_HASH_FORMAT = 23;
     */
    BAD_HASH_FORMAT = 23,
    /**
     * @generated from enum value: BAD_PREV_MINIBLOCK_HASH = 24;
     */
    BAD_PREV_MINIBLOCK_HASH = 24,
    /**
     * @generated from enum value: NO_EVENT_SPECIFIED = 25;
     */
    NO_EVENT_SPECIFIED = 25,
    /**
     * @generated from enum value: BAD_EVENT = 26;
     */
    BAD_EVENT = 26,
    /**
     * @generated from enum value: USER_CANT_POST = 27;
     */
    USER_CANT_POST = 27,
    /**
     * @generated from enum value: STREAM_BAD_HASHES = 28;
     */
    STREAM_BAD_HASHES = 28,
    /**
     * @generated from enum value: STREAM_EMPTY = 29;
     */
    STREAM_EMPTY = 29,
    /**
     * @generated from enum value: STREAM_BAD_EVENT = 30;
     */
    STREAM_BAD_EVENT = 30,
    /**
     * @generated from enum value: BAD_DELEGATE_SIG = 31;
     */
    BAD_DELEGATE_SIG = 31,
    /**
     * @generated from enum value: BAD_PUBLIC_KEY = 32;
     */
    BAD_PUBLIC_KEY = 32,
    /**
     * @generated from enum value: BAD_PAYLOAD = 33;
     */
    BAD_PAYLOAD = 33,
    /**
     * @generated from enum value: BAD_HEX_STRING = 34;
     */
    BAD_HEX_STRING = 34,
    /**
     * @generated from enum value: BAD_EVENT_HASH = 35;
     */
    BAD_EVENT_HASH = 35,
    /**
     * @generated from enum value: BAD_SYNC_COOKIE = 36;
     */
    BAD_SYNC_COOKIE = 36,
    /**
     * @generated from enum value: DUPLICATE_EVENT = 37;
     */
    DUPLICATE_EVENT = 37,
    /**
     * @generated from enum value: BAD_BLOCK = 38;
     */
    BAD_BLOCK = 38,
    /**
     * @generated from enum value: STREAM_NO_INCEPTION_EVENT = 39;
     */
    STREAM_NO_INCEPTION_EVENT = 39,
    /**
     * @generated from enum value: BAD_BLOCK_NUMBER = 40;
     */
    BAD_BLOCK_NUMBER = 40,
    /**
     * @generated from enum value: BAD_MINIPOOL_SLOT = 41;
     */
    BAD_MINIPOOL_SLOT = 41,
    /**
     * @generated from enum value: BAD_CREATOR_ADDRESS = 42;
     */
    BAD_CREATOR_ADDRESS = 42,
    /**
     * @generated from enum value: STALE_DELEGATE = 43;
     */
    STALE_DELEGATE = 43,
    /**
     * @generated from enum value: BAD_LINK_WALLET_BAD_SIGNATURE = 44;
     */
    BAD_LINK_WALLET_BAD_SIGNATURE = 44,
    /**
     * @generated from enum value: BAD_ROOT_KEY_ID = 45;
     */
    BAD_ROOT_KEY_ID = 45,
    /**
     * @generated from enum value: UNKNOWN_NODE = 46;
     */
    UNKNOWN_NODE = 46,
    /**
     * @generated from enum value: DB_OPERATION_FAILURE = 47;
     */
    DB_OPERATION_FAILURE = 47,
    /**
     * @generated from enum value: MINIBLOCKS_STORAGE_FAILURE = 48;
     */
    MINIBLOCKS_STORAGE_FAILURE = 48,
    /**
     * @generated from enum value: BAD_ADDRESS = 49;
     */
    BAD_ADDRESS = 49,
    /**
     * @generated from enum value: BUFFER_FULL = 50;
     */
    BUFFER_FULL = 50,
    /**
     * @generated from enum value: BAD_CONFIG = 51;
     */
    BAD_CONFIG = 51,
    /**
     * @generated from enum value: BAD_CONTRACT = 52;
     */
    BAD_CONTRACT = 52,
    /**
     * @generated from enum value: CANNOT_CONNECT = 53;
     */
    CANNOT_CONNECT = 53,
    /**
     * @generated from enum value: CANNOT_GET_LINKED_WALLETS = 54;
     */
    CANNOT_GET_LINKED_WALLETS = 54,
    /**
     * @generated from enum value: CANNOT_CHECK_ENTITLEMENTS = 55;
     */
    CANNOT_CHECK_ENTITLEMENTS = 55,
    /**
     * @generated from enum value: CANNOT_CALL_CONTRACT = 56;
     */
    CANNOT_CALL_CONTRACT = 56,
    /**
     * @generated from enum value: SPACE_DISABLED = 57;
     */
    SPACE_DISABLED = 57,
    /**
     * @generated from enum value: CHANNEL_DISABLED = 58;
     */
    CHANNEL_DISABLED = 58,
    /**
     * @generated from enum value: WRONG_STREAM_TYPE = 59;
     */
    WRONG_STREAM_TYPE = 59,
    /**
     * @generated from enum value: MINIPOOL_MISSING_EVENTS = 60;
     */
    MINIPOOL_MISSING_EVENTS = 60,
    /**
     * @generated from enum value: STREAM_LAST_BLOCK_MISMATCH = 61;
     */
    STREAM_LAST_BLOCK_MISMATCH = 61,
    /**
     * @generated from enum value: DOWNSTREAM_NETWORK_ERROR = 62;
     */
    DOWNSTREAM_NETWORK_ERROR = 62
}
/**
 * *
 * Miniblock contains a list of events and the header event.
 * Events must be in the same order as in the header, which is of type MiniblockHeader.
 * Only signed data (Envelopes) should exist in this data structure.
 *
 * @generated from message river.Miniblock
 */
export declare class Miniblock extends Message<Miniblock> {
    /**
     * @generated from field: repeated river.Envelope events = 1;
     */
    events: Envelope[];
    /**
     * @generated from field: river.Envelope header = 2;
     */
    header?: Envelope;
    constructor(data?: PartialMessage<Miniblock>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.Miniblock";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Miniblock;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Miniblock;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Miniblock;
    static equals(a: Miniblock | PlainMessage<Miniblock> | undefined, b: Miniblock | PlainMessage<Miniblock> | undefined): boolean;
}
/**
 * *
 * Envelope contains serialized event, and its hash and signature.
 * hash is used as event id. Subsequent events reference this event by hash.
 * event is a serialized StreamEvent
 *
 * @generated from message river.Envelope
 */
export declare class Envelope extends Message<Envelope> {
    /**
     * *
     * Hash of event.
     * While hash can be recalculated from the event, having it here explicitely
     * makes it easier to work with event.
     * For the event to be valid, must match hash of event field.
     *
     * @generated from field: bytes hash = 1;
     */
    hash: Uint8Array;
    /**
     * *
     * Signature.
     * For the event to be valid, signature must match event.creator_address
     * or be signed by the address from evant.delegate_sig.
     *
     * @generated from field: bytes signature = 2;
     */
    signature: Uint8Array;
    /**
     * @generated from field: bytes event = 3;
     */
    event: Uint8Array;
    constructor(data?: PartialMessage<Envelope>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.Envelope";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Envelope;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Envelope;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Envelope;
    static equals(a: Envelope | PlainMessage<Envelope> | undefined, b: Envelope | PlainMessage<Envelope> | undefined): boolean;
}
/**
 * *
 * StreamEvent is a single event in the stream.
 *
 * @generated from message river.StreamEvent
 */
export declare class StreamEvent extends Message<StreamEvent> {
    /**
     * *
     * Address of the creator of the event.
     * For user - address of the user's wallet.
     * For server - address of the server's keypair in staking smart contract.
     *
     * For the event to be valid:
     * If delegate_sig is present, creator_address must match delegate_sig.
     * If delegate_sig is not present, creator_address must match event signature in the Envelope.
     *
     * @generated from field: bytes creator_address = 1;
     */
    creatorAddress: Uint8Array;
    /**
     * *
     * delegate_sig allows event to be signed by a delegate keypair
     *
     * delegate_sig constains signature of the
     * public key of the delegate keypair + the delegate_expirary_epoch_ms.
     * User's wallet is used to produce this signature.
     *
     * If present, for the event to be valid:
     * 1. creator_address must match delegate_sig's signer public key
     * 2. delegate_sig should be signed as an Ethereum Signed Message (eip-191)
     *
     * Server nodes sign node-produced events with their own keypair and do not
     * need to use delegate_sig.
     *
     * @generated from field: bytes delegate_sig = 2;
     */
    delegateSig: Uint8Array;
    /**
     * * Salt ensures that similar messages are not hashed to the same value. genId() from id.ts may be used.
     *
     * @generated from field: bytes salt = 3;
     */
    salt: Uint8Array;
    /**
     * * Hash of a preceding miniblock. Null for the inception event. Must be a recent miniblock
     *
     * @generated from field: optional bytes prev_miniblock_hash = 4;
     */
    prevMiniblockHash?: Uint8Array;
    /**
     * * CreatedAt is the time when the event was created.
     * NOTE: this value is set by clients and is not reliable for anything other than displaying
     * the value to the user. Never use this value to sort events from different users.
     *
     * @generated from field: int64 created_at_epoch_ms = 5;
     */
    createdAtEpochMs: bigint;
    /**
     * * DelegateExpiry is the time when the delegate signature expires.
     *
     * @generated from field: int64 delegate_expiry_epoch_ms = 6;
     */
    delegateExpiryEpochMs: bigint;
    /**
     * * Variable-type payload.
     * Payloads should obey the following rules:
     * - payloads should have their own unique type
     * - each payload should have a oneof content field
     * - each payload, with the exception of miniblock header and member payloads
     *     should have an inception field inside the content oneof
     * - each payload should have a unique Inception type
     * - payloads can't violate previous type recursively to inception payload
     *
     * @generated from oneof river.StreamEvent.payload
     */
    payload: {
        /**
         * @generated from field: river.MiniblockHeader miniblock_header = 100;
         */
        value: MiniblockHeader;
        case: "miniblockHeader";
    } | {
        /**
         * @generated from field: river.MemberPayload member_payload = 101;
         */
        value: MemberPayload;
        case: "memberPayload";
    } | {
        /**
         * @generated from field: river.SpacePayload space_payload = 102;
         */
        value: SpacePayload;
        case: "spacePayload";
    } | {
        /**
         * @generated from field: river.ChannelPayload channel_payload = 103;
         */
        value: ChannelPayload;
        case: "channelPayload";
    } | {
        /**
         * @generated from field: river.UserPayload user_payload = 104;
         */
        value: UserPayload;
        case: "userPayload";
    } | {
        /**
         * @generated from field: river.UserSettingsPayload user_settings_payload = 105;
         */
        value: UserSettingsPayload;
        case: "userSettingsPayload";
    } | {
        /**
         * @generated from field: river.UserDeviceKeyPayload user_device_key_payload = 106;
         */
        value: UserDeviceKeyPayload;
        case: "userDeviceKeyPayload";
    } | {
        /**
         * @generated from field: river.UserInboxPayload user_inbox_payload = 107;
         */
        value: UserInboxPayload;
        case: "userInboxPayload";
    } | {
        /**
         * @generated from field: river.MediaPayload media_payload = 108;
         */
        value: MediaPayload;
        case: "mediaPayload";
    } | {
        /**
         * @generated from field: river.DmChannelPayload dm_channel_payload = 109;
         */
        value: DmChannelPayload;
        case: "dmChannelPayload";
    } | {
        /**
         * @generated from field: river.GdmChannelPayload gdm_channel_payload = 110;
         */
        value: GdmChannelPayload;
        case: "gdmChannelPayload";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<StreamEvent>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.StreamEvent";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): StreamEvent;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): StreamEvent;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): StreamEvent;
    static equals(a: StreamEvent | PlainMessage<StreamEvent> | undefined, b: StreamEvent | PlainMessage<StreamEvent> | undefined): boolean;
}
/**
 * *
 * MiniblockHeader is a special event that forms a block from set of the stream events.
 * Hash of the serialized StreamEvent containing MiniblockHeader is used as a block hash.
 *
 * @generated from message river.MiniblockHeader
 */
export declare class MiniblockHeader extends Message<MiniblockHeader> {
    /**
     * Miniblock number.
     * 0 for genesis block.
     * Must be 1 greater than the previous block number.
     *
     * @generated from field: int64 miniblock_num = 1;
     */
    miniblockNum: bigint;
    /**
     * Hash of the previous block.
     *
     * @generated from field: bytes prev_miniblock_hash = 2;
     */
    prevMiniblockHash: Uint8Array;
    /**
     * Timestamp of the block.
     * Must be greater than the previous block timestamp.
     *
     * @generated from field: google.protobuf.Timestamp timestamp = 3;
     */
    timestamp?: Timestamp;
    /**
     * Hashes of the events included in the block.
     *
     * @generated from field: repeated bytes event_hashes = 4;
     */
    eventHashes: Uint8Array[];
    /**
     * Snapshot of the state at the end of the block.
     *
     * @generated from field: optional river.Snapshot snapshot = 5;
     */
    snapshot?: Snapshot;
    /**
     * count of all events in the stream before this block
     *
     * @generated from field: int64 event_num_offset = 6;
     */
    eventNumOffset: bigint;
    /**
     * pointer to block with previous snapshot
     *
     * @generated from field: int64 prev_snapshot_miniblock_num = 7;
     */
    prevSnapshotMiniblockNum: bigint;
    /**
     * stream payloads are required to have a content field
     *
     * @generated from oneof river.MiniblockHeader.content
     */
    content: {
        /**
         * @generated from field: google.protobuf.Empty none = 100;
         */
        value: Empty;
        case: "none";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<MiniblockHeader>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MiniblockHeader";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MiniblockHeader;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MiniblockHeader;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MiniblockHeader;
    static equals(a: MiniblockHeader | PlainMessage<MiniblockHeader> | undefined, b: MiniblockHeader | PlainMessage<MiniblockHeader> | undefined): boolean;
}
/**
 * *
 * MemberPayload
 * can appear in any stream
 *
 * @generated from message river.MemberPayload
 */
export declare class MemberPayload extends Message<MemberPayload> {
    /**
     * @generated from oneof river.MemberPayload.content
     */
    content: {
        /**
         * @generated from field: river.MemberPayload.Membership membership = 1;
         */
        value: MemberPayload_Membership;
        case: "membership";
    } | {
        /**
         * @generated from field: river.MemberPayload.KeySolicitation key_solicitation = 2;
         */
        value: MemberPayload_KeySolicitation;
        case: "keySolicitation";
    } | {
        /**
         * @generated from field: river.MemberPayload.KeyFulfillment key_fulfillment = 3;
         */
        value: MemberPayload_KeyFulfillment;
        case: "keyFulfillment";
    } | {
        /**
         * @generated from field: river.EncryptedData username = 4;
         */
        value: EncryptedData;
        case: "username";
    } | {
        /**
         * @generated from field: river.EncryptedData display_name = 5;
         */
        value: EncryptedData;
        case: "displayName";
    } | {
        /**
         * @generated from field: bytes ens_address = 6;
         */
        value: Uint8Array;
        case: "ensAddress";
    } | {
        /**
         * @generated from field: river.MemberPayload.Nft nft = 7;
         */
        value: MemberPayload_Nft;
        case: "nft";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<MemberPayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MemberPayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MemberPayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MemberPayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MemberPayload;
    static equals(a: MemberPayload | PlainMessage<MemberPayload> | undefined, b: MemberPayload | PlainMessage<MemberPayload> | undefined): boolean;
}
/**
 * @generated from message river.MemberPayload.Snapshot
 */
export declare class MemberPayload_Snapshot extends Message<MemberPayload_Snapshot> {
    /**
     * @generated from field: repeated river.MemberPayload.Snapshot.Member joined = 1;
     */
    joined: MemberPayload_Snapshot_Member[];
    constructor(data?: PartialMessage<MemberPayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MemberPayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MemberPayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MemberPayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MemberPayload_Snapshot;
    static equals(a: MemberPayload_Snapshot | PlainMessage<MemberPayload_Snapshot> | undefined, b: MemberPayload_Snapshot | PlainMessage<MemberPayload_Snapshot> | undefined): boolean;
}
/**
 * @generated from message river.MemberPayload.Snapshot.Member
 */
export declare class MemberPayload_Snapshot_Member extends Message<MemberPayload_Snapshot_Member> {
    /**
     * @generated from field: bytes user_address = 1;
     */
    userAddress: Uint8Array;
    /**
     * @generated from field: int64 miniblock_num = 2;
     */
    miniblockNum: bigint;
    /**
     * @generated from field: int64 event_num = 3;
     */
    eventNum: bigint;
    /**
     * @generated from field: repeated river.MemberPayload.KeySolicitation solicitations = 4;
     */
    solicitations: MemberPayload_KeySolicitation[];
    /**
     * @generated from field: river.WrappedEncryptedData username = 5;
     */
    username?: WrappedEncryptedData;
    /**
     * @generated from field: river.WrappedEncryptedData display_name = 6;
     */
    displayName?: WrappedEncryptedData;
    /**
     * @generated from field: bytes ens_address = 7;
     */
    ensAddress: Uint8Array;
    /**
     * @generated from field: river.MemberPayload.Nft nft = 8;
     */
    nft?: MemberPayload_Nft;
    constructor(data?: PartialMessage<MemberPayload_Snapshot_Member>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MemberPayload.Snapshot.Member";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MemberPayload_Snapshot_Member;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MemberPayload_Snapshot_Member;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MemberPayload_Snapshot_Member;
    static equals(a: MemberPayload_Snapshot_Member | PlainMessage<MemberPayload_Snapshot_Member> | undefined, b: MemberPayload_Snapshot_Member | PlainMessage<MemberPayload_Snapshot_Member> | undefined): boolean;
}
/**
 * @generated from message river.MemberPayload.Membership
 */
export declare class MemberPayload_Membership extends Message<MemberPayload_Membership> {
    /**
     * @generated from field: river.MembershipOp op = 1;
     */
    op: MembershipOp;
    /**
     * @generated from field: bytes user_address = 2;
     */
    userAddress: Uint8Array;
    /**
     * @generated from field: bytes initiator_address = 3;
     */
    initiatorAddress: Uint8Array;
    /**
     * @generated from field: optional bytes stream_parent_id = 4;
     */
    streamParentId?: Uint8Array;
    constructor(data?: PartialMessage<MemberPayload_Membership>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MemberPayload.Membership";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MemberPayload_Membership;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MemberPayload_Membership;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MemberPayload_Membership;
    static equals(a: MemberPayload_Membership | PlainMessage<MemberPayload_Membership> | undefined, b: MemberPayload_Membership | PlainMessage<MemberPayload_Membership> | undefined): boolean;
}
/**
 * @generated from message river.MemberPayload.KeySolicitation
 */
export declare class MemberPayload_KeySolicitation extends Message<MemberPayload_KeySolicitation> {
    /**
     * requesters device_key
     *
     * @generated from field: string device_key = 1;
     */
    deviceKey: string;
    /**
     * requesters fallback_key
     *
     * @generated from field: string fallback_key = 2;
     */
    fallbackKey: string;
    /**
     * true if this is a new device, session_ids will be empty
     *
     * @generated from field: bool is_new_device = 3;
     */
    isNewDevice: boolean;
    /**
     * @generated from field: repeated string session_ids = 4;
     */
    sessionIds: string[];
    constructor(data?: PartialMessage<MemberPayload_KeySolicitation>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MemberPayload.KeySolicitation";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MemberPayload_KeySolicitation;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MemberPayload_KeySolicitation;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MemberPayload_KeySolicitation;
    static equals(a: MemberPayload_KeySolicitation | PlainMessage<MemberPayload_KeySolicitation> | undefined, b: MemberPayload_KeySolicitation | PlainMessage<MemberPayload_KeySolicitation> | undefined): boolean;
}
/**
 * @generated from message river.MemberPayload.KeyFulfillment
 */
export declare class MemberPayload_KeyFulfillment extends Message<MemberPayload_KeyFulfillment> {
    /**
     * @generated from field: bytes user_address = 1;
     */
    userAddress: Uint8Array;
    /**
     * @generated from field: string device_key = 2;
     */
    deviceKey: string;
    /**
     * @generated from field: repeated string session_ids = 3;
     */
    sessionIds: string[];
    constructor(data?: PartialMessage<MemberPayload_KeyFulfillment>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MemberPayload.KeyFulfillment";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MemberPayload_KeyFulfillment;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MemberPayload_KeyFulfillment;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MemberPayload_KeyFulfillment;
    static equals(a: MemberPayload_KeyFulfillment | PlainMessage<MemberPayload_KeyFulfillment> | undefined, b: MemberPayload_KeyFulfillment | PlainMessage<MemberPayload_KeyFulfillment> | undefined): boolean;
}
/**
 * @generated from message river.MemberPayload.Nft
 */
export declare class MemberPayload_Nft extends Message<MemberPayload_Nft> {
    /**
     * @generated from field: int32 chain_id = 1;
     */
    chainId: number;
    /**
     * @generated from field: bytes contract_address = 2;
     */
    contractAddress: Uint8Array;
    /**
     * @generated from field: bytes token_id = 3;
     */
    tokenId: Uint8Array;
    constructor(data?: PartialMessage<MemberPayload_Nft>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MemberPayload.Nft";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MemberPayload_Nft;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MemberPayload_Nft;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MemberPayload_Nft;
    static equals(a: MemberPayload_Nft | PlainMessage<MemberPayload_Nft> | undefined, b: MemberPayload_Nft | PlainMessage<MemberPayload_Nft> | undefined): boolean;
}
/**
 * *
 * SpacePayload
 *
 * @generated from message river.SpacePayload
 */
export declare class SpacePayload extends Message<SpacePayload> {
    /**
     * @generated from oneof river.SpacePayload.content
     */
    content: {
        /**
         * @generated from field: river.SpacePayload.Inception inception = 1;
         */
        value: SpacePayload_Inception;
        case: "inception";
    } | {
        /**
         * @generated from field: river.SpacePayload.ChannelUpdate channel = 2;
         */
        value: SpacePayload_ChannelUpdate;
        case: "channel";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<SpacePayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.SpacePayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SpacePayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SpacePayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SpacePayload;
    static equals(a: SpacePayload | PlainMessage<SpacePayload> | undefined, b: SpacePayload | PlainMessage<SpacePayload> | undefined): boolean;
}
/**
 * @generated from message river.SpacePayload.Snapshot
 */
export declare class SpacePayload_Snapshot extends Message<SpacePayload_Snapshot> {
    /**
     * inception
     *
     * @generated from field: river.SpacePayload.Inception inception = 1;
     */
    inception?: SpacePayload_Inception;
    /**
     * channels: sorted by channel_id
     *
     * @generated from field: repeated river.SpacePayload.ChannelMetadata channels = 2;
     */
    channels: SpacePayload_ChannelMetadata[];
    constructor(data?: PartialMessage<SpacePayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.SpacePayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SpacePayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SpacePayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SpacePayload_Snapshot;
    static equals(a: SpacePayload_Snapshot | PlainMessage<SpacePayload_Snapshot> | undefined, b: SpacePayload_Snapshot | PlainMessage<SpacePayload_Snapshot> | undefined): boolean;
}
/**
 * @generated from message river.SpacePayload.Inception
 */
export declare class SpacePayload_Inception extends Message<SpacePayload_Inception> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: river.StreamSettings settings = 2;
     */
    settings?: StreamSettings;
    constructor(data?: PartialMessage<SpacePayload_Inception>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.SpacePayload.Inception";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SpacePayload_Inception;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SpacePayload_Inception;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SpacePayload_Inception;
    static equals(a: SpacePayload_Inception | PlainMessage<SpacePayload_Inception> | undefined, b: SpacePayload_Inception | PlainMessage<SpacePayload_Inception> | undefined): boolean;
}
/**
 * @generated from message river.SpacePayload.ChannelMetadata
 */
export declare class SpacePayload_ChannelMetadata extends Message<SpacePayload_ChannelMetadata> {
    /**
     * @generated from field: river.ChannelOp op = 1;
     */
    op: ChannelOp;
    /**
     * @generated from field: bytes channel_id = 2;
     */
    channelId: Uint8Array;
    /**
     * @generated from field: river.EventRef origin_event = 3;
     */
    originEvent?: EventRef;
    /**
     * @generated from field: int64 updated_at_event_num = 6;
     */
    updatedAtEventNum: bigint;
    constructor(data?: PartialMessage<SpacePayload_ChannelMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.SpacePayload.ChannelMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SpacePayload_ChannelMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SpacePayload_ChannelMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SpacePayload_ChannelMetadata;
    static equals(a: SpacePayload_ChannelMetadata | PlainMessage<SpacePayload_ChannelMetadata> | undefined, b: SpacePayload_ChannelMetadata | PlainMessage<SpacePayload_ChannelMetadata> | undefined): boolean;
}
/**
 * @generated from message river.SpacePayload.ChannelUpdate
 */
export declare class SpacePayload_ChannelUpdate extends Message<SpacePayload_ChannelUpdate> {
    /**
     * @generated from field: river.ChannelOp op = 1;
     */
    op: ChannelOp;
    /**
     * @generated from field: bytes channel_id = 2;
     */
    channelId: Uint8Array;
    /**
     * @generated from field: river.EventRef origin_event = 3;
     */
    originEvent?: EventRef;
    constructor(data?: PartialMessage<SpacePayload_ChannelUpdate>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.SpacePayload.ChannelUpdate";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SpacePayload_ChannelUpdate;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SpacePayload_ChannelUpdate;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SpacePayload_ChannelUpdate;
    static equals(a: SpacePayload_ChannelUpdate | PlainMessage<SpacePayload_ChannelUpdate> | undefined, b: SpacePayload_ChannelUpdate | PlainMessage<SpacePayload_ChannelUpdate> | undefined): boolean;
}
/**
 * *
 * ChannelPayload
 *
 * @generated from message river.ChannelPayload
 */
export declare class ChannelPayload extends Message<ChannelPayload> {
    /**
     * @generated from oneof river.ChannelPayload.content
     */
    content: {
        /**
         * @generated from field: river.ChannelPayload.Inception inception = 1;
         */
        value: ChannelPayload_Inception;
        case: "inception";
    } | {
        /**
         * @generated from field: river.EncryptedData message = 2;
         */
        value: EncryptedData;
        case: "message";
    } | {
        /**
         * @generated from field: river.ChannelPayload.Redaction redaction = 3;
         */
        value: ChannelPayload_Redaction;
        case: "redaction";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<ChannelPayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelPayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelPayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelPayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelPayload;
    static equals(a: ChannelPayload | PlainMessage<ChannelPayload> | undefined, b: ChannelPayload | PlainMessage<ChannelPayload> | undefined): boolean;
}
/**
 * @generated from message river.ChannelPayload.Snapshot
 */
export declare class ChannelPayload_Snapshot extends Message<ChannelPayload_Snapshot> {
    /**
     * inception
     *
     * @generated from field: river.ChannelPayload.Inception inception = 1;
     */
    inception?: ChannelPayload_Inception;
    constructor(data?: PartialMessage<ChannelPayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelPayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelPayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelPayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelPayload_Snapshot;
    static equals(a: ChannelPayload_Snapshot | PlainMessage<ChannelPayload_Snapshot> | undefined, b: ChannelPayload_Snapshot | PlainMessage<ChannelPayload_Snapshot> | undefined): boolean;
}
/**
 * @generated from message river.ChannelPayload.Inception
 */
export declare class ChannelPayload_Inception extends Message<ChannelPayload_Inception> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: bytes space_id = 3;
     */
    spaceId: Uint8Array;
    /**
     * @generated from field: river.StreamSettings settings = 5;
     */
    settings?: StreamSettings;
    constructor(data?: PartialMessage<ChannelPayload_Inception>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelPayload.Inception";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelPayload_Inception;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelPayload_Inception;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelPayload_Inception;
    static equals(a: ChannelPayload_Inception | PlainMessage<ChannelPayload_Inception> | undefined, b: ChannelPayload_Inception | PlainMessage<ChannelPayload_Inception> | undefined): boolean;
}
/**
 * @generated from message river.ChannelPayload.Redaction
 */
export declare class ChannelPayload_Redaction extends Message<ChannelPayload_Redaction> {
    /**
     * @generated from field: bytes event_id = 1;
     */
    eventId: Uint8Array;
    constructor(data?: PartialMessage<ChannelPayload_Redaction>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.ChannelPayload.Redaction";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ChannelPayload_Redaction;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ChannelPayload_Redaction;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ChannelPayload_Redaction;
    static equals(a: ChannelPayload_Redaction | PlainMessage<ChannelPayload_Redaction> | undefined, b: ChannelPayload_Redaction | PlainMessage<ChannelPayload_Redaction> | undefined): boolean;
}
/**
 * *
 * DmChannelPayload
 *
 * @generated from message river.DmChannelPayload
 */
export declare class DmChannelPayload extends Message<DmChannelPayload> {
    /**
     * @generated from oneof river.DmChannelPayload.content
     */
    content: {
        /**
         * @generated from field: river.DmChannelPayload.Inception inception = 1;
         */
        value: DmChannelPayload_Inception;
        case: "inception";
    } | {
        /**
         * @generated from field: river.EncryptedData message = 3;
         */
        value: EncryptedData;
        case: "message";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<DmChannelPayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.DmChannelPayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DmChannelPayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DmChannelPayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DmChannelPayload;
    static equals(a: DmChannelPayload | PlainMessage<DmChannelPayload> | undefined, b: DmChannelPayload | PlainMessage<DmChannelPayload> | undefined): boolean;
}
/**
 * @generated from message river.DmChannelPayload.Snapshot
 */
export declare class DmChannelPayload_Snapshot extends Message<DmChannelPayload_Snapshot> {
    /**
     * @generated from field: river.DmChannelPayload.Inception inception = 1;
     */
    inception?: DmChannelPayload_Inception;
    constructor(data?: PartialMessage<DmChannelPayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.DmChannelPayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DmChannelPayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DmChannelPayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DmChannelPayload_Snapshot;
    static equals(a: DmChannelPayload_Snapshot | PlainMessage<DmChannelPayload_Snapshot> | undefined, b: DmChannelPayload_Snapshot | PlainMessage<DmChannelPayload_Snapshot> | undefined): boolean;
}
/**
 * @generated from message river.DmChannelPayload.Inception
 */
export declare class DmChannelPayload_Inception extends Message<DmChannelPayload_Inception> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: bytes first_party_address = 2;
     */
    firstPartyAddress: Uint8Array;
    /**
     * @generated from field: bytes second_party_address = 3;
     */
    secondPartyAddress: Uint8Array;
    /**
     * @generated from field: river.StreamSettings settings = 4;
     */
    settings?: StreamSettings;
    constructor(data?: PartialMessage<DmChannelPayload_Inception>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.DmChannelPayload.Inception";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DmChannelPayload_Inception;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DmChannelPayload_Inception;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DmChannelPayload_Inception;
    static equals(a: DmChannelPayload_Inception | PlainMessage<DmChannelPayload_Inception> | undefined, b: DmChannelPayload_Inception | PlainMessage<DmChannelPayload_Inception> | undefined): boolean;
}
/**
 * *
 * GdmChannelPayload
 *
 * @generated from message river.GdmChannelPayload
 */
export declare class GdmChannelPayload extends Message<GdmChannelPayload> {
    /**
     * @generated from oneof river.GdmChannelPayload.content
     */
    content: {
        /**
         * @generated from field: river.GdmChannelPayload.Inception inception = 1;
         */
        value: GdmChannelPayload_Inception;
        case: "inception";
    } | {
        /**
         * @generated from field: river.EncryptedData message = 2;
         */
        value: EncryptedData;
        case: "message";
    } | {
        /**
         * @generated from field: river.EncryptedData channel_properties = 3;
         */
        value: EncryptedData;
        case: "channelProperties";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<GdmChannelPayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GdmChannelPayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GdmChannelPayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GdmChannelPayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GdmChannelPayload;
    static equals(a: GdmChannelPayload | PlainMessage<GdmChannelPayload> | undefined, b: GdmChannelPayload | PlainMessage<GdmChannelPayload> | undefined): boolean;
}
/**
 * @generated from message river.GdmChannelPayload.Snapshot
 */
export declare class GdmChannelPayload_Snapshot extends Message<GdmChannelPayload_Snapshot> {
    /**
     * @generated from field: river.GdmChannelPayload.Inception inception = 1;
     */
    inception?: GdmChannelPayload_Inception;
    /**
     * @generated from field: river.WrappedEncryptedData channel_properties = 2;
     */
    channelProperties?: WrappedEncryptedData;
    constructor(data?: PartialMessage<GdmChannelPayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GdmChannelPayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GdmChannelPayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GdmChannelPayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GdmChannelPayload_Snapshot;
    static equals(a: GdmChannelPayload_Snapshot | PlainMessage<GdmChannelPayload_Snapshot> | undefined, b: GdmChannelPayload_Snapshot | PlainMessage<GdmChannelPayload_Snapshot> | undefined): boolean;
}
/**
 * @generated from message river.GdmChannelPayload.Inception
 */
export declare class GdmChannelPayload_Inception extends Message<GdmChannelPayload_Inception> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: river.EncryptedData channel_properties = 2;
     */
    channelProperties?: EncryptedData;
    /**
     * @generated from field: river.StreamSettings settings = 3;
     */
    settings?: StreamSettings;
    constructor(data?: PartialMessage<GdmChannelPayload_Inception>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GdmChannelPayload.Inception";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GdmChannelPayload_Inception;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GdmChannelPayload_Inception;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GdmChannelPayload_Inception;
    static equals(a: GdmChannelPayload_Inception | PlainMessage<GdmChannelPayload_Inception> | undefined, b: GdmChannelPayload_Inception | PlainMessage<GdmChannelPayload_Inception> | undefined): boolean;
}
/**
 * *
 * UserPayload
 *
 * @generated from message river.UserPayload
 */
export declare class UserPayload extends Message<UserPayload> {
    /**
     * @generated from oneof river.UserPayload.content
     */
    content: {
        /**
         * @generated from field: river.UserPayload.Inception inception = 1;
         */
        value: UserPayload_Inception;
        case: "inception";
    } | {
        /**
         * @generated from field: river.UserPayload.UserMembership user_membership = 2;
         */
        value: UserPayload_UserMembership;
        case: "userMembership";
    } | {
        /**
         * @generated from field: river.UserPayload.UserMembershipAction user_membership_action = 3;
         */
        value: UserPayload_UserMembershipAction;
        case: "userMembershipAction";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<UserPayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserPayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserPayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserPayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserPayload;
    static equals(a: UserPayload | PlainMessage<UserPayload> | undefined, b: UserPayload | PlainMessage<UserPayload> | undefined): boolean;
}
/**
 * @generated from message river.UserPayload.Snapshot
 */
export declare class UserPayload_Snapshot extends Message<UserPayload_Snapshot> {
    /**
     * inception
     *
     * @generated from field: river.UserPayload.Inception inception = 1;
     */
    inception?: UserPayload_Inception;
    /**
     * memberships, sorted by stream_id
     *
     * @generated from field: repeated river.UserPayload.UserMembership memberships = 2;
     */
    memberships: UserPayload_UserMembership[];
    constructor(data?: PartialMessage<UserPayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserPayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserPayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserPayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserPayload_Snapshot;
    static equals(a: UserPayload_Snapshot | PlainMessage<UserPayload_Snapshot> | undefined, b: UserPayload_Snapshot | PlainMessage<UserPayload_Snapshot> | undefined): boolean;
}
/**
 * @generated from message river.UserPayload.Inception
 */
export declare class UserPayload_Inception extends Message<UserPayload_Inception> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: river.StreamSettings settings = 2;
     */
    settings?: StreamSettings;
    constructor(data?: PartialMessage<UserPayload_Inception>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserPayload.Inception";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserPayload_Inception;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserPayload_Inception;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserPayload_Inception;
    static equals(a: UserPayload_Inception | PlainMessage<UserPayload_Inception> | undefined, b: UserPayload_Inception | PlainMessage<UserPayload_Inception> | undefined): boolean;
}
/**
 * update own membership
 *
 * @generated from message river.UserPayload.UserMembership
 */
export declare class UserPayload_UserMembership extends Message<UserPayload_UserMembership> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: river.MembershipOp op = 2;
     */
    op: MembershipOp;
    /**
     * @generated from field: optional bytes inviter = 3;
     */
    inviter?: Uint8Array;
    /**
     * @generated from field: optional bytes stream_parent_id = 4;
     */
    streamParentId?: Uint8Array;
    constructor(data?: PartialMessage<UserPayload_UserMembership>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserPayload.UserMembership";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserPayload_UserMembership;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserPayload_UserMembership;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserPayload_UserMembership;
    static equals(a: UserPayload_UserMembership | PlainMessage<UserPayload_UserMembership> | undefined, b: UserPayload_UserMembership | PlainMessage<UserPayload_UserMembership> | undefined): boolean;
}
/**
 * update someone else's membership
 *
 * @generated from message river.UserPayload.UserMembershipAction
 */
export declare class UserPayload_UserMembershipAction extends Message<UserPayload_UserMembershipAction> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: bytes user_id = 2;
     */
    userId: Uint8Array;
    /**
     * @generated from field: river.MembershipOp op = 3;
     */
    op: MembershipOp;
    /**
     * @generated from field: optional bytes stream_parent_id = 4;
     */
    streamParentId?: Uint8Array;
    constructor(data?: PartialMessage<UserPayload_UserMembershipAction>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserPayload.UserMembershipAction";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserPayload_UserMembershipAction;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserPayload_UserMembershipAction;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserPayload_UserMembershipAction;
    static equals(a: UserPayload_UserMembershipAction | PlainMessage<UserPayload_UserMembershipAction> | undefined, b: UserPayload_UserMembershipAction | PlainMessage<UserPayload_UserMembershipAction> | undefined): boolean;
}
/**
 * *
 * UserInboxPayload
 * messages to a user encrypted per deviceId
 *
 * @generated from message river.UserInboxPayload
 */
export declare class UserInboxPayload extends Message<UserInboxPayload> {
    /**
     * @generated from oneof river.UserInboxPayload.content
     */
    content: {
        /**
         * @generated from field: river.UserInboxPayload.Inception inception = 1;
         */
        value: UserInboxPayload_Inception;
        case: "inception";
    } | {
        /**
         * @generated from field: river.UserInboxPayload.Ack ack = 2;
         */
        value: UserInboxPayload_Ack;
        case: "ack";
    } | {
        /**
         * @generated from field: river.UserInboxPayload.GroupEncryptionSessions group_encryption_sessions = 3;
         */
        value: UserInboxPayload_GroupEncryptionSessions;
        case: "groupEncryptionSessions";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<UserInboxPayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserInboxPayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserInboxPayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserInboxPayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserInboxPayload;
    static equals(a: UserInboxPayload | PlainMessage<UserInboxPayload> | undefined, b: UserInboxPayload | PlainMessage<UserInboxPayload> | undefined): boolean;
}
/**
 * @generated from message river.UserInboxPayload.Snapshot
 */
export declare class UserInboxPayload_Snapshot extends Message<UserInboxPayload_Snapshot> {
    /**
     * @generated from field: river.UserInboxPayload.Inception inception = 1;
     */
    inception?: UserInboxPayload_Inception;
    /**
     * deviceKey: miniblockNum that the ack was snapshotted
     *
     * @generated from field: map<string, river.UserInboxPayload.Snapshot.DeviceSummary> device_summary = 2;
     */
    deviceSummary: {
        [key: string]: UserInboxPayload_Snapshot_DeviceSummary;
    };
    constructor(data?: PartialMessage<UserInboxPayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserInboxPayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserInboxPayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserInboxPayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserInboxPayload_Snapshot;
    static equals(a: UserInboxPayload_Snapshot | PlainMessage<UserInboxPayload_Snapshot> | undefined, b: UserInboxPayload_Snapshot | PlainMessage<UserInboxPayload_Snapshot> | undefined): boolean;
}
/**
 * @generated from message river.UserInboxPayload.Snapshot.DeviceSummary
 */
export declare class UserInboxPayload_Snapshot_DeviceSummary extends Message<UserInboxPayload_Snapshot_DeviceSummary> {
    /**
     * *
     * UpperBound = latest to device event sent from other client per deviceKey
     * LowerBound = latest ack sent by stream owner per deviceKey
     * on ack, if UpperBound <= LowerBound then delete this deviceKey entry from the record
     * on ack or new session, if any device’s lower bound < N generations ago, delete the deviceKey entry from the record
     *
     * @generated from field: int64 lower_bound = 1;
     */
    lowerBound: bigint;
    /**
     * @generated from field: int64 upper_bound = 2;
     */
    upperBound: bigint;
    constructor(data?: PartialMessage<UserInboxPayload_Snapshot_DeviceSummary>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserInboxPayload.Snapshot.DeviceSummary";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserInboxPayload_Snapshot_DeviceSummary;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserInboxPayload_Snapshot_DeviceSummary;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserInboxPayload_Snapshot_DeviceSummary;
    static equals(a: UserInboxPayload_Snapshot_DeviceSummary | PlainMessage<UserInboxPayload_Snapshot_DeviceSummary> | undefined, b: UserInboxPayload_Snapshot_DeviceSummary | PlainMessage<UserInboxPayload_Snapshot_DeviceSummary> | undefined): boolean;
}
/**
 * @generated from message river.UserInboxPayload.Inception
 */
export declare class UserInboxPayload_Inception extends Message<UserInboxPayload_Inception> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: river.StreamSettings settings = 2;
     */
    settings?: StreamSettings;
    constructor(data?: PartialMessage<UserInboxPayload_Inception>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserInboxPayload.Inception";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserInboxPayload_Inception;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserInboxPayload_Inception;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserInboxPayload_Inception;
    static equals(a: UserInboxPayload_Inception | PlainMessage<UserInboxPayload_Inception> | undefined, b: UserInboxPayload_Inception | PlainMessage<UserInboxPayload_Inception> | undefined): boolean;
}
/**
 * @generated from message river.UserInboxPayload.GroupEncryptionSessions
 */
export declare class UserInboxPayload_GroupEncryptionSessions extends Message<UserInboxPayload_GroupEncryptionSessions> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: string sender_key = 2;
     */
    senderKey: string;
    /**
     * @generated from field: repeated string session_ids = 3;
     */
    sessionIds: string[];
    /**
     * deviceKey: per device ciphertext of encrypted session keys that match session_ids
     *
     * @generated from field: map<string, string> ciphertexts = 4;
     */
    ciphertexts: {
        [key: string]: string;
    };
    constructor(data?: PartialMessage<UserInboxPayload_GroupEncryptionSessions>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserInboxPayload.GroupEncryptionSessions";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserInboxPayload_GroupEncryptionSessions;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserInboxPayload_GroupEncryptionSessions;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserInboxPayload_GroupEncryptionSessions;
    static equals(a: UserInboxPayload_GroupEncryptionSessions | PlainMessage<UserInboxPayload_GroupEncryptionSessions> | undefined, b: UserInboxPayload_GroupEncryptionSessions | PlainMessage<UserInboxPayload_GroupEncryptionSessions> | undefined): boolean;
}
/**
 * @generated from message river.UserInboxPayload.Ack
 */
export declare class UserInboxPayload_Ack extends Message<UserInboxPayload_Ack> {
    /**
     * @generated from field: string device_key = 1;
     */
    deviceKey: string;
    /**
     * @generated from field: int64 miniblock_num = 2;
     */
    miniblockNum: bigint;
    constructor(data?: PartialMessage<UserInboxPayload_Ack>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserInboxPayload.Ack";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserInboxPayload_Ack;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserInboxPayload_Ack;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserInboxPayload_Ack;
    static equals(a: UserInboxPayload_Ack | PlainMessage<UserInboxPayload_Ack> | undefined, b: UserInboxPayload_Ack | PlainMessage<UserInboxPayload_Ack> | undefined): boolean;
}
/**
 * *
 * UserSettingsPayload
 *
 * @generated from message river.UserSettingsPayload
 */
export declare class UserSettingsPayload extends Message<UserSettingsPayload> {
    /**
     * @generated from oneof river.UserSettingsPayload.content
     */
    content: {
        /**
         * @generated from field: river.UserSettingsPayload.Inception inception = 1;
         */
        value: UserSettingsPayload_Inception;
        case: "inception";
    } | {
        /**
         * @generated from field: river.UserSettingsPayload.FullyReadMarkers fully_read_markers = 2;
         */
        value: UserSettingsPayload_FullyReadMarkers;
        case: "fullyReadMarkers";
    } | {
        /**
         * @generated from field: river.UserSettingsPayload.UserBlock user_block = 3;
         */
        value: UserSettingsPayload_UserBlock;
        case: "userBlock";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<UserSettingsPayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserSettingsPayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserSettingsPayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserSettingsPayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserSettingsPayload;
    static equals(a: UserSettingsPayload | PlainMessage<UserSettingsPayload> | undefined, b: UserSettingsPayload | PlainMessage<UserSettingsPayload> | undefined): boolean;
}
/**
 * @generated from message river.UserSettingsPayload.Snapshot
 */
export declare class UserSettingsPayload_Snapshot extends Message<UserSettingsPayload_Snapshot> {
    /**
     * inception
     *
     * @generated from field: river.UserSettingsPayload.Inception inception = 1;
     */
    inception?: UserSettingsPayload_Inception;
    /**
     * fullyReadMarkers: sorted by stream_id
     *
     * @generated from field: repeated river.UserSettingsPayload.FullyReadMarkers fully_read_markers = 2;
     */
    fullyReadMarkers: UserSettingsPayload_FullyReadMarkers[];
    /**
     * @generated from field: repeated river.UserSettingsPayload.Snapshot.UserBlocks user_blocks_list = 3;
     */
    userBlocksList: UserSettingsPayload_Snapshot_UserBlocks[];
    constructor(data?: PartialMessage<UserSettingsPayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserSettingsPayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserSettingsPayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserSettingsPayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserSettingsPayload_Snapshot;
    static equals(a: UserSettingsPayload_Snapshot | PlainMessage<UserSettingsPayload_Snapshot> | undefined, b: UserSettingsPayload_Snapshot | PlainMessage<UserSettingsPayload_Snapshot> | undefined): boolean;
}
/**
 * for a specific blocked user, there might be multiple block or unblock events
 *
 * @generated from message river.UserSettingsPayload.Snapshot.UserBlocks
 */
export declare class UserSettingsPayload_Snapshot_UserBlocks extends Message<UserSettingsPayload_Snapshot_UserBlocks> {
    /**
     * @generated from field: bytes user_id = 1;
     */
    userId: Uint8Array;
    /**
     * @generated from field: repeated river.UserSettingsPayload.Snapshot.UserBlocks.Block blocks = 2;
     */
    blocks: UserSettingsPayload_Snapshot_UserBlocks_Block[];
    constructor(data?: PartialMessage<UserSettingsPayload_Snapshot_UserBlocks>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserSettingsPayload.Snapshot.UserBlocks";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserSettingsPayload_Snapshot_UserBlocks;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserSettingsPayload_Snapshot_UserBlocks;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserSettingsPayload_Snapshot_UserBlocks;
    static equals(a: UserSettingsPayload_Snapshot_UserBlocks | PlainMessage<UserSettingsPayload_Snapshot_UserBlocks> | undefined, b: UserSettingsPayload_Snapshot_UserBlocks | PlainMessage<UserSettingsPayload_Snapshot_UserBlocks> | undefined): boolean;
}
/**
 * @generated from message river.UserSettingsPayload.Snapshot.UserBlocks.Block
 */
export declare class UserSettingsPayload_Snapshot_UserBlocks_Block extends Message<UserSettingsPayload_Snapshot_UserBlocks_Block> {
    /**
     * @generated from field: bool is_blocked = 1;
     */
    isBlocked: boolean;
    /**
     * @generated from field: int64 event_num = 2;
     */
    eventNum: bigint;
    constructor(data?: PartialMessage<UserSettingsPayload_Snapshot_UserBlocks_Block>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserSettingsPayload.Snapshot.UserBlocks.Block";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserSettingsPayload_Snapshot_UserBlocks_Block;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserSettingsPayload_Snapshot_UserBlocks_Block;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserSettingsPayload_Snapshot_UserBlocks_Block;
    static equals(a: UserSettingsPayload_Snapshot_UserBlocks_Block | PlainMessage<UserSettingsPayload_Snapshot_UserBlocks_Block> | undefined, b: UserSettingsPayload_Snapshot_UserBlocks_Block | PlainMessage<UserSettingsPayload_Snapshot_UserBlocks_Block> | undefined): boolean;
}
/**
 * @generated from message river.UserSettingsPayload.Inception
 */
export declare class UserSettingsPayload_Inception extends Message<UserSettingsPayload_Inception> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: river.StreamSettings settings = 2;
     */
    settings?: StreamSettings;
    constructor(data?: PartialMessage<UserSettingsPayload_Inception>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserSettingsPayload.Inception";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserSettingsPayload_Inception;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserSettingsPayload_Inception;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserSettingsPayload_Inception;
    static equals(a: UserSettingsPayload_Inception | PlainMessage<UserSettingsPayload_Inception> | undefined, b: UserSettingsPayload_Inception | PlainMessage<UserSettingsPayload_Inception> | undefined): boolean;
}
/**
 * @generated from message river.UserSettingsPayload.MarkerContent
 */
export declare class UserSettingsPayload_MarkerContent extends Message<UserSettingsPayload_MarkerContent> {
    /**
     * @generated from field: string data = 1;
     */
    data: string;
    constructor(data?: PartialMessage<UserSettingsPayload_MarkerContent>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserSettingsPayload.MarkerContent";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserSettingsPayload_MarkerContent;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserSettingsPayload_MarkerContent;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserSettingsPayload_MarkerContent;
    static equals(a: UserSettingsPayload_MarkerContent | PlainMessage<UserSettingsPayload_MarkerContent> | undefined, b: UserSettingsPayload_MarkerContent | PlainMessage<UserSettingsPayload_MarkerContent> | undefined): boolean;
}
/**
 * @generated from message river.UserSettingsPayload.FullyReadMarkers
 */
export declare class UserSettingsPayload_FullyReadMarkers extends Message<UserSettingsPayload_FullyReadMarkers> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: river.UserSettingsPayload.MarkerContent content = 2;
     */
    content?: UserSettingsPayload_MarkerContent;
    constructor(data?: PartialMessage<UserSettingsPayload_FullyReadMarkers>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserSettingsPayload.FullyReadMarkers";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserSettingsPayload_FullyReadMarkers;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserSettingsPayload_FullyReadMarkers;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserSettingsPayload_FullyReadMarkers;
    static equals(a: UserSettingsPayload_FullyReadMarkers | PlainMessage<UserSettingsPayload_FullyReadMarkers> | undefined, b: UserSettingsPayload_FullyReadMarkers | PlainMessage<UserSettingsPayload_FullyReadMarkers> | undefined): boolean;
}
/**
 * @generated from message river.UserSettingsPayload.UserBlock
 */
export declare class UserSettingsPayload_UserBlock extends Message<UserSettingsPayload_UserBlock> {
    /**
     * @generated from field: bytes user_id = 1;
     */
    userId: Uint8Array;
    /**
     * @generated from field: bool is_blocked = 2;
     */
    isBlocked: boolean;
    /**
     * @generated from field: int64 event_num = 3;
     */
    eventNum: bigint;
    constructor(data?: PartialMessage<UserSettingsPayload_UserBlock>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserSettingsPayload.UserBlock";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserSettingsPayload_UserBlock;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserSettingsPayload_UserBlock;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserSettingsPayload_UserBlock;
    static equals(a: UserSettingsPayload_UserBlock | PlainMessage<UserSettingsPayload_UserBlock> | undefined, b: UserSettingsPayload_UserBlock | PlainMessage<UserSettingsPayload_UserBlock> | undefined): boolean;
}
/**
 * *
 * UserDeviceKeyPayload
 *
 * @generated from message river.UserDeviceKeyPayload
 */
export declare class UserDeviceKeyPayload extends Message<UserDeviceKeyPayload> {
    /**
     * @generated from oneof river.UserDeviceKeyPayload.content
     */
    content: {
        /**
         * @generated from field: river.UserDeviceKeyPayload.Inception inception = 1;
         */
        value: UserDeviceKeyPayload_Inception;
        case: "inception";
    } | {
        /**
         * @generated from field: river.UserDeviceKeyPayload.EncryptionDevice encryption_device = 2;
         */
        value: UserDeviceKeyPayload_EncryptionDevice;
        case: "encryptionDevice";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<UserDeviceKeyPayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserDeviceKeyPayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserDeviceKeyPayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserDeviceKeyPayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserDeviceKeyPayload;
    static equals(a: UserDeviceKeyPayload | PlainMessage<UserDeviceKeyPayload> | undefined, b: UserDeviceKeyPayload | PlainMessage<UserDeviceKeyPayload> | undefined): boolean;
}
/**
 * @generated from message river.UserDeviceKeyPayload.Snapshot
 */
export declare class UserDeviceKeyPayload_Snapshot extends Message<UserDeviceKeyPayload_Snapshot> {
    /**
     * inception
     *
     * @generated from field: river.UserDeviceKeyPayload.Inception inception = 1;
     */
    inception?: UserDeviceKeyPayload_Inception;
    /**
     * device keys for this user, unique by device_key, capped at N, most recent last
     *
     * @generated from field: repeated river.UserDeviceKeyPayload.EncryptionDevice encryption_devices = 2;
     */
    encryptionDevices: UserDeviceKeyPayload_EncryptionDevice[];
    constructor(data?: PartialMessage<UserDeviceKeyPayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserDeviceKeyPayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserDeviceKeyPayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserDeviceKeyPayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserDeviceKeyPayload_Snapshot;
    static equals(a: UserDeviceKeyPayload_Snapshot | PlainMessage<UserDeviceKeyPayload_Snapshot> | undefined, b: UserDeviceKeyPayload_Snapshot | PlainMessage<UserDeviceKeyPayload_Snapshot> | undefined): boolean;
}
/**
 * @generated from message river.UserDeviceKeyPayload.Inception
 */
export declare class UserDeviceKeyPayload_Inception extends Message<UserDeviceKeyPayload_Inception> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: river.StreamSettings settings = 2;
     */
    settings?: StreamSettings;
    constructor(data?: PartialMessage<UserDeviceKeyPayload_Inception>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserDeviceKeyPayload.Inception";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserDeviceKeyPayload_Inception;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserDeviceKeyPayload_Inception;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserDeviceKeyPayload_Inception;
    static equals(a: UserDeviceKeyPayload_Inception | PlainMessage<UserDeviceKeyPayload_Inception> | undefined, b: UserDeviceKeyPayload_Inception | PlainMessage<UserDeviceKeyPayload_Inception> | undefined): boolean;
}
/**
 * @generated from message river.UserDeviceKeyPayload.EncryptionDevice
 */
export declare class UserDeviceKeyPayload_EncryptionDevice extends Message<UserDeviceKeyPayload_EncryptionDevice> {
    /**
     * @generated from field: string device_key = 1;
     */
    deviceKey: string;
    /**
     * @generated from field: string fallback_key = 2;
     */
    fallbackKey: string;
    constructor(data?: PartialMessage<UserDeviceKeyPayload_EncryptionDevice>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.UserDeviceKeyPayload.EncryptionDevice";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserDeviceKeyPayload_EncryptionDevice;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserDeviceKeyPayload_EncryptionDevice;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserDeviceKeyPayload_EncryptionDevice;
    static equals(a: UserDeviceKeyPayload_EncryptionDevice | PlainMessage<UserDeviceKeyPayload_EncryptionDevice> | undefined, b: UserDeviceKeyPayload_EncryptionDevice | PlainMessage<UserDeviceKeyPayload_EncryptionDevice> | undefined): boolean;
}
/**
 * *
 * MediaPayload
 *
 * @generated from message river.MediaPayload
 */
export declare class MediaPayload extends Message<MediaPayload> {
    /**
     * @generated from oneof river.MediaPayload.content
     */
    content: {
        /**
         * @generated from field: river.MediaPayload.Inception inception = 1;
         */
        value: MediaPayload_Inception;
        case: "inception";
    } | {
        /**
         * @generated from field: river.MediaPayload.Chunk chunk = 2;
         */
        value: MediaPayload_Chunk;
        case: "chunk";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<MediaPayload>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MediaPayload";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MediaPayload;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MediaPayload;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MediaPayload;
    static equals(a: MediaPayload | PlainMessage<MediaPayload> | undefined, b: MediaPayload | PlainMessage<MediaPayload> | undefined): boolean;
}
/**
 * @generated from message river.MediaPayload.Snapshot
 */
export declare class MediaPayload_Snapshot extends Message<MediaPayload_Snapshot> {
    /**
     * @generated from field: river.MediaPayload.Inception inception = 1;
     */
    inception?: MediaPayload_Inception;
    constructor(data?: PartialMessage<MediaPayload_Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MediaPayload.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MediaPayload_Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MediaPayload_Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MediaPayload_Snapshot;
    static equals(a: MediaPayload_Snapshot | PlainMessage<MediaPayload_Snapshot> | undefined, b: MediaPayload_Snapshot | PlainMessage<MediaPayload_Snapshot> | undefined): boolean;
}
/**
 * @generated from message river.MediaPayload.Inception
 */
export declare class MediaPayload_Inception extends Message<MediaPayload_Inception> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: bytes channel_id = 2;
     */
    channelId: Uint8Array;
    /**
     * @generated from field: int32 chunk_count = 3;
     */
    chunkCount: number;
    /**
     * @generated from field: river.StreamSettings settings = 4;
     */
    settings?: StreamSettings;
    /**
     * @generated from field: optional bytes space_id = 5;
     */
    spaceId?: Uint8Array;
    constructor(data?: PartialMessage<MediaPayload_Inception>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MediaPayload.Inception";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MediaPayload_Inception;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MediaPayload_Inception;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MediaPayload_Inception;
    static equals(a: MediaPayload_Inception | PlainMessage<MediaPayload_Inception> | undefined, b: MediaPayload_Inception | PlainMessage<MediaPayload_Inception> | undefined): boolean;
}
/**
 * @generated from message river.MediaPayload.Chunk
 */
export declare class MediaPayload_Chunk extends Message<MediaPayload_Chunk> {
    /**
     * @generated from field: bytes data = 1;
     */
    data: Uint8Array;
    /**
     * @generated from field: int32 chunk_index = 2;
     */
    chunkIndex: number;
    constructor(data?: PartialMessage<MediaPayload_Chunk>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.MediaPayload.Chunk";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MediaPayload_Chunk;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MediaPayload_Chunk;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MediaPayload_Chunk;
    static equals(a: MediaPayload_Chunk | PlainMessage<MediaPayload_Chunk> | undefined, b: MediaPayload_Chunk | PlainMessage<MediaPayload_Chunk> | undefined): boolean;
}
/**
 * *
 * Snapshot contains a summary of all state events up to the most recent miniblock
 *
 * @generated from message river.Snapshot
 */
export declare class Snapshot extends Message<Snapshot> {
    /**
     * @generated from field: river.MemberPayload.Snapshot members = 1;
     */
    members?: MemberPayload_Snapshot;
    /**
     * @generated from field: int32 snapshot_version = 2;
     */
    snapshotVersion: number;
    /**
     * Snapshot data specific for each stream type.
     *
     * @generated from oneof river.Snapshot.content
     */
    content: {
        /**
         * @generated from field: river.SpacePayload.Snapshot space_content = 101;
         */
        value: SpacePayload_Snapshot;
        case: "spaceContent";
    } | {
        /**
         * @generated from field: river.ChannelPayload.Snapshot channel_content = 102;
         */
        value: ChannelPayload_Snapshot;
        case: "channelContent";
    } | {
        /**
         * @generated from field: river.UserPayload.Snapshot user_content = 103;
         */
        value: UserPayload_Snapshot;
        case: "userContent";
    } | {
        /**
         * @generated from field: river.UserSettingsPayload.Snapshot user_settings_content = 104;
         */
        value: UserSettingsPayload_Snapshot;
        case: "userSettingsContent";
    } | {
        /**
         * @generated from field: river.UserDeviceKeyPayload.Snapshot user_device_key_content = 105;
         */
        value: UserDeviceKeyPayload_Snapshot;
        case: "userDeviceKeyContent";
    } | {
        /**
         * @generated from field: river.MediaPayload.Snapshot media_content = 106;
         */
        value: MediaPayload_Snapshot;
        case: "mediaContent";
    } | {
        /**
         * @generated from field: river.DmChannelPayload.Snapshot dm_channel_content = 107;
         */
        value: DmChannelPayload_Snapshot;
        case: "dmChannelContent";
    } | {
        /**
         * @generated from field: river.GdmChannelPayload.Snapshot gdm_channel_content = 108;
         */
        value: GdmChannelPayload_Snapshot;
        case: "gdmChannelContent";
    } | {
        /**
         * @generated from field: river.UserInboxPayload.Snapshot user_inbox_content = 109;
         */
        value: UserInboxPayload_Snapshot;
        case: "userInboxContent";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Snapshot>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.Snapshot";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Snapshot;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Snapshot;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Snapshot;
    static equals(a: Snapshot | PlainMessage<Snapshot> | undefined, b: Snapshot | PlainMessage<Snapshot> | undefined): boolean;
}
/**
 * *
 * Derived event is produces by server when there should be additional event to compliment
 * received event. For example, when user joins a space through event in the space stream, server will produce a derived event
 * in a user stream to indicate that user joined a particual space.
 *
 * EventRef is used to reference the event that caused the derived event to be produced.
 *
 * @generated from message river.EventRef
 */
export declare class EventRef extends Message<EventRef> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: bytes hash = 2;
     */
    hash: Uint8Array;
    /**
     * @generated from field: bytes signature = 3;
     */
    signature: Uint8Array;
    constructor(data?: PartialMessage<EventRef>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.EventRef";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): EventRef;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): EventRef;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): EventRef;
    static equals(a: EventRef | PlainMessage<EventRef> | undefined, b: EventRef | PlainMessage<EventRef> | undefined): boolean;
}
/**
 * *
 * StreamSettings is a part of inception payload for each stream type.
 *
 * @generated from message river.StreamSettings
 */
export declare class StreamSettings extends Message<StreamSettings> {
    /**
     * Test setting for testing with manual miniblock creation through Info debug request.
     *
     * @generated from field: bool disable_miniblock_creation = 1;
     */
    disableMiniblockCreation: boolean;
    constructor(data?: PartialMessage<StreamSettings>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.StreamSettings";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): StreamSettings;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): StreamSettings;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): StreamSettings;
    static equals(a: StreamSettings | PlainMessage<StreamSettings> | undefined, b: StreamSettings | PlainMessage<StreamSettings> | undefined): boolean;
}
/**
 * *
 * EncryptedData
 *
 * @generated from message river.EncryptedData
 */
export declare class EncryptedData extends Message<EncryptedData> {
    /**
     * *
     * Ciphertext of the encryption envelope.
     *
     * @generated from field: string ciphertext = 1;
     */
    ciphertext: string;
    /**
     * *
     * Encryption algorithm  used to encrypt this event.
     *
     * @generated from field: string algorithm = 2;
     */
    algorithm: string;
    /**
     * *
     * Sender device public key identifying the sender's device.
     *
     * @generated from field: string sender_key = 3;
     */
    senderKey: string;
    /**
     * *
     * The ID of the session used to encrypt the message.
     *
     * @generated from field: string session_id = 4;
     */
    sessionId: string;
    /**
     * *
     * Optional checksum of the cleartext data.
     *
     * @generated from field: optional string checksum = 5;
     */
    checksum?: string;
    /**
     * *
     * Optional reference to parent event ID
     *
     * @generated from field: optional string ref_event_id = 6;
     */
    refEventId?: string;
    constructor(data?: PartialMessage<EncryptedData>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.EncryptedData";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): EncryptedData;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): EncryptedData;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): EncryptedData;
    static equals(a: EncryptedData | PlainMessage<EncryptedData> | undefined, b: EncryptedData | PlainMessage<EncryptedData> | undefined): boolean;
}
/**
 * @generated from message river.WrappedEncryptedData
 */
export declare class WrappedEncryptedData extends Message<WrappedEncryptedData> {
    /**
     * @generated from field: river.EncryptedData data = 1;
     */
    data?: EncryptedData;
    /**
     * @generated from field: int64 event_num = 2;
     */
    eventNum: bigint;
    /**
     * @generated from field: bytes event_hash = 3;
     */
    eventHash: Uint8Array;
    constructor(data?: PartialMessage<WrappedEncryptedData>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.WrappedEncryptedData";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WrappedEncryptedData;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WrappedEncryptedData;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WrappedEncryptedData;
    static equals(a: WrappedEncryptedData | PlainMessage<WrappedEncryptedData> | undefined, b: WrappedEncryptedData | PlainMessage<WrappedEncryptedData> | undefined): boolean;
}
/**
 * @generated from message river.SyncCookie
 */
export declare class SyncCookie extends Message<SyncCookie> {
    /**
     * @generated from field: bytes node_address = 1;
     */
    nodeAddress: Uint8Array;
    /**
     * @generated from field: bytes stream_id = 2;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: int64 minipool_gen = 3;
     */
    minipoolGen: bigint;
    /**
     * @generated from field: int64 minipool_slot = 4;
     */
    minipoolSlot: bigint;
    /**
     * @generated from field: bytes prev_miniblock_hash = 5;
     */
    prevMiniblockHash: Uint8Array;
    constructor(data?: PartialMessage<SyncCookie>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.SyncCookie";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SyncCookie;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SyncCookie;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SyncCookie;
    static equals(a: SyncCookie | PlainMessage<SyncCookie> | undefined, b: SyncCookie | PlainMessage<SyncCookie> | undefined): boolean;
}
/**
 * @generated from message river.StreamAndCookie
 */
export declare class StreamAndCookie extends Message<StreamAndCookie> {
    /**
     * @generated from field: repeated river.Envelope events = 1;
     */
    events: Envelope[];
    /**
     * @generated from field: river.SyncCookie next_sync_cookie = 2;
     */
    nextSyncCookie?: SyncCookie;
    /**
     * if non-empty, contains all blocks since the latest snapshot, miniblocks[0].header is the latest snapshot
     *
     * @generated from field: repeated river.Miniblock miniblocks = 3;
     */
    miniblocks: Miniblock[];
    /**
     * @generated from field: bool sync_reset = 4;
     */
    syncReset: boolean;
    constructor(data?: PartialMessage<StreamAndCookie>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.StreamAndCookie";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): StreamAndCookie;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): StreamAndCookie;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): StreamAndCookie;
    static equals(a: StreamAndCookie | PlainMessage<StreamAndCookie> | undefined, b: StreamAndCookie | PlainMessage<StreamAndCookie> | undefined): boolean;
}
/**
 * @generated from message river.GetStreamExRequest
 */
export declare class GetStreamExRequest extends Message<GetStreamExRequest> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    constructor(data?: PartialMessage<GetStreamExRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GetStreamExRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetStreamExRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetStreamExRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetStreamExRequest;
    static equals(a: GetStreamExRequest | PlainMessage<GetStreamExRequest> | undefined, b: GetStreamExRequest | PlainMessage<GetStreamExRequest> | undefined): boolean;
}
/**
 * @generated from message river.Minipool
 */
export declare class Minipool extends Message<Minipool> {
    /**
     * @generated from field: repeated river.Envelope events = 1;
     */
    events: Envelope[];
    constructor(data?: PartialMessage<Minipool>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.Minipool";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Minipool;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Minipool;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Minipool;
    static equals(a: Minipool | PlainMessage<Minipool> | undefined, b: Minipool | PlainMessage<Minipool> | undefined): boolean;
}
/**
 * GetStreamExResponse is a stream of raw data that represents the current state of the requested stream.
 * These responses represent streams that are not expected to change once finalized, and have a optimized code path
 * for retrieval. Response may potentially be very large, and are streamed back to the client. The client is expected
 * to martial the raw data back into protobuf messages.
 *
 * @generated from message river.GetStreamExResponse
 */
export declare class GetStreamExResponse extends Message<GetStreamExResponse> {
    /**
     * @generated from oneof river.GetStreamExResponse.data
     */
    data: {
        /**
         * @generated from field: river.Miniblock miniblock = 1;
         */
        value: Miniblock;
        case: "miniblock";
    } | {
        /**
         * @generated from field: river.Minipool minipool = 2;
         */
        value: Minipool;
        case: "minipool";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<GetStreamExResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GetStreamExResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetStreamExResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetStreamExResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetStreamExResponse;
    static equals(a: GetStreamExResponse | PlainMessage<GetStreamExResponse> | undefined, b: GetStreamExResponse | PlainMessage<GetStreamExResponse> | undefined): boolean;
}
/**
 * @generated from message river.CreateStreamRequest
 */
export declare class CreateStreamRequest extends Message<CreateStreamRequest> {
    /**
     * @generated from field: repeated river.Envelope events = 1;
     */
    events: Envelope[];
    /**
     * stream_id should match the stream_id in the inception payload of the first event
     *
     * @generated from field: bytes stream_id = 2;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: map<string, bytes> metadata = 3;
     */
    metadata: {
        [key: string]: Uint8Array;
    };
    constructor(data?: PartialMessage<CreateStreamRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.CreateStreamRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateStreamRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateStreamRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateStreamRequest;
    static equals(a: CreateStreamRequest | PlainMessage<CreateStreamRequest> | undefined, b: CreateStreamRequest | PlainMessage<CreateStreamRequest> | undefined): boolean;
}
/**
 * @generated from message river.CreateStreamResponse
 */
export declare class CreateStreamResponse extends Message<CreateStreamResponse> {
    /**
     * all events in current minipool and cookie allowing to sync from the end of the stream
     *
     * @generated from field: river.StreamAndCookie stream = 1;
     */
    stream?: StreamAndCookie;
    constructor(data?: PartialMessage<CreateStreamResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.CreateStreamResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateStreamResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateStreamResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateStreamResponse;
    static equals(a: CreateStreamResponse | PlainMessage<CreateStreamResponse> | undefined, b: CreateStreamResponse | PlainMessage<CreateStreamResponse> | undefined): boolean;
}
/**
 * @generated from message river.GetStreamRequest
 */
export declare class GetStreamRequest extends Message<GetStreamRequest> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * if optional is true and stream doesn't exist, response will be a nil stream instead of ERROR NOT_FOUND
     *
     * @generated from field: bool optional = 2;
     */
    optional: boolean;
    constructor(data?: PartialMessage<GetStreamRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GetStreamRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetStreamRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetStreamRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetStreamRequest;
    static equals(a: GetStreamRequest | PlainMessage<GetStreamRequest> | undefined, b: GetStreamRequest | PlainMessage<GetStreamRequest> | undefined): boolean;
}
/**
 * @generated from message river.GetStreamResponse
 */
export declare class GetStreamResponse extends Message<GetStreamResponse> {
    /**
     * all events in current minipool and cookie allowing to sync from the end of the stream
     *
     * @generated from field: river.StreamAndCookie stream = 1;
     */
    stream?: StreamAndCookie;
    constructor(data?: PartialMessage<GetStreamResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GetStreamResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetStreamResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetStreamResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetStreamResponse;
    static equals(a: GetStreamResponse | PlainMessage<GetStreamResponse> | undefined, b: GetStreamResponse | PlainMessage<GetStreamResponse> | undefined): boolean;
}
/**
 * @generated from message river.GetMiniblocksRequest
 */
export declare class GetMiniblocksRequest extends Message<GetMiniblocksRequest> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: int64 fromInclusive = 2;
     */
    fromInclusive: bigint;
    /**
     * @generated from field: int64 toExclusive = 3;
     */
    toExclusive: bigint;
    constructor(data?: PartialMessage<GetMiniblocksRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GetMiniblocksRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetMiniblocksRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetMiniblocksRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetMiniblocksRequest;
    static equals(a: GetMiniblocksRequest | PlainMessage<GetMiniblocksRequest> | undefined, b: GetMiniblocksRequest | PlainMessage<GetMiniblocksRequest> | undefined): boolean;
}
/**
 * @generated from message river.GetMiniblocksResponse
 */
export declare class GetMiniblocksResponse extends Message<GetMiniblocksResponse> {
    /**
     * @generated from field: repeated river.Miniblock miniblocks = 1;
     */
    miniblocks: Miniblock[];
    /**
     * terminus: true if there are no more blocks to fetch because they've been garbage collected, or you've reached block 0
     *
     * @generated from field: bool terminus = 2;
     */
    terminus: boolean;
    constructor(data?: PartialMessage<GetMiniblocksResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GetMiniblocksResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetMiniblocksResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetMiniblocksResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetMiniblocksResponse;
    static equals(a: GetMiniblocksResponse | PlainMessage<GetMiniblocksResponse> | undefined, b: GetMiniblocksResponse | PlainMessage<GetMiniblocksResponse> | undefined): boolean;
}
/**
 * @generated from message river.GetLastMiniblockHashRequest
 */
export declare class GetLastMiniblockHashRequest extends Message<GetLastMiniblockHashRequest> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    constructor(data?: PartialMessage<GetLastMiniblockHashRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GetLastMiniblockHashRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetLastMiniblockHashRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetLastMiniblockHashRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetLastMiniblockHashRequest;
    static equals(a: GetLastMiniblockHashRequest | PlainMessage<GetLastMiniblockHashRequest> | undefined, b: GetLastMiniblockHashRequest | PlainMessage<GetLastMiniblockHashRequest> | undefined): boolean;
}
/**
 * @generated from message river.GetLastMiniblockHashResponse
 */
export declare class GetLastMiniblockHashResponse extends Message<GetLastMiniblockHashResponse> {
    /**
     * @generated from field: bytes hash = 1;
     */
    hash: Uint8Array;
    /**
     * @generated from field: int64 miniblock_num = 2;
     */
    miniblockNum: bigint;
    constructor(data?: PartialMessage<GetLastMiniblockHashResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.GetLastMiniblockHashResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetLastMiniblockHashResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetLastMiniblockHashResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetLastMiniblockHashResponse;
    static equals(a: GetLastMiniblockHashResponse | PlainMessage<GetLastMiniblockHashResponse> | undefined, b: GetLastMiniblockHashResponse | PlainMessage<GetLastMiniblockHashResponse> | undefined): boolean;
}
/**
 * @generated from message river.AddEventRequest
 */
export declare class AddEventRequest extends Message<AddEventRequest> {
    /**
     * @generated from field: bytes stream_id = 1;
     */
    streamId: Uint8Array;
    /**
     * @generated from field: river.Envelope event = 2;
     */
    event?: Envelope;
    /**
     * if true, response will contain non nil error if event didn't pass validation
     *
     * @generated from field: bool optional = 3;
     */
    optional: boolean;
    constructor(data?: PartialMessage<AddEventRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.AddEventRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AddEventRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AddEventRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AddEventRequest;
    static equals(a: AddEventRequest | PlainMessage<AddEventRequest> | undefined, b: AddEventRequest | PlainMessage<AddEventRequest> | undefined): boolean;
}
/**
 * @generated from message river.AddEventResponse
 */
export declare class AddEventResponse extends Message<AddEventResponse> {
    /**
     * only set if AddEventRequest.optional is true
     *
     * @generated from field: river.AddEventResponse.Error error = 1;
     */
    error?: AddEventResponse_Error;
    constructor(data?: PartialMessage<AddEventResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.AddEventResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AddEventResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AddEventResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AddEventResponse;
    static equals(a: AddEventResponse | PlainMessage<AddEventResponse> | undefined, b: AddEventResponse | PlainMessage<AddEventResponse> | undefined): boolean;
}
/**
 * @generated from message river.AddEventResponse.Error
 */
export declare class AddEventResponse_Error extends Message<AddEventResponse_Error> {
    /**
     * @generated from field: river.Err code = 1;
     */
    code: Err;
    /**
     * @generated from field: string msg = 2;
     */
    msg: string;
    /**
     * @generated from field: repeated string funcs = 3;
     */
    funcs: string[];
    constructor(data?: PartialMessage<AddEventResponse_Error>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.AddEventResponse.Error";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AddEventResponse_Error;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AddEventResponse_Error;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AddEventResponse_Error;
    static equals(a: AddEventResponse_Error | PlainMessage<AddEventResponse_Error> | undefined, b: AddEventResponse_Error | PlainMessage<AddEventResponse_Error> | undefined): boolean;
}
/**
 * @generated from message river.SyncStreamsRequest
 */
export declare class SyncStreamsRequest extends Message<SyncStreamsRequest> {
    /**
     * @generated from field: repeated river.SyncCookie sync_pos = 1;
     */
    syncPos: SyncCookie[];
    constructor(data?: PartialMessage<SyncStreamsRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.SyncStreamsRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SyncStreamsRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SyncStreamsRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SyncStreamsRequest;
    static equals(a: SyncStreamsRequest | PlainMessage<SyncStreamsRequest> | undefined, b: SyncStreamsRequest | PlainMessage<SyncStreamsRequest> | undefined): boolean;
}
/**
 * @generated from message river.SyncStreamsResponse
 */
export declare class SyncStreamsResponse extends Message<SyncStreamsResponse> {
    /**
     * @generated from field: string sync_id = 1;
     */
    syncId: string;
    /**
     * @generated from field: river.SyncOp sync_op = 2;
     */
    syncOp: SyncOp;
    /**
     * @generated from field: river.StreamAndCookie stream = 3;
     */
    stream?: StreamAndCookie;
    /**
     * @generated from field: string pong_nonce = 4;
     */
    pongNonce: string;
    constructor(data?: PartialMessage<SyncStreamsResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.SyncStreamsResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SyncStreamsResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SyncStreamsResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SyncStreamsResponse;
    static equals(a: SyncStreamsResponse | PlainMessage<SyncStreamsResponse> | undefined, b: SyncStreamsResponse | PlainMessage<SyncStreamsResponse> | undefined): boolean;
}
/**
 * @generated from message river.AddStreamToSyncRequest
 */
export declare class AddStreamToSyncRequest extends Message<AddStreamToSyncRequest> {
    /**
     * @generated from field: string sync_id = 1;
     */
    syncId: string;
    /**
     * @generated from field: river.SyncCookie sync_pos = 2;
     */
    syncPos?: SyncCookie;
    constructor(data?: PartialMessage<AddStreamToSyncRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.AddStreamToSyncRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AddStreamToSyncRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AddStreamToSyncRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AddStreamToSyncRequest;
    static equals(a: AddStreamToSyncRequest | PlainMessage<AddStreamToSyncRequest> | undefined, b: AddStreamToSyncRequest | PlainMessage<AddStreamToSyncRequest> | undefined): boolean;
}
/**
 * @generated from message river.AddStreamToSyncResponse
 */
export declare class AddStreamToSyncResponse extends Message<AddStreamToSyncResponse> {
    constructor(data?: PartialMessage<AddStreamToSyncResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.AddStreamToSyncResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AddStreamToSyncResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AddStreamToSyncResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AddStreamToSyncResponse;
    static equals(a: AddStreamToSyncResponse | PlainMessage<AddStreamToSyncResponse> | undefined, b: AddStreamToSyncResponse | PlainMessage<AddStreamToSyncResponse> | undefined): boolean;
}
/**
 * @generated from message river.RemoveStreamFromSyncRequest
 */
export declare class RemoveStreamFromSyncRequest extends Message<RemoveStreamFromSyncRequest> {
    /**
     * @generated from field: string sync_id = 1;
     */
    syncId: string;
    /**
     * @generated from field: bytes stream_id = 2;
     */
    streamId: Uint8Array;
    constructor(data?: PartialMessage<RemoveStreamFromSyncRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.RemoveStreamFromSyncRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RemoveStreamFromSyncRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RemoveStreamFromSyncRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RemoveStreamFromSyncRequest;
    static equals(a: RemoveStreamFromSyncRequest | PlainMessage<RemoveStreamFromSyncRequest> | undefined, b: RemoveStreamFromSyncRequest | PlainMessage<RemoveStreamFromSyncRequest> | undefined): boolean;
}
/**
 * @generated from message river.RemoveStreamFromSyncResponse
 */
export declare class RemoveStreamFromSyncResponse extends Message<RemoveStreamFromSyncResponse> {
    constructor(data?: PartialMessage<RemoveStreamFromSyncResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.RemoveStreamFromSyncResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RemoveStreamFromSyncResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RemoveStreamFromSyncResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RemoveStreamFromSyncResponse;
    static equals(a: RemoveStreamFromSyncResponse | PlainMessage<RemoveStreamFromSyncResponse> | undefined, b: RemoveStreamFromSyncResponse | PlainMessage<RemoveStreamFromSyncResponse> | undefined): boolean;
}
/**
 * @generated from message river.CancelSyncRequest
 */
export declare class CancelSyncRequest extends Message<CancelSyncRequest> {
    /**
     * @generated from field: string sync_id = 1;
     */
    syncId: string;
    constructor(data?: PartialMessage<CancelSyncRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.CancelSyncRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CancelSyncRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CancelSyncRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CancelSyncRequest;
    static equals(a: CancelSyncRequest | PlainMessage<CancelSyncRequest> | undefined, b: CancelSyncRequest | PlainMessage<CancelSyncRequest> | undefined): boolean;
}
/**
 * @generated from message river.CancelSyncResponse
 */
export declare class CancelSyncResponse extends Message<CancelSyncResponse> {
    constructor(data?: PartialMessage<CancelSyncResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.CancelSyncResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CancelSyncResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CancelSyncResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CancelSyncResponse;
    static equals(a: CancelSyncResponse | PlainMessage<CancelSyncResponse> | undefined, b: CancelSyncResponse | PlainMessage<CancelSyncResponse> | undefined): boolean;
}
/**
 * @generated from message river.PingSyncRequest
 */
export declare class PingSyncRequest extends Message<PingSyncRequest> {
    /**
     * @generated from field: string sync_id = 1;
     */
    syncId: string;
    /**
     * @generated from field: string nonce = 2;
     */
    nonce: string;
    constructor(data?: PartialMessage<PingSyncRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.PingSyncRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PingSyncRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PingSyncRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PingSyncRequest;
    static equals(a: PingSyncRequest | PlainMessage<PingSyncRequest> | undefined, b: PingSyncRequest | PlainMessage<PingSyncRequest> | undefined): boolean;
}
/**
 * @generated from message river.PingSyncResponse
 */
export declare class PingSyncResponse extends Message<PingSyncResponse> {
    constructor(data?: PartialMessage<PingSyncResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.PingSyncResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PingSyncResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PingSyncResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PingSyncResponse;
    static equals(a: PingSyncResponse | PlainMessage<PingSyncResponse> | undefined, b: PingSyncResponse | PlainMessage<PingSyncResponse> | undefined): boolean;
}
/**
 * @generated from message river.InfoRequest
 */
export declare class InfoRequest extends Message<InfoRequest> {
    /**
     * @generated from field: repeated string debug = 1;
     */
    debug: string[];
    constructor(data?: PartialMessage<InfoRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.InfoRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): InfoRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): InfoRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): InfoRequest;
    static equals(a: InfoRequest | PlainMessage<InfoRequest> | undefined, b: InfoRequest | PlainMessage<InfoRequest> | undefined): boolean;
}
/**
 * @generated from message river.InfoResponse
 */
export declare class InfoResponse extends Message<InfoResponse> {
    /**
     * @generated from field: string graffiti = 1;
     */
    graffiti: string;
    /**
     * @generated from field: google.protobuf.Timestamp start_time = 2;
     */
    startTime?: Timestamp;
    /**
     * @generated from field: string version = 3;
     */
    version: string;
    constructor(data?: PartialMessage<InfoResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.InfoResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): InfoResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): InfoResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): InfoResponse;
    static equals(a: InfoResponse | PlainMessage<InfoResponse> | undefined, b: InfoResponse | PlainMessage<InfoResponse> | undefined): boolean;
}
//# sourceMappingURL=protocol_pb.d.ts.map