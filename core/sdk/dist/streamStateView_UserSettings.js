import { FullyReadMarkers, UserSettingsPayload_Snapshot_UserBlocks, } from '@river-build/proto';
import { check, dlog } from '@river-build/dlog';
import { logNever } from './check';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { toPlainMessage } from '@bufbuild/protobuf';
import { streamIdFromBytes, userIdFromAddress } from './id';
const log = dlog('csb:stream');
export class StreamStateView_UserSettings extends StreamStateView_AbstractContent {
    streamId;
    settings = new Map();
    fullyReadMarkersSrc = new Map();
    fullyReadMarkers = new Map();
    userBlocks = {};
    constructor(streamId) {
        super();
        this.streamId = streamId;
    }
    applySnapshot(snapshot, content) {
        // iterate over content.fullyReadMarkers
        for (const payload of content.fullyReadMarkers) {
            this.fullyReadMarkerUpdate(payload);
        }
        for (const userBlocks of content.userBlocksList) {
            const userId = userIdFromAddress(userBlocks.userId);
            this.userBlocks[userId] = userBlocks;
        }
    }
    prependEvent(event, _cleartext, _encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'userSettingsPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'fullyReadMarkers':
                // handled in snapshot
                break;
            case 'userBlock':
                // handled in snapshot
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    appendEvent(event, _cleartext, _encryptionEmitter, stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'userSettingsPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'fullyReadMarkers':
                this.fullyReadMarkerUpdate(payload.content.value, stateEmitter);
                break;
            case 'userBlock':
                this.userBlockUpdate(payload.content.value, stateEmitter);
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    fullyReadMarkerUpdate(payload, emitter) {
        const { content } = payload;
        log('$ fullyReadMarkerUpdate', { content });
        if (content === undefined) {
            log('$ Content with FullyReadMarkers is undefined');
            return;
        }
        const streamId = streamIdFromBytes(payload.streamId);
        this.fullyReadMarkersSrc.set(streamId, content);
        const fullyReadMarkersContent = toPlainMessage(FullyReadMarkers.fromJsonString(content.data));
        this.fullyReadMarkers.set(streamId, fullyReadMarkersContent.markers);
        emitter?.emit('fullyReadMarkersUpdated', streamId, fullyReadMarkersContent.markers);
    }
    userBlockUpdate(payload, emitter) {
        const userId = userIdFromAddress(payload.userId);
        if (!this.userBlocks[userId]) {
            this.userBlocks[userId] = new UserSettingsPayload_Snapshot_UserBlocks();
        }
        this.userBlocks[userId].blocks.push(payload);
        emitter?.emit('userBlockUpdated', payload);
    }
    isUserBlocked(userId) {
        const latestBlock = this.getLastBlock(userId);
        if (latestBlock === undefined) {
            return false;
        }
        return latestBlock.isBlocked;
    }
    isUserBlockedAt(userId, eventNum) {
        let isBlocked = false;
        for (const block of this.userBlocks[userId]?.blocks ?? []) {
            if (eventNum >= block.eventNum) {
                isBlocked = block.isBlocked;
            }
        }
        return isBlocked;
    }
    getLastBlock(userId) {
        const blocks = this.userBlocks[userId]?.blocks;
        if (!blocks || blocks.length === 0) {
            return undefined;
        }
        return blocks[blocks.length - 1];
    }
}
//# sourceMappingURL=streamStateView_UserSettings.js.map