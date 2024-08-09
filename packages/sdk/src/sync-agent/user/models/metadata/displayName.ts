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

type DisplayNameModel = {
    isEncrypted: boolean
    displayName: string
}

export interface UserMetadata_DisplayNameModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    displayNames: Map<string, DisplayNameModel | undefined>
}

// TODO: Discuss (dont commit this, raise in github issue)
// River clients ideally have their own product-specific rules about user information metadata.
// Towns for example only store display names inside space and dm streams, and not in channel streams.
// We need a way to let the client define the rules for the storage of user information metadata.
// For now, let's store it in all streams.
@persistedObservable({ tableName: 'UserMetadata_DisplayName' })
export class UserMetadata_DisplayName extends PersistedObservable<UserMetadata_DisplayNameModel> {
    constructor(
        userId: string,
        streamId: string,
        store: Store,
        private riverConnection: RiverConnection,
    ) {
        super(
            { id: userId, streamId, initialized: false, displayNames: new Map() },
            store,
            LoadPriority.high,
        )
    }

    protected override async onLoaded() {
        this.riverConnection.registerView(this.onClientStarted)
    }

    async setDisplayName(streamId: string, displayName: string) {
        const oldState = this.data.displayNames.get(streamId)
        this.setData({
            displayNames: this.data.displayNames.set(streamId, {
                isEncrypted: false,
                displayName,
            }),
        })
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
                this.setData({ displayNames: this.data.displayNames.set(streamId, oldState) })
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
            if (metadata) {
                this.setData({
                    displayNames: this.data.displayNames.set(
                        streamId,
                        info
                            ? {
                                  isEncrypted: info.displayNameEncrypted,
                                  displayName: info.displayName,
                              }
                            : undefined,
                    ),
                })
            }
        }
    }

    private initialize = (_streamView: IStreamStateView) => {
        this.setData({ initialized: true })
    }
}
