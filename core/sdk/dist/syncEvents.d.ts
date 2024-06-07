export type SyncEvents = {
    syncing: (syncId: string) => void;
    syncCanceling: (syncId: string) => void;
    syncError: (syncId: string, error: unknown) => void;
    syncRetrying: (retryDelay: number) => void;
    syncStarting: () => void;
    syncStopped: () => void;
};
//# sourceMappingURL=syncEvents.d.ts.map