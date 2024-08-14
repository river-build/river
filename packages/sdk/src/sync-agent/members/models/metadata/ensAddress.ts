import { check } from '@river-build/dlog'
import { LoadPriority, type Identifiable, type Store } from '../../../../store/store'
import {
    PersistedObservable,
    persistedObservable,
} from '../../../../observable/persistedObservable'
import type { RiverConnection } from '../../../river-connection/riverConnection'
import type { Client } from '../../../../client'
import { isDefined } from '../../../../check'
import type { Address } from '@river-build/web3'
import { make_MemberPayload_EnsAddress } from '../../../../types'
import { addressFromUserId } from '../../../../id'

export interface MemberEnsAddressModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    ensAddress?: Address
}

@persistedObservable({ tableName: 'member_ensAddress' })
export class MemberEnsAddress extends PersistedObservable<MemberEnsAddressModel> {
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
        this.riverConnection.registerView((client) => {
            if (
                client.streams.has(this.data.id) &&
                client.streams.get(this.data.id)?.view.isInitialized
            ) {
                this.onStreamInitialized(this.data.id)
            }
            client.on('streamInitialized', this.onStreamInitialized)
            client.on('streamEnsAddressUpdated', this.onStreamEnsAddressUpdated)
            return () => {
                client.off('streamInitialized', this.onStreamInitialized)
                client.off('streamEnsAddressUpdated', this.onStreamEnsAddressUpdated)
            }
        })
    }

    async setEnsAddress(ensAddress: Address) {
        const streamId = this.data.streamId
        const oldState = this.data
        this.setData({ ensAddress })
        return this.riverConnection
            .call(async (client) => {
                const bytes = addressFromUserId(ensAddress)
                return client.makeEventAndAddToStream(
                    streamId,
                    make_MemberPayload_EnsAddress(bytes),
                    { method: 'ensAddress' },
                )
            })
            .catch((e) => {
                this.setData(oldState)
                throw e
            })
    }

    private onStreamInitialized = (streamId: string) => {
        if (streamId === this.data.streamId) {
            const streamView = this.riverConnection.client?.stream(this.data.streamId)?.view
            check(isDefined(streamView), 'streamView is not defined')
            const metadata = streamView.getUserMetadata()
            const ensAddress = metadata?.ensAddresses.info(this.data.id) as Address | undefined
            this.setData({ initialized: true, ensAddress })
        }
    }

    private onStreamEnsAddressUpdated = (streamId: string, userId: string) => {
        if (streamId === this.data.streamId && userId === this.data.id) {
            const stream = this.riverConnection.client?.streams.get(streamId)
            const metadata = stream?.view.getUserMetadata()
            const ensAddress = metadata?.ensAddresses.info(userId)
            if (ensAddress) {
                this.setData({ ensAddress: ensAddress as Address })
            }
        }
    }
}
