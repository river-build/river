import { AddEventRequest, AddEventResponse, AddStreamToSyncRequest, AddStreamToSyncResponse, CancelSyncRequest, CancelSyncResponse, CreateStreamRequest, CreateStreamResponse, GetLastMiniblockHashRequest, GetLastMiniblockHashResponse, GetMiniblocksRequest, GetMiniblocksResponse, GetStreamExRequest, GetStreamExResponse, GetStreamRequest, GetStreamResponse, InfoRequest, InfoResponse, PingSyncRequest, PingSyncResponse, RemoveStreamFromSyncRequest, RemoveStreamFromSyncResponse, SyncStreamsRequest, SyncStreamsResponse } from "./protocol_pb.js";
import { MethodKind } from "@bufbuild/protobuf";
/**
 * @generated from service river.StreamService
 */
export declare const StreamService: {
    readonly typeName: "river.StreamService";
    readonly methods: {
        /**
         * @generated from rpc river.StreamService.CreateStream
         */
        readonly createStream: {
            readonly name: "CreateStream";
            readonly I: typeof CreateStreamRequest;
            readonly O: typeof CreateStreamResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc river.StreamService.GetStream
         */
        readonly getStream: {
            readonly name: "GetStream";
            readonly I: typeof GetStreamRequest;
            readonly O: typeof GetStreamResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc river.StreamService.GetStreamEx
         */
        readonly getStreamEx: {
            readonly name: "GetStreamEx";
            readonly I: typeof GetStreamExRequest;
            readonly O: typeof GetStreamExResponse;
            readonly kind: MethodKind.ServerStreaming;
        };
        /**
         * @generated from rpc river.StreamService.GetMiniblocks
         */
        readonly getMiniblocks: {
            readonly name: "GetMiniblocks";
            readonly I: typeof GetMiniblocksRequest;
            readonly O: typeof GetMiniblocksResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc river.StreamService.GetLastMiniblockHash
         */
        readonly getLastMiniblockHash: {
            readonly name: "GetLastMiniblockHash";
            readonly I: typeof GetLastMiniblockHashRequest;
            readonly O: typeof GetLastMiniblockHashResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc river.StreamService.AddEvent
         */
        readonly addEvent: {
            readonly name: "AddEvent";
            readonly I: typeof AddEventRequest;
            readonly O: typeof AddEventResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc river.StreamService.SyncStreams
         */
        readonly syncStreams: {
            readonly name: "SyncStreams";
            readonly I: typeof SyncStreamsRequest;
            readonly O: typeof SyncStreamsResponse;
            readonly kind: MethodKind.ServerStreaming;
        };
        /**
         * @generated from rpc river.StreamService.AddStreamToSync
         */
        readonly addStreamToSync: {
            readonly name: "AddStreamToSync";
            readonly I: typeof AddStreamToSyncRequest;
            readonly O: typeof AddStreamToSyncResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc river.StreamService.CancelSync
         */
        readonly cancelSync: {
            readonly name: "CancelSync";
            readonly I: typeof CancelSyncRequest;
            readonly O: typeof CancelSyncResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc river.StreamService.RemoveStreamFromSync
         */
        readonly removeStreamFromSync: {
            readonly name: "RemoveStreamFromSync";
            readonly I: typeof RemoveStreamFromSyncRequest;
            readonly O: typeof RemoveStreamFromSyncResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc river.StreamService.Info
         */
        readonly info: {
            readonly name: "Info";
            readonly I: typeof InfoRequest;
            readonly O: typeof InfoResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc river.StreamService.PingSync
         */
        readonly pingSync: {
            readonly name: "PingSync";
            readonly I: typeof PingSyncRequest;
            readonly O: typeof PingSyncResponse;
            readonly kind: MethodKind.Unary;
        };
    };
};
//# sourceMappingURL=protocol_connect.d.ts.map