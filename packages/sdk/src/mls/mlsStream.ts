import { OnChainView } from './onChainView'
import { Client } from '../client'
import { DLogger, dlog, check } from '@river-build/dlog'
import { LocalEpochSecret, LocalView } from './localView'
import { MlsLogger } from './logger'
import { IValueAwaiter, IndefiniteValueAwaiter } from './awaiter'
import { MlsEncryptedContentItem } from './types'
import { DecryptedContent, EncryptedContent, toDecryptedContent } from '../encryptedContentTypes'
import { MLS_ALGORITHM } from './constants'
import { IPersistenceStore } from '../persistenceStore'
import { isDefined } from '../check'
import { EncryptedData } from '@river-build/proto'
import { MlsMessages } from './messages'

export type MlsStreamOpts = {
    log: MlsLogger
}

const defaultLogger = dlog('csb:mls:stream')

const defaultMlsStreamOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
}

export class MlsStream {
    public readonly streamId: string
    private _onChainView = new OnChainView()
    private _localView?: LocalView
    private awaitingActiveLocalView?: IValueAwaiter<LocalView>
    // cheating
    private client: Client
    private persistenceStore?: IPersistenceStore
    private decryptionFailures: Map<bigint, MlsEncryptedContentItem[]> = new Map()
    private log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }

    public constructor(
        streamId: string,
        client: Client,
        localView?: LocalView,
        opts: MlsStreamOpts = defaultMlsStreamOpts,
    ) {
        this.streamId = streamId
        this._localView = localView
        this.client = client
        this.streamId = streamId
        this.log = opts.log
    }

    public get onChainView(): OnChainView {
        return this._onChainView
    }

    public get localView(): LocalView | undefined {
        return this._localView
    }

    public trackLocalView(localView: LocalView): void {
        this._localView = localView
    }

    public clearLocalView(): void {
        this._localView = undefined
    }

    public awaitActiveLocalView(): Promise<LocalView> {
        if (this._localView?.status === 'active') {
            return Promise.resolve(this._localView)
        }

        if (this._localView?.status === 'corrupted') {
            return Promise.reject(new Error('corrupted local view'))
        }

        if (this.awaitingActiveLocalView === undefined) {
            const internalAwaiter: IndefiniteValueAwaiter<LocalView> = new IndefiniteValueAwaiter()
            const promise = internalAwaiter.promise.finally(() => {
                this.awaitingActiveLocalView = undefined
            })
            this.awaitingActiveLocalView = {
                promise,
                resolve: internalAwaiter.resolve,
            }
        }

        return this.awaitingActiveLocalView.promise
    }

    public checkAndResolveActiveLocalView(): void {
        if (this._localView?.status === 'active') {
            this.awaitingActiveLocalView?.resolve(this._localView)
        }
    }

    public async unannouncedEpochKeys(): Promise<{ epoch: bigint; secret: Uint8Array }[]> {
        const unannouncedSecrets: LocalEpochSecret[] = []

        this._localView?.epochSecrets.forEach((secret) => {
            if (!this.onChainView.sealedEpochSecrets.has(secret.epoch)) {
                unannouncedSecrets.push(secret)
            }
        })

        const sealedSecrets: { epoch: bigint; secret: Uint8Array }[] = []
        for (const unnannouncedSecret of unannouncedSecrets) {
            const sealedSecret = await this._localView?.sealEpochSecret(unnannouncedSecret)
            if (sealedSecret) {
                sealedSecrets.push({
                    epoch: unnannouncedSecret.epoch,
                    secret: sealedSecret,
                })
            }
        }

        return sealedSecrets
    }

    // TODO: Update not to depend on client
    public async handleStreamUpdate(): Promise<void> {
        this.log.debug?.('handleStreamUpdate', this.streamId)
        const stream = this.client?.stream(this.streamId)
        if (stream === undefined) {
            this.log.debug?.('streamUpdated: stream not found', this.streamId)
            return
        }

        const view = stream.view
        this._onChainView = await OnChainView.loadFromStreamStateView(view, { log: this.log })
        // try updaing your local view
        if (this._localView !== undefined) {
            await this._localView.processOnChainView(this._onChainView)
            this.checkAndResolveActiveLocalView()
        }
    }

    public async handleEncryptedContent(
        streamId: string,
        eventId: string,
        message: EncryptedContent,
    ): Promise<void> {
        const encryptedData = message.content
        const kind = message.kind
        const epoch = encryptedData.mls?.epoch
        const ciphertext = encryptedData.mls?.ciphertext

        if (epoch === undefined) {
            throw new Error('epoch not found')
        }

        if (ciphertext === undefined) {
            throw new Error('ciphertext not found')
        }

        if (encryptedData.algorithm == MLS_ALGORITHM) {
            throw new Error(`unknown algorithm: ${encryptedData.algorithm}`)
        }

        const clearText = await this.persistenceStore?.getCleartext(eventId)
        if (clearText !== undefined) {
            return this.updateDecryptedContent(
                streamId,
                eventId,
                toDecryptedContent(kind, clearText),
            )
        }

        const epochSecret = this.localView?.getEpochSecret(epoch)
        if (epochSecret === undefined) {
            return this.decryptionFailure(streamId, eventId, epoch, kind, encryptedData)
        }

        const decryptedContent = await MlsMessages.decryptEpochSecretMessage(
            epochSecret.derivedKeys,
            kind,
            ciphertext,
        )

        return this.updateDecryptedContent(streamId, eventId, decryptedContent)
    }

    public async updateDecryptedContent(
        streamId: string,
        eventId: string,
        content: DecryptedContent,
    ): Promise<void> {
        const stream = this.client?.stream(streamId)
        check(isDefined(stream), 'stream not found')
        stream.updateDecryptedContent(eventId, content)
    }

    private decryptionFailure(
        streamId: string,
        eventId: string,
        epoch: bigint,
        kind: EncryptedContent['kind'],
        encryptedData: EncryptedData,
    ) {
        let perEpoch = this.decryptionFailures.get(epoch)
        if (!perEpoch) {
            perEpoch = []
            this.decryptionFailures.set(epoch, perEpoch)
        }

        perEpoch.push({ streamId, eventId, epoch, kind, encryptedData })
    }
}
