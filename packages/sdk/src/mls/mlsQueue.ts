import { dlog } from '@river-build/dlog'
import { MlsLogger } from './logger'

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
    handleStreamUpdate(streamId: string): Promise<void>
}

export class MlsQueue {
    private updatedStreams: Set<string> = new Set()

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

    // Queue-related fields
    // private commandQueue: Set<QueueCommand> = new Set()

    public enqueueUpdatedStream(streamId: string) {
        this.log.debug?.('enqueueConfirmedEvent', { streamId })

        this.updatedStreams.add(streamId)
        // TODO: Is this needed when we tick after start
        this.checkStartTicking()
    }

    // Dequeue streams in round-robin fashion
    // Dequeue first stream that got inserted
    // TODO: Add limit for draining in one go
    public dequeueConfirmedStream(): string | undefined {
        const firstStream = this.updatedStreams.keys().next()
        if (firstStream.done) {
            return undefined
        }
        this.updatedStreams.delete(firstStream.value)
        return firstStream.value
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
        const streamId = this.dequeueConfirmedStream()
        if (streamId !== undefined) {
            await this.delegate?.handleStreamUpdate(streamId)
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
