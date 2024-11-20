import {
    CipherSuite as MlsCipherSuite,
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    Secret as MlsSecret,
} from '@river-build/mls-rs-wasm'
import { MlsStore } from './mlsStore'
import { DLogger } from '@river-build/dlog'
import { DerivedKeys, EpochKey, EpochKeyState } from './epochKey'

export class EpochKeyService {
    private epochKeyStores: Map<string, EpochKeyStore> = new Map()
    private cipherSuite: MlsCipherSuite
    private mlsStore: MlsStore
    log: DLogger

    public constructor(cipherSuite: MlsCipherSuite, mlsStore: MlsStore, log: DLogger) {
        this.cipherSuite = cipherSuite
        this.mlsStore = mlsStore
        this.log = log
    }

    private getEpochKeyStore(streamId: string): EpochKeyStore {
        let epochKeyStore = this.epochKeyStores.get(streamId)
        if (!epochKeyStore) {
            epochKeyStore = new EpochKeyStore(streamId, this.mlsStore, this.log)
            this.epochKeyStores.set(streamId, epochKeyStore)
        }
        return epochKeyStore
    }

    public getEpochKey(streamId: string, epoch: bigint): EpochKey {
        const epochKeyStore = this.getEpochKeyStore(streamId)
        return epochKeyStore.getEpochKey(epoch)
    }

    public async addSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecretBytes: Uint8Array,
    ): Promise<EpochKeyState> {
        const epochKeyStore = this.getEpochKeyStore(streamId)
        const epochKey = epochKeyStore.getEpochKey(epoch)
        const sealedEpochSecret = MlsSecret.fromBytes(sealedEpochSecretBytes)
        epochKey.addSealedEpochSecret(sealedEpochSecret)
        epochKeyStore.setEpochKeyState(epochKey.epoch, epochKey.state)
        const nextEpochKey = epochKeyStore.getEpochKey(epoch + 1n)
        if (nextEpochKey.state.status === 'EPOCH_KEY_DERIVED') {
            await this.openSealedEpochSecret(streamId, epoch, nextEpochKey.state)
        }
        return Promise.resolve(epochKey.state)
    }

    public async addOpenEpochSecret(
        streamId: string,
        epoch: bigint,
        openEpochSecretBytes: Uint8Array,
    ): Promise<EpochKeyState> {
        const openEpochSecret = MlsSecret.fromBytes(openEpochSecretBytes)
        const epochKeyStore = this.getEpochKeyStore(streamId)
        const epochKey = epochKeyStore.getEpochKey(epoch)
        epochKey.addOpenEpochSecret(openEpochSecret)
        epochKeyStore.setEpochKeyState(epochKey.epoch, epochKey.state)
        return await this.deriveKeys(streamId, epoch)
    }

    private async openSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        nextEpochKeys: DerivedKeys,
    ): Promise<EpochKeyState> {
        const epochKeyStore = this.getEpochKeyStore(streamId)
        const epochKey = epochKeyStore.getEpochKey(epoch)
        if (epochKey.state.status === 'EPOCH_KEY_SEALED') {
            const sealedEpochSecret = epochKey.state.sealedEpochSecret
            const unsealedBytes = await this.cipherSuite.open(
                sealedEpochSecret,
                nextEpochKeys.secretKey,
                nextEpochKeys.publicKey,
            )
            return await this.addOpenEpochSecret(streamId, epoch, unsealedBytes)
        }
        return Promise.resolve(epochKey.state)
    }

    private async deriveKeys(streamId: string, epoch: bigint): Promise<EpochKeyState> {
        const epochKeyStore = this.getEpochKeyStore(streamId)
        const epochKey = epochKeyStore.getEpochKey(epoch)
        if (epochKey.state.status === 'EPOCH_KEY_OPEN') {
            const openEpochSecret = epochKey.state.openEpochSecret
            const keys = await this.cipherSuite.kemDerive(openEpochSecret)
            epochKey.addDerivedKeys(keys)
            epochKeyStore.setEpochKeyState(epochKey.epoch, epochKey.state)
            if (epoch > 0n) {
                await this.openSealedEpochSecret(streamId, epoch - 1n, keys)
            }
        }
        return Promise.resolve(epochKey.state)
    }
}

type HpkeCiphertextBytes = Uint8Array & { __brand: 'HpkeCiphertext' }
type MlsSecretBytes = Uint8Array & { __brand: 'MlsSecret' }
type HpkeSecretKeyBytes = Uint8Array & { __brand: 'HpkeSecretKey' }
type HpkePublicKeyBytes = Uint8Array & { __brand: 'HpkePublicKey' }

export class EpochKeyStore {
    private sealedEpochSecrets: Map<bigint, HpkeCiphertextBytes> = new Map()
    private openEpochSecrets: Map<bigint, MlsSecretBytes> = new Map()
    private secretKeys: Map<bigint, HpkeSecretKeyBytes> = new Map()
    private publicKeys: Map<bigint, HpkePublicKeyBytes> = new Map()
    private streamId: string
    private mlsStore: MlsStore
    log: DLogger

    constructor(streamId: string, mlsStore: MlsStore, log: DLogger) {
        this.streamId = streamId
        this.mlsStore = mlsStore
        // this.log = log.extend(shortenHexString(streamId))
        this.log = log
    }

    private getEpochKeyState(epoch: bigint): EpochKeyState {
        const derivedKeys = this.getDerivedKeys(epoch)
        const openEpochSecret = this.getOpenEpochSecret(epoch)
        const sealedEpochSecret = this.getSealedEpochSecret(epoch)

        if (derivedKeys) {
            if (!openEpochSecret) {
                throw new Error('Derived keys without open epoch secret')
            }
            return {
                status: 'EPOCH_KEY_DERIVED',
                secretKey: derivedKeys.secretKey,
                publicKey: derivedKeys.publicKey,
                openEpochSecret,
                sealedEpochSecret,
            }
        }
        if (openEpochSecret) {
            return {
                status: 'EPOCH_KEY_OPEN',
                openEpochSecret,
            }
        }
        if (sealedEpochSecret) {
            return {
                status: 'EPOCH_KEY_SEALED',
                sealedEpochSecret,
            }
        }
        return {
            status: 'EPOCH_KEY_MISSING',
        }
    }

    public getEpochKey(epoch: bigint): EpochKey {
        const state = this.getEpochKeyState(epoch)
        return new EpochKey(epoch, this.log, state)
    }

    // TODO: Optimise this
    public setEpochKeyState(epoch: bigint, state: EpochKeyState) {
        switch (state.status) {
            case 'EPOCH_KEY_MISSING':
                break
            case 'EPOCH_KEY_SEALED':
                this.addSealedEpochSecret(epoch, state.sealedEpochSecret)
                break
            case 'EPOCH_KEY_OPEN':
                this.addOpenEpochSecret(epoch, state.openEpochSecret)
                if (state.sealedEpochSecret) {
                    this.addSealedEpochSecret(epoch, state.sealedEpochSecret)
                }
                break
            case 'EPOCH_KEY_DERIVED':
                this.addOpenEpochSecret(epoch, state.openEpochSecret)
                this.addDerivedKeys(epoch, state)
                if (state.sealedEpochSecret) {
                    this.addSealedEpochSecret(epoch, state.sealedEpochSecret)
                }
                break
        }
    }

    private addSealedEpochSecret(epoch: bigint, sealedEpochSecret: HpkeCiphertext) {
        const sealedEpochSecretBytes = sealedEpochSecret.toBytes() as HpkeCiphertextBytes
        this.sealedEpochSecrets.set(epoch, sealedEpochSecretBytes)
    }

    private getSealedEpochSecret(epoch: bigint): HpkeCiphertext | undefined {
        const sealedEpochSecretBytes = this.sealedEpochSecrets.get(epoch)
        if (sealedEpochSecretBytes) {
            return HpkeCiphertext.fromBytes(sealedEpochSecretBytes)
        }
        return undefined
    }

    private addOpenEpochSecret(epoch: bigint, openEpochSecret: MlsSecret) {
        const openEpochSecretBytes = openEpochSecret.toBytes() as MlsSecretBytes
        this.openEpochSecrets.set(epoch, openEpochSecretBytes)
    }

    private getOpenEpochSecret(epoch: bigint): MlsSecret | undefined {
        const openEpochSecretBytes = this.openEpochSecrets.get(epoch)
        if (openEpochSecretBytes) {
            return MlsSecret.fromBytes(openEpochSecretBytes)
        }
        return undefined
    }

    private addDerivedKeys(epoch: bigint, keys: DerivedKeys) {
        const secretKeyBytes = keys.secretKey.toBytes() as HpkeSecretKeyBytes
        const publicKeyBytes = keys.publicKey.toBytes() as HpkePublicKeyBytes
        this.secretKeys.set(epoch, secretKeyBytes)
        this.publicKeys.set(epoch, publicKeyBytes)
    }

    private getDerivedKeys(epoch: bigint): DerivedKeys | undefined {
        const secretKeyBytes = this.secretKeys.get(epoch)
        const publicKeyBytes = this.publicKeys.get(epoch)
        if (secretKeyBytes && publicKeyBytes) {
            return {
                secretKey: HpkeSecretKey.fromBytes(secretKeyBytes),
                publicKey: HpkePublicKey.fromBytes(publicKeyBytes),
            }
        }
        return undefined
    }
}
