import { Err } from '@river-build/proto';
export declare class CodeException extends Error {
    code: number;
    data?: any;
    constructor(message: string, code: number, data?: any);
}
export declare function throwWithCode(message?: string, code?: Err, data?: any): never;
/**
 * If not value, throws JSON RPC error with numberic error code, which is transmitted to the client.
 * @param value The value to check
 * @param message Error message to use if value is not valid
 * @param code JSON RPC error code to use if value is not valid
 * @param data Optional data to include in the error
 */
export declare function check(value: boolean, message?: string, code?: Err, data?: any): asserts value;
//# sourceMappingURL=check.d.ts.map