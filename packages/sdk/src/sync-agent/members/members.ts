import { check } from '@river-build/dlog'
import { isDefined } from '../../check'
import { PersistedObservable, persistedObservable } from '../../observable/persistedObservable'
import type { Store } from '../../store/store'
import type { RiverConnection } from '../river-connection/riverConnection'
import { Member } from './models/member'

type MembersModel = {
    id: string
    userIds: string[]
    initialized: boolean
}

@persistedObservable({ tableName: 'members' })
export class Members extends PersistedObservable<MembersModel> {
    private members: Map<string, Member>
    constructor(streamId: string, private riverConnection: RiverConnection, store: Store) {
        super({ id: streamId, userIds: [], initialized: false }, store)
        this.members = new Map()
    }

    protected override async onLoaded() {
        this.riverConnection.registerView((client) => {
            if (
                client.streams.has(this.data.id) &&
                client.streams.get(this.data.id)?.view.isInitialized
            ) {
                this.onStreamInitialized(this.data.id)
            }
            client.on('streamNewUserJoined', (streamId, userId) =>
                this.onMemberJoin(streamId, userId),
            )
            client.on('streamNewUserInvited', (streamId, userId) =>
                this.onMemberJoin(streamId, userId),
            )
            client.on('streamUserLeft', (streamId, userId) => this.onMemberLeave(streamId, userId))

            return () => {
                client.off('streamNewUserJoined', (streamId, userId) =>
                    this.onMemberJoin(streamId, userId),
                )
                client.off('streamNewUserInvited', (streamId, userId) =>
                    this.onMemberJoin(streamId, userId),
                )
                client.off('streamUserLeft', (streamId, userId) =>
                    this.onMemberLeave(streamId, userId),
                )
            }
        })
    }

    getMember(userId: string) {
        return this.members.get(userId)
    }

    isUsernameAvailable(username: string): boolean {
        const streamId = this.data.id
        const streamView = this.riverConnection.client?.stream(streamId)?.view
        check(isDefined(streamView), 'stream not found')
        return streamView.getUserMetadata().usernames.cleartextUsernameAvailable(username)
    }

    private onStreamInitialized(streamId: string): void {
        if (streamId !== this.data.id) return
        const stream = this.riverConnection.client?.stream(streamId)
        check(isDefined(stream), 'stream is not defined')
        const userIds = Array.from(stream.view.getMembers().joined.values()).map(
            (member) => member.userId,
        )

        for (const userId of userIds) {
            this.members.set(userId, new Member(userId, streamId, this.riverConnection, this.store))
        }
        this.setData({ initialized: true, userIds })
    }

    private onMemberLeave(streamId: string, userId: string): void {
        if (streamId !== this.data.id) return
        this.members.delete(userId)
        this.setData({ userIds: this.data.userIds.filter((id) => id !== userId) })
    }

    private onMemberJoin(streamId: string, userId: string): void {
        if (streamId !== this.data.id) return
        this.members.set(userId, new Member(userId, streamId, this.riverConnection, this.store))
        this.setData({ userIds: [...this.data.userIds, userId] })
    }
}
