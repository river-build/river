import { EncryptedData } from '@river-build/proto'
import {
    GROUP_ENCRYPTION_ALGORITHM,
    GroupEncryptionSession,
    OLM_ALGORITHM,
    UserDevice,
} from './olmLib'

import { CryptoStore } from './cryptoStore'
import { IGroupEncryptionClient } from './base'
import { GroupDecryption } from './groupDecryption'
import { GroupEncryption } from './groupEncryption'
import { EncryptionDevice, type EncryptionDeviceInitOpts } from './encryptionDevice'
import { EncryptionDelegate } from './encryptionDelegate'
import { check, dlog } from '@river-build/dlog'

const log = dlog('csb:encryption:groupEncryptionCrypto')

export interface ImportRoomKeysOpts {
    /** Reports ongoing progress of the import process. Can be used for feedback. */
    progressCallback?: (stage: ImportRoomKeyProgressData) => void
}

/**
 * Room key import progress report.
 * Used when calling {@link GroupEncryptionCrypto#importRoomKeys} or
 * {@link GroupEncryptionCrypto#importRoomKeysAsJson} as the parameter of
 * the progressCallback. Used to display feedback.
 */
export interface ImportRoomKeyProgressData {
    stage: string // TODO: Enum
    successes?: number
    failures?: number
    total?: number
}

export class GroupEncryptionCrypto {
    private delegate: EncryptionDelegate | undefined

    public readonly supportedAlgorithms: string[]
    public readonly encryptionDevice: EncryptionDevice
    public readonly groupEncryption: GroupEncryption
    public readonly groupDecryption: GroupDecryption
    public readonly cryptoStore: CryptoStore
    public globalBlacklistUnverifiedDevices = false
    public globalErrorOnUnknownDevices = true

    public constructor(client: IGroupEncryptionClient, cryptoStore: CryptoStore) {
        this.cryptoStore = cryptoStore
        // initialize Olm library
        this.delegate = new EncryptionDelegate()
        // olm lib returns a Promise<void> on init, hence the catch if it rejects
        this.delegate.init().catch((e) => {
            log('error initializing olm', e)
            throw e
        })
        this.encryptionDevice = new EncryptionDevice(this.delegate, cryptoStore)
        this.supportedAlgorithms = [OLM_ALGORITHM, GROUP_ENCRYPTION_ALGORITHM]

        this.groupEncryption = new GroupEncryption({
            device: this.encryptionDevice,
            client,
        })
        this.groupDecryption = new GroupDecryption({
            device: this.encryptionDevice,
        })
    }

    /** Iniitalize crypto module prior to usage
     *
     */
    public async init(opts?: EncryptionDeviceInitOpts): Promise<void> {
        // initialize deviceKey and fallbackKey
        await this.encryptionDevice.init(opts)

        // build device keys to upload
        if (
            !this.encryptionDevice.deviceCurve25519Key ||
            !this.encryptionDevice.deviceDoNotUseKey
        ) {
            log('device keys not initialized, cannot encrypt event')
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
    public async encryptWithDeviceKeys(
        payload: string,
        deviceKeys: UserDevice[],
    ): Promise<Record<string, string>> {
        const ciphertextRecord: Record<string, string> = {}
        await Promise.all(
            deviceKeys.map(async (deviceKey) => {
                const encrypted = await this.encryptionDevice.encryptUsingFallbackKey(
                    deviceKey.deviceKey,
                    deviceKey.fallbackKey,
                    payload,
                )
                check(encrypted.type === 0, 'expecting only prekey messages at this time')
                ciphertextRecord[deviceKey.deviceKey] = encrypted.body
            }),
        )
        return ciphertextRecord
    }

    /**
     * Decrypt a received event using the device key
     *
     * @returns a promise which resolves once we have finished decrypting.
     * Rejects with an error if there is a problem decrypting the event.
     */
    public async decryptWithDeviceKey(
        ciphertext: string,
        senderDeviceKey: string,
    ): Promise<string> {
        return await this.encryptionDevice.decryptMessage(ciphertext, senderDeviceKey)
    }

    /**
     * Ensure that we have an outbound group session key for the given stream
     *
     * @returns Promise which resolves when the event has been
     *     created, use options to await the initial share
     */
    public async ensureOutboundSession(
        streamId: string,
        opts?: { awaitInitialShareSession: boolean },
    ): Promise<void> {
        return this.groupEncryption.ensureOutboundSession(streamId, opts)
    }

    /**
     * Encrypt an event using group encryption algorithm
     *
     * @returns Promise which resolves when the event has been
     *     encrypted, or null if nothing was needed
     */
    public async encryptGroupEvent(streamId: string, payload: string): Promise<EncryptedData> {
        return this.groupEncryption.encrypt(streamId, payload)
    }
    /**
     * Decrypt a received event using group encryption algorithm
     *
     * @returns a promise which resolves once we have finished decrypting.
     * Rejects with an error if there is a problem decrypting the event.
     */
    public async decryptGroupEvent(streamId: string, content: EncryptedData) {
        return this.groupDecryption.decrypt(streamId, content)
    }

    /**
     * Import a list of group session keys previously exported by exportRoomKeys
     *
     * @param streamId - the id of the stream the keys are for
     * @param keys - a list of session export objects
     * @returns a promise which resolves once the keys have been imported
     */
    public async importSessionKeys(
        streamId: string,
        keys: GroupEncryptionSession[],
    ): Promise<void> {
        await this.cryptoStore.withGroupSessions(async () =>
            Promise.all(
                keys.map(async (key) => {
                    try {
                        await this.groupDecryption.importStreamKey(streamId, key)
                    } catch {
                        log(`failed to import key`)
                    }
                }),
            ),
        )
    }

    /**
     * Import a list of room keys previously exported by exportRoomKeys
     *
     * @param keys - a list of session export objects
     * @returns a promise which resolves once the keys have been imported
     */
    public importRoomKeys(
        keys: GroupEncryptionSession[],
        opts: ImportRoomKeysOpts = {},
    ): Promise<void> {
        let successes = 0
        let failures = 0
        const total = keys.length

        function updateProgress(): void {
            opts.progressCallback?.({
                stage: 'load_keys',
                successes,
                failures,
                total,
            })
        }

        return Promise.all(
            keys.map(async (key) => {
                if (!key.streamId || !key.algorithm) {
                    log('ignoring room key entry with missing fields', key)
                    failures++
                    if (opts.progressCallback) {
                        updateProgress()
                    }
                    return
                }

                try {
                    await this.groupDecryption.importStreamKey(key.streamId, key)
                    successes++
                    if (opts.progressCallback) {
                        updateProgress()
                    }
                } catch (error) {
                    log('failed to import key', error)
                    failures++
                    if (opts.progressCallback) {
                        updateProgress()
                    }
                }
                return
            }),
        ).then()
    }

    /**
     * Import a JSON string encoding a list of room keys previously
     * exported by exportRoomKeysAsJson
     *
     * @param keys - a JSON string encoding a list of session export
     *    objects, each of which is an GroupEncryptionSession
     * @param opts - options object
     * @returns a promise which resolves once the keys have been imported
     */
    public async importRoomKeysAsJson(keys: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return await this.importRoomKeys(JSON.parse(keys))
    }
}
