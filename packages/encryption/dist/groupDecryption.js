import { DecryptionAlgorithm, DecryptionError } from './base';
import { dlog } from '@river-build/dlog';
const log = dlog('csb:encryption:groupDecryption');
/**
 * Group decryption implementation
 *
 * @param params - parameters, as per {@link DecryptionAlgorithm}
 */
export class GroupDecryption extends DecryptionAlgorithm {
    constructor(params) {
        super(params);
    }
    /**
     * returns a promise which resolves to a
     * {@link EventDecryptionResult} once we have finished
     * decrypting, or rejects with an `algorithms.DecryptionError` if there is a
     * problem decrypting the event.
     */
    async decrypt(streamId, content) {
        if (!content.senderKey || !content.sessionId || !content.ciphertext) {
            throw new DecryptionError('GROUP_DECRYPTION_MISSING_FIELDS', 'Missing fields in input');
        }
        const { session } = await this.device.getInboundGroupSession(streamId, content.sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        const result = session.decrypt(content.ciphertext);
        return result.plaintext;
    }
    /**
     * @param streamId - the stream id of the session
     * @param session- the group session object
     */
    async importStreamKey(streamId, session) {
        const extraSessionData = {};
        try {
            await this.device.addInboundGroupSession(streamId, session.sessionId, session.sessionKey, 
            // sender claimed keys not yet supported
            {}, false, extraSessionData);
        }
        catch (e) {
            log(`Error handling room key import: ${e.message}`);
        }
    }
}
//# sourceMappingURL=groupDecryption.js.map