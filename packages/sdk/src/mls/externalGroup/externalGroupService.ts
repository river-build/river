import { ExternalGroup } from './externalGroup'
import { PlainMessage } from '@bufbuild/protobuf'
import {
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'
import { ExternalCrypto } from './externalCrypto'

type InitializeGroupMessage = PlainMessage<MemberPayload_Mls_InitializeGroup>
type ExternalJoinMessage = PlainMessage<MemberPayload_Mls_ExternalJoin>

export class ExternalGroupService {
    private externalGroupCache: Map<string, ExternalGroup> = new Map()

    private crypto: ExternalCrypto

    constructor(crypto: ExternalCrypto) {
        this.crypto = crypto
    }

    public getExternalGroup(streamId: string): ExternalGroup | undefined {
        return this.externalGroupCache.get(streamId)
    }

    public async handleInitializeGroup(streamId: string, message: InitializeGroupMessage) {
        if (this.externalGroupCache.has(streamId)) {
            const message = `group already present: ${streamId}`
            throw new Error(message)
        }

        const group = await this.crypto.loadExternalGroupFromSnapshot(
            streamId,
            message.externalGroupSnapshot,
        )

        this.externalGroupCache.set(streamId, group)
    }

    public async handleExternalJoin(streamId: string, message: ExternalJoinMessage) {
        const group = this.externalGroupCache.get(streamId)
        if (!group) {
            const message = `group not found: ${streamId}`
            throw new Error(message)
        }

        await this.crypto.processCommit(group, message.commit)
    }

    // Handle confirmed commit message and write to storage
    private async handleCommit(group: ExternalGroup, commit: Uint8Array) {
        await this.crypto.processCommit(group, commit)
    }
}
