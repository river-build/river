import { Stream } from './stream';
import { ClientInitStatus } from './types';
interface SyncedStreamsExtensionDelegate {
    startSyncStreams: () => Promise<void>;
    initStream(streamId: string, allowGetStream: boolean): Promise<Stream>;
    emitClientInitStatus: (status: ClientInitStatus) => void;
}
export declare class SyncedStreamsExtension {
    private log;
    private logError;
    private readonly delegate;
    private readonly tasks;
    private streamIds;
    private highPriorityIds;
    private started;
    private inProgressTick?;
    private timeoutId?;
    private initStreamsStartTime;
    private startSyncRequested;
    private didLoadStreamsFromPersistence;
    private streamCountRequiringNetworkAccess;
    private numStreamsLoadedFromCache;
    private numStreamsLoadedFromNetwork;
    private numStreamsFailedToLoad;
    private totalStreamCount;
    private loadedStreamCount;
    initStatus: ClientInitStatus;
    constructor(delegate: SyncedStreamsExtensionDelegate);
    setStreamIds(streamIds: string[]): void;
    setHighPriority(streamIds: string[]): void;
    setStartSyncRequested(startSyncRequested: boolean): void;
    start(): void;
    stop(): Promise<void>;
    private checkStartTicking;
    private loadHighPriorityStreams;
    private loadStreamsFromPersistence;
    private loadStreamFromPersistence;
    private loadStreamsFromNetwork;
    private loadStreamFromNetwork;
    private tick;
    private startSync;
    private emitClientStatus;
    private stopTicking;
    private priorityFromStreamId;
}
export {};
//# sourceMappingURL=syncedStreamsExtension.d.ts.map