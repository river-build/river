import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { check } from '@river-build/dlog';
import { logNever } from './check';
import { getUserIdFromStreamId } from './id';
export class StreamStateView_UserDeviceKeys extends StreamStateView_AbstractContent {
    streamId;
    streamCreatorId;
    // user_id -> device_keys, fallback_keys
    deviceKeys = [];
    constructor(streamId) {
        super();
        this.streamId = streamId;
        this.streamCreatorId = getUserIdFromStreamId(streamId);
    }
    applySnapshot(snapshot, content, encryptionEmitter) {
        // dispatch events for all device keys, todo this seems inefficient?
        for (const value of content.encryptionDevices) {
            this.addUserDeviceKey(value, encryptionEmitter);
        }
    }
    prependEvent(_event, _cleartext, _encryptionEmitter, _stateEmitter) {
        // nohing to do
    }
    appendEvent(event, _cleartext, encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'userDeviceKeyPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'encryptionDevice':
                this.addUserDeviceKey(payload.content.value, encryptionEmitter);
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    addUserDeviceKey(value, encryptionEmitter) {
        const device = {
            deviceKey: value.deviceKey,
            fallbackKey: value.fallbackKey,
        };
        const existing = this.deviceKeys.findIndex((x) => x.deviceKey === device.deviceKey);
        if (existing >= 0) {
            this.deviceKeys.splice(existing, 1);
        }
        this.deviceKeys.push(device);
        encryptionEmitter?.emit('userDeviceKeyMessage', this.streamId, this.streamCreatorId, device);
    }
}
//# sourceMappingURL=streamStateView_UserDeviceKey.js.map