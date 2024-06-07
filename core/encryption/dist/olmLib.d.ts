/**
 * Utilities common to Olm encryption
 */
declare enum Algorithm {
    Olm = "r.olm.v1.curve25519-aes-sha2",
    GroupEncryption = "r.group-encryption.v1.aes-sha2"
}
/**
 * river algorithm tag for olm
 */
export declare const OLM_ALGORITHM = Algorithm.Olm;
/**
 * river algorithm tag for group encryption
 */
export declare const GROUP_ENCRYPTION_ALGORITHM = Algorithm.GroupEncryption;
export interface UserDevice {
    deviceKey: string;
    fallbackKey: string;
}
export interface UserDeviceCollection {
    [userId: string]: UserDevice[];
}
export interface GroupEncryptionSession {
    streamId: string;
    sessionId: string;
    sessionKey: string;
    algorithm: string;
}
export {};
//# sourceMappingURL=olmLib.d.ts.map