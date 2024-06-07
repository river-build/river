import { Err } from '@river-build/proto';
/**
 * Use this function in the default case of a exhaustive switch statement to ensure that all cases are handled.
 * Always throws JSON RPC error.
 * @param value Switch value
 * @param message Error message
 * @param code JSON RPC error code
 * @param data Optional data to include in the error
 */
export declare function checkNever(value: never, message?: string, code?: Err, data?: any): never;
/**
 * Use this function in the default case of a exhaustive switch statement to ensure that all cases are handled,
 * but you don't want to throw an error.
 * Typical place you wouldn't want to throw an error - when parsing a protobuf message on the client. The protocol may
 * have been updated on the server, but the client hasn't been updated yet. In this case, the client will receive a case
 * that they can't handle, but it shouldn't break other messages in the stream. If you throw in the middle of a loop processing events,
 * then lots of messages will appear lost, when you could have just gracefully handled a new case.
 * @param value Switch value
 * @param message Error message
 * @param code JSON RPC error code
 * @param data Optional data to include in the error
 */
export declare function logNever(value: never, message?: string): void;
export declare function isDefined<T>(value: T | undefined | null): value is T;
interface Lengthwise {
    length: number;
}
export declare function hasElements<T extends Lengthwise>(value: T | undefined | null): value is T;
export declare function assert(condition: boolean, message: string): asserts condition;
export {};
//# sourceMappingURL=check.d.ts.map