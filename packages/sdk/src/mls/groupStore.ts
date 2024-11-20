import { MlsStore } from './mlsStore'
import { DLogger } from '@river-build/dlog'
import { GroupState, Group } from './group'

export class GroupStore {
    private groups: Map<string, GroupState> = new Map()
    mlsStore: MlsStore
    log: DLogger
    constructor(mlsStore: MlsStore, log: DLogger) {
        this.mlsStore = mlsStore
        this.log = log
    }

    public hasGroup(streamId: string): boolean {
        return this.groups.has(streamId)
    }

    public getGroup(streamId: string): Group | undefined {
        const state = this.groups.get(streamId)
        if (!state) {
            return undefined
        }
        return new Group(streamId, state)
    }

    public addGroup(group: Group) {
        if (this.groups.has(group.streamId)) {
            throw new Error(`Group already exists for ${group.streamId}`)
        }
        this.groups.set(group.streamId, group.state)
    }

    public updateGroup(group: Group) {
        if (!this.groups.has(group.streamId)) {
            throw new Error(`Group not found for ${group.streamId}`)
        }
        this.groups.set(group.streamId, group.state)
    }

    public clearGroup(streamId: string): void {
        this.groups.delete(streamId)
    }
}
