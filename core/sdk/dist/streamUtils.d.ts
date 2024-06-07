import { PersistedEvent, PersistedMiniblock, PersistedSyncedStream, SyncCookie } from '@river-build/proto';
import { ParsedEvent, ParsedMiniblock } from './types';
export declare function persistedEventToParsedEvent(event: PersistedEvent): ParsedEvent | undefined;
export declare function persistedMiniblockToParsedMiniblock(miniblock: PersistedMiniblock): ParsedMiniblock | undefined;
export declare function parsedMiniblockToPersistedMiniblock(miniblock: ParsedMiniblock): PersistedMiniblock;
export declare function persistedSyncedStreamToParsedSyncedStream(stream: PersistedSyncedStream): {
    syncCookie: SyncCookie;
    lastSnapshotMiniblockNum: bigint;
    minipoolEvents: ParsedEvent[];
    lastMiniblockNum: bigint;
} | undefined;
//# sourceMappingURL=streamUtils.d.ts.map