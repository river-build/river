import { Message, PlainMessage } from '@bufbuild/protobuf'
import { EncryptedData, MemberPayload_Mls } from '@river-build/proto'
import { Client } from '../client'
import { Client as MlsClient, Group as MlsGroup } from '@river-build/mls-rs-wasm'
import { OnChainView } from './onChainView'
import { LocalView } from './localView'
import { check, dlog } from '@river-build/dlog'
import { make_MemberPayload_Mls } from '../types'
import { MlsMessages } from './messages'
import { MlsStream } from './mlsStream'
import { IPersistenceStore } from '../persistenceStore'
import { DecryptedContent, EncryptedContent } from '../encryptedContentTypes'
import { isDefined } from '../check'
import { MlsLogger } from './logger'

const defaultLogger = dlog('csb:mls:ext')

export type MlsProcessorOpts = {
    log: MlsLogger
    sendingOptions: {
        method?: 'mls'
    }
}

const defaultMlsProcessorOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
    sendingOptions: {},
}

type MlsEncryptedContentItem = {
    streamId: string
    eventId: string
    kind: EncryptedContent['kind']
    encryptedData: EncryptedData
}

type JoinOrCreateMessage = PlainMessage<MemberPayload_Mls>

// TODO: Update so that MlsProceessor only depends on viewAdapter
export class MlsProcessor {
    private client: Client
    private mlsClient: MlsClient
    private persistenceStore?: IPersistenceStore
    public decryptionFailures: MlsEncryptedContentItem[] = []
    private sendingOptions: MlsProcessorOpts['sendingOptions']

    private log: MlsLogger

    constructor(
        client: Client,
        mlsClient: MlsClient,
        persistenceStore?: IPersistenceStore,
        opts: MlsProcessorOpts = defaultMlsProcessorOpts,
    ) {
        this.client = client
        this.mlsClient = mlsClient
        this.persistenceStore = persistenceStore
        this.log = opts.log
        this.sendingOptions = opts.sendingOptions
    }

    // API needed by the client
    // TODO: How long will be the timeout here?
    public async encryptMessage(mlsStream: MlsStream, event: Message): Promise<EncryptedData> {
        const localView = mlsStream.localView
        if (localView === undefined) {
            throw new Error('waiting for local view not supported yet')
        }

        if (localView.status !== 'active') {
            throw new Error('unsupported operation for pending local view')
        }

        const lastEpochSecret = localView.latestEpochSecret()
        if (lastEpochSecret === undefined) {
            throw new Error('no epoch secret found')
        }

        return MlsMessages.encryptEpochSecretMessage(lastEpochSecret, event)
    }

    public async initializeOrJoinGroup(mlsStream: MlsStream): Promise<void> {
        switch (mlsStream.localView?.status) {
            case 'corrupted':
                this.log?.warn?.('corrupted mls stream', { streamId: mlsStream.streamId })
                return
            case 'active':
                return
            case 'pending':
                return
            case 'rejected':
                this.log?.debug?.('rejected local view', { streamId: mlsStream.streamId })
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
            this.log.debug?.('error creating pending local view', {
                streamId: mlsStream.streamId,
                e,
            })
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
            await this.client.makeEventAndAddToStream(
                mlsStream.streamId,
                make_MemberPayload_Mls(epochSecretsMessage),
                this.sendingOptions,
            )
        } catch (e) {
            this.log.debug?.('error sending epoch secrets', {
                streamId: mlsStream.streamId,
                e,
            })
        }
    }

    // TODO: Not sure what to do with exception
    public async createPendingLocalView(
        streamId: string,
        onChainView: OnChainView,
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

    // public async handleEncryptedContent(
    //     streamId: string,
    //     eventId: string,
    //     message: EncryptedContent,
    // ): Promise<void> {
    //     const encryptedData = message.content
    //     const kind = message.kind
    //     const epoch = encryptedData.mls?.epoch
    //     const ciphertext = encryptedData.mls?.ciphertext
    //
    //     if (epoch === undefined) {
    //         throw new Error('epoch not found')
    //     }
    //
    //     if (ciphertext === undefined) {
    //         throw new Error('ciphertext not found')
    //     }
    //
    //     if (encryptedData.algorithm == MLS_ALGORITHM) {
    //         throw new Error(`unknown algorithm: ${encryptedData.algorithm}`)
    //     }
    //
    //     const clearText = await this.persistenceStore?.getCleartext(eventId)
    //     if (clearText !== undefined) {
    //         return this.updateDecryptedContent(
    //             streamId,
    //             eventId,
    //             toDecryptedContent(kind, clearText),
    //         )
    //     }
    //
    //     const epochSecret = this.viewAdapter.localView(streamId)?.getEpochSecret(epoch)
    //     if (epochSecret === undefined) {
    //         // Decryption failure
    //         return this.decryptionFailure(streamId, eventId, kind, encryptedData)
    //     }
    //
    //     const decryptedContent = await MlsMessages.decryptEpochSecretMessage(
    //         epochSecret.derivedKeys,
    //         kind,
    //         ciphertext,
    //     )
    //     return this.updateDecryptedContent(streamId, eventId, decryptedContent)
    // }

    public async updateDecryptedContent(
        streamId: string,
        eventId: string,
        content: DecryptedContent,
    ): Promise<void> {
        const stream = this.client.stream(streamId)
        check(isDefined(stream), 'stream not found')
        stream.updateDecryptedContent(eventId, content)
    }

    private decryptionFailure(
        streamId: string,
        eventId: string,
        kind: EncryptedContent['kind'],
        encryptedData: EncryptedData,
    ) {
        this.decryptionFailures.push({ streamId, eventId, kind, encryptedData })
    }
}
