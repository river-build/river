import { check, dlogger } from '@river-build/dlog'
import { LoadPriority, type Identifiable, type Store } from '../../../../store/store'
import {
    PersistedObservable,
    persistedObservable,
} from '../../../../observable/persistedObservable'
import type { RiverConnection } from '../../../river-connection/riverConnection'
import type { Client } from '../../../../client'
import { isDefined } from '../../../../check'
import type { IStreamStateView } from '../../../../streamStateView'
import type { Address } from '@river-build/web3'
import { make_MemberPayload_EnsAddress } from '../../../../types'
import { addressFromUserId } from '../../../../id'
const logger = dlogger('csb:userSettings')

export interface UserMetadata_EnsAddressModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    ensAddresses: Map<string, Address | undefined>
}

@persistedObservable({ tableName: 'UserMetadata_EnsAddress' })
export class UserMetadata_EnsAddress extends PersistedObservable<UserMetadata_EnsAddressModel> {
    constructor(
        userId: string,
        streamId: string,
        store: Store,
        private riverConnection: RiverConnection,
    ) {
        super(
            { id: userId, streamId, initialized: false, ensAddresses: new Map() },
            store,
            LoadPriority.high,
        )
    }

    protected override async onLoaded() {
        this.riverConnection.registerView(this.onClientStarted)
    }

    async setEnsAddress(streamId: string, ensAddress: Address) {
        const oldState = this.data.ensAddresses.get(streamId)
        this.setData({
            ensAddresses: this.data.ensAddresses.set(streamId, ensAddress),
        })
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
                this.setData({ ensAddresses: this.data.ensAddresses.set(streamId, oldState) })
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
        client.addListener('streamEnsAddressUpdated', this.onStreamEnsAddressUpdated)
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

    private onStreamEnsAddressUpdated = (streamId: string, userId: string) => {
        if (streamId === this.data.streamId && userId === this.data.id) {
            const stream = this.riverConnection.client?.streams.get(streamId)
            const metadata = stream?.view.getUserMetadata()
            const ensAddress = metadata?.ensAddresses.info(userId)
            if (metadata) {
                this.setData({
                    ensAddresses: this.data.ensAddresses.set(
                        streamId,
                        ensAddress as Address | undefined,
                    ),
                })
            }
        }
    }

    private initialize = (_streamView: IStreamStateView) => {
        this.setData({ initialized: true })
    }
}
