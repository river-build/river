import { check, dlogger } from '@river-build/dlog'
import { isDefined } from '../../../check'
import { makeDefaultChannelStreamId, makeUniqueChannelStreamId } from '../../../id'
import { PersistedObservable, persistedObservable } from '../../../observable/persistedObservable'
import { Identifiable, Store } from '../../../store/store'
import { RiverConnection } from '../../river-connection/riverConnection'
import { Channel } from './channel'
import { ethers } from 'ethers'
import { SpaceDapp, SpaceInfo } from '@river-build/web3'
import { Members } from '../../members/members'

const logger = dlogger('csb:space')

export interface SpaceModel extends Identifiable {
    id: string
    initialized: boolean
    channelIds: string[]
    metadata?: SpaceInfo
}

@persistedObservable({ tableName: 'space' })
export class Space extends PersistedObservable<SpaceModel> {
    private channels: Record<string, Channel>
    members: Members
    constructor(
        id: string,
        private riverConnection: RiverConnection,
        store: Store,
        private spaceDapp: SpaceDapp,
    ) {
        super({ id, channelIds: [], initialized: false }, store)
        this.channels = {
            [makeDefaultChannelStreamId(id)]: new Channel(
                makeDefaultChannelStreamId(id),
                id,
                riverConnection,
                spaceDapp,
                store,
            ),
        }
        this.members = new Members(id, riverConnection, store)
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
            client.on('spaceChannelCreated', this.onSpaceChannelCreated)
            client.on('spaceChannelDeleted', this.onSpaceChannelDeleted)
            client.on('spaceChannelUpdated', this.onSpaceChannelUpdated)
            return () => {
                client.off('streamInitialized', this.onStreamInitialized)
                client.off('spaceChannelCreated', this.onSpaceChannelCreated)
                client.off('spaceChannelDeleted', this.onSpaceChannelDeleted)
                client.off('spaceChannelUpdated', this.onSpaceChannelUpdated)
            }
        })
        if (!this.data.metadata) {
            // todo aellis this needs retries and batching
            this.spaceDapp
                .getSpaceInfo(this.data.id)
                .then((spaceInfo) => {
                    this.setData({ metadata: spaceInfo })
                })
                .catch((error) => {
                    logger.error('getSpaceInfo error', error)
                })
        }
    }

    async join(signer: ethers.Signer, opts?: { skipMintMembership?: boolean }) {
        const spaceId = this.data.id
        if (opts?.skipMintMembership !== true) {
            const { issued } = await this.spaceDapp.joinSpace(
                spaceId,
                this.riverConnection.userId,
                signer,
            )
            logger.log('joinSpace transaction', issued)
        }
        await this.riverConnection.login({ spaceId })
        await this.riverConnection.call(async (client) => {
            await client.joinStream(spaceId)
            await client.joinStream(makeDefaultChannelStreamId(spaceId))
        })
    }

    async createChannel(channelName: string, signer: ethers.Signer) {
        const spaceId = this.data.id
        const channelId = makeUniqueChannelStreamId(spaceId)
        const roles = await this.spaceDapp.getRoles(spaceId)
        const tx = await this.spaceDapp.createChannel(
            spaceId,
            channelName,
            '',
            channelId,
            roles.filter((role) => role.name !== 'Owner').map((role) => role.roleId),
            signer,
        )
        const receipt = await tx.wait()
        logger.log('createChannel receipt', receipt)
        await this.riverConnection.call((client) =>
            client.createChannel(spaceId, channelName, '', channelId),
        )
        return channelId
    }

    getChannel(channelId: string): Channel {
        if (!this.data.channelIds.includes(channelId)) {
            throw new Error(`channel ${channelId} not found in space ${this.data.id}`)
        }
        if (!this.channels[channelId]) {
            this.channels[channelId] = new Channel(
                channelId,
                this.data.id,
                this.riverConnection,
                this.spaceDapp,
                this.store,
            )
        }
        return this.channels[channelId]
    }

    getDefaultChannel(): Channel {
        return this.channels[makeDefaultChannelStreamId(this.data.id)]
    }

    private onStreamInitialized = (streamId: string) => {
        if (this.data.id === streamId) {
            const stream = this.riverConnection.client?.stream(streamId)
            check(isDefined(stream), 'stream is not defined')
            const channelIds = [...stream.view.spaceContent.spaceChannelsMetadata.keys()]
            for (const channelId of channelIds) {
                if (!this.channels[channelId]) {
                    this.channels[channelId] = new Channel(
                        channelId,
                        this.data.id,
                        this.riverConnection,
                        this.spaceDapp,
                        this.store,
                    )
                }
            }
            this.setData({ initialized: true, channelIds: channelIds })
        }
    }

    private onSpaceChannelCreated = (streamId: string, channelId: string) => {
        if (streamId === this.data.id) {
            if (!this.channels[channelId]) {
                this.channels[channelId] = new Channel(
                    channelId,
                    this.data.id,
                    this.riverConnection,
                    this.spaceDapp,
                    this.store,
                )
            }
            if (!this.data.channelIds.includes(channelId)) {
                this.setData({ channelIds: [...this.data.channelIds, channelId] })
            }
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
