import { PersistedEvent, PersistedMiniblock, } from '@river-build/proto';
import { bin_toHexString } from '@river-build/dlog';
import { isDefined } from './check';
export function persistedEventToParsedEvent(event) {
    if (!event.event) {
        return undefined;
    }
    return {
        event: event.event,
        hash: event.hash,
        hashStr: bin_toHexString(event.hash),
        prevMiniblockHashStr: event.prevMiniblockHashStr.length > 0 ? event.prevMiniblockHashStr : undefined,
        creatorUserId: event.creatorUserId,
    };
}
export function persistedMiniblockToParsedMiniblock(miniblock) {
    if (!miniblock.header) {
        return undefined;
    }
    return {
        hash: miniblock.hash,
        header: miniblock.header,
        events: miniblock.events.map(persistedEventToParsedEvent).filter(isDefined),
    };
}
export function parsedMiniblockToPersistedMiniblock(miniblock) {
    return new PersistedMiniblock({
        hash: miniblock.hash,
        header: miniblock.header,
        events: miniblock.events.map(parsedEventToPersistedEvent),
    });
}
function parsedEventToPersistedEvent(event) {
    return new PersistedEvent({
        event: event.event,
        hash: event.hash,
        prevMiniblockHashStr: event.prevMiniblockHashStr,
        creatorUserId: event.creatorUserId,
    });
}
export function persistedSyncedStreamToParsedSyncedStream(stream) {
    if (!stream.syncCookie) {
        return undefined;
    }
    return {
        syncCookie: stream.syncCookie,
        lastSnapshotMiniblockNum: stream.lastSnapshotMiniblockNum,
        minipoolEvents: stream.minipoolEvents.map(persistedEventToParsedEvent).filter(isDefined),
        lastMiniblockNum: stream.lastMiniblockNum,
    };
}
//# sourceMappingURL=streamUtils.js.map