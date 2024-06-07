import { WrappedEncryptedData as WrappedEncryptedData, EncryptedData, MemberPayload_Nft } from '@river-build/proto';
import TypedEmitter from 'typed-emitter';
import { ConfirmedTimelineEvent, RemoteTimelineEvent } from './types';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
import { UserMetadata_Usernames } from './userMetadata_Usernames';
import { UserMetadata_DisplayNames } from './userMetadata_DisplayNames';
import { userMetadata_EnsAddresses } from './userMetadata_EnsAddresses';
import { userMetadata_Nft } from './userMetadata_Nft';
export declare class StreamStateView_UserMetadata {
    readonly usernames: UserMetadata_Usernames;
    readonly displayNames: UserMetadata_DisplayNames;
    readonly ensAddresses: userMetadata_EnsAddresses;
    readonly nfts: userMetadata_Nft;
    constructor(streamId: string);
    applySnapshot(usernames: {
        userId: string;
        wrappedEncryptedData: WrappedEncryptedData;
    }[], displayNames: {
        userId: string;
        wrappedEncryptedData: WrappedEncryptedData;
    }[], ensAddresses: {
        userId: string;
        ensAddress: Uint8Array;
    }[], nfts: {
        userId: string;
        nft: MemberPayload_Nft;
    }[], cleartexts: Record<string, string> | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    onConfirmedEvent(confirmedEvent: ConfirmedTimelineEvent, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    prependEvent(_event: RemoteTimelineEvent, _cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendDisplayName(eventId: string, data: EncryptedData, userId: string, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendUsername(eventId: string, data: EncryptedData, userId: string, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendEnsAddress(eventId: string, EnsAddress: Uint8Array, userId: string, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendNft(eventId: string, nft: MemberPayload_Nft, userId: string, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onDecryptedContent(eventId: string, content: string, emitter?: TypedEmitter<StreamStateEvents>): void;
    userInfo(userId: string): {
        username: string;
        usernameConfirmed: boolean;
        usernameEncrypted: boolean;
        displayName: string;
        displayNameEncrypted: boolean;
        ensAddress?: string;
        nft?: {
            chainId: number;
            tokenId: string;
            contractAddress: string;
        };
    };
}
//# sourceMappingURL=streamStateView_UserMetadata.d.ts.map