import {
    CipherSuite as MlsCipherSuite,
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    Secret as MlsSecret,
} from '@river-build/mls-rs-wasm'

type EpochKeyState =
    | { status: 'EPOCH_KEY_MISSING' }
    | { status: 'EPOCH_KEY_SEALED'; sealedEpochSecret: HpkeCiphertext }
    | { status: 'EPOCH_KEY_OPEN'; openEpochSecret: MlsSecret }
    | {
          status: 'EPOCH_KEY_DERIVED'
          secretKey: HpkeSecretKey
          publicKey: HpkePublicKey
      }

type DerivedKeys = {
    secretKey: HpkeSecretKey
    publicKey: HpkePublicKey
}

export class EpochKeyService {
    private epochKeyStores: Map<string, EpochKeyStore> = new Map()
    private cipherSuite: MlsCipherSuite

    public constructor(cipherSuite: MlsCipherSuite) {
        this.cipherSuite = cipherSuite
    }

    private getEpochKeyStore(streamId: string): EpochKeyStore {
        let epochKeyStore = this.epochKeyStores.get(streamId)
        if (!epochKeyStore) {
            epochKeyStore = new EpochKeyStore()
            this.epochKeyStores.set(streamId, epochKeyStore)
        }
        return epochKeyStore
    }

    public getEpochKeyState(streamId: string, epoch: bigint): EpochKeyState {
        const epochKeyStore = this.getEpochKeyStore(streamId)
        const derivedKeys = epochKeyStore.getDerivedKeys(epoch)
        if (derivedKeys) {
            return {
                status: 'EPOCH_KEY_DERIVED',
                secretKey: derivedKeys.secretKey,
                publicKey: derivedKeys.publicKey,
            }
        }
        const openEpochSecret = epochKeyStore.getOpenEpochSecret(epoch)
        if (openEpochSecret) {
            return {
                status: 'EPOCH_KEY_OPEN',
                openEpochSecret,
            }
        }
        const sealedEpochSecret = epochKeyStore.getSealedEpochSecret(epoch)
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

    public addSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecretBytes: Uint8Array,
    ): Promise<EpochKeyState> {
        const epochKeyStore = this.getEpochKeyStore(streamId)
        epochKeyStore.addSealedEpochSecret(epoch, sealedEpochSecretBytes)
        return Promise.resolve(this.getEpochKeyState(streamId, epoch))
    }

    public async addOpenEpochSecret(
        streamId: string,
        epoch: bigint,
        openEpochSecretBytes: Uint8Array,
    ): Promise<EpochKeyState> {
        const epochKeyStore = this.getEpochKeyStore(streamId)
        const openEpochSecret = MlsSecret.fromBytes(openEpochSecretBytes)
        epochKeyStore.addOpenEpochSecret(epoch, openEpochSecret)
        return await this.deriveKeys(streamId, epoch)
    }

    private async openSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        nextEpochKeys: DerivedKeys,
    ): Promise<EpochKeyState> {
        const epochKeyStore = this.getEpochKeyStore(streamId)
        const sealedEpochSecret = epochKeyStore.getSealedEpochSecret(epoch)
        const openEpochSecret = epochKeyStore.getOpenEpochSecret(epoch)
        if (sealedEpochSecret && !openEpochSecret) {
            const unsealedBytes = await this.cipherSuite.open(
                sealedEpochSecret,
                nextEpochKeys.secretKey,
                nextEpochKeys.publicKey,
            )
            // TODO: New side effect!
            await this.addOpenEpochSecret(streamId, epoch, unsealedBytes)
        }
        return Promise.resolve(this.getEpochKeyState(streamId, epoch))
    }

    private async deriveKeys(streamId: string, epoch: bigint): Promise<EpochKeyState> {
        const epochKeyStore = this.getEpochKeyStore(streamId)
        const openEpochSecret = epochKeyStore.getOpenEpochSecret(epoch)
        if (openEpochSecret) {
            const keys = await this.cipherSuite.kemDerive(openEpochSecret)
            epochKeyStore.addDerivedKeys(epoch, keys)
            // TODO: try opening
            // await this.openSealedEpochSecret(streamId, epoch, keys)
        }
        return Promise.resolve(this.getEpochKeyState(streamId, epoch))
    }
}

export class EpochKeyStore {
    private sealedEpochSecrets: Map<bigint, HpkeCiphertext> = new Map()
    private openEpochSecrets: Map<bigint, MlsSecret> = new Map()
    private derivedKeys: Map<bigint, DerivedKeys> = new Map()

    public addSealedEpochSecret(epoch: bigint, sealedEpochSecretBytes: Uint8Array) {
        const sealedEpochSecret = HpkeCiphertext.fromBytes(sealedEpochSecretBytes)
        this.sealedEpochSecrets.set(epoch, sealedEpochSecret)
    }

    public getSealedEpochSecret(epoch: bigint): HpkeCiphertext | undefined {
        return this.sealedEpochSecrets.get(epoch)
    }

    public addOpenEpochSecret(epoch: bigint, openEpochSecret: MlsSecret) {
        this.openEpochSecrets.set(epoch, openEpochSecret)
    }

    public getOpenEpochSecret(epoch: bigint): MlsSecret | undefined {
        return this.openEpochSecrets.get(epoch)
    }

    public addDerivedKeys(epoch: bigint, keys: DerivedKeys) {
        this.derivedKeys.set(epoch, keys)
    }

    public getDerivedKeys(epoch: bigint): DerivedKeys | undefined {
        return this.derivedKeys.get(epoch)
    }
}
