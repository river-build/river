import { bin_fromHexString, bin_fromString, check, dlogger } from '@river-build/dlog'
import { LoadPriority, type Identifiable, type Store } from '../../../../store/store'
import {
    PersistedObservable,
    persistedObservable,
} from '../../../../observable/persistedObservable'
import type { RiverConnection } from '../../../river-connection/riverConnection'
import type { Client } from '../../../../client'
import { isDefined } from '../../../../check'
import type { IStreamStateView } from '../../../../streamStateView'
import { MemberPayload_Nft } from '@river-build/proto'
import { make_MemberPayload_Nft } from '../../../../types'

const logger = dlogger('csb:userSettings')

type NftModel = {
    contractAddress: Uint8Array
    tokenId: Uint8Array
    chainId: number
}

export interface UserMetadata_NftModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    nfts: Map<string, NftModel | undefined>
}

@persistedObservable({ tableName: 'UserMetadata_Nft' })
export class UserMetadata_Nft extends PersistedObservable<UserMetadata_NftModel> {
    constructor(
        userId: string,
        streamId: string,
        store: Store,
        private riverConnection: RiverConnection,
    ) {
        super(
            { id: userId, streamId, initialized: false, nfts: new Map() },
            store,
            LoadPriority.high,
        )
    }
    protected override async onLoaded() {
        this.riverConnection.registerView(this.onClientStarted)
    }

    async setNft(
        streamId: string,
        contractAddress: Uint8Array | string,
        tokenId: Uint8Array | string,
        chainId: number,
    ) {
        const oldState = this.data.nfts.get(streamId)
        const contractAddressBytes =
            typeof contractAddress === 'string'
                ? bin_fromHexString(contractAddress)
                : contractAddress
        const tokenIdBytes = typeof tokenId === 'string' ? bin_fromString(tokenId) : tokenId
        const payload =
            tokenId.length > 0
                ? new MemberPayload_Nft({
                      chainId: chainId,
                      contractAddress: contractAddressBytes,
                      tokenId: tokenIdBytes,
                  })
                : new MemberPayload_Nft()
        this.setData({
            nfts: this.data.nfts.set(streamId, {
                contractAddress: contractAddressBytes,
                tokenId: tokenIdBytes,
                chainId,
            }),
        })
        return this.riverConnection
            .call((client) =>
                client.makeEventAndAddToStream(streamId, make_MemberPayload_Nft(payload), {
                    method: 'nft',
                }),
            )
            .catch((e) => {
                this.setData({ nfts: this.data.nfts.set(streamId, oldState) })
                throw e
            })
    }

    private onClientStarted = (client: Client) => {
        logger.log('onClientStarted')
        const streamView = client.stream(this.data.streamId)?.view
        if (streamView) {
            this.initialize(streamView)
        }
        client.addListener('streamInitialized', this.onStreamInitialized)
        client.addListener('streamNftUpdated', this.onStreamNftUpdated)
        return () => {
            client.removeListener('streamInitialized', this.onStreamInitialized)
        }
    }

    private onStreamInitialized = (streamId: string) => {
        if (streamId === this.data.streamId) {
            const streamView = this.riverConnection.client?.stream(this.data.streamId)?.view
            check(isDefined(streamView), 'streamView is not defined')
            this.initialize(streamView)
        }
    }

    private onStreamNftUpdated = (streamId: string, userId: string) => {
        if (streamId === this.data.streamId && userId === this.data.id) {
            const stream = this.riverConnection.client?.streams.get(streamId)
            const metadata = stream?.view.getUserMetadata()
            if (metadata) {
                const nftPayload = metadata.nfts.confirmedNfts.get(userId)
                const nft = nftPayload
                    ? {
                          contractAddress: nftPayload.contractAddress,
                          tokenId: nftPayload.tokenId,
                          chainId: nftPayload.chainId,
                      }
                    : undefined
                this.setData({ nfts: this.data.nfts.set(streamId, nft) })
            }
        }
    }

    private initialize = (_streamView: IStreamStateView) => {
        this.setData({ initialized: true })
    }
}
