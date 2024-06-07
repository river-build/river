import EventEmitter from 'events';
import { StreamStateView } from './streamStateView';
import { isLocalEvent } from './types';
export class Stream extends EventEmitter {
    clientEmitter;
    logEmitFromStream;
    userId;
    view;
    stopped = false;
    constructor(userId, streamId, clientEmitter, logEmitFromStream) {
        super();
        this.clientEmitter = clientEmitter;
        this.logEmitFromStream = logEmitFromStream;
        this.userId = userId;
        this.view = new StreamStateView(userId, streamId);
    }
    get streamId() {
        return this.view.streamId;
    }
    /**
     * NOTE: Separating initial rollup from the constructor allows consumer to subscribe to events
     * on the new stream event and still access this object through Client.streams.
     */
    initialize(nextSyncCookie, minipoolEvents, snapshot, miniblocks, prependedMiniblocks, prevSnapshotMiniblockNum, cleartexts) {
        // grab any local events from the previous view that haven't been processed
        const localEvents = this.view.timeline
            .filter(isLocalEvent)
            .filter((e) => e.hashStr.startsWith('~'));
        this.view = new StreamStateView(this.userId, this.streamId);
        this.view.initialize(nextSyncCookie, minipoolEvents, snapshot, miniblocks, prependedMiniblocks, prevSnapshotMiniblockNum, cleartexts, localEvents, this);
    }
    stop() {
        this.removeAllListeners();
        this.stopped = true;
    }
    async appendEvents(events, nextSyncCookie, cleartexts) {
        this.view.appendEvents(events, nextSyncCookie, cleartexts, this);
    }
    prependEvents(miniblocks, cleartexts, terminus) {
        this.view.prependEvents(miniblocks, cleartexts, terminus, this, this);
    }
    emit(event, ...args) {
        if (this.stopped) {
            return false;
        }
        this.logEmitFromStream(event, ...args);
        this.clientEmitter.emit(event, ...args);
        return super.emit(event, ...args);
    }
    /**
     * Memberships are processed on block boundaries, so we need to wait for the next block to be processed
     * passing an undefined userId will wait for the membership to be updated for the current user
     */
    async waitForMembership(membership, userId) {
        // check to see if we're already in that state
        if (this.view.getMembers().isMember(membership, userId ?? this.userId)) {
            return;
        }
        // wait for a membership updated event, event, check again
        await this.waitFor('streamMembershipUpdated', (_streamId, iUserId) => {
            return ((userId === undefined || userId === iUserId) &&
                this.view.getMembers().isMember(membership, userId ?? this.userId));
        });
    }
    /**
     * Wait for a stream event to be emitted
     * optionally pass a condition function to check the event args
     */
    async waitFor(event, fn, opts = { timeoutMs: 20000 }) {
        this.logEmitFromStream('waitFor', this.streamId, event);
        return new Promise((resolve, reject) => {
            // Set up the event listener
            const handler = (...args) => {
                if (!fn || fn(...args)) {
                    this.logEmitFromStream('waitFor success', this.streamId, event);
                    this.off(event, handler);
                    clearTimeout(timeout);
                    resolve();
                }
            };
            // Set up the timeout
            const timeout = setTimeout(() => {
                this.logEmitFromStream('waitFor timeout', this.streamId, event);
                this.off(event, handler);
                reject(new Error(`Timed out waiting for event: ${event}`));
            }, opts.timeoutMs);
            this.on(event, handler);
        });
    }
}
//# sourceMappingURL=stream.js.map