import { EncryptedData } from '@river-build/proto';
import { GroupEncryptionSession, UserDevice } from './olmLib';
import { CryptoStore } from './cryptoStore';
import { IGroupEncryptionClient } from './base';
import { GroupDecryption } from './groupDecryption';
import { GroupEncryption } from './groupEncryption';
import { EncryptionDevice } from './encryptionDevice';
export declare class GroupEncryptionCrypto {
    private delegate;
    readonly supportedAlgorithms: string[];
    readonly encryptionDevice: EncryptionDevice;
    readonly groupEncryption: GroupEncryption;
    readonly groupDecryption: GroupDecryption;
    readonly cryptoStore: CryptoStore;
    globalBlacklistUnverifiedDevices: boolean;
    globalErrorOnUnknownDevices: boolean;
    constructor(client: IGroupEncryptionClient, cryptoStore: CryptoStore);
    /** Iniitalize crypto module prior to usage
     *
     */
    init(): Promise<void>;
    /**
     * Encrypt an event using the device keys
     *
     * @param payload -  string to be encrypted
     * @param deviceKeys - recipients to encrypt message for
     *
     * @returns Promise which resolves when the event has been
     *     encrypted, or null if nothing was needed
     */
    encryptWithDeviceKeys(payload: string, deviceKeys: UserDevice[]): Promise<Record<string, string>>;
    /**
     * Decrypt a received event using the device key
     *
     * @returns a promise which resolves once we have finished decrypting.
     * Rejects with an error if there is a problem decrypting the event.
     */
    decryptWithDeviceKey(ciphertext: string, senderDeviceKey: string): Promise<string>;
    /**
     * Ensure that we have an outbound group session key for the given stream
     *
     * @returns Promise which resolves when the event has been
     *     created, use options to await the initial share
     */
    ensureOutboundSession(streamId: string, opts?: {
        awaitInitialShareSession: boolean;
    }): Promise<void>;
    /**
     * Encrypt an event using group encryption algorithm
     *
     * @returns Promise which resolves when the event has been
     *     encrypted, or null if nothing was needed
     */
    encryptGroupEvent(streamId: string, payload: string): Promise<EncryptedData>;
    /**
     * Decrypt a received event using group encryption algorithm
     *
     * @returns a promise which resolves once we have finished decrypting.
     * Rejects with an error if there is a problem decrypting the event.
     */
    decryptGroupEvent(streamId: string, content: EncryptedData): Promise<string>;
    /**
     * Import a list of group session keys previously exported by exportRoomKeys
     *
     * @param streamId - the id of the stream the keys are for
     * @param keys - a list of session export objects
     * @returns a promise which resolves once the keys have been imported
     */
    importSessionKeys(streamId: string, keys: GroupEncryptionSession[]): Promise<void>;
}
//# sourceMappingURL=groupEncryptionCrypto.d.ts.map