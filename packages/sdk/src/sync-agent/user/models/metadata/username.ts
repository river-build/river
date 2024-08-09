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
import { make_MemberPayload_Username } from '../../../../types'
import { usernameChecksum } from '../../../../utils'

const logger = dlogger('csb:userSettings')

export interface UserMetadata_UsernameModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    username: string
    isUsernameConfirmed: boolean
    isUsernameEncrypted: boolean
}

@persistedObservable({ tableName: 'UserMetadata_Username' })
export class UserMetadata_Username extends PersistedObservable<UserMetadata_UsernameModel> {
    constructor(
        userId: string,
        streamId: string,
        store: Store,
        private riverConnection: RiverConnection,
    ) {
        super(
            {
                id: userId,
                streamId,
                initialized: false,
                username: '',
                isUsernameConfirmed: false,
                isUsernameEncrypted: false,
            },
            store,
            LoadPriority.high,
        )
    }

    protected override async onLoaded() {
        this.riverConnection.registerView(this.onClientStarted)
    }

    isUsernameAvailable(username: string): boolean {
        const streamId = this.data.streamId
        const streamView = this.riverConnection.client?.stream(streamId)?.view
        check(isDefined(streamView), 'stream not found')
        return streamView.getUserMetadata().usernames.cleartextUsernameAvailable(username)
    }

    async setUsername(username: string) {
        const streamId = this.data.streamId
        const oldState = this.data
        check(isDefined(oldState), 'oldState is not defined')
        const streamView = this.riverConnection.client
            ?.stream(streamId)
            ?.view.getUserMetadata().usernames
        streamView?.setLocalUsername(this.data.id, username)
        this.setData({
            username,
            isUsernameConfirmed: true,
            isUsernameEncrypted: false,
        })
        return this.riverConnection
            .call(async (client) => {
                check(isDefined(client.cryptoBackend), 'cryptoBackend is not defined')
                const encryptedData = await client.cryptoBackend.encryptGroupEvent(
                    streamId,
                    username,
                )
                encryptedData.checksum = usernameChecksum(username, streamId)
                return client.makeEventAndAddToStream(
                    streamId,
                    make_MemberPayload_Username(encryptedData),
                    {
                        method: 'username',
                    },
                )
            })
            .catch((e) => {
                this.setData(oldState)
                streamView?.resetLocalUsername(this.data.id)
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
        client.addListener('streamUsernameUpdated', this.onStreamUsernameUpdated)
        client.addListener('streamPendingUsernameUpdated', this.onStreamUsernameUpdated)
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

    private onStreamUsernameUpdated = (streamId: string, userId: string) => {
        if (streamId === this.data.streamId && userId === this.data.id) {
            const stream = this.riverConnection.client?.streams.get(streamId)
            const metadata = stream?.view.getUserMetadata()
            if (metadata) {
                const { username, usernameConfirmed, usernameEncrypted } =
                    metadata.usernames.info(userId)
                this.setData({
                    username,
                    isUsernameConfirmed: usernameConfirmed,
                    isUsernameEncrypted: usernameEncrypted,
                })
            }
        }
    }

    private initialize = (_streamView: IStreamStateView) => {
        this.setData({ initialized: true })
    }
}
