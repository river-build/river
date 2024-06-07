import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { MiniblockHeader, StreamEvent, SyncCookie } from "./protocol_pb.js";
/**
 * @generated from message river.PersistedEvent
 */
export declare class PersistedEvent extends Message<PersistedEvent> {
    /**
     * @generated from field: river.StreamEvent event = 1;
     */
    event?: StreamEvent;
    /**
     * @generated from field: bytes hash = 2;
     */
    hash: Uint8Array;
    /**
     * @generated from field: string prev_miniblock_hash_str = 3;
     */
    prevMiniblockHashStr: string;
    /**
     * @generated from field: string creator_user_id = 4;
     */
    creatorUserId: string;
    constructor(data?: PartialMessage<PersistedEvent>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.PersistedEvent";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PersistedEvent;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PersistedEvent;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PersistedEvent;
    static equals(a: PersistedEvent | PlainMessage<PersistedEvent> | undefined, b: PersistedEvent | PlainMessage<PersistedEvent> | undefined): boolean;
}
/**
 * @generated from message river.PersistedMiniblock
 */
export declare class PersistedMiniblock extends Message<PersistedMiniblock> {
    /**
     * @generated from field: bytes hash = 1;
     */
    hash: Uint8Array;
    /**
     * @generated from field: river.MiniblockHeader header = 2;
     */
    header?: MiniblockHeader;
    /**
     * @generated from field: repeated river.PersistedEvent events = 3;
     */
    events: PersistedEvent[];
    constructor(data?: PartialMessage<PersistedMiniblock>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.PersistedMiniblock";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PersistedMiniblock;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PersistedMiniblock;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PersistedMiniblock;
    static equals(a: PersistedMiniblock | PlainMessage<PersistedMiniblock> | undefined, b: PersistedMiniblock | PlainMessage<PersistedMiniblock> | undefined): boolean;
}
/**
 * @generated from message river.PersistedSyncedStream
 */
export declare class PersistedSyncedStream extends Message<PersistedSyncedStream> {
    /**
     * @generated from field: river.SyncCookie sync_cookie = 1;
     */
    syncCookie?: SyncCookie;
    /**
     * @generated from field: uint64 last_snapshot_miniblock_num = 2;
     */
    lastSnapshotMiniblockNum: bigint;
    /**
     * @generated from field: uint64 last_miniblock_num = 3;
     */
    lastMiniblockNum: bigint;
    /**
     * @generated from field: repeated river.PersistedEvent minipoolEvents = 4;
     */
    minipoolEvents: PersistedEvent[];
    constructor(data?: PartialMessage<PersistedSyncedStream>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "river.PersistedSyncedStream";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): PersistedSyncedStream;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PersistedSyncedStream;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PersistedSyncedStream;
    static equals(a: PersistedSyncedStream | PlainMessage<PersistedSyncedStream> | undefined, b: PersistedSyncedStream | PlainMessage<PersistedSyncedStream> | undefined): boolean;
}
//# sourceMappingURL=internal_pb.d.ts.map