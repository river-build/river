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
    private epochKeyStore: EpochKeyStore
    private cipherSuite: MlsCipherSuite
    log: DLogger

    public constructor(cipherSuite: MlsCipherSuite, mlsStore: MlsStore, log: DLogger) {
        this.log = log
        this.cipherSuite = cipherSuite
        this.epochKeyStore = new EpochKeyStore(this.log)
    }

    public async getEpochKey(streamId: string, epoch: bigint): Promise<EpochKey | undefined> {
        return await this.epochKeyStore.getEpochKey(streamId, epoch)
    }

    public async addSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecretBytes: Uint8Array,
    ): Promise<void> {
        try {
            let epochKey = await this.epochKeyStore.getEpochKey(streamId, epoch)
            if (!epochKey) {
                epochKey = EpochKey.missing(streamId, epoch)
            }
            const sealedEpochSecret = HpkeCiphertext.fromBytes(sealedEpochSecretBytes)
            epochKey.addSealedEpochSecret(sealedEpochSecret)
            await this.epochKeyStore.setEpochKeyState(epochKey)
            const nextEpochKey = await this.epochKeyStore.getEpochKey(streamId, epoch + 1n)
            if (nextEpochKey?.state.status === 'EPOCH_KEY_DERIVED') {
                await this.openSealedEpochSecret(epochKey, nextEpochKey.state)
            }
        } catch (e) {
            this.log('Error adding sealed epoch secret', e)
        }
    }

    public async addOpenEpochSecret(
        streamId: string,
        epoch: bigint,
        openEpochSecretBytes: Uint8Array,
    ): Promise<void> {
        try {
            const openEpochSecret = MlsSecret.fromBytes(openEpochSecretBytes)
            let epochKey = await this.epochKeyStore.getEpochKey(streamId, epoch)
            if (!epochKey) {
                epochKey = EpochKey.missing(streamId, epoch)
            }
            epochKey.addOpenEpochSecret(openEpochSecret)
            await this.epochKeyStore.setEpochKeyState(epochKey)
            await this.deriveKeys(epochKey)
        } catch (e) {
            this.log('error adding open epoch secret', e)
        }
    }

    private async openSealedEpochSecret(
        epochKey: EpochKey,
        nextEpochKeys: DerivedKeys,
    ): Promise<void> {
        if (epochKey?.state.status === 'EPOCH_KEY_SEALED') {
            const sealedEpochSecret = epochKey.state.sealedEpochSecret
            const unsealedBytes = await this.cipherSuite.open(
                sealedEpochSecret,
                nextEpochKeys.secretKey,
                nextEpochKeys.publicKey,
            )
            await this.addOpenEpochSecret(epochKey.streamId, epochKey.epoch, unsealedBytes)
        }
    }

    private async deriveKeys(epochKey: EpochKey): Promise<void> {
        if (epochKey.state.status === 'EPOCH_KEY_OPEN') {
            const openEpochSecret = epochKey.state.openEpochSecret
            const keys = await this.cipherSuite.kemDerive(openEpochSecret)
            epochKey.addDerivedKeys(keys)
            await this.epochKeyStore.setEpochKeyState(epochKey)
            const previousEpoch = await this.getEpochKey(epochKey.streamId, epochKey.epoch - 1n)
            if (previousEpoch) {
                await this.openSealedEpochSecret(previousEpoch, keys)
            }
        }
    }
}

type HpkeCiphertextBytes = Uint8Array & { __brand: 'HpkeCiphertext' }
type MlsSecretBytes = Uint8Array & { __brand: 'MlsSecret' }
type HpkeSecretKeyBytes = Uint8Array & { __brand: 'HpkeSecretKey' }
type HpkePublicKeyBytes = Uint8Array & { __brand: 'HpkePublicKey' }

type EpochKeyId = string & { __brand: 'EpochKeyId' }

function epochKeyId(streamId: string, epoch: bigint): EpochKeyId {
    return `${streamId}/${epoch}` as EpochKeyId
}

export class EpochKeyStore {
    private sealedEpochSecrets: Map<EpochKeyId, HpkeCiphertextBytes> = new Map()
    private openEpochSecrets: Map<EpochKeyId, MlsSecretBytes> = new Map()
    private secretKeys: Map<EpochKeyId, HpkeSecretKeyBytes> = new Map()
    private publicKeys: Map<EpochKeyId, HpkePublicKeyBytes> = new Map()
    log: DLogger

    constructor(log: DLogger) {
        // this.log = log.extend(shortenHexString(streamId))
        this.log = log
    }

    private getEpochKeyState(epochId: EpochKeyId): EpochKeyState | undefined {
        const derivedKeys = this.getDerivedKeys(epochId)
        const openEpochSecret = this.getOpenEpochSecret(epochId)
        const sealedEpochSecret = this.getSealedEpochSecret(epochId)

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
        return undefined
    }

    public async getEpochKey(streamId: string, epoch: bigint): Promise<EpochKey | undefined> {
        const epochId: EpochKeyId = epochKeyId(streamId, epoch)
        const state = this.getEpochKeyState(epochId)
        if (!state) {
            return undefined
        }
        return new EpochKey(streamId, epoch, state)
    }

    // TODO: Optimise this
    public async setEpochKeyState(epochKey: EpochKey): Promise<void> {
        const streamId = epochKey.streamId
        const epoch = epochKey.epoch
        const state = epochKey.state
        const epochId = epochKeyId(streamId, epoch)
        switch (state.status) {
            case 'EPOCH_KEY_MISSING':
                break
            case 'EPOCH_KEY_SEALED':
                this.addSealedEpochSecret(epochId, state.sealedEpochSecret)
                break
            case 'EPOCH_KEY_OPEN':
                this.addOpenEpochSecret(epochId, state.openEpochSecret)
                if (state.sealedEpochSecret) {
                    this.addSealedEpochSecret(epochId, state.sealedEpochSecret)
                }
                break
            case 'EPOCH_KEY_DERIVED':
                this.addOpenEpochSecret(epochId, state.openEpochSecret)
                this.addDerivedKeys(epochId, state)
                if (state.sealedEpochSecret) {
                    this.addSealedEpochSecret(epochId, state.sealedEpochSecret)
                }
                break
        }
    }

    private addSealedEpochSecret(epochId: EpochKeyId, sealedEpochSecret: HpkeCiphertext) {
        const sealedEpochSecretBytes = sealedEpochSecret.toBytes() as HpkeCiphertextBytes
        this.sealedEpochSecrets.set(epochId, sealedEpochSecretBytes)
    }

    private getSealedEpochSecret(epochId: EpochKeyId): HpkeCiphertext | undefined {
        const sealedEpochSecretBytes = this.sealedEpochSecrets.get(epochId)
        if (sealedEpochSecretBytes) {
            return HpkeCiphertext.fromBytes(sealedEpochSecretBytes)
        }
        return undefined
    }

    private addOpenEpochSecret(epochId: EpochKeyId, openEpochSecret: MlsSecret) {
        const openEpochSecretBytes = openEpochSecret.toBytes() as MlsSecretBytes
        this.openEpochSecrets.set(epochId, openEpochSecretBytes)
    }

    private getOpenEpochSecret(epochId: EpochKeyId): MlsSecret | undefined {
        const openEpochSecretBytes = this.openEpochSecrets.get(epochId)
        if (openEpochSecretBytes) {
            return MlsSecret.fromBytes(openEpochSecretBytes)
        }
        return undefined
    }

    private addDerivedKeys(epochId: EpochKeyId, keys: DerivedKeys) {
        const secretKeyBytes = keys.secretKey.toBytes() as HpkeSecretKeyBytes
        const publicKeyBytes = keys.publicKey.toBytes() as HpkePublicKeyBytes
        this.secretKeys.set(epochId, secretKeyBytes)
        this.publicKeys.set(epochId, publicKeyBytes)
    }

    private getDerivedKeys(epochId: EpochKeyId): DerivedKeys | undefined {
        const secretKeyBytes = this.secretKeys.get(epochId)
        const publicKeyBytes = this.publicKeys.get(epochId)
        if (secretKeyBytes && publicKeyBytes) {
            return {
                secretKey: HpkeSecretKey.fromBytes(secretKeyBytes),
                publicKey: HpkePublicKey.fromBytes(publicKeyBytes),
            }
        }
        return undefined
    }
}
