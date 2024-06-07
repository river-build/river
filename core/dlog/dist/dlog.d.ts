import { Debugger } from 'debug';
export declare const cloneAndFormat: (obj: unknown, opts?: {
    shortenHex?: boolean;
}) => unknown;
export interface DLogger {
    (...args: unknown[]): void;
    enabled: boolean;
    namespace: string;
    extend: (namespace: string, delimiter?: string) => DLogger;
    baseDebug: Debugger;
    opts?: DLogOpts;
}
export interface DLogOpts {
    defaultEnabled?: boolean;
    allowJest?: boolean;
    printStack?: boolean;
}
/**
 * Create a new logger with namespace `ns`.
 * It's based on the `debug` package logger with custom formatter:
 * All aguments are formatted, hex strings and UInt8Arrays are printer as hex and shortened.
 * No %-specifiers are supported.
 *
 * @param ns Namespace for the logger.
 * @returns New logger with namespace `ns`.
 */
export declare const dlog: (ns: string, opts?: DLogOpts) => DLogger;
/**
 * Same as dlog, but logger is bound to console.error so clicking on it expands log site callstack (in addition to printed error callstack).
 * Also, logger is enabled by default, except if running in jest.
 *
 * @param ns Namespace for the logger.
 * @returns New logger with namespace `ns`.
 */
export declare const dlogError: (ns: string) => DLogger;
/**
 * Create complex logger with multiple levels
 * @param ns Namespace for the logger.
 * @returns New logger with log/info/error namespace `ns`.
 */
export declare const dlogger: (ns: string) => {
    log: DLogger;
    info: DLogger;
    error: DLogger;
};
//# sourceMappingURL=dlog.d.ts.map