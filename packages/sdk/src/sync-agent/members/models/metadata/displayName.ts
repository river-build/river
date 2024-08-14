import { check } from '@river-build/dlog'
import { LoadPriority, type Identifiable, type Store } from '../../../../store/store'
import {
    PersistedObservable,
    persistedObservable,
} from '../../../../observable/persistedObservable'
import type { RiverConnection } from '../../../river-connection/riverConnection'
import { isDefined } from '../../../../check'
import { make_MemberPayload_DisplayName } from '../../../../types'

export interface MemberDisplayNameModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    displayName?: string
    isEncrypted?: boolean
}

@persistedObservable({ tableName: 'member_displayName' })
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
                displayName: undefined,
                isEncrypted: false,
            },
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
            client.on('streamDisplayNameUpdated', this.onStreamDisplayNameUpdated)
            return () => {
                client.off('streamInitialized', this.onStreamInitialized)
                client.off('streamDisplayNameUpdated', this.onStreamDisplayNameUpdated)
            }
        })
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

    private onStreamInitialized = (streamId: string) => {
        if (streamId === this.data.streamId) {
            const streamView = this.riverConnection.client?.stream(this.data.streamId)?.view
            check(isDefined(streamView), 'streamView is not defined')
            const metadata = streamView.getUserMetadata()
            const info = metadata?.displayNames.info(this.data.id)
            this.setData({
                initialized: true,
                displayName: info?.displayName,
                isEncrypted: info?.displayNameEncrypted,
            })
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
}
