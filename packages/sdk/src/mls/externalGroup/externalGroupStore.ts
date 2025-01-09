import { ExternalGroup } from './externalGroup'

export type ExternalGroupDTO = Omit<ExternalGroup, 'externalGroup'> & { snapshot: Uint8Array }

export interface IExternalGroupStore {
    getExternalGroup(streamId: string): Promise<ExternalGroupDTO | undefined>
    setExternalGroup(dto: ExternalGroupDTO): Promise<void>
    clearExternalGroup(streamId: string): Promise<void>
}

export class InMemoryExternalGroupStore implements IExternalGroupStore {
    private externalGroups: Map<string, ExternalGroupDTO> = new Map()

    async getExternalGroup(streamId: string): Promise<ExternalGroupDTO | undefined> {
        return this.externalGroups.get(streamId)
    }
    async setExternalGroup(dto: ExternalGroupDTO): Promise<void> {
        this.externalGroups.set(dto.streamId, dto)
    }

    async clearExternalGroup(streamId: string): Promise<void> {
        this.externalGroups.delete(streamId)
    }
}
