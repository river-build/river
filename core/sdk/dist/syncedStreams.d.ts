import { SyncCookie } from '@river-build/proto';
import { StreamRpcClientType } from './makeStreamRpcClient';
import { StreamStateEvents } from './streamEvents';
import { SyncedStream } from './syncedStream';
import TypedEmitter from 'typed-emitter';
export declare enum SyncState {
    Canceling = "Canceling",
    NotSyncing = "NotSyncing",
    Retrying = "Retrying",
    Starting = "Starting",
    Syncing = "Syncing"
}
/**
 * See https://www.notion.so/herenottherelabs/RFC-Sync-hardening-e0552a4ed68a4d07b42ae34c69ee1bec?pvs=4#861081756f86423ea668c62b9eb76f4b
 Valid state transitions:
    [*] --> NotSyncing
    NotSyncing --> Starting
    Starting --> Syncing
    Starting --> Canceling: failed / stop sync
    Starting --> Retrying: connection error
    Syncing --> Canceling: connection aborted / stop sync
    Syncing --> Retrying: connection error
    Syncing --> Syncing: resync
    Retrying --> Canceling: stop sync
    Retrying --> Syncing: resume
    Retrying --> Retrying: still retrying
    Canceling --> NotSyncing
 */
export declare const stateConstraints: Record<SyncState, Set<SyncState>>;
export declare class SyncedStreams {
    private readonly userId;
    private readonly streams;
    private readonly logSync;
    private readonly logError;
    private readonly clientEmitter;
    private syncLoop?;
    private syncId?;
    private rpcClient;
    private _syncState;
    private releaseRetryWait;
    private currentRetryCount;
    private forceStopSyncStreams;
    private interruptSync;
    private isMobileSafariBackgrounded;
    private responsesQueue;
    private inProgressTick?;
    private pingInfo;
    constructor(userId: string, rpcClient: StreamRpcClientType, clientEmitter: TypedEmitter<StreamStateEvents>);
    has(streamId: string | Uint8Array): boolean;
    get(streamId: string | Uint8Array): SyncedStream | undefined;
    set(streamId: string | Uint8Array, stream: SyncedStream): void;
    delete(inStreamId: string | Uint8Array): void;
    size(): number;
    getStreams(): SyncedStream[];
    getStreamIds(): string[];
    onNetworkStatusChanged(isOnline: boolean): void;
    private onMobileSafariBackgrounded;
    startSyncStreams(): Promise<void>;
    private checkStartTicking;
    private tick;
    stopSync(): Promise<void>;
    private waitForSyncingState;
    addStreamToSync(syncCookie: SyncCookie): Promise<void>;
    removeStreamFromSync(inStreamId: string | Uint8Array): Promise<void>;
    private createSyncLoop;
    get syncState(): SyncState;
    private setSyncState;
    private attemptRetry;
    private syncStarted;
    private syncClosed;
    private onUpdate;
    private sendKeepAlivePings;
    private stopPing;
    private printNonces;
    private logInvalidStateAndReturnError;
    private log;
}
//# sourceMappingURL=syncedStreams.d.ts.map