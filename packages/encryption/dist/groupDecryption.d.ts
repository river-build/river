import { DecryptionAlgorithm, IDecryptionParams } from './base';
import { GroupEncryptionSession } from './olmLib';
import { EncryptedData } from '@river-build/proto';
/**
 * Group decryption implementation
 *
 * @param params - parameters, as per {@link DecryptionAlgorithm}
 */
export declare class GroupDecryption extends DecryptionAlgorithm {
    constructor(params: IDecryptionParams);
    /**
     * returns a promise which resolves to a
     * {@link EventDecryptionResult} once we have finished
     * decrypting, or rejects with an `algorithms.DecryptionError` if there is a
     * problem decrypting the event.
     */
    decrypt(streamId: string, content: EncryptedData): Promise<string>;
    /**
     * @param streamId - the stream id of the session
     * @param session- the group session object
     */
    importStreamKey(streamId: string, session: GroupEncryptionSession): Promise<void>;
}
//# sourceMappingURL=groupDecryption.d.ts.map