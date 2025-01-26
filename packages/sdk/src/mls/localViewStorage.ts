import { LocalEpochSecret, LocalView } from './localView'
import Dexie from 'dexie'
import { bin_toString } from '@river-build/dlog'
import { MlsProcessor } from './mlsProcessor'

export type LocalViewDTO = {
    streamId: string
    groupId: Uint8Array
    pendingInfo: LocalView['pendingInfo']
    rejectedEpoch: LocalView['rejectedEpoch']
}

type LocalEpochSecretDTO = {
    streamId: string
    epoch: string
    secret: Uint8Array
    derivedKeys: {
        publicKey: Uint8Array
        secretKey: Uint8Array
    }
}

function toEpochSecretDTO(streamId: string, epochSecret: LocalEpochSecret): LocalEpochSecretDTO {
    return {
        streamId,
        epoch: epochSecret.epoch.toString(),
        secret: epochSecret.secret,
        derivedKeys: {
            publicKey: epochSecret.derivedKeys.publicKey,
            secretKey: epochSecret.derivedKeys.secretKey,
        },
    }
}

function toLocalViewDTO(streamId: string, localView: LocalView): LocalViewDTO {
    return {
        streamId,
        groupId: localView.group.groupId,
        pendingInfo: localView.pendingInfo,
        rejectedEpoch: localView.rejectedEpoch,
    }
}

export class DexieLocalViewStorage extends Dexie {
    localViews!: Dexie.Table<LocalViewDTO>
    epochSecrets!: Dexie.Table<LocalEpochSecretDTO>

    constructor(deviceKey: Uint8Array) {
        const databaseName = `mlsLocalViewStore-${bin_toString(deviceKey)}`
        super(databaseName)
        this.version(1).stores({
            localViews: 'streamId',
            epochSecrets: '[streamId+epoch]',
        })
    }

    public async saveLocalView(streamId: string, view: LocalView): Promise<void> {
        const viewDTO = toLocalViewDTO(streamId, view)
        const epochSecretDTOs = Array.from(view.epochSecrets.values()).map((epochSecret) =>
            toEpochSecretDTO(streamId, epochSecret),
        )

        await this.transaction('rw', this.localViews, this.epochSecrets, async () => {
            await this.localViews.put(viewDTO)
            await this.epochSecrets.bulkPut(epochSecretDTOs)
        })
    }

    public async getLocalView(
        streamId: string,
        processor: MlsProcessor,
    ): Promise<LocalView | undefined> {
        let viewDTO: LocalViewDTO | undefined
        let epochSecretDTOs: LocalEpochSecretDTO[] = []

        await this.transaction('r', this.localViews, this.epochSecrets, async () => {
            viewDTO = await this.localViews.get(streamId)
            epochSecretDTOs = await this.epochSecrets.where('streamId').equals(streamId).toArray()
        })

        if (viewDTO === undefined) {
            return undefined
        }

        const localView = await processor.loadLocalView(viewDTO)

        for (const epochSecretDTO of epochSecretDTOs) {
            const epoch = BigInt(epochSecretDTO.epoch)
            const secret = epochSecretDTO.secret
            const derivedKeys = {
                publicKey: epochSecretDTO.derivedKeys.publicKey,
                secretKey: epochSecretDTO.derivedKeys.secretKey,
            }
            localView.epochSecrets.set(epoch, { epoch, secret, derivedKeys })
        }

        return localView
    }
}
