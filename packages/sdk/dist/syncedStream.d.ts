import TypedEmitter from 'typed-emitter';
import { Snapshot, SyncCookie } from '@river-build/proto';
import { Stream } from './stream';
import { ParsedMiniblock, ParsedEvent, ParsedStreamResponse } from './types';
import { DLogger } from '@river-build/dlog';
import { IPersistenceStore } from './persistenceStore';
import { StreamEvents } from './streamEvents';
export declare class SyncedStream extends Stream {
    log: DLogger;
    isUpToDate: boolean;
    readonly persistenceStore: IPersistenceStore;
    constructor(userId: string, streamId: string, clientEmitter: TypedEmitter<StreamEvents>, logEmitFromStream: DLogger, persistenceStore: IPersistenceStore);
    initializeFromPersistence(): Promise<boolean>;
    initialize(nextSyncCookie: SyncCookie, events: ParsedEvent[], snapshot: Snapshot, miniblocks: ParsedMiniblock[], prependedMiniblocks: ParsedMiniblock[], prevSnapshotMiniblockNum: bigint, cleartexts: Record<string, string> | undefined): Promise<void>;
    initializeFromResponse(response: ParsedStreamResponse): Promise<void>;
    appendEvents(events: ParsedEvent[], nextSyncCookie: SyncCookie, cleartexts: Record<string, string> | undefined): Promise<void>;
    private onMiniblockHeader;
    private cachedScrollback;
    private markUpToDate;
}
//# sourceMappingURL=syncedStream.d.ts.map