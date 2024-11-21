import {
    CipherSuite as MlsCipherSuite,
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    Secret as MlsSecret,
} from '@river-build/mls-rs-wasm'
import { MlsStore } from './mlsStore'
import { bin_toHexString, DLogger, shortenHexString } from '@river-build/dlog'
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
        this.log('addSealedEpochSecret', {
            streamId,
            epoch,
            sealedEpochSecretBytes: shortenHexString(bin_toHexString(sealedEpochSecretBytes)),
        })
        try {
            const sealedEpochSecret = HpkeCiphertext.fromBytes(sealedEpochSecretBytes)
            let epochKey = await this.epochKeyStore.getEpochKey(streamId, epoch)
            if (!epochKey) {
                epochKey = EpochKey.fromSealedEpochSecret(streamId, epoch, sealedEpochSecret)
            } else {
                epochKey.addSealedEpochSecret(sealedEpochSecret)
            }
            await this.epochKeyStore.setEpochKeyState(epochKey)
            if (epochKey.state.status === 'EPOCH_KEY_SEALED') {
                const nextEpochKey = await this.epochKeyStore.getEpochKey(streamId, epoch + 1n)
                if (nextEpochKey?.state.status === 'EPOCH_KEY_OPEN') {
                    await this.openSealedEpochSecret(epochKey, nextEpochKey.state)
                }
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
        this.log('addOpenEpochSecret', {
            streamId,
            epoch,
            openEpochSecretBytes: shortenHexString(bin_toHexString(openEpochSecretBytes)),
        })
        const openEpochSecret = MlsSecret.fromBytes(openEpochSecretBytes)
        const derivedKeys = await this.cipherSuite.kemDerive(openEpochSecret)

        let epochKey = await this.epochKeyStore.getEpochKey(streamId, epoch)
        if (!epochKey) {
            epochKey = EpochKey.fromOpenEpochSecret(streamId, epoch, openEpochSecret, derivedKeys)
        } else {
            epochKey.addOpenEpochSecretAndKeys(openEpochSecret, derivedKeys)
        }
        await this.epochKeyStore.setEpochKeyState(epochKey)
        // Try opening the previous one
        const previousEpochKey = await this.epochKeyStore.getEpochKey(streamId, epoch - 1n)
        if (previousEpochKey?.state.status === 'EPOCH_KEY_SEALED') {
            await this.openSealedEpochSecret(previousEpochKey, derivedKeys)
        }
    }

    private async openSealedEpochSecret(
        epochKey: EpochKey,
        nextEpochKeys: DerivedKeys,
    ): Promise<void> {
        this.log('openSealedEpochSecret', {
            streamId: epochKey.streamId,
            epoch: epochKey.epoch,
        })
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
    private announceds: Map<EpochKeyId, boolean> = new Map()
    log: DLogger

    constructor(log: DLogger) {
        // this.log = log.extend(shortenHexString(streamId))
        this.log = log
    }

    private getEpochKeyState(epochId: EpochKeyId): EpochKeyState | undefined {
        const derivedKeys = this.getDerivedKeys(epochId)
        const openEpochSecret = this.getOpenEpochSecret(epochId)
        const sealedEpochSecret = this.getSealedEpochSecret(epochId)
        const announced = this.announceds.get(epochId) || false

        if (derivedKeys) {
            if (!openEpochSecret) {
                throw new Error('Derived keys without open epoch secret')
            }
            return {
                status: 'EPOCH_KEY_OPEN',
                secretKey: derivedKeys.secretKey,
                publicKey: derivedKeys.publicKey,
                openEpochSecret,
                sealedEpochSecret,
                announced,
            }
        }
        if (sealedEpochSecret) {
            return {
                status: 'EPOCH_KEY_SEALED',
                sealedEpochSecret,
                announced,
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
            case 'EPOCH_KEY_SEALED':
                this.addSealedEpochSecret(epochId, state.sealedEpochSecret)
                this.announceds.set(epochId, state.announced)
                break
            case 'EPOCH_KEY_OPEN':
                this.addOpenEpochSecret(epochId, state.openEpochSecret)
                this.addDerivedKeys(epochId, state)
                if (state.sealedEpochSecret) {
                    this.addSealedEpochSecret(epochId, state.sealedEpochSecret)
                }
                this.announceds.set(epochId, state.announced)
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
