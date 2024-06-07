import { PlainMessage } from '@bufbuild/protobuf';
import { Envelope, EventRef, StreamEvent, Miniblock, StreamAndCookie } from '@river-build/proto';
import { ParsedEvent, ParsedMiniblock, ParsedStreamAndCookie, ParsedStreamResponse } from './types';
import { SignerContext } from './signerContext';
export declare const _impl_makeEvent_impl_: (context: SignerContext, payload: PlainMessage<StreamEvent>['payload'], prevMiniblockHash?: Uint8Array) => Promise<Envelope>;
export declare const makeEvent: (context: SignerContext, payload: PlainMessage<StreamEvent>['payload'], prevMiniblockHash?: Uint8Array) => Promise<Envelope>;
export declare const makeEvents: (context: SignerContext, payloads: PlainMessage<StreamEvent>['payload'][], prevMiniblockHash?: Uint8Array) => Promise<Envelope[]>;
export declare const unpackStream: (stream?: StreamAndCookie) => Promise<ParsedStreamResponse>;
export declare const unpackStreamEx: (miniblocks: Miniblock[]) => Promise<ParsedStreamResponse>;
export declare const unpackStreamAndCookie: (streamAndCookie: StreamAndCookie) => Promise<ParsedStreamAndCookie>;
export declare const unpackMiniblock: (miniblock: Miniblock, opts?: {
    disableChecks: boolean;
}) => Promise<ParsedMiniblock>;
export declare const unpackEnvelope: (envelope: Envelope, opts?: {
    disableChecks: boolean;
}) => Promise<ParsedEvent>;
export declare const unpackEnvelopes: (event: Envelope[], opts?: {
    disableChecks: boolean;
}) => Promise<ParsedEvent[]>;
export declare const unpackStreamEnvelopes: (stream: StreamAndCookie) => Promise<ParsedEvent[]>;
export declare const makeEventRef: (streamId: string | Uint8Array, event: Envelope) => EventRef;
export declare function riverHash(data: Uint8Array): Uint8Array;
export declare function riverDelegateHashSrc(devicePublicKey: Uint8Array, expiryEpochMs: bigint): Uint8Array;
export declare function riverSign(hash: Uint8Array, privateKey: Uint8Array | string): Promise<Uint8Array>;
export declare function riverVerifySignature(hash: Uint8Array, signature: Uint8Array, publicKey: Uint8Array | string): boolean;
export declare function riverRecoverPubKey(hash: Uint8Array, signature: Uint8Array): Uint8Array;
export declare function publicKeyToAddress(publicKey: Uint8Array): Uint8Array;
export declare function publicKeyToUint8Array(publicKey: string): Uint8Array;
//# sourceMappingURL=sign.d.ts.map