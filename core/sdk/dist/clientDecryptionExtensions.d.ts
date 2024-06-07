import { BaseDecryptionExtensions, DecryptionSessionError, EncryptedContentItem, EntitlementsDelegate, GroupEncryptionCrypto, GroupSessionsData, KeyFulfilmentData, KeySolicitationContent, KeySolicitationData, UserDevice } from '@river-build/encryption';
import { EncryptedData, UserInboxPayload_GroupEncryptionSessions } from '@river-build/proto';
import { Client } from './client';
export declare class ClientDecryptionExtensions extends BaseDecryptionExtensions {
    private readonly client;
    private isMobileSafariBackgrounded;
    constructor(client: Client, crypto: GroupEncryptionCrypto, delegate: EntitlementsDelegate, userId: string, userDevice: UserDevice);
    hasStream(streamId: string): boolean;
    isUserInboxStreamUpToDate(upToDateStreams: Set<string>): boolean;
    shouldPauseTicking(): boolean;
    decryptGroupEvent(streamId: string, eventId: string, kind: string, // kind of data
    encryptedData: EncryptedData): Promise<void>;
    downloadNewMessages(): Promise<void>;
    getKeySolicitations(streamId: string): KeySolicitationContent[];
    /**
     * Override the default implementation to use the number of members in the stream
     * to determine the delay time.
     */
    getRespondDelayMSForKeySolicitation(streamId: string, userId: string): number;
    hasUnprocessedSession(item: EncryptedContentItem): boolean;
    isUserEntitledToKeyExchange(streamId: string, userId: string, opts?: {
        skipOnChainValidation: boolean;
    }): Promise<boolean>;
    onDecryptionError(item: EncryptedContentItem, err: DecryptionSessionError): void;
    ackNewGroupSession(_session: UserInboxPayload_GroupEncryptionSessions): Promise<void>;
    encryptAndShareGroupSessions({ streamId, item, sessions, }: GroupSessionsData): Promise<void>;
    sendKeySolicitation({ streamId, isNewDevice, missingSessionIds, }: KeySolicitationData): Promise<void>;
    sendKeyFulfillment({ streamId, userAddress, deviceKey, sessionIds, }: KeyFulfilmentData): Promise<void>;
    uploadDeviceKeys(): Promise<void>;
    onStart(): void;
    onStop(): Promise<void>;
    private mobileSafariPageVisibilityChanged;
}
//# sourceMappingURL=clientDecryptionExtensions.d.ts.map