import { EntitlementsDelegate, MlsEncryptionEvent } from "@river-build/encryption";
import { Client } from "./client";
import { check, dlog, dlogError, DLogger } from "@river-build/dlog";

interface MlsQueueItem {
    respondAfter: Date
    event: MlsEncryptionEvent
}

export class MlsQueue {

    private started: boolean = false
    private inProgressTick?: Promise<void>
    private timeoutId?: NodeJS.Timeout
    private queue = new Array<MlsQueueItem>()
    protected log: {
        debug: DLogger
        info: DLogger
        error: DLogger
    }

    constructor(
        private readonly client: Client,
        delegate: EntitlementsDelegate,
    ) {
        this.log = {
            debug: dlog('csb:mls:debug'),
            info: dlog('csb:mls'),
            error: dlogError('csb:mls:error'),
        }
        // to subscribe, call something like :
        // client.on('mls...') and add corresponding event
    }

    public start() {
        check(!this.started, 'start() called twice, please re-instantiate instead')
        this.started = true
    }

    public stop() {
        
    }

    checkStartTicking() {
        // TODO: pause if take mobile safari is backgrounded (idb issue)
        if (!this.started || this.timeoutId) {
            return
        }

        this.timeoutId = setTimeout(() => {
            this.inProgressTick = this.tick()
            this.inProgressTick
                .catch((e) => this.log.error('MLS ProcessTick Error', e))
                .finally(() => {
                    this.timeoutId = undefined
                    this.checkStartTicking()
                })
        }, 0)
    }

    stopTicking() {

    }

    async tick() {
        const item = this.dequeueWorkItem()
        if (!item) {
            return
        }
        this.processItem(item)
    }

    async processItem(item: MlsEncryptionEvent) {
        // call out to client etc
    }

    dequeueWorkItem(): MlsEncryptionEvent | undefined {
        if (this.queue.length === 0) {
            return undefined
        }
        const now = new Date()
        if (this.queue[0].respondAfter > now) {
            return undefined
        }
        const index = this.queue.findIndex((x) => x.respondAfter <= now)
        if (index === -1) {
            return undefined
        }
        return this.queue.splice(index, 1)[0].event
    }
    
    insertWorkItem(event: MlsEncryptionEvent,respondAfter?: Date) {
        let position = this.queue.length
        let workItem: MlsQueueItem = {
            respondAfter: respondAfter ?? new Date(),
            event: event
        }
        // Iterate backwards to find the correct position
        for (let i = this.queue.length - 1; i >= 0; i--) {
            if (this.queue[i].respondAfter <= workItem.respondAfter) {
                position = i + 1
                break
            }
        }
        this.queue.splice(position, 0, workItem)
    }
}