import {
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    Secret as MlsSecret,
} from '@river-build/mls-rs-wasm'

export type EpochKeyState =
    | { status: 'EPOCH_KEY_SEALED'; sealedEpochSecret: HpkeCiphertext; announced: boolean }
    | {
          status: 'EPOCH_KEY_OPEN'
          openEpochSecret: MlsSecret
          secretKey: HpkeSecretKey
          publicKey: HpkePublicKey
          sealedEpochSecret?: HpkeCiphertext
          announced: boolean
      }

export type DerivedKeys = {
    secretKey: HpkeSecretKey
    publicKey: HpkePublicKey
}

export class EpochKey {
    public readonly streamId: string
    public readonly epoch: bigint
    public state: EpochKeyState

    constructor(streamId: string, epoch: bigint, state: EpochKeyState) {
        this.streamId = streamId
        this.epoch = epoch
        this.state = state
    }

    public static fromSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecret: HpkeCiphertext,
    ): EpochKey {
        return new EpochKey(streamId, epoch, {
            status: 'EPOCH_KEY_SEALED',
            sealedEpochSecret,
            announced: true,
        })
    }

    public static fromOpenEpochSecret(
        streamId: string,
        epoch: bigint,
        openEpochSecret: MlsSecret,
        derivedKeys: DerivedKeys,
    ): EpochKey {
        return new EpochKey(streamId, epoch, {
            status: 'EPOCH_KEY_OPEN',
            openEpochSecret,
            secretKey: derivedKeys.secretKey,
            publicKey: derivedKeys.publicKey,
            announced: false,
        })
    }

    public addSealedEpochSecret(sealedEpochSecret: HpkeCiphertext) {
        this.state.sealedEpochSecret = sealedEpochSecret
    }

    public addOpenEpochSecretAndKeys(openEpochSecret: MlsSecret, keys: DerivedKeys) {
        this.state = {
            status: 'EPOCH_KEY_OPEN',
            openEpochSecret,
            secretKey: keys.secretKey,
            publicKey: keys.publicKey,
            sealedEpochSecret: this.state.sealedEpochSecret,
            announced: this.state.announced,
        }
    }

    public markAnnounced() {
        this.state.announced = true
    }
}
