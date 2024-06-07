import { EncryptedData } from '@river-build/proto';
import { EncryptionAlgorithm, IEncryptionParams } from './base';
/** Note Jterzis 07/26/23: Several features are intentionally left out of this module,
 * that we may want to implement in the future:
 * 1. Shared History - We don't have a concept of "shared history visibility settings" in River.
 * 2. Backup Manager - We do not backup session keys to anything other than client-side storage.
 * 3. Blocking Devices - We do not block devices and therefore do not account for blocked devices here.
 * 4. Key Forwarding - River does not support key forwarding sessions created by another user's device.
 * 5. Cross Signing - River does not support cross signing yet. Each device is verified individually at this time.
 * 6. Sessions Rotation - River does not support active or periodic session rotation yet.
 */
/**
 * Group encryption implementation
 *
 * @param params - parameters, as per {@link EncryptionAlgorithm}
 */
export declare class GroupEncryption extends EncryptionAlgorithm {
    constructor(params: IEncryptionParams);
    ensureOutboundSession(streamId: string, opts?: {
        awaitInitialShareSession: boolean;
    }): Promise<void>;
    private shareSession;
    /**
     * @param content - plaintext event content
     *
     * @returns Promise which resolves to the new event body
     */
    encrypt(streamId: string, payload: string): Promise<EncryptedData>;
}
//# sourceMappingURL=groupEncryption.d.ts.map