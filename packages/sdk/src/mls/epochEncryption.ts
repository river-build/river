import {
    CipherSuite as MlsCipherSuite,
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    Secret as MlsSecret,
} from '@river-build/mls-rs-wasm'
import { dlog } from '@river-build/dlog'
import { MlsLogger } from './logger'

const defaultLogger = dlog('csb:mls:epochEncryption')

export type DerivedKeys = {
    secretKey: Uint8Array
    publicKey: Uint8Array
}

export type EpochEncryptionOpts = {
    cipherSuite: MlsCipherSuite
    log: MlsLogger
}

const defaultEpochEncryptionOpts = {
    cipherSuite: new MlsCipherSuite(),
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
}

export class EpochEncryption {
    private cipherSuite: MlsCipherSuite

    private log: MlsLogger

    constructor(opts: EpochEncryptionOpts = defaultEpochEncryptionOpts) {
        this.log = opts.log
        this.cipherSuite = opts.cipherSuite
    }

    public async seal(derivedKeys: DerivedKeys, plaintext: Uint8Array): Promise<Uint8Array> {
        const publicKey_ = HpkePublicKey.fromBytes(derivedKeys.publicKey)
        const ciphertext_ = await this.cipherSuite.seal(publicKey_, plaintext)
        return ciphertext_.toBytes()
    }

    public async open(derivedKeys: DerivedKeys, ciphertext: Uint8Array): Promise<Uint8Array> {
        const publicKey_ = HpkePublicKey.fromBytes(derivedKeys.publicKey)
        const secretKey_ = HpkeSecretKey.fromBytes(derivedKeys.secretKey)
        const ciphertext_ = HpkeCiphertext.fromBytes(ciphertext)
        return await this.cipherSuite.open(ciphertext_, secretKey_, publicKey_)
    }

    public async deriveKeys(secret: Uint8Array): Promise<DerivedKeys> {
        const mlsSecret = MlsSecret.fromBytes(secret)
        const deriveOutput = await this.cipherSuite.kemDerive(mlsSecret)
        return {
            publicKey: deriveOutput.publicKey.toBytes(),
            secretKey: deriveOutput.secretKey.toBytes(),
        }
    }
}
