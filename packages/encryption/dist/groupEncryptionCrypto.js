import { GROUP_ENCRYPTION_ALGORITHM, OLM_ALGORITHM, } from './olmLib';
import { GroupDecryption } from './groupDecryption';
import { GroupEncryption } from './groupEncryption';
import { EncryptionDevice } from './encryptionDevice';
import { EncryptionDelegate } from './encryptionDelegate';
import { check, dlog } from '@river-build/dlog';
const log = dlog('csb:encryption:groupEncryptionCrypto');
export class GroupEncryptionCrypto {
    delegate;
    supportedAlgorithms;
    encryptionDevice;
    groupEncryption;
    groupDecryption;
    cryptoStore;
    globalBlacklistUnverifiedDevices = false;
    globalErrorOnUnknownDevices = true;
    constructor(client, cryptoStore) {
        this.cryptoStore = cryptoStore;
        // initialize Olm library
        this.delegate = new EncryptionDelegate();
        // olm lib returns a Promise<void> on init, hence the catch if it rejects
        this.delegate.init().catch((e) => {
            log('error initializing olm', e);
            throw e;
        });
        this.encryptionDevice = new EncryptionDevice(this.delegate, cryptoStore);
        this.supportedAlgorithms = [OLM_ALGORITHM, GROUP_ENCRYPTION_ALGORITHM];
        this.groupEncryption = new GroupEncryption({
            device: this.encryptionDevice,
            client,
        });
        this.groupDecryption = new GroupDecryption({
            device: this.encryptionDevice,
        });
    }
    /** Iniitalize crypto module prior to usage
     *
     */
    async init() {
        // initialize deviceKey and fallbackKey
        await this.encryptionDevice.init();
        // build device keys to upload
        if (!this.encryptionDevice.deviceCurve25519Key ||
            !this.encryptionDevice.deviceDoNotUseKey) {
            log('device keys not initialized, cannot encrypt event');
        }
    }
    /**
     * Encrypt an event using the device keys
     *
     * @param payload -  string to be encrypted
     * @param deviceKeys - recipients to encrypt message for
     *
     * @returns Promise which resolves when the event has been
     *     encrypted, or null if nothing was needed
     */
    async encryptWithDeviceKeys(payload, deviceKeys) {
        const ciphertextRecord = {};
        await Promise.all(deviceKeys.map(async (deviceKey) => {
            const encrypted = await this.encryptionDevice.encryptUsingFallbackKey(deviceKey.deviceKey, deviceKey.fallbackKey, payload);
            check(encrypted.type === 0, 'expecting only prekey messages at this time');
            ciphertextRecord[deviceKey.deviceKey] = encrypted.body;
        }));
        return ciphertextRecord;
    }
    /**
     * Decrypt a received event using the device key
     *
     * @returns a promise which resolves once we have finished decrypting.
     * Rejects with an error if there is a problem decrypting the event.
     */
    async decryptWithDeviceKey(ciphertext, senderDeviceKey) {
        return await this.encryptionDevice.decryptMessage(ciphertext, senderDeviceKey);
    }
    /**
     * Ensure that we have an outbound group session key for the given stream
     *
     * @returns Promise which resolves when the event has been
     *     created, use options to await the initial share
     */
    async ensureOutboundSession(streamId, opts) {
        return this.groupEncryption.ensureOutboundSession(streamId, opts);
    }
    /**
     * Encrypt an event using group encryption algorithm
     *
     * @returns Promise which resolves when the event has been
     *     encrypted, or null if nothing was needed
     */
    async encryptGroupEvent(streamId, payload) {
        return this.groupEncryption.encrypt(streamId, payload);
    }
    /**
     * Decrypt a received event using group encryption algorithm
     *
     * @returns a promise which resolves once we have finished decrypting.
     * Rejects with an error if there is a problem decrypting the event.
     */
    async decryptGroupEvent(streamId, content) {
        return this.groupDecryption.decrypt(streamId, content);
    }
    /**
     * Import a list of group session keys previously exported by exportRoomKeys
     *
     * @param streamId - the id of the stream the keys are for
     * @param keys - a list of session export objects
     * @returns a promise which resolves once the keys have been imported
     */
    async importSessionKeys(streamId, keys) {
        await this.cryptoStore.withGroupSessions(async () => Promise.all(keys.map(async (key) => {
            try {
                await this.groupDecryption.importStreamKey(streamId, key);
            }
            catch {
                log(`failed to import key`);
            }
        })));
    }
}
//# sourceMappingURL=groupEncryptionCrypto.js.map