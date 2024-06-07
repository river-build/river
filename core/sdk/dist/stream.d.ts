import { MembershipOp, Snapshot, SyncCookie } from '@river-build/proto';
import { DLogger } from '@river-build/dlog';
import TypedEmitter from 'typed-emitter';
import { StreamStateView } from './streamStateView';
import { ParsedEvent, ParsedMiniblock } from './types';
import { StreamEvents } from './streamEvents';
declare const Stream_base: new () => TypedEmitter<StreamEvents>;
export declare class Stream extends Stream_base {
    readonly clientEmitter: TypedEmitter<StreamEvents>;
    readonly logEmitFromStream: DLogger;
    readonly userId: string;
    view: StreamStateView;
    private stopped;
    constructor(userId: string, streamId: string, clientEmitter: TypedEmitter<StreamEvents>, logEmitFromStream: DLogger);
    get streamId(): string;
    /**
     * NOTE: Separating initial rollup from the constructor allows consumer to subscribe to events
     * on the new stream event and still access this object through Client.streams.
     */
    initialize(nextSyncCookie: SyncCookie, minipoolEvents: ParsedEvent[], snapshot: Snapshot, miniblocks: ParsedMiniblock[], prependedMiniblocks: ParsedMiniblock[], prevSnapshotMiniblockNum: bigint, cleartexts: Record<string, string> | undefined): void;
    stop(): void;
    appendEvents(events: ParsedEvent[], nextSyncCookie: SyncCookie, cleartexts: Record<string, string> | undefined): Promise<void>;
    prependEvents(miniblocks: ParsedMiniblock[], cleartexts: Record<string, string> | undefined, terminus: boolean): void;
    emit<E extends keyof StreamEvents>(event: E, ...args: Parameters<StreamEvents[E]>): boolean;
    /**
     * Memberships are processed on block boundaries, so we need to wait for the next block to be processed
     * passing an undefined userId will wait for the membership to be updated for the current user
     */
    waitForMembership(membership: MembershipOp, userId?: string): Promise<void>;
    /**
     * Wait for a stream event to be emitted
     * optionally pass a condition function to check the event args
     */
    waitFor<E extends keyof StreamEvents>(event: E, fn?: (...args: Parameters<StreamEvents[E]>) => boolean, opts?: {
        timeoutMs: number;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=stream.d.ts.map