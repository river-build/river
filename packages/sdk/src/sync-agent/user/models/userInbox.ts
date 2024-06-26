import { check, dlogger } from '@river-build/dlog'
import { Identifiable, LoadPriority, Store } from '../../../store/store'
import { UserInboxPayload_Snapshot_DeviceSummary } from '@river-build/proto'
import { PersistedObservable } from '../../../observable/persistedObservable'
import { makeUserInboxStreamId } from '../../../id'
import { RiverConnection } from '../../river-connection/riverConnection'
import { Client } from '../../../client'
import { StreamStateView } from '../../../streamStateView'
import { isDefined } from '../../../check'

const logger = dlogger('csb:userInbox')

export interface UserInboxModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    deviceId?: string
    deviceSummary?: UserInboxPayload_Snapshot_DeviceSummary
}

export class UserInbox extends PersistedObservable<UserInboxModel> {
    constructor(id: string, store: Store, private riverConnection: RiverConnection) {
        super(
            { id, streamId: makeUserInboxStreamId(id), initialized: false },
            store,
            LoadPriority.high,
        )
    }

    protected override async onLoaded() {
        this.riverConnection.registerView(this.onClientStarted)
    }

    private onClientStarted = (client: Client) => {
        logger.log('onClientStarted')
        const streamView = this.riverConnection.client.value?.stream(this.data.streamId)?.view
        if (streamView) {
            this.initialize(streamView)
        }
        client.addListener('userInboxDeviceSummaryUpdated', this.onUserInboxDeviceSummaryUpdated)
        client.addListener('streamInitialized', this.onStreamInitialized)
        return () => {
            client.removeListener(
                'userInboxDeviceSummaryUpdated',
                this.onUserInboxDeviceSummaryUpdated,
            )
            client.removeListener('streamInitialized', this.onStreamInitialized)
        }
    }

    private onStreamInitialized = (streamId: string) => {
        if (streamId === this.data.streamId) {
            const streamView = this.riverConnection.client.value?.stream(this.data.streamId)?.view
            check(isDefined(streamView), 'streamView is not defined')
            this.initialize(streamView)
        }
    }

    private onUserInboxDeviceSummaryUpdated = (
        deviceId: string,
        deviceSummary: UserInboxPayload_Snapshot_DeviceSummary,
    ) => {
        logger.log('onUserInboxDeviceSummaryUpdated', deviceId, deviceSummary)
        //this.data.deviceId = deviceId
        //this.data.deviceSummary = deviceSummary
    }

    private initialize(_streamView: StreamStateView) {
        // this.data.initialized = true
        // this.data.deviceId = streamView.deviceId
        // this.data.deviceSummary = streamView.deviceSummary
    }
}
