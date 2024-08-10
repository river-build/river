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
import { make_MemberPayload_DisplayName } from '../../../../types'
const logger = dlogger('csb:userSettings')

export interface MemberDisplayNameModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    displayName?: string
    isEncrypted?: boolean
}

@persistedObservable({ tableName: 'MemberDisplayName' })
export class MemberDisplayName extends PersistedObservable<MemberDisplayNameModel> {
    constructor(
        userId: string,
        streamId: string,
        private riverConnection: RiverConnection,
        store: Store,
    ) {
        super(
            {
                id: `${userId}_${streamId}`,
                streamId,
                initialized: false,
                displayName: '',
                isEncrypted: false,
            },
            store,
            LoadPriority.high,
        )
    }

    protected override async onLoaded() {
        this.riverConnection.registerView(this.onClientStarted)
    }

    async setDisplayName(displayName: string) {
        const streamId = this.data.streamId
        const oldState = this.data
        this.setData({ displayName })
        return this.riverConnection
            .call(async (client) => {
                check(isDefined(client.cryptoBackend), 'cryptoBackend is not defined')
                const encryptedData = await client.cryptoBackend.encryptGroupEvent(
                    streamId,
                    displayName,
                )
                return client.makeEventAndAddToStream(
                    streamId,
                    make_MemberPayload_DisplayName(encryptedData),
                    { method: 'displayName' },
                )
            })
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
        client.addListener('streamDisplayNameUpdated', this.onStreamDisplayNameUpdated)
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

    private onStreamDisplayNameUpdated = (streamId: string, userId: string) => {
        if (streamId === this.data.streamId && userId === this.data.id) {
            const stream = this.riverConnection.client?.streams.get(streamId)
            const metadata = stream?.view.getUserMetadata()
            const info = metadata?.displayNames.info(userId)
            if (info) {
                this.setData({
                    displayName: info.displayName,
                    isEncrypted: info.displayNameEncrypted,
                })
            }
        }
    }

    private initialize = (_streamView: IStreamStateView) => {
        this.setData({ initialized: true })
    }
}
