import { check } from '@river-build/dlog'
import { isDefined } from '../../../check'
import { Client } from '../../../client'
import { makeDefaultChannelStreamId } from '../../../id'
import { PersistedObservable, persistedObservable } from '../../../observable/persistedObservable'
import { Identifiable, Store } from '../../../store/store'
import { RiverConnection } from '../../river-connection/riverConnection'
import { Channel } from './channel'

export interface SpaceMetadata {
    name: string
}

export interface SpaceModel extends Identifiable {
    id: string
    initialized: boolean
    channelIds: string[]
    metadata?: SpaceMetadata
}

@persistedObservable({ tableName: 'space' })
export class Space extends PersistedObservable<SpaceModel> {
    private channels: Record<string, Channel>
    constructor(id: string, private riverConnection: RiverConnection, store: Store) {
        super({ id, channelIds: [], initialized: false }, store)
        this.channels = {
            [makeDefaultChannelStreamId(id)]: new Channel(
                makeDefaultChannelStreamId(id),
                id,
                riverConnection,
                store,
            ),
        }
    }

    protected override async onLoaded() {
        this.riverConnection.registerView(this.onClientStarted)
    }

    private onClientStarted = (client: Client) => {
        client.on('streamInitialized', this.onStreamInitialized)
        client.on('spaceChannelCreated', this.onSpaceChannelCreated)
        client.on('spaceChannelDeleted', this.onSpaceChannelDeleted)
        client.on('spaceChannelUpdated', this.onSpaceChannelUpdated)
        return () => {
            client.off('spaceChannelCreated', this.onSpaceChannelCreated)
            client.off('spaceChannelDeleted', this.onSpaceChannelDeleted)
            client.off('spaceChannelUpdated', this.onSpaceChannelUpdated)
            client.off('streamInitialized', this.onStreamInitialized)
        }
    }

    getChannel(channelId: string): Channel | undefined {
        return this.channels[channelId]
    }

    getDefaultChannel(): Channel {
        return this.channels[makeDefaultChannelStreamId(this.data.id)]
    }

    private onStreamInitialized = (streamId: string) => {
        if (this.data.id === streamId) {
            const stream = this.riverConnection.client?.stream(streamId)
            check(isDefined(stream), 'stream is not defined')
            this.store.withTransaction('space::onStreamInitialized', () => {
                const channelIds = stream.view.spaceContent.spaceChannelsMetadata.keys()
                for (const channelId of channelIds) {
                    if (!this.channels[channelId]) {
                        this.channels[channelId] = new Channel(
                            channelId,
                            this.data.id,
                            this.riverConnection,
                            this.store,
                        )
                    }
                }
                this.setData({ initialized: true })
            })
        }
    }

    private onSpaceChannelCreated = (streamId: string, channelId: string) => {
        if (streamId === this.data.id) {
            this.store.withTransaction('space::onSpaceChannelCreated', () => {
                if (!this.channels[channelId]) {
                    this.channels[channelId] = new Channel(
                        channelId,
                        this.data.id,
                        this.riverConnection,
                        this.store,
                    )
                }
                this.setData({ channelIds: [...this.data.channelIds, channelId] })
            })
        }
    }

    private onSpaceChannelDeleted = (streamId: string, channelId: string) => {
        if (streamId === this.data.id) {
            delete this.channels[channelId]
            this.setData({ channelIds: this.data.channelIds.filter((id) => id !== channelId) })
        }
    }

    private onSpaceChannelUpdated = (
        streamId: string,
        _channelId: string,
        _updatedAtEventNum: bigint,
    ) => {
        if (streamId === this.data.id) {
            // refetch the channel data from on chain
        }
    }
}
