import { GroupEncryptionSession, UserDeviceCollection } from './olmLib';
import { EncryptionDevice } from './encryptionDevice';
export interface IGroupEncryptionClient {
    downloadUserDeviceInfo(userIds: string[], forceDownload: boolean): Promise<UserDeviceCollection>;
    encryptAndShareGroupSessions(streamId: string, sessions: GroupEncryptionSession[], devicesInRoom: UserDeviceCollection): Promise<void>;
    getDevicesInStream(streamId: string): Promise<UserDeviceCollection>;
}
export interface IDecryptionParams {
    /** olm.js wrapper */
    device: EncryptionDevice;
}
export interface IEncryptionParams {
    client: IGroupEncryptionClient;
    /** olm.js wrapper */
    device: EncryptionDevice;
}
/**
 * base type for encryption implementations
 */
export declare abstract class EncryptionAlgorithm implements IEncryptionParams {
    readonly device: EncryptionDevice;
    readonly client: IGroupEncryptionClient;
    /**
     * @param params - parameters
     */
    constructor(params: IEncryptionParams);
}
/**
 * base type for decryption implementations
 */
export declare abstract class DecryptionAlgorithm implements IDecryptionParams {
    readonly device: EncryptionDevice;
    constructor(params: IDecryptionParams);
}
/**
 * Exception thrown when decryption fails
 *
 * @param msg - user-visible message describing the problem
 *
 * @param details - key/value pairs reported in the logs but not shown
 *   to the user.
 */
export declare class DecryptionError extends Error {
    readonly code: string;
    constructor(code: string, msg: string);
}
export declare function isDecryptionError(e: Error): e is DecryptionError;
//# sourceMappingURL=base.d.ts.map