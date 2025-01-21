import type { GroupSessionExtraData } from './encryptionDevice'

import { DecryptionAlgorithm, DecryptionError, IDecryptionParams } from './base'
import { GroupEncryptionAlgorithmId, GroupEncryptionSession } from './olmLib'
import { EncryptedData } from '@river-build/proto'
import { bin_fromHexString, dlog } from '@river-build/dlog'

const log = dlog('csb:encryption:groupDecryption')

/**
 * Group decryption implementation
 *
 * @param params - parameters, as per {@link DecryptionAlgorithm}
 */
export class GroupDecryption extends DecryptionAlgorithm {
    public readonly algorithm = GroupEncryptionAlgorithmId.GroupEncryption
    public constructor(params: IDecryptionParams) {
        super(params)
    }

    /**
     * returns a promise which resolves to a
     * {@link EventDecryptionResult} once we have finished
     * decrypting, or rejects with an `algorithms.DecryptionError` if there is a
     * problem decrypting the event.
     */
    public async decrypt(streamId: string, content: EncryptedData): Promise<Uint8Array> {
        if (!content.senderKey || !content.sessionId || !content.ciphertext) {
            throw new DecryptionError('GROUP_DECRYPTION_MISSING_FIELDS', 'Missing fields in input')
        }

        const { session } = await this.device.getInboundGroupSession(streamId, content.sessionId)

        if (!session) {
            throw new Error('Session not found')
        }

        // for historical reasons, we return the plaintext as a string
        const result = session.decrypt(content.ciphertext)

        if (content.dataType && content.dataType.length > 0) {
            // v2 encrypted data, should be a hex string
            return bin_fromHexString(result.plaintext)
        } else {
            // deprecated v1 - these were encoded with toJsonString()... return encoded for api reasons
            return new TextEncoder().encode(result.plaintext)
        }
    }

    /**
     * @param streamId - the stream id of the session
     * @param session- the group session object
     */
    public async importStreamKey(streamId: string, session: GroupEncryptionSession): Promise<void> {
        const extraSessionData: GroupSessionExtraData = {}
        try {
            await this.device.addInboundGroupSession(
                streamId,
                session.sessionId,
                session.sessionKey,
                // sender claimed keys not yet supported
                {} as Record<string, string>,
                false,
                extraSessionData,
            )
        } catch (e) {
            log(`Error handling room key import: ${(<Error>e).message}`)
        }
    }

    /** */
    public async exportGroupSession(
        streamId: string,
        sessionId: string,
    ): Promise<GroupEncryptionSession | undefined> {
        return this.device.exportInboundGroupSession(streamId, sessionId)
    }

    /** */
    public exportGroupSessions(): Promise<GroupEncryptionSession[]> {
        return this.device.exportInboundGroupSessions()
    }

    /** */
    public exportGroupSessionIds(streamId: string): Promise<string[]> {
        return this.device.getInboundGroupSessionIds(streamId)
    }

    /** */
    public async hasSessionKey(streamId: string, sessionId: string): Promise<boolean> {
        return this.device.hasInboundSessionKeys(streamId, sessionId)
    }
}
