import debug from 'debug';
import { check, dlog, dlogError } from '@river-build/dlog';
import { hasElements, isDefined } from './check';
import { unpackMiniblock, unpackStream } from './sign';
import { StreamStateView } from './streamStateView';
import { streamIdAsString, streamIdAsBytes, userIdFromAddress, makeUserStreamId } from './id';
const SCROLLBACK_MAX_COUNT = 20;
const SCROLLBACK_MULTIPLIER = 4n;
export class UnauthenticatedClient {
    rpcClient;
    logCall;
    logEmitFromClient;
    logError;
    userId = 'unauthenticatedClientUser';
    getScrollbackRequests = new Map();
    constructor(rpcClient, logNamespaceFilter) {
        if (logNamespaceFilter) {
            debug.enable(logNamespaceFilter);
        }
        this.rpcClient = rpcClient;
        const shortId = 'unauthClientShortId';
        this.logCall = dlog('csb:cl:call').extend(shortId);
        this.logEmitFromClient = dlog('csb:cl:emit').extend(shortId);
        this.logError = dlogError('csb:cl:error').extend(shortId);
        this.logCall('new UnauthenticatedClient');
    }
    async userExists(userId) {
        const userStreamId = makeUserStreamId(userId);
        this.logCall('userExists', userId);
        const response = await this.rpcClient.getStream({
            streamId: streamIdAsBytes(userStreamId),
            optional: true,
        });
        this.logCall('userExists', userId, response.stream);
        return response.stream !== undefined;
    }
    async userWithAddressExists(address) {
        return this.userExists(userIdFromAddress(address));
    }
    async getStream(streamId) {
        try {
            this.logCall('getStream', streamId);
            const response = await this.rpcClient.getStream({ streamId: streamIdAsBytes(streamId) });
            this.logCall('getStream', response.stream);
            check(isDefined(response.stream) && hasElements(response.stream.miniblocks), 'got bad stream');
            const { streamAndCookie, snapshot, prevSnapshotMiniblockNum } = await unpackStream(response.stream);
            const streamView = new StreamStateView(this.userId, streamIdAsString(streamId));
            streamView.initialize(streamAndCookie.nextSyncCookie, streamAndCookie.events, snapshot, streamAndCookie.miniblocks, [], prevSnapshotMiniblockNum, undefined, [], undefined);
            return streamView;
        }
        catch (err) {
            this.logCall('getStream', streamId, 'ERROR', err);
            throw err;
        }
    }
    async scrollbackToDate(streamView, toDate) {
        this.logCall('scrollbackToDate', { streamId: streamView.streamId, toDate });
        // scrollback to get events till max scrollback, toDate or till no events are left
        for (let i = 0; i < SCROLLBACK_MAX_COUNT; i++) {
            const result = await this.scrollback(streamView);
            if (result.terminus) {
                break;
            }
            const currentOldestEvent = result.firstEvent;
            this.logCall('scrollbackToDate result', {
                oldest: currentOldestEvent?.createdAtEpochMs,
                toDate,
            });
            if (currentOldestEvent) {
                if (!this.isWithin(currentOldestEvent.createdAtEpochMs, toDate)) {
                    break;
                }
            }
        }
    }
    async scrollback(streamView) {
        const currentRequest = this.getScrollbackRequests.get(streamView.streamId);
        if (currentRequest) {
            return currentRequest;
        }
        const _scrollback = async () => {
            check(isDefined(streamView.miniblockInfo), `stream not initialized: ${streamView.streamId}`);
            if (streamView.miniblockInfo.terminusReached) {
                this.logCall('scrollback', streamView.streamId, 'terminus reached');
                return { terminus: true, firstEvent: streamView.timeline.at(0) };
            }
            check(streamView.miniblockInfo.min >= streamView.prevSnapshotMiniblockNum);
            this.logCall('scrollback', {
                streamId: streamView.streamId,
                miniblockInfo: streamView.miniblockInfo,
                prevSnapshotMiniblockNum: streamView.prevSnapshotMiniblockNum,
            });
            const toExclusive = streamView.miniblockInfo.min;
            const fromInclusive = streamView.prevSnapshotMiniblockNum;
            const span = toExclusive - fromInclusive;
            let fromInclusiveNew = toExclusive - span * SCROLLBACK_MULTIPLIER;
            fromInclusiveNew = fromInclusiveNew < 0n ? 0n : fromInclusiveNew;
            const response = await this.getMiniblocks(streamView.streamId, fromInclusiveNew, toExclusive);
            // a race may occur here: if the state view has been reinitialized during the scrollback
            // request, we need to discard the new miniblocks.
            if ((streamView.miniblockInfo?.min ?? -1n) === toExclusive) {
                streamView.prependEvents(response.miniblocks, undefined, response.terminus, undefined, undefined);
                return { terminus: response.terminus, firstEvent: streamView.timeline.at(0) };
            }
            return { terminus: false, firstEvent: streamView.timeline.at(0) };
        };
        try {
            const request = _scrollback();
            this.getScrollbackRequests.set(streamView.streamId, request);
            return await request;
        }
        finally {
            this.getScrollbackRequests.delete(streamView.streamId);
        }
    }
    async getMiniblocks(streamId, fromInclusive, toExclusive) {
        if (toExclusive === fromInclusive) {
            return {
                miniblocks: [],
                terminus: toExclusive === 0n,
            };
        }
        const response = await this.rpcClient.getMiniblocks({
            streamId: streamIdAsBytes(streamId),
            fromInclusive,
            toExclusive,
        });
        const unpackedMiniblocks = [];
        for (const miniblock of response.miniblocks) {
            const unpackedMiniblock = await unpackMiniblock(miniblock, { disableChecks: true });
            unpackedMiniblocks.push(unpackedMiniblock);
        }
        return {
            terminus: response.terminus,
            miniblocks: unpackedMiniblocks,
        };
    }
    isWithin(number, time) {
        const minEpochMs = Date.now() - time;
        return number > minEpochMs;
    }
}
//# sourceMappingURL=unauthenticatedClient.js.map