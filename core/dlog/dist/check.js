import { Err } from '@river-build/proto';
import { dlogError } from './dlog';
const log = dlogError('csb:error');
export class CodeException extends Error {
    code;
    data;
    constructor(message, code, data) {
        super(message);
        this.code = code;
        this.data = data;
    }
}
export function throwWithCode(message, code, data) {
    const e = new CodeException(message ?? 'Unknown', code ?? Err.ERR_UNSPECIFIED, data);
    log('throwWithCode', e.message, e.stack);
    throw e;
}
/**
 * If not value, throws JSON RPC error with numberic error code, which is transmitted to the client.
 * @param value The value to check
 * @param message Error message to use if value is not valid
 * @param code JSON RPC error code to use if value is not valid
 * @param data Optional data to include in the error
 */
export function check(value, message, code, data) {
    if (!value) {
        throwWithCode(message, code, data);
    }
}
//# sourceMappingURL=check.js.map