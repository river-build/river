import {
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    Secret as MlsSecret,
} from '@river-build/mls-rs-wasm'

export type EpochKeyState =
    | { status: 'EPOCH_KEY_MISSING' }
    | { status: 'EPOCH_KEY_SEALED'; sealedEpochSecret: HpkeCiphertext }
    | { status: 'EPOCH_KEY_OPEN'; openEpochSecret: MlsSecret; sealedEpochSecret?: HpkeCiphertext }
    | {
          status: 'EPOCH_KEY_DERIVED'
          secretKey: HpkeSecretKey
          publicKey: HpkePublicKey
          openEpochSecret: MlsSecret
          sealedEpochSecret?: HpkeCiphertext
      }

export type DerivedKeys = {
    secretKey: HpkeSecretKey
    publicKey: HpkePublicKey
}

export class EpochKey {
    public readonly streamId: string
    public readonly epoch: bigint
    public state: EpochKeyState

    constructor(
        streamId: string,
        epoch: bigint,
        state: EpochKeyState = { status: 'EPOCH_KEY_MISSING' },
    ) {
        this.streamId = streamId
        this.epoch = epoch
        this.state = state
    }

    public static missing(streamId: string, epoch: bigint): EpochKey {
        return new EpochKey(streamId, epoch, { status: 'EPOCH_KEY_MISSING' })
    }

    public addSealedEpochSecret(sealedEpochSecret: HpkeCiphertext): void {
        switch (this.state.status) {
            case 'EPOCH_KEY_MISSING':
                this.state = { status: 'EPOCH_KEY_SEALED', sealedEpochSecret }
                break
            default:
                this.state.sealedEpochSecret = sealedEpochSecret
        }
    }

    public addOpenEpochSecret(openEpochSecret: HpkeSecretKey): void {
        switch (this.state.status) {
            case 'EPOCH_KEY_MISSING':
                this.state = { status: 'EPOCH_KEY_OPEN', openEpochSecret }
                break
            case 'EPOCH_KEY_SEALED':
                this.state = {
                    status: 'EPOCH_KEY_OPEN',
                    openEpochSecret,
                    sealedEpochSecret: this.state.sealedEpochSecret,
                }
                break
            default:
                this.state.openEpochSecret = openEpochSecret
        }
    }

    public addDerivedKeys(derivedKeys: DerivedKeys): void {
        switch (this.state.status) {
            case 'EPOCH_KEY_OPEN':
                this.state = {
                    status: 'EPOCH_KEY_DERIVED',
                    secretKey: derivedKeys.secretKey,
                    publicKey: derivedKeys.publicKey,
                    openEpochSecret: this.state.openEpochSecret,
                    sealedEpochSecret: this.state.sealedEpochSecret,
                }
                break

            case 'EPOCH_KEY_DERIVED':
                this.state.publicKey = derivedKeys.publicKey
                this.state.secretKey = derivedKeys.secretKey
                break

            default:
                throw new Error(`Unexpected state ${this.state.status} for epoch ${this.epoch}`)
        }
    }
}
