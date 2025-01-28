import { Message, PlainMessage } from '@bufbuild/protobuf'
import { EncryptedData, MemberPayload_Mls } from '@river-build/proto'
import { Client } from '../client'
import { Client as MlsClient, Group as MlsGroup } from '@river-build/mls-rs-wasm'
import { RemoteView } from './view/remote'
import { LocalView } from './view/local'
import { elogger, ELogger } from '@river-build/dlog'
import { make_MemberPayload_Mls } from '../types'
import * as MlsMessages from './messages'
import { MlsStream } from './mlsStream'
import { MlsEncryptedContentItem } from './types'
import { LocalViewDTO } from './mlsCryptoStore'

const defaultLogger = elogger('csb:mls:processor')

export type MlsProcessorOpts = {
    log?: ELogger
    sendingOptions?: {
        method?: 'mls'
    }
}

const defaultMlsProcessorOpts = {
    log: defaultLogger,
    sendingOptions: {},
}

type JoinOrCreateMessage = PlainMessage<MemberPayload_Mls>

// TODO: Update so that MlsProceessor only depends on viewAdapter
export class MlsProcessor {
    private client: Client
    private mlsClient: MlsClient
    public decryptionFailures: MlsEncryptedContentItem[] = []
    private sendingOptions: MlsProcessorOpts['sendingOptions']

    private log: ELogger

    constructor(
        client: Client,
        mlsClient: MlsClient,
        opts: MlsProcessorOpts = defaultMlsProcessorOpts,
    ) {
        this.client = client
        this.mlsClient = mlsClient
        const mlsProcessorOpts = {
            ...defaultMlsProcessorOpts,
            ...opts,
        }

        this.log = mlsProcessorOpts.log
        this.sendingOptions = mlsProcessorOpts.sendingOptions
    }

    // API needed by the client
    // TODO: How long will be the timeout here?
    public async encryptMessage(mlsStream: MlsStream, event: Message): Promise<EncryptedData> {
        const localView = await mlsStream.awaitActiveLocalView()

        const lastEpochSecret = localView.latestEpochSecret()
        if (lastEpochSecret === undefined) {
            throw new Error('no epoch secret found')
        }

        return MlsMessages.encryptEpochSecretMessage(lastEpochSecret, event)
    }

    public async initializeOrJoinGroup(mlsStream: MlsStream): Promise<void> {
        switch (mlsStream.localView?.status) {
            case 'corrupted':
                this.log.log('corrupted mls stream', { streamId: mlsStream.streamId })
                throw new Error('corrupted mls stream')
                return
            case 'active':
                return
            case 'pending':
                return
            case 'rejected':
                this.log.log('rejected local view', { streamId: mlsStream.streamId })
                mlsStream.clearLocalView()
                break
            default:
        }
        try {
            const localView = await this.createPendingLocalView(
                mlsStream.streamId,
                mlsStream.onChainView,
            )
            mlsStream.trackLocalView(localView)
        } catch (e) {
            this.log.error('error creating pending local view', {
                streamId: mlsStream.streamId,
                e,
            })
            throw e
        }
    }

    public async announceEpochSecrets(mlsStream: MlsStream): Promise<void> {
        if (mlsStream.localView?.status !== 'active') {
            return
        }

        const epochSecrets = await mlsStream.unannouncedEpochKeys()
        if (epochSecrets.length === 0) {
            return
        }

        const epochSecretsMessage = MlsMessages.epochSecretsMessage(epochSecrets)

        try {
            this.log.log('sending epoch secrets', { secrets: epochSecrets.map((s) => s.epoch) })
            await this.client.makeEventAndAddToStream(
                mlsStream.streamId,
                make_MemberPayload_Mls(epochSecretsMessage),
                this.sendingOptions,
            )
        } catch (e) {
            this.log.error('error sending epoch secrets', {
                streamId: mlsStream.streamId,
                e,
            })
        }
    }

    // TODO: Not sure what to do with exception
    public async createPendingLocalView(
        streamId: string,
        onChainView: RemoteView,
    ): Promise<LocalView> {
        let prepared: { group: MlsGroup; message: JoinOrCreateMessage }

        if (onChainView.externalInfo !== undefined) {
            prepared = await MlsMessages.prepareExternalJoinMessage(
                this.mlsClient,
                onChainView.externalInfo,
            )
        } else {
            prepared = await MlsMessages.prepareInitializeGroup(this.mlsClient)
        }

        const { eventId } = await this.client.makeEventAndAddToStream(
            streamId,
            make_MemberPayload_Mls(prepared.message),
            this.sendingOptions,
        )

        // TODO: Figure how to get miniblockBefore
        return new LocalView(prepared.group, { eventId, miniblockBefore: 0n })
    }

    public async loadLocalView(dto: LocalViewDTO): Promise<LocalView> {
        const group = await this.mlsClient.loadGroup(dto.groupId)
        return new LocalView(group, dto.pendingInfo, dto.rejectedEpoch)
    }
}
