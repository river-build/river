/**
 * base type for encryption implementations
 */
export class EncryptionAlgorithm {
    device;
    client;
    /**
     * @param params - parameters
     */
    constructor(params) {
        this.device = params.device;
        this.client = params.client;
    }
}
/**
 * base type for decryption implementations
 */
export class DecryptionAlgorithm {
    device;
    constructor(params) {
        this.device = params.device;
    }
}
/**
 * Exception thrown when decryption fails
 *
 * @param msg - user-visible message describing the problem
 *
 * @param details - key/value pairs reported in the logs but not shown
 *   to the user.
 */
export class DecryptionError extends Error {
    code;
    constructor(code, msg) {
        super(msg);
        this.code = code;
        this.code = code;
        this.name = 'DecryptionError';
    }
}
export function isDecryptionError(e) {
    return e.name === 'DecryptionError';
}
//# sourceMappingURL=base.js.map