import TypedEmitter from 'typed-emitter';
import { EncryptedData } from '@river-build/proto';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
export declare class UserMetadata_Usernames {
    log: import("@river-build/dlog").DLogger;
    readonly streamId: string;
    readonly plaintextUsernames: Map<string, string>;
    readonly userIdToEventId: Map<string, string>;
    readonly confirmedUserIds: Set<string>;
    readonly usernameEvents: Map<string, {
        encryptedData: EncryptedData;
        userId: string;
        pending: boolean;
    }>;
    readonly checksums: Set<string>;
    constructor(streamId: string);
    setLocalUsername(userId: string, username: string, emitter?: TypedEmitter<StreamStateEvents>): void;
    resetLocalUsername(userId: string, emitter?: TypedEmitter<StreamStateEvents>): void;
    addEncryptedData(eventId: string, encryptedData: EncryptedData, userId: string, pending: boolean | undefined, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onConfirmEvent(eventId: string, emitter?: TypedEmitter<StreamStateEvents>): void;
    onDecryptedContent(eventId: string, content: string, emitter?: TypedEmitter<StreamStateEvents>): void;
    cleartextUsernameAvailable(username: string): boolean;
    usernameAvailable(checksum: string): boolean;
    private emitUsernameUpdated;
    private removeUsernameEventForUserId;
    private addUsernameEventForUserId;
    info(userId: string): {
        username: string;
        usernameConfirmed: boolean;
        usernameEncrypted: boolean;
    };
}
//# sourceMappingURL=userMetadata_Usernames.d.ts.map