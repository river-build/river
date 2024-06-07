export declare function waitFor<T>(condition: () => T | Promise<T>, opts?: {
    interval?: number;
    timeoutMs?: number;
    logId?: string;
}): Promise<NonNullable<T>>;
//# sourceMappingURL=waitFor.d.ts.map