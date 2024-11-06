import {
    CipherSuite as MlsCipherSuite,
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    Secret as MlsSecret,
} from '@river-build/mls-rs-wasm'

type EpochKeyStatus =
    | 'EPOCH_KEY_MISSING'
    | 'EPOCH_KEY_SEALED'
    | 'EPOCH_KEY_OPEN'
    | 'EPOCH_KEY_DERIVED'

type EpochIdentifier = string & { __brand: 'EPOCH_IDENTIFIER' }

function epochIdentifier(streamId: string, epoch: bigint): EpochIdentifier {
    return `${streamId}:${epoch}` as EpochIdentifier
}

type DerivedKeys = {
    secretKey: HpkeSecretKey
    publicKey: HpkePublicKey
}
export class EpochKeyStore {
    private sealedEpochSecrets: Map<EpochIdentifier, HpkeCiphertext> = new Map()
    private openEpochSecrets: Map<EpochIdentifier, MlsSecret> = new Map()
    private derivedKeys: Map<EpochIdentifier, DerivedKeys> = new Map()
    private cipherSuite: MlsCipherSuite

    public constructor(cipherSuite: MlsCipherSuite) {
        this.cipherSuite = cipherSuite
    }

    public getEpochKeyStatus(streamId: string, epoch: bigint): EpochKeyStatus {
        const epochId = epochIdentifier(streamId, epoch)
        if (this.derivedKeys.has(epochId)) {
            return 'EPOCH_KEY_DERIVED'
        }
        if (this.openEpochSecrets.has(epochId)) {
            return 'EPOCH_KEY_OPEN'
        }
        if (this.sealedEpochSecrets.has(epochId)) {
            return 'EPOCH_KEY_SEALED'
        }
        return 'EPOCH_KEY_MISSING'
    }

    public addSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecretBytes: Uint8Array,
    ) {
        const epochId = epochIdentifier(streamId, epoch)
        const sealedEpochSecret = HpkeCiphertext.fromBytes(sealedEpochSecretBytes)
        this.sealedEpochSecrets.set(epochId, sealedEpochSecret)
    }

    public getSealedEpochSecret(streamId: string, epoch: bigint): HpkeCiphertext | undefined {
        const epochId = epochIdentifier(streamId, epoch)
        return this.sealedEpochSecrets.get(epochId)
    }

    public addOpenEpochSecret(streamId: string, epoch: bigint, openEpochSecret: MlsSecret) {
        const epochId = epochIdentifier(streamId, epoch)
        this.openEpochSecrets.set(epochId, openEpochSecret)
    }

    public getOpenEpochSecret(streamId: string, epoch: bigint): MlsSecret | undefined {
        const epochId = epochIdentifier(streamId, epoch)
        return this.openEpochSecrets.get(epochId)
    }

    public addDerivedKeys(
        streamId: string,
        epoch: bigint,
        secretKey: HpkeSecretKey,
        publicKey: HpkePublicKey,
    ) {
        const epochId = epochIdentifier(streamId, epoch)
        this.derivedKeys.set(epochId, { secretKey, publicKey })
    }

    public getDerivedKeys(
        streamId: string,
        epoch: bigint,
    ): { publicKey: HpkePublicKey; secretKey: HpkeSecretKey } | undefined {
        const epochId = epochIdentifier(streamId, epoch)
        const keys = this.derivedKeys.get(epochId)
        if (keys) {
            return { ...keys }
        }
        return undefined
    }

    private async openEpochSecret(streamId: string, epoch: bigint) {
        const sealedEpochSecret = this.getSealedEpochSecret(streamId, epoch)!
        const { publicKey, secretKey } = this.getDerivedKeys(streamId, epoch + 1n)!
        const openEpochSecretBytes = await this.cipherSuite.open(
            sealedEpochSecret,
            secretKey,
            publicKey,
        )
        const openEpochSecret = MlsSecret.fromBytes(openEpochSecretBytes)

        this.addOpenEpochSecret(streamId, epoch, openEpochSecret)
    }

    public async tryOpenEpochSecret(streamId: string, epoch: bigint): Promise<EpochKeyStatus> {
        let status = this.getEpochKeyStatus(streamId, epoch)
        if (status === 'EPOCH_KEY_SEALED') {
            const nextEpochStatus = this.getEpochKeyStatus(streamId, epoch + 1n)
            if (nextEpochStatus === 'EPOCH_KEY_DERIVED') {
                await this.openEpochSecret(streamId, epoch)

                // Update the status
                status = this.getEpochKeyStatus(streamId, epoch)
            }
        }
        return Promise.resolve(status)
    }

    private async deriveKeys(streamId: string, epoch: bigint) {
        const openEpochSecret = this.getOpenEpochSecret(streamId, epoch)!
        const { publicKey, secretKey } = await this.cipherSuite.kemDerive(openEpochSecret)
        this.addDerivedKeys(streamId, epoch, secretKey, publicKey)
    }

    public async tryDeriveKeys(streamId: string, epoch: bigint): Promise<EpochKeyStatus> {
        let status = this.getEpochKeyStatus(streamId, epoch)

        if (status === 'EPOCH_KEY_OPEN') {
            await this.deriveKeys(streamId, epoch)

            // Update the status
            status = this.getEpochKeyStatus(streamId, epoch)
        }

        return Promise.resolve(status)
    }
}
