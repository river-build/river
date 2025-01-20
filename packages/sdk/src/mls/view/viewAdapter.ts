import { OnChainView } from './onChainView'
import { Client } from '../../client'
import { DLogger, dlog } from '@river-build/dlog'
import { LocalView } from './localView'

export type ViewAdapterOpts = {
    log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }
}

const defaultLogger = dlog('csb:mls:viewAdapter')

const defaultViewAdapterOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
}

export class ViewAdapter {
    private onChainViews: Map<string, OnChainView> = new Map()
    private localViews: Map<string, LocalView> = new Map()
    // cheating
    private client: Client
    private log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }

    public constructor(client: Client, opts: ViewAdapterOpts = defaultViewAdapterOpts) {
        this.client = client
        this.log = opts.log
    }

    public onChainView(streamId: string): OnChainView | undefined {
        return this.onChainViews.get(streamId)
    }

    public trackLocalView(streamId: string, localView: LocalView): void {
        this.localViews.set(streamId, localView)
    }

    public localView(streamId: string): LocalView | undefined {
        return this.localViews.get(streamId)
    }

    // TODO: Update not to depend on client
    public async streamUpdated(streamId: string): Promise<void> {
        this.log.debug?.('streamUpdated', streamId)
        const stream = this.client.stream(streamId)
        if (stream === undefined) {
            this.log.debug?.('streamUpdated: stream not found', streamId)
            throw new Error(`Programmer error: missing stream ${streamId}`)
        }

        const view = stream.view
        const onChainView = await OnChainView.loadFromStreamStateView(view, { log: this.log })
        this.onChainViews.set(streamId, onChainView)
        // try updaing your local view
        const localView = this.localViews.get(streamId)
        if (localView !== undefined) {
            await localView.processOnChainView(onChainView)
        }
    }
}
