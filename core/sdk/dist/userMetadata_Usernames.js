import { usernameChecksum } from './utils';
import { dlog } from '@river-build/dlog';
export class UserMetadata_Usernames {
    log = dlog('csb:streams:usernames');
    streamId;
    plaintextUsernames = new Map();
    userIdToEventId = new Map();
    confirmedUserIds = new Set();
    usernameEvents = new Map();
    checksums = new Set();
    constructor(streamId) {
        this.streamId = streamId;
    }
    setLocalUsername(userId, username, emitter) {
        this.plaintextUsernames.set(userId, username);
        emitter?.emit('streamPendingUsernameUpdated', this.streamId, userId);
    }
    resetLocalUsername(userId, emitter) {
        this.plaintextUsernames.delete(userId);
        emitter?.emit('streamPendingUsernameUpdated', this.streamId, userId);
    }
    addEncryptedData(eventId, encryptedData, userId, pending = true, cleartext, encryptionEmitter, stateEmitter) {
        if (!encryptedData.checksum) {
            this.log('no checksum in encrypted data');
            return;
        }
        if (!this.usernameAvailable(encryptedData.checksum)) {
            this.log(`username not available for checksum ${encryptedData.checksum}`);
            return;
        }
        this.removeUsernameEventForUserId(userId);
        this.addUsernameEventForUserId(userId, eventId, encryptedData, pending);
        if (cleartext) {
            this.plaintextUsernames.set(userId, cleartext);
        }
        else {
            // Clear the plaintext username for this user on name change
            this.plaintextUsernames.delete(userId);
            encryptionEmitter?.emit('newEncryptedContent', this.streamId, eventId, {
                kind: 'text',
                content: encryptedData,
            });
        }
        if (!pending) {
            this.confirmedUserIds.add(userId);
        }
        this.emitUsernameUpdated(eventId, stateEmitter);
    }
    onConfirmEvent(eventId, emitter) {
        const event = this.usernameEvents.get(eventId);
        if (!event) {
            return;
        }
        this.usernameEvents.set(eventId, { ...event, pending: false });
        this.confirmedUserIds.add(event.userId);
        // if we don't have the plaintext username, no need to emit an event
        if (this.plaintextUsernames.has(event.userId)) {
            this.log(`'streamUsernameUpdated' for userId ${event.userId}`);
            this.emitUsernameUpdated(eventId, emitter);
        }
    }
    onDecryptedContent(eventId, content, emitter) {
        const event = this.usernameEvents.get(eventId);
        if (!event) {
            return;
        }
        const checksum = event.encryptedData.checksum;
        if (!checksum) {
            return;
        }
        // If the checksum doesn't match, we don't want to update the username
        const calculatedChecksum = usernameChecksum(content, this.streamId);
        if (checksum !== calculatedChecksum) {
            this.log(`checksum mismatch for userId: ${event.userId}, username: ${content}`);
            return;
        }
        this.log(`setting username ${content} for user ${event.userId}`);
        this.plaintextUsernames.set(event.userId, content);
        this.emitUsernameUpdated(eventId, emitter);
    }
    cleartextUsernameAvailable(username) {
        const checksum = usernameChecksum(username, this.streamId);
        return this.usernameAvailable(checksum);
    }
    usernameAvailable(checksum) {
        return !this.checksums.has(checksum);
    }
    emitUsernameUpdated(eventId, emitter) {
        const event = this.usernameEvents.get(eventId);
        if (!event) {
            return;
        }
        // no information to emit — we haven't decrypted the username yet
        if (!this.plaintextUsernames.has(event.userId)) {
            return;
        }
        // depending on confirmation status, emit different events
        emitter?.emit(event.pending ? 'streamPendingUsernameUpdated' : 'streamUsernameUpdated', this.streamId, event.userId);
    }
    removeUsernameEventForUserId(userId) {
        // remove any traces of old events for this user
        // we do this because unused usernames should be freed up for other users to use
        const eventId = this.userIdToEventId.get(userId);
        if (!eventId) {
            this.log(`no existing username event for user ${userId}`);
            return;
        }
        const event = this.usernameEvents.get(eventId);
        if (!event) {
            this.log(`no existing username event for user ${userId} — this is a programmer error`);
            return;
        }
        this.checksums.delete(event.encryptedData.checksum ?? '');
        this.usernameEvents.delete(eventId);
        this.log(`deleted old username event for user ${userId}`);
    }
    addUsernameEventForUserId(userId, eventId, encryptedData, pending) {
        if (!encryptedData.checksum) {
            this.log('no checksum in encrypted data');
            return;
        }
        // add to the userId -> eventId mapping for fast lookup later
        this.userIdToEventId.set(userId, eventId);
        // Set the checksum. This user has now claimed this checksum
        // and no other users are able to use a username with the same checksum
        this.checksums.add(encryptedData.checksum);
        this.usernameEvents.set(eventId, {
            userId,
            encryptedData: encryptedData,
            pending: pending,
        });
    }
    info(userId) {
        const name = this.plaintextUsernames.get(userId) ?? '';
        const eventId = this.userIdToEventId.get(userId);
        if (!eventId) {
            return {
                username: name,
                usernameConfirmed: false,
                usernameEncrypted: false,
            };
        }
        const encrypted = this.usernameEvents.has(eventId) && !this.plaintextUsernames.has(userId);
        return {
            username: name,
            usernameConfirmed: this.confirmedUserIds.has(userId),
            usernameEncrypted: encrypted,
        };
    }
}
//# sourceMappingURL=userMetadata_Usernames.js.map