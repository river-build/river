import { DLogger } from '@river-build/dlog'
import { Group } from './group'

// Group DTO masks group field
export type GroupDTO = Omit<Group, 'group'>

export interface IGroupStore {
    hasGroup(streamId: string): Promise<boolean>
    getGroup(streamId: string): Promise<GroupDTO | undefined>
    setGroup(dto: GroupDTO): Promise<void>
    clearGroup(streamId: string): Promise<void>
}

export class InMemoryGroupStore implements IGroupStore {
    private groups: Map<string, GroupDTO> = new Map()
    log: DLogger

    constructor(log: DLogger) {
        this.log = log
    }

    public async hasGroup(streamId: string): Promise<boolean> {
        return this.groups.has(streamId)
    }

    public async getGroup(streamId: string): Promise<GroupDTO | undefined> {
        return this.groups.get(streamId)
    }

    public async setGroup(dto: GroupDTO): Promise<void> {
        this.groups.set(dto.streamId, dto)
    }

    public async clearGroup(streamId: string): Promise<void> {
        this.groups.delete(streamId)
    }
}
