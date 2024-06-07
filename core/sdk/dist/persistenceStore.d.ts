import { PersistedSyncedStream, SyncCookie } from '@river-build/proto';
import Dexie, { Table } from 'dexie';
import { ParsedEvent, ParsedMiniblock } from './types';
export interface IPersistenceStore {
    saveCleartext(eventId: string, cleartext: string): Promise<void>;
    getCleartext(eventId: string): Promise<string | undefined>;
    getCleartexts(eventIds: string[]): Promise<Record<string, string> | undefined>;
    getSyncedStream(streamId: string): Promise<{
        syncCookie: SyncCookie;
        lastSnapshotMiniblockNum: bigint;
        minipoolEvents: ParsedEvent[];
        lastMiniblockNum: bigint;
    } | undefined>;
    saveSyncedStream(streamId: string, syncedStream: PersistedSyncedStream): Promise<void>;
    saveMiniblock(streamId: string, miniblock: ParsedMiniblock): Promise<void>;
    saveMiniblocks(streamId: string, miniblocks: ParsedMiniblock[]): Promise<void>;
    getMiniblock(streamId: string, miniblockNum: bigint): Promise<ParsedMiniblock | undefined>;
    getMiniblocks(streamId: string, rangeStart: bigint, randeEnd: bigint): Promise<ParsedMiniblock[]>;
}
export declare class PersistenceStore extends Dexie implements IPersistenceStore {
    cleartexts: Table<{
        cleartext: string;
        eventId: string;
    }>;
    syncedStreams: Table<{
        streamId: string;
        data: Uint8Array;
    }>;
    miniblocks: Table<{
        streamId: string;
        miniblockNum: string;
        data: Uint8Array;
    }>;
    constructor(databaseName: string);
    saveCleartext(eventId: string, cleartext: string): Promise<void>;
    getCleartext(eventId: string): Promise<string | undefined>;
    getCleartexts(eventIds: string[]): Promise<Record<string, string> | undefined>;
    getSyncedStream(streamId: string): Promise<{
        syncCookie: SyncCookie;
        lastSnapshotMiniblockNum: bigint;
        minipoolEvents: ParsedEvent[];
        lastMiniblockNum: bigint;
    } | undefined>;
    saveSyncedStream(streamId: string, syncedStream: PersistedSyncedStream): Promise<void>;
    saveMiniblock(streamId: string, miniblock: ParsedMiniblock): Promise<void>;
    saveMiniblocks(streamId: string, miniblocks: ParsedMiniblock[]): Promise<void>;
    getMiniblock(streamId: string, miniblockNum: bigint): Promise<ParsedMiniblock | undefined>;
    getMiniblocks(streamId: string, rangeStart: bigint, rangeEnd: bigint): Promise<ParsedMiniblock[]>;
    private requestPersistentStorage;
    private logPersistenceStats;
}
export declare class StubPersistenceStore implements IPersistenceStore {
    saveCleartext(eventId: string, cleartext: string): Promise<void>;
    getCleartext(eventId: string): Promise<undefined>;
    getCleartexts(eventIds: string[]): Promise<undefined>;
    getSyncedStream(streamId: string): Promise<undefined>;
    saveSyncedStream(streamId: string, syncedStream: PersistedSyncedStream): Promise<void>;
    saveMiniblock(streamId: string, miniblock: ParsedMiniblock): Promise<void>;
    saveMiniblocks(streamId: string, miniblocks: ParsedMiniblock[]): Promise<void>;
    getMiniblock(streamId: string, miniblockNum: bigint): Promise<ParsedMiniblock | undefined>;
    getMiniblocks(streamId: string, rangeStart: bigint, rangeEnd: bigint): Promise<ParsedMiniblock[]>;
}
//# sourceMappingURL=persistenceStore.d.ts.map