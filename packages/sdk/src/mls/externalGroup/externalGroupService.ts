import { IExternalGroupStore } from './externalGroupStore'
import { ExternalGroup } from './externalGroup'
import { MlsCrypto } from '../mlsCrypto'
import { PlainMessage } from '@bufbuild/protobuf'
import {
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'

type InitializeGroupMessage = PlainMessage<MemberPayload_Mls_InitializeGroup>
type ExternalJoinMessage = PlainMessage<MemberPayload_Mls_ExternalJoin>

export class ExternalGroupService {
    private externalGroupStore: IExternalGroupStore
    private externalGroupCache: Map<string, ExternalGroup> = new Map()

    private mlsCrypto: MlsCrypto

    constructor(externalGroupStore: IExternalGroupStore, mlsCrypto: MlsCrypto) {
        this.externalGroupStore = externalGroupStore
        this.mlsCrypto = mlsCrypto
    }

    public getExternalGroup(streamId: string): ExternalGroup | undefined {
        return this.externalGroupCache.get(streamId)
    }

    public async loadExternalGroup(streamId: string): Promise<void> {
        const dto = await this.externalGroupStore.getExternalGroup(streamId)

        if (dto === undefined) {
            throw new Error(`External group not found for ${streamId}`)
        }

        const { snapshot, ...fields } = dto

        const mlsExternalGroup = await this.mlsCrypto.loadExternalGroupFromSnapshot(snapshot)
        const externalGroup = {
            ...fields,
            externalGroup: mlsExternalGroup,
        }

        this.externalGroupCache.set(streamId, externalGroup)
    }

    public async saveExternalGroup(externalGroup: ExternalGroup): Promise<void> {
        this.externalGroupCache.set(externalGroup.streamId, externalGroup)

        const { externalGroup: mlsExternalGroup, ...fields } = externalGroup
        const snapshot = mlsExternalGroup.snapshot().toBytes()
        const dto = { ...fields, snapshot }

        await this.externalGroupStore.setExternalGroup(dto)
    }

    public handleInitializeGroup(_streamId: string, _message: InitializeGroupMessage) {
        throw new Error('Not implemented')
    }

    public handleExternalJoin(_streamId: string, _message: ExternalJoinMessage) {
        throw new Error('Not implemented')
    }

    // Handle confirmed commit message and write to storage
    private async handleCommit(group: ExternalGroup, commit: Uint8Array) {
        await this.mlsCrypto.externalGroupProcessCommit(group.externalGroup, commit)
        await this.saveExternalGroup(group)
    }
}
