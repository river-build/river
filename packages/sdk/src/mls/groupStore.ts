import { MlsStore } from './mlsStore'
import { DLogger } from '@river-build/dlog'
import { GroupState, Group } from './group'

export interface IGroupStore {
    hasGroup(streamId: string): Promise<boolean>
    getGroup(streamId: string): Promise<Group | undefined>
    addGroup(group: Group): Promise<void>
    updateGroup(group: Group): Promise<void>
    clearGroup(streamId: string): Promise<void>
}

export class GroupStore implements IGroupStore {
    private groups: Map<string, GroupState> = new Map()
    mlsStore: MlsStore
    log: DLogger
    constructor(mlsStore: MlsStore, log: DLogger) {
        this.mlsStore = mlsStore
        this.log = log
    }

    public async hasGroup(streamId: string): Promise<boolean> {
        return this.groups.has(streamId)
    }

    public async getGroup(streamId: string): Promise<Group | undefined> {
        const state = this.groups.get(streamId)
        if (!state) {
            return undefined
        }
        return new Group(streamId, state)
    }

    public async addGroup(group: Group): Promise<void> {
        if (this.groups.has(group.streamId)) {
            throw new Error(`Group already exists for ${group.streamId}`)
        }
        this.groups.set(group.streamId, group.state)
    }

    public async updateGroup(group: Group): Promise<void> {
        if (!this.groups.has(group.streamId)) {
            throw new Error(`Group not found for ${group.streamId}`)
        }
        this.groups.set(group.streamId, group.state)
    }

    public async clearGroup(streamId: string): Promise<void> {
        this.groups.delete(streamId)
    }
}
