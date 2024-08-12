import {
    bin_fromHexString,
    bin_fromString,
    bin_toHexString,
    bin_toString,
    check,
    dlogger,
} from '@river-build/dlog'
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

export type NftModel = {
    contractAddress: string
    tokenId: string
    chainId: number
}

export interface MemberNftModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    nft?: NftModel
}

@persistedObservable({ tableName: 'member_nft' })
export class MemberNft extends PersistedObservable<MemberNftModel> {
    constructor(
        userId: string,
        streamId: string,
        private riverConnection: RiverConnection,
        store: Store,
    ) {
        super(
            { id: `${userId}_${streamId}`, streamId, initialized: false },
            store,
            LoadPriority.high,
        )
    }
    protected override async onLoaded() {
        this.riverConnection.registerView(this.onClientStarted)
    }

    async setNft(nft: NftModel) {
        const streamId = this.data.streamId
        const oldState = this.data
        const { contractAddress, tokenId, chainId } = nft
        const payload =
            tokenId.length > 0
                ? new MemberPayload_Nft({
                      chainId: chainId,
                      contractAddress: bin_fromHexString(contractAddress),
                      tokenId: bin_fromString(tokenId),
                  })
                : new MemberPayload_Nft()
        this.setData({
            nft: {
                contractAddress,
                tokenId,
                chainId,
            },
        })
        return this.riverConnection
            .call((client) =>
                client.makeEventAndAddToStream(streamId, make_MemberPayload_Nft(payload), {
                    method: 'nft',
                }),
            )
            .catch((e) => {
                this.setData(oldState)
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
            const streamView = this.riverConnection.client?.stream(streamId)?.view
            const metadata = streamView?.getUserMetadata()
            if (metadata) {
                const nftPayload = metadata.nfts.confirmedNfts.get(userId)
                const nft = nftPayload
                    ? {
                          contractAddress: bin_toHexString(nftPayload.contractAddress),
                          tokenId: bin_toString(nftPayload.tokenId),
                          chainId: nftPayload.chainId,
                      }
                    : undefined
                this.setData({ nft })
            }
        }
    }

    private initialize = (_streamView: IStreamStateView) => {
        this.setData({ initialized: true })
    }
}
