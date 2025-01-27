import { OnChainView } from './onChainView'
import { dlog, DLogger } from '@river-build/dlog'
import { LocalEpochSecret, LocalView } from './localView'
import { MlsLogger } from './logger'
import { awaiter, IValueAwaiter } from './awaiter'
import { MlsEncryptedContentItem } from './types'
import { toDecryptedContent } from '../encryptedContentTypes'
import { IPersistenceStore } from '../persistenceStore'
import { Stream } from '../stream'
import { MlsQueueDelegate, StreamUpdate } from './mlsQueue'
import { MLS_ENCRYPTED_DATA_VERSION } from './constants'
import { EpochEncryption } from './epochEncryption'

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

const crypto = new EpochEncryption()

export class MlsStream implements MlsQueueDelegate {
    public readonly streamId: string
    private _onChainView = new OnChainView()
    private _localView?: LocalView
    public awaitingActiveLocalView?: IValueAwaiter<LocalView>
    public readonly stream: Stream
    private persistenceStore: IPersistenceStore
    public readonly decryptionFailures: Map<bigint, MlsEncryptedContentItem[]> = new Map()
    private log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }

    public constructor(
        streamId: string,
        stream: Stream,
        persistenceStore: IPersistenceStore,
        localView?: LocalView,
        opts: MlsStreamOpts = defaultMlsStreamOpts,
    ) {
        this.streamId = streamId
        this._localView = localView
        this.stream = stream
        this.persistenceStore = persistenceStore
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

    public awaitActiveLocalView(timeoutMS?: number): Promise<LocalView> {
        if (this._localView?.status === 'active') {
            return Promise.resolve(this._localView)
        }

        if (this._localView?.status === 'corrupted') {
            return Promise.reject(new Error('corrupted local view'))
        }

        if (this.awaitingActiveLocalView === undefined) {
            const internalAwaiter: IValueAwaiter<LocalView> = awaiter(timeoutMS)
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

        this.log.debug?.(
            'unannounced secrets',
            unannouncedSecrets.map((s) => s.epoch),
        )

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
    public async handleStreamUpdate(streamUpdate: StreamUpdate): Promise<void> {
        const view = this.stream.view
        this._onChainView = await OnChainView.loadFromStreamStateView(view, { log: this.log })

        // try updating your local view
        if (this._localView !== undefined) {
            await this._localView.processOnChainView(this._onChainView)
            this.checkAndResolveActiveLocalView()
        }

        for (const encryptedContentItem of streamUpdate.encryptedContentItems) {
            await this.processMlsEncryptedContentItem(encryptedContentItem)
        }
    }

    public async processMlsEncryptedContentItem(
        mlsEncryptedContentItem: MlsEncryptedContentItem,
    ): Promise<void> {
        const eventId = mlsEncryptedContentItem.eventId
        const kind = mlsEncryptedContentItem.kind
        const epoch = mlsEncryptedContentItem.epoch
        const ciphertext = mlsEncryptedContentItem.ciphertext

        let cleartext = await this.persistenceStore.getCleartext(eventId)

        if (cleartext !== undefined) {
            return this.stream.updateDecryptedContent(
                eventId,
                toDecryptedContent(kind, MLS_ENCRYPTED_DATA_VERSION, cleartext),
            )
        }

        const epochSecret = this.localView?.getEpochSecret(epoch)
        if (epochSecret === undefined) {
            return this.decryptionFailure(mlsEncryptedContentItem)
        }

        cleartext = await crypto.open(epochSecret.derivedKeys, ciphertext)

        await this.persistenceStore.saveCleartext(eventId, cleartext)

        return this.stream.updateDecryptedContent(
            eventId,
            toDecryptedContent(kind, MLS_ENCRYPTED_DATA_VERSION, cleartext),
        )
    }

    private decryptionFailure(mlsEncryptedContentItem: MlsEncryptedContentItem) {
        const epoch = mlsEncryptedContentItem.epoch
        let perEpoch = this.decryptionFailures.get(epoch)
        if (!perEpoch) {
            perEpoch = []
            this.decryptionFailures.set(epoch, perEpoch)
        }

        perEpoch.push(mlsEncryptedContentItem)
    }

    public async retryDecryptionFailures() {
        const openEpochs: Map<bigint, LocalEpochSecret> = this._localView?.epochSecrets ?? new Map()

        if (this.decryptionFailures.size === 0 || openEpochs.size === 0) {
            return
        }

        // TODO: This could be optimised
        for (const [epoch, mlsEncryptedContentItems] of this.decryptionFailures.entries()) {
            const epochSecret = openEpochs.get(epoch)
            if (epochSecret === undefined) {
                continue
            }

            for (const mlsEncryptedContentItem of mlsEncryptedContentItems) {
                const eventId = mlsEncryptedContentItem.eventId
                const kind = mlsEncryptedContentItem.kind
                const ciphertext = mlsEncryptedContentItem.ciphertext

                const cleartext = await crypto.open(epochSecret.derivedKeys, ciphertext)

                await this.persistenceStore.saveCleartext(eventId, cleartext)
                this.stream.updateDecryptedContent(
                    eventId,
                    toDecryptedContent(kind, MLS_ENCRYPTED_DATA_VERSION, cleartext),
                )
            }

            this.decryptionFailures.delete(epoch)
        }
    }
}
