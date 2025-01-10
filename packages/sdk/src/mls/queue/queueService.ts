import { PlainMessage, Message } from '@bufbuild/protobuf'
import {
    EncryptedData,
    MemberPayload_Mls_EpochSecrets,
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'
import { GroupService, IGroupServiceCoordinator } from '../group'
import { EpochSecretService } from '../epoch'
import { ExternalGroupService } from '../externalGroup'

type InitializeGroupMessage = PlainMessage<MemberPayload_Mls_InitializeGroup>
type ExternalJoinMessage = PlainMessage<MemberPayload_Mls_ExternalJoin>
type EpochSecretsMessage = PlainMessage<MemberPayload_Mls_EpochSecrets>

// This feels more like a coordinator
export class QueueService implements IGroupServiceCoordinator {
    private epochSecretService!: EpochSecretService
    private groupService!: GroupService
    private externalGroupService!: ExternalGroupService

    constructor() {
        // nop
    }

    // IGroupServiceCoordinator
    public joinOrCreateGroup(_streamId: string): void {
        throw new Error('Method not implemented.')
    }

    // IGroupServiceCoordinator
    public groupActive(_streamId: string): void {
        throw new Error('Method not implemented.')
    }

    // IGroupServiceCoordinator
    public newEpochSecret(_streamId: string, _epoch: bigint): void {
        throw new Error('Method not implemented.')
    }

    // API needed by the client
    public encryptGroupEventEpochSecret(
        _streamId: string,
        _event: Message,
    ): Promise<EncryptedData> {
        throw new Error('Not implemented')
    }

    public async handleInitializeGroup(_streamId: string, _message: InitializeGroupMessage) {
        const group = this.groupService.getGroup(_streamId)
        if (group) {
            await this.groupService.handleInitializeGroup(group, _message)
        }

        const groupServiceHasGroup = this.groupService.getGroup(_streamId) !== undefined
        if (!groupServiceHasGroup) {
            const externalGroup = this.externalGroupService.getExternalGroup(_streamId)
            // TODO: change first arg to externalGroup
            await this.externalGroupService.handleInitializeGroup(externalGroup!.streamId, _message)
        }
    }

    public async handleExternalJoin(_streamId: string, _message: ExternalJoinMessage) {
        const group = this.groupService.getGroup(_streamId)
        if (group) {
            await this.groupService.handleExternalJoin(group, _message)
        }

        const groupServiceHasGroup = this.groupService.getGroup(_streamId) !== undefined
        if (!groupServiceHasGroup) {
            const externalGroup = this.externalGroupService.getExternalGroup(_streamId)
            // TODO: change first arg to externalGroup
            await this.externalGroupService.handleExternalJoin(externalGroup!.streamId, _message)
        }
    }

    public async handleEpochSecrets(_streamId: string, _message: EpochSecretsMessage) {
        return this.epochSecretService.handleEpochSecrets(_streamId, _message)
    }

    public async initializeGroupMessage(streamId: string): Promise<InitializeGroupMessage> {
        // TODO: Check preconditions
        // TODO: Change this API to return group as well
        const message = await this.groupService.initializeGroupMessage(streamId)
        const group = this.groupService.getGroup(streamId)!
        const exportedTree = this.groupService.exportTree(group)
        const externalGroupSnapshot = await this.externalGroupService.externalGroupSnapshot(
            streamId,
            message.groupInfoMessage,
            exportedTree,
        )

        return { ...message, externalGroupSnapshot }
    }

    public async externalJoinMessage(streamId: string): Promise<ExternalJoinMessage> {
        // TODO: Check preconditions
        const externalGroup = this.externalGroupService.getExternalGroup('streamId')!
        const exportedTree = this.externalGroupService.exportTree(externalGroup)
        const latestGroupInfo = this.externalGroupService.latestGroupInfo(externalGroup)

        return this.groupService.externalJoinMessage(streamId, latestGroupInfo, exportedTree)
    }

    public epochSecretsMessage(streamId: string): EpochSecretsMessage {
        // TODO: Check preconditions
        return this.epochSecretService.epochSecretMessage(streamId)
    }
}
