import { dlog } from '@river-build/dlog'
import { MlsLogger } from './logger'
import { MlsConfirmedEvent, MlsConfirmedSnapshot } from './types'

const defaultLogger = dlog('csb:mls:queue')

export type MlsQueueOpts = {
    log: MlsLogger
    delayMs: number
}

const defaultMlsQueueOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
    delayMs: 15,
}

export type MlsQueueDelegate = {
    handleStreamUpdate(
        streamId: string,
        snapshots: MlsConfirmedSnapshot[],
        confirmedEvents: MlsConfirmedEvent[],
    ): Promise<void>
}

type StreamUpdate = {
    streamId: string
    snapshots: MlsConfirmedSnapshot[]
    confirmedEvents: MlsConfirmedEvent[]
}

export class MlsQueue {
    private streamUpdates: Map<string, StreamUpdate> = new Map()

    private delayMs = 15
    private started: boolean = false
    private stopping: boolean = false
    private timeoutId?: NodeJS.Timeout
    private inProgressTick?: Promise<void>
    private isMobileSafariBackgrounded = false
    public delegate?: MlsQueueDelegate

    private log: MlsLogger

    constructor(delegate?: MlsQueueDelegate, opts: MlsQueueOpts = defaultMlsQueueOpts) {
        this.delegate = delegate
        // this.coordinator = coordinator
        this.log = opts.log
        this.delayMs = opts.delayMs
    }

    // # Queue-related operations #

    public enqueueConfirmedSnapshot(streamId: string, snapshot: MlsConfirmedSnapshot) {
        this.log.debug?.('enqueueConfirmedSnapshot', streamId, snapshot)

        let streamUpdate = this.streamUpdates.get(streamId)
        if (!streamUpdate) {
            streamUpdate = {
                streamId,
                snapshots: [],
                confirmedEvents: [],
            }
            this.streamUpdates.set(streamId, streamUpdate)
        }

        streamUpdate.snapshots.push(snapshot)
    }

    public enqueueConfirmedEvent(streamId: string, event: MlsConfirmedEvent) {
        this.log.debug?.('enqueueConfirmedEvent', streamId, event)

        let streamUpdate = this.streamUpdates.get(streamId)
        if (!streamUpdate) {
            streamUpdate = {
                streamId,
                snapshots: [],
                confirmedEvents: [],
            }
            this.streamUpdates.set(streamId, streamUpdate)
        }

        streamUpdate.confirmedEvents.push(event)
    }

    // Dequeue streams in round-robin fashion
    // Dequeue first stream that got inserted
    // TODO: Add limit for draining in one go
    public dequeueStreamUpdate(): StreamUpdate | undefined {
        const firstStream = this.streamUpdates.entries().next()
        if (firstStream.done) {
            return undefined
        }
        this.streamUpdates.delete(firstStream.value[0])
        return firstStream.value[1]
    }

    getDelayMs(): number {
        return this.delayMs
    }

    public start() {
        this.log.debug?.('start')

        // nop
        this.started = true
        this.checkStartTicking()
    }

    public async stop(): Promise<void> {
        this.log.debug?.('stop')

        this.started = false
        await this.stopTicking()
        // nop
    }

    private shouldPauseTicking(): boolean {
        return this.isMobileSafariBackgrounded
    }

    private checkStartTicking() {
        if (this.stopping) {
            // this.log.debug('ticking is being stopped')
            return
        }

        if (!this.started || this.timeoutId) {
            // this.log.debug('previous tick is still running')
            return
        }

        if (this.shouldPauseTicking()) {
            return
        }

        // TODO: should this have any timeout?
        this.timeoutId = setTimeout(() => {
            this.inProgressTick = this.tick()
                .catch((e) => this.log.error?.('MLS ProcessTick Error', e))
                .finally(() => {
                    this.timeoutId = undefined
                    this.checkStartTicking()
                })
        }, this.getDelayMs())
    }

    private async stopTicking() {
        if (this.stopping) {
            return
        }
        this.stopping = true

        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = undefined
        }
        if (this.inProgressTick) {
            try {
                await this.inProgressTick
            } catch (e) {
                this.log.error?.('ProcessTick Error while stopping', e)
            } finally {
                this.inProgressTick = undefined
            }
        }
        this.stopping = false
    }

    // TODO: Figure out how to schedule this...
    public async tick(): Promise<void> {
        this.log.debug?.('tick')

        const streamUpdate = this.dequeueStreamUpdate()
        this.log.debug?.('tick: streamUpdate', streamUpdate)
        if (streamUpdate !== undefined) {
            this.log.debug?.('handlingStreamUpdate', streamUpdate)
            await this.delegate?.handleStreamUpdate(
                streamUpdate.streamId,
                streamUpdate.snapshots,
                streamUpdate.confirmedEvents,
            )
        }
    }

    public readonly onMobileSafariPageVisibilityChanged = () => {
        this.log.debug?.('onMobileSafariBackgrounded', this.isMobileSafariBackgrounded)
        this.isMobileSafariBackgrounded = document.visibilityState === 'hidden'
        if (!this.isMobileSafariBackgrounded) {
            this.checkStartTicking()
        }
    }
}
