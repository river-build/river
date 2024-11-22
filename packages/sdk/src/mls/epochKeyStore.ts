import {
    CipherSuite as MlsCipherSuite,
    HpkeCiphertext,
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

type EpochKeyId = string & { __brand: 'EpochKeyId' }

function epochKeyId(streamId: string, epoch: bigint): EpochKeyId {
    return `${streamId}/${epoch}` as EpochKeyId
}

export class EpochKeyStore {
    private epochKeySates: Map<EpochKeyId, EpochKeyState> = new Map()
    log: DLogger

    constructor(log: DLogger) {
        this.log = log
    }

    public async getEpochKey(streamId: string, epoch: bigint): Promise<EpochKey | undefined> {
        const epochId: EpochKeyId = epochKeyId(streamId, epoch)
        const state = this.epochKeySates.get(epochId)
        if (!state) {
            return undefined
        }
        return new EpochKey(streamId, epoch, state)
    }

    public async setEpochKeyState(epochKey: EpochKey): Promise<void> {
        const streamId = epochKey.streamId
        const epoch = epochKey.epoch
        const state = epochKey.state
        const epochId = epochKeyId(streamId, epoch)
        this.epochKeySates.set(epochId, state)
    }
}
