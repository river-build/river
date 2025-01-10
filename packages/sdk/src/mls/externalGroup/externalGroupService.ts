import { ExternalGroup } from './externalGroup'
import { PlainMessage } from '@bufbuild/protobuf'
import {
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'
import { ExternalCrypto } from './externalCrypto'
import { dlog, DLogger } from '@river-build/dlog'

type InitializeGroupMessage = PlainMessage<MemberPayload_Mls_InitializeGroup>
type ExternalJoinMessage = PlainMessage<MemberPayload_Mls_ExternalJoin>

const defaultLogger = dlog('csb:mls:externalGroupService')

export class ExternalGroupService {
    private externalGroupCache: Map<string, ExternalGroup> = new Map()
    private log: {
        debug: DLogger
        error: DLogger
    }

    private crypto: ExternalCrypto

    constructor(crypto: ExternalCrypto, opts?: { log: DLogger }) {
        this.crypto = crypto
        const logger = opts?.log ?? defaultLogger
        this.log = {
            debug: logger.extend('debug'),
            error: logger.extend('error'),
        }
    }

    public getExternalGroup(streamId: string): ExternalGroup | undefined {
        this.log.debug('getExternalGroup', { streamId })

        return this.externalGroupCache.get(streamId)
    }

    public deleteExternalGroup(streamId: string) {
        this.log.debug('deleteExternalGroup', { streamId })

        this.externalGroupCache.delete(streamId)
    }

    // change it so it accepts maybe undefined exernal group
    public async handleInitializeGroup(streamId: string, message: InitializeGroupMessage) {
        this.log.debug('handleInitializeGroup', { streamId })

        if (this.externalGroupCache.has(streamId)) {
            const message = `group already present: ${streamId}`
            this.log.error(`handleInitializeGroup: ${message}`)
            throw new Error(message)
        }

        const group = await this.crypto.loadExternalGroupFromSnapshot(
            streamId,
            message.externalGroupSnapshot,
        )

        this.externalGroupCache.set(streamId, group)
    }

    // TODO: change it so it accepts maybe undefined external group
    public async handleExternalJoin(streamId: string, message: ExternalJoinMessage) {
        this.log.debug('handleExternalJoin', { streamId })

        const group = this.externalGroupCache.get(streamId)
        if (!group) {
            const message = `group not found: ${streamId}`
            this.log.error(`handleExternalJoin: ${message}`)
            throw new Error(message)
        }

        await this.crypto.processCommit(group, message.commit)
    }

    public exportTree(group: ExternalGroup): Uint8Array {
        this.log.debug('exportTree', { streamId: group.streamId })

        return this.crypto.exportTree(group)
    }

    public externalGroupSnapshot(
        streamId: string,
        groupInfoMessage: Uint8Array,
        exportedTree: Uint8Array,
    ): Promise<Uint8Array> {
        this.log.debug('externalGroupSnapshot', { streamId })

        return this.crypto.externalGroupSnapshot(groupInfoMessage, exportedTree)
    }

    public latestGroupInfo(externalGroup: ExternalGroup): Uint8Array {
        throw new Error('Not implemented')
    }
}
