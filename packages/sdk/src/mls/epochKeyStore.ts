import {
    CipherSuite as MlsCipherSuite,
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    Secret as MlsSecret,
} from '@river-build/mls-rs-wasm'
import { bin_toHexString, DLogger, shortenHexString } from '@river-build/dlog'
import { DerivedKeys, EpochKey } from './epochKey'
import { EncryptedData } from '@river-build/proto'

export class EpochKeyService {
    private epochKeyStore: IEpochKeyStore
    private cipherSuite: MlsCipherSuite
    private cache: Map<EpochKeyId, EpochKey> = new Map()
    log: DLogger

    public constructor(cipherSuite: MlsCipherSuite, epochKeyStore: IEpochKeyStore, log: DLogger) {
        this.log = log
        this.cipherSuite = cipherSuite
        this.epochKeyStore = epochKeyStore
    }

    /// Gets epochKey from the cache
    public getEpochKey(streamId: string, epoch: bigint): EpochKey | undefined {
        const epochId: EpochKeyId = epochKeyId(streamId, epoch)
        return this.cache.get(epochId)
    }

    /// Loads epoch key from storage and rehydrates the cache
    public async loadEpochKey(streamId: string, epoch: bigint): Promise<EpochKey | undefined> {
        const epochKey = await this.epochKeyStore.getEpochKey(streamId, epoch)
        const epochId = epochKeyId(streamId, epoch)
        if (epochKey) {
            this.cache.set(epochId, epochKey)
        } else {
            this.cache.delete(epochId)
        }
        return epochKey
    }

    private async saveEpochKey(epochKey: EpochKey): Promise<void> {
        this.log('saveEpochKey', {
            streamId: epochKey.streamId,
            epoch: epochKey.epoch,
        })
        this.cache.set(epochKeyId(epochKey.streamId, epochKey.epoch), epochKey)
        await this.epochKeyStore.setEpochKeyState(epochKey)
    }

    /// Seal epoch secret
    public async sealEpochSecret(
        epochKey: EpochKey,
        { publicKey }: { publicKey: Uint8Array },
    ): Promise<void> {
        this.log('sealEpochSecret', {
            streamId: epochKey.streamId,
            epoch: epochKey.epoch,
            publicKey: shortenHexString(bin_toHexString(publicKey)),
        })

        if (epochKey.openEpochSecret === undefined) {
            throw new Error(`Epoch key not open: ${epochKey.streamId} ${epochKey.epoch}`)
        }
        if (epochKey.sealedEpochSecret !== undefined) {
            throw new Error(`Epoch key already sealed: ${epochKey.streamId} ${epochKey.epoch}`)
        }

        const publicKey_ = HpkePublicKey.fromBytes(publicKey)
        const sealedEpochSecret = (
            await this.cipherSuite.seal(publicKey_, epochKey.openEpochSecret)
        ).toBytes()
        const updatedEpochKey = { ...epochKey, sealedEpochSecret }
        // TODO: Should this method store epochKey?
        await this.saveEpochKey(updatedEpochKey)
    }

    // TODO: Refactor this one not to perform load
    public async addAnnouncedSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecret: Uint8Array,
    ): Promise<void> {
        this.log('addSealedEpochSecret', {
            streamId,
            epoch,
            sealedEpochSecretBytes: shortenHexString(bin_toHexString(sealedEpochSecret)),
        })
        let epochKey = await this.epochKeyStore.getEpochKey(streamId, epoch)
        if (!epochKey) {
            epochKey = EpochKey.fromSealedEpochSecret(streamId, epoch, sealedEpochSecret)
        } else {
            epochKey = { ...epochKey, sealedEpochSecret, announced: true }
        }
        // TODO: Should this method store epochKey?
        await this.saveEpochKey(epochKey)
    }

    // TODO: Should this method persist the epoch key?
    public async addOpenEpochSecret(
        streamId: string,
        epoch: bigint,
        openEpochSecret: Uint8Array,
    ): Promise<void> {
        this.log('addOpenEpochSecret', {
            streamId,
            epoch,
            openEpochSecret: shortenHexString(bin_toHexString(openEpochSecret)),
        })
        const openEpochSecret_ = MlsSecret.fromBytes(openEpochSecret)
        const derivedKeys_ = await this.cipherSuite.kemDerive(openEpochSecret_)
        const derivedKeys = {
            publicKey: derivedKeys_.publicKey.toBytes(),
            secretKey: derivedKeys_.secretKey.toBytes(),
        }

        let epochKey = await this.epochKeyStore.getEpochKey(streamId, epoch)
        if (!epochKey) {
            epochKey = EpochKey.fromOpenEpochSecret(streamId, epoch, openEpochSecret, derivedKeys)
        } else {
            epochKey = { ...epochKey, openEpochSecret, derivedKeys }
        }
        // TODO: Should this method store epochKey
        await this.saveEpochKey(epochKey)
    }

    public async openSealedEpochSecret(
        epochKey: EpochKey,
        { derivedKeys: nextEpochKeys }: { derivedKeys: DerivedKeys },
    ): Promise<void> {
        this.log('openSealedEpochSecret', {
            streamId: epochKey.streamId,
            epoch: epochKey.epoch,
        })

        if (epochKey.openEpochSecret !== undefined) {
            throw new Error(`Epoch key already open: ${epochKey.streamId} ${epochKey.epoch}`)
        }

        if (epochKey.sealedEpochSecret === undefined) {
            throw new Error(`Epoch key not sealed: ${epochKey.streamId} ${epochKey.epoch}`)
        }

        const sealedEpochSecret_ = HpkeCiphertext.fromBytes(epochKey.sealedEpochSecret)
        const secretKey_ = MlsSecret.fromBytes(nextEpochKeys.secretKey)
        const publicKey_ = HpkePublicKey.fromBytes(nextEpochKeys.publicKey)
        const unsealedBytes = await this.cipherSuite.open(
            sealedEpochSecret_,
            secretKey_,
            publicKey_,
        )
        await this.addOpenEpochSecret(epochKey.streamId, epochKey.epoch, unsealedBytes)
    }

    public async encryptMessage(epochKey: EpochKey, message: Uint8Array): Promise<EncryptedData> {
        this.log('encryptMessage', {
            streamId: epochKey.streamId,
            epoch: epochKey.epoch,
        })

        if (epochKey.derivedKeys === undefined) {
            throw new Error(`Epoch key not open: ${epochKey.streamId} ${epochKey.epoch}`)
        }

        const publicKey_ = HpkePublicKey.fromBytes(epochKey.derivedKeys.publicKey)
        const ciphertext_ = await this.cipherSuite.seal(publicKey_, message)
        const ciphertext = ciphertext_.toBytes()

        return new EncryptedData({
            algorithm: 'mls',
            mlsCiphertext: ciphertext,
            mlsEpoch: epochKey.epoch,
        })
    }

    public async decryptMessage(epochKey: EpochKey, message: EncryptedData): Promise<Uint8Array> {
        this.log('decryptMessage', {
            streamId: epochKey.streamId,
            epoch: epochKey.epoch,
        })

        if (epochKey.derivedKeys === undefined) {
            throw new Error(`Epoch key not open: ${epochKey.streamId} ${epochKey.epoch}`)
        }

        if (message.algorithm !== 'mls') {
            throw new Error(`Invalid algorithm: ${message.algorithm}`)
        }

        if (message.mlsEpoch !== epochKey.epoch) {
            throw new Error(`Invalid epoch: ${message.mlsEpoch}`)
        }

        if (message.mlsCiphertext === undefined) {
            throw new Error(`No ciphertext`)
        }

        const ciphertext = message.mlsCiphertext
        const publicKey_ = HpkePublicKey.fromBytes(epochKey.derivedKeys.publicKey)
        const secretKey_ = HpkeSecretKey.fromBytes(epochKey.derivedKeys.secretKey)
        const ciphertext_ = HpkeCiphertext.fromBytes(ciphertext)
        return await this.cipherSuite.open(ciphertext_, secretKey_, publicKey_)
    }
}

type EpochKeyId = string & { __brand: 'EpochKeyId' }

function epochKeyId(streamId: string, epoch: bigint): EpochKeyId {
    return `${streamId}/${epoch}` as EpochKeyId
}

export interface IEpochKeyStore {
    getEpochKey(streamId: string, epoch: bigint): Promise<EpochKey | undefined>
    setEpochKeyState(epochKey: EpochKey): Promise<void>
}

export class EpochKeyStore implements IEpochKeyStore {
    private epochKeySates: Map<EpochKeyId, EpochKey> = new Map()
    log: DLogger

    constructor(log: DLogger) {
        this.log = log
    }

    public async getEpochKey(streamId: string, epoch: bigint): Promise<EpochKey | undefined> {
        const epochId: EpochKeyId = epochKeyId(streamId, epoch)
        return this.epochKeySates.get(epochId)
    }

    public async setEpochKeyState(epochKey: EpochKey): Promise<void> {
        const epochId = epochKeyId(epochKey.streamId, epochKey.epoch)
        this.epochKeySates.set(epochId, epochKey)
    }
}
