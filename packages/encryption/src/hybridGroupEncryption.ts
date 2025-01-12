import { EncryptedData, HybridGroupSessionKey } from '@river-build/proto'
import { PlainMessage } from '@bufbuild/protobuf'
import { EncryptionAlgorithm, IEncryptionParams } from './base'
import { GroupEncryptionAlgorithmId } from './olmLib'
import { dlog } from '@river-build/dlog'
import { encryptAESCBCAsync } from './crypto_utils'

const log = dlog('csb:encryption:groupEncryption')

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
export class HybridGroupEncryption extends EncryptionAlgorithm {
    public readonly algorithm = GroupEncryptionAlgorithmId.HybridGroupEncryption
    public constructor(params: IEncryptionParams) {
        super(params)
    }

    public async ensureOutboundSession(
        streamId: string,
        opts?: { awaitInitialShareSession: boolean },
    ): Promise<void> {
        await this._ensureOutboundSession(streamId, opts)
    }

    public async _ensureOutboundSession(
        streamId: string,
        opts?: { awaitInitialShareSession: boolean },
    ): Promise<HybridGroupSessionKey> {
        try {
            const sessionKey = await this.device.getHybridGroupSessionKeyForStream(streamId)
            return sessionKey
        } catch (error) {
            const { miniblockNum, miniblockHash } = await this.client.getMiniblockInfo(streamId)
            // if we don't have a cached session at this point, create a new one
            const { sessionId, sessionKey } = await this.device.createHybridGroupSession(
                streamId,
                miniblockNum,
                miniblockHash,
            )
            log(`Started new hybrid group session ${sessionId}`)
            // don't wait for the session to be shared
            const promise = this.shareSession(streamId, sessionId)

            if (opts?.awaitInitialShareSession === true) {
                await promise
            } else {
                // await the promise but timeout after N seconds
                const waitTimeBeforeMovingOn = 30000
                await Promise.race([
                    promise,
                    new Promise<void>((resolve, _) =>
                        setTimeout(() => resolve(), waitTimeBeforeMovingOn),
                    ),
                ])
            }
            return sessionKey
        }
    }

    private async shareSession(streamId: string, sessionId: string): Promise<void> {
        const devicesInRoom = await this.client.getDevicesInStream(streamId)
        const session = await this.device.exportHybridGroupSession(
            streamId,
            sessionId,
            this.algorithm,
        )

        if (!session) {
            throw new Error('Session key not found for session ' + sessionId)
        }

        await this.client.encryptAndShareGroupSessions(
            streamId,
            [session],
            devicesInRoom,
            this.algorithm,
        )
    }

    /**
     * @param content - plaintext event content
     *
     * @returns Promise which resolves to the new event body
     */
    public async encrypt(streamId: string, payload: string): Promise<EncryptedData> {
        log('Starting to encrypt event')

        const sessionKey = await this._ensureOutboundSession(streamId)

        const ciphertext = await encryptAESCBCAsync(payload, sessionKey.key, sessionKey.iv)

        return new EncryptedData({
            algorithm: this.algorithm,
            senderKey: this.device.deviceCurve25519Key!,
            ciphertext: ciphertext,
            sessionId: sessionKey.sessionId,
        } satisfies PlainMessage<EncryptedData>)
    }
}
