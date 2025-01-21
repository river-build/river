import { OnChainView } from './onChainView'
import { Client } from '../client'
import { DLogger, dlog } from '@river-build/dlog'
import { LocalView } from './localView'
import { MlsLogger } from './logger'
import { IValueAwaiter, IndefiniteValueAwaiter } from './awaiter'

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
    private client?: Client
    private log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }

    public constructor(
        streamId: string,
        localView?: LocalView,
        client?: Client,
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
}
