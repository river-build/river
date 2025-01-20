import { dlog, DLogger } from '@river-build/dlog'
import { logNever } from '../../check'
import { EncryptedContent } from '../../encryptedContentTypes'
import { Coordinator } from '../coordinator'
import { ConfirmedMlsEvent } from '../view/types'

// TODO: Should encrypted content get its own queue?
type EncryptedContentEvent = {
    streamId: string
    eventId: string
    message: EncryptedContent
}

const defaultLogger = dlog('csb:mls:queue')

export type QueueServiceOpts = {
    log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }
}

const defaultQueueServiceOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
}

export class QueueService {
    private coordinator?: Coordinator

    private log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }

    constructor(coordinator?: Coordinator, opts: QueueServiceOpts = defaultQueueServiceOpts) {
        this.coordinator = coordinator
        this.log = opts.log
    }

    // # Queue-related operations #

    // Queue-related fields
    // private commandQueue: Set<QueueCommand> = new Set()
    private mlsEventQueue: Map<string, ConfirmedMlsEvent[]> = new Map()
    private encryptedContentQueue: EncryptedContentEvent[] = []

    private delayMs = 15
    private started: boolean = false
    private stopping: boolean = false
    private timeoutId?: NodeJS.Timeout
    private inProgressTick?: Promise<void>
    private isMobileSafariBackgrounded = false

    // public enqueueCommand(command: QueueCommand) {
    //     this.log.debug('enqueueCommand', command)
    //
    //     this.commandQueue.add(command)
    //     // TODO: Is this needed when we tick after start
    //     this.checkStartTicking()
    // }
    //
    // private dequeueCommand(): QueueCommand | undefined {
    //     const result = this.commandQueue.values().next()
    //     if (result.done) {
    //         return undefined
    //     }
    //     this.commandQueue.delete(result.value)
    //     return result.value
    // }

    public enqueueConfirmedMlsEvent(streamId: string, event: ConfirmedMlsEvent) {
        this.log.debug?.('enqueueEvent', streamId, event)

        const perStream = this.mlsEventQueue.get(streamId)
        if (perStream === undefined) {
            this.mlsEventQueue.set(streamId, [event])
        } else {
            perStream.push(event)
        }

        // TODO: Is this needed when we tick after start
        this.checkStartTicking()
    }

    // Dequeue streams in round-robin fashion
    // Dequeue first stream that got inserted
    // TODO: Add limit for draining in one go
    public dequeueConfirmedMlsEventsPerStream():
        | { streamId: string; events: ConfirmedMlsEvent[] }
        | undefined {
        const firstStream = this.mlsEventQueue.keys().next()
        if (firstStream.done) {
            return undefined
        }
        const streamId = firstStream.value
        const events = this.mlsEventQueue.get(streamId)
        if (events === undefined) {
            return undefined
        }
        this.mlsEventQueue.delete(streamId)
        return {
            streamId,
            events,
        }
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
        const perStream = this.dequeueConfirmedMlsEventsPerStream()
        if (perStream !== undefined) {
            for (const event of perStream.events) {
                await this.processEvent(perStream.streamId, event)
            }
        }

        // const command = this.dequeueCommand()
        // if (command !== undefined) {
        //     return this.processCommand(command)
        // }
    }

    // public async processCommand(command: QueueCommand): Promise<void> {
    //     this.log.debug('processCommand', command)
    //
    //     switch (command.tag) {
    //         case 'joinOrCreateGroup':
    //             return this.coordinator.joinOrCreateGroup(command.streamId)
    //         case 'groupActive':
    //             return this.coordinator.groupActive(command.streamId)
    //         case 'newEpoch':
    //             return this.coordinator.newEpoch(
    //                 command.streamId,
    //                 command.epoch,
    //                 command.epochSecret,
    //             )
    //         case 'newOpenEpochSecret':
    //             return this.coordinator.newOpenEpochSecret(command.openEpochSecret)
    //         case 'newSealedEpochSecret':
    //             return this.coordinator.newSealedEpochSecret(command.sealedEpochSecret)
    //         case 'announceEpochSecret':
    //             return this.coordinator.announceEpochSecret(
    //                 command.streamId,
    //                 command.epoch,
    //                 command.sealedEpochSecret,
    //             )
    //         default:
    //             logNever(command)
    //     }
    // }

    public async processEvent(streamId: string, event: ConfirmedMlsEvent): Promise<void> {
        if (this.coordinator === undefined) {
            return
        }
        this.log.debug?.('processEvent', event)

        switch (event.case) {
            case 'initializeGroup':
                return this.coordinator.handleInitializeGroup(streamId, event.value)
            case 'externalJoin':
                return this.coordinator.handleExternalJoin(streamId, event.value)
            case 'epochSecrets':
                return this.coordinator.handleEpochSecrets(streamId, event.value)
            // case 'encryptedContent':
            //     return this.coordinator.handleEncryptedContent(
            //         streamId,
            //         event.eventId,
            //         event.message,
            //     )
            // case 'encryptionAlgorithmUpdated':
            //     return this.coordinator.handleAlgorithmUpdated(
            //         streamId,
            //         event.encryptionAlgorithm,
            //     )
            case 'keyPackage':
            case 'welcomeMessage':
            case undefined:
                return
            default:
                logNever(event)
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

// export class CoordinatorDelegateAdapter implements CoordinatorDelegate {
//     private queueService: QueueService
//
//     constructor(queueService: QueueService) {
//         this.queueService = queueService
//     }
//
//     scheduleJoinOrCreateGroup(streamId: string): void {
//         this.queueService.enqueueCommand({ tag: 'joinOrCreateGroup', streamId })
//     }
//
//     scheduleAnnounceEpochSecret(
//         streamId: string,
//         epoch: bigint,
//         sealedEpochSecret: Uint8Array,
//     ): void {
//         this.queueService.enqueueCommand({
//             tag: 'announceEpochSecret',
//             streamId,
//             epoch,
//             sealedEpochSecret,
//         })
//     }
// }

// export class GroupServiceCoordinatorAdapter implements GroupServiceDelegate {
//     public queueService: QueueService
//
//     constructor(queueService: QueueService) {
//         this.queueService = queueService
//     }
//
//     public joinOrCreateGroup(streamId: string): void {
//         this.queueService.enqueueCommand({ tag: 'joinOrCreateGroup', streamId })
//     }
//     public groupActive(streamId: string): void {
//         this.queueService.enqueueCommand({ tag: 'groupActive', streamId })
//     }
//     public newEpoch(streamId: string, epoch: bigint, epochSecret: Uint8Array): void {
//         this.queueService.enqueueCommand({ tag: 'newEpoch', streamId, epoch, epochSecret })
//     }
// }
//
// export class EpochSecretServiceCoordinatorAdapter implements EpochSecretServiceDelegate {
//     public queueService: QueueService
//
//     constructor(queueService: QueueService) {
//         this.queueService = queueService
//     }
//
//     public newOpenEpochSecret(openEpochSecret: EpochSecret): void {
//         this.queueService.enqueueCommand({
//             tag: 'newOpenEpochSecret',
//             openEpochSecret,
//         })
//     }
//     public newSealedEpochSecret(sealedEpochSecret: EpochSecret): void {
//         this.queueService.enqueueCommand({
//             tag: 'newSealedEpochSecret',
//             sealedEpochSecret,
//         })
//     }
// }
