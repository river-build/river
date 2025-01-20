import { Message, PlainMessage } from '@bufbuild/protobuf'
import { EncryptedData, MemberPayload_Mls } from '@river-build/proto'
import { Client } from '../../client'
import {
    Client as MlsClient,
    ExportedTree,
    MlsMessage,
    Group as MlsGroup,
} from '@river-build/mls-rs-wasm'
import { ExternalInfo, OnChainView } from './onChainView'
import { LocalView } from './localView'
import { EpochEncryption } from './epochEncryption'
import { dlog, DLogger } from '@river-build/dlog'
import {
    createGroupInfoAndExternalSnapshot,
    makeExternalJoin,
    makeInitializeGroup,
} from '../../tests/multi_ne/mls/utils'
import { make_MemberPayload_Mls } from '../../types'

const defaultLogger = dlog('csb:mls:processor')

export interface CoordinatorDelegate {
    scheduleJoinOrCreateGroup(streamId: string): void
    scheduleAnnounceEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecret: Uint8Array,
    ): void
}

export type MlsExtensionsOpts = {
    log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }
}

const defaultMlsExtensionsOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
}

type JoinOrCreateMessage = PlainMessage<MemberPayload_Mls>

export class MlsExtensions {
    private client: Client
    private mlsClient: MlsClient
    private crypto: EpochEncryption = new EpochEncryption()

    private onChainViews: Map<string, OnChainView> = new Map()
    private localViews: Map<string, LocalView> = new Map()

    private log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }

    constructor(
        client: Client,
        mlsClient: MlsClient,
        opts: MlsExtensionsOpts = defaultMlsExtensionsOpts,
    ) {
        this.client = client
        this.mlsClient = mlsClient
        this.log = opts.log
    }

    public async initialize(): Promise<void> {
        // nop
    }

    // API needed by the client
    // TODO: How long will be the timeout here?
    public async encryptGroupEventEpochSecret(
        streamId: string,
        event: Message,
    ): Promise<EncryptedData> {
        throw new Error('Not implemented')
    }

    public async initializeOrJoinGroup(streamId: string): Promise<void> {
        if (!this.onChainViews.has(streamId)) {
            // TODO: Initialize the onChainView
        }

        // TODO: createPendingLocalView
        // TODO: store it in localViews
    }

    // TODO: Not sure what to do with exception
    public async createPendingLocalView(
        streamId: string,
        onChainView: OnChainView,
    ): Promise<LocalView> {
        let prepared: { group: MlsGroup; message: JoinOrCreateMessage }

        if (onChainView.externalInfo !== undefined) {
            prepared = await this.prepareExternalJoin(onChainView.externalInfo)
        } else {
            prepared = await this.prepareInitializeGroup()
        }

        const { eventId } = await this.client.makeEventAndAddToStream(
            streamId,
            make_MemberPayload_Mls(prepared.message),
        )

        // TODO: Figure how to get miniblockBefore
        return new LocalView(prepared.group, { eventId, miniblockBefore: 0n })
    }

    public async prepareExternalJoin(externalInfo: ExternalInfo) {
        const groupInfoMessage = MlsMessage.fromBytes(externalInfo.latestGroupInfo)
        const exportedTree = ExportedTree.fromBytes(externalInfo.exportedTree)
        const { group, commit } = await this.mlsClient.commitExternal(
            groupInfoMessage,
            exportedTree,
        )
        const updatedGroupInfoMessage = await group.groupInfoMessageAllowingExtCommit(false)
        const updatedGroupInfoMessageBytes = updatedGroupInfoMessage.toBytes()
        const commitBytes = commit.toBytes()
        const event = makeExternalJoin(
            this.mlsClient.signaturePublicKey(),
            commitBytes,
            updatedGroupInfoMessageBytes,
        )
        const message = { content: event }
        return {
            group,
            message,
        }
    }

    public async prepareInitializeGroup() {
        const group = await this.mlsClient.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)
        const event = makeInitializeGroup(
            this.mlsClient.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        const message = { content: event }
        return {
            group,
            message,
        }
    }


    public async prepareAnnounceKeys(localView: LocalView, onChainView: OnChainView) {
        // TODO:
    }

    public async prepareWelcome(localView: LocalView, onChainView: OnChainView) {
        // nop
    }
}
