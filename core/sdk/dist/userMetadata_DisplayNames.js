import { dlog } from '@river-build/dlog';
export class UserMetadata_DisplayNames {
    log = dlog('csb:streams:displaynames');
    streamId;
    userIdToEventId = new Map();
    plaintextDisplayNames = new Map();
    displayNameEvents = new Map();
    constructor(streamId) {
        this.streamId = streamId;
    }
    addEncryptedData(eventId, encryptedData, userId, pending = true, cleartext, encryptionEmitter, stateEmitter) {
        this.removeEventForUserId(userId);
        this.addEventForUserId(userId, eventId, encryptedData, pending);
        if (cleartext) {
            this.plaintextDisplayNames.set(userId, cleartext);
        }
        else {
            // Clear the plaintext display name for this user on name change
            this.plaintextDisplayNames.delete(userId);
            encryptionEmitter?.emit('newEncryptedContent', this.streamId, eventId, {
                kind: 'text',
                content: encryptedData,
            });
        }
        this.emitDisplayNameUpdated(eventId, stateEmitter);
    }
    onConfirmEvent(eventId, emitter) {
        const event = this.displayNameEvents.get(eventId);
        if (!event) {
            return;
        }
        this.displayNameEvents.set(eventId, { ...event, pending: false });
        // if we don't have the plaintext display name, no need to emit an event
        if (this.plaintextDisplayNames.has(event.userId)) {
            this.log(`'streamDisplayNameUpdated' for userId ${event.userId}`);
            this.emitDisplayNameUpdated(eventId, emitter);
        }
    }
    onDecryptedContent(eventId, content, emitter) {
        const event = this.displayNameEvents.get(eventId);
        if (!event) {
            return;
        }
        this.log(`setting display name ${content} for user ${event.userId}`);
        this.plaintextDisplayNames.set(event.userId, content);
        this.emitDisplayNameUpdated(eventId, emitter);
    }
    emitDisplayNameUpdated(eventId, emitter) {
        const event = this.displayNameEvents.get(eventId);
        if (!event) {
            return;
        }
        // no information to emit — we haven't decrypted the display name yet
        if (!this.plaintextDisplayNames.has(event.userId)) {
            return;
        }
        // depending on confirmation status, emit different events
        emitter?.emit(event.pending ? 'streamPendingDisplayNameUpdated' : 'streamDisplayNameUpdated', this.streamId, event.userId);
    }
    removeEventForUserId(userId) {
        // remove any traces of old events for this user
        const eventId = this.userIdToEventId.get(userId);
        if (!eventId) {
            this.log(`no existing displayName event for user ${userId}`);
            return;
        }
        const event = this.displayNameEvents.get(eventId);
        if (!event) {
            this.log(`no existing event for user ${userId} — this is a programmer error`);
            return;
        }
        this.displayNameEvents.delete(eventId);
        this.log(`deleted old event for user ${userId}`);
    }
    addEventForUserId(userId, eventId, encryptedData, pending) {
        // add to the userId -> eventId mapping for fast lookup later
        this.userIdToEventId.set(userId, eventId);
        this.displayNameEvents.set(eventId, {
            userId,
            encryptedData: encryptedData,
            pending: pending,
        });
    }
    info(userId) {
        const displayName = this.plaintextDisplayNames.get(userId) ?? '';
        const displayNameEncrypted = !this.plaintextDisplayNames.has(userId) && this.userIdToEventId.has(userId);
        return { displayName, displayNameEncrypted };
    }
}
//# sourceMappingURL=userMetadata_DisplayNames.js.map