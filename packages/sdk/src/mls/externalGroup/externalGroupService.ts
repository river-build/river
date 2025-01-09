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

    public handleInitializeGroup(_streamId: string, _message: InitializeGroupMessage) {
        throw new Error('Not implemented')
    }

    public handleExternalJoin(_streamId: string, _message: ExternalJoinMessage) {
        throw new Error('Not implemented')
    }

    // Handle confirmed commit message and write to storage
    private async handleCommit(group: ExternalGroup, commit: Uint8Array) {
        await this.crypto.processCommit(group, commit)
    }
}
