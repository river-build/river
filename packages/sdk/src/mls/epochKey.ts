import { DLogger } from '@river-build/dlog'
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
    public readonly epoch: bigint
    public state: EpochKeyState
    private readonly log: DLogger

    constructor(
        epoch: bigint,
        log: DLogger,
        state: EpochKeyState = { status: 'EPOCH_KEY_MISSING' },
    ) {
        this.epoch = epoch
        this.log = log.extend('epoch-key')
        this.state = state
    }

    public addSealedEpochSecret(sealedEpochSecret: HpkeCiphertext): EpochKey {
        const before = this.state.status
        switch (this.state.status) {
            case 'EPOCH_KEY_MISSING':
                this.state = { status: 'EPOCH_KEY_SEALED', sealedEpochSecret }
                break
            default:
                this.state.sealedEpochSecret = sealedEpochSecret
        }
        const after = this.state.status

        this.log('add sealed epoch secret', this.epoch, before, after)
        return this
    }

    public addOpenEpochSecret(openEpochSecret: HpkeSecretKey): EpochKey {
        const before = this.state.status
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
        const after = this.state.status

        this.log('add open epoch secret', this.epoch, before, after)
        return this
    }

    public addDerivedKeys(derivedKeys: DerivedKeys): EpochKey {
        const before = this.state.status
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
        const after = this.state.status

        this.log('add derived keys', this.epoch, before, after)
        return this
    }
}
