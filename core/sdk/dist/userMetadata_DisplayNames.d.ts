import { EncryptedData } from '@river-build/proto';
import TypedEmitter from 'typed-emitter';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
export declare class UserMetadata_DisplayNames {
    log: import("@river-build/dlog").DLogger;
    readonly streamId: string;
    readonly userIdToEventId: Map<string, string>;
    readonly plaintextDisplayNames: Map<string, string>;
    readonly displayNameEvents: Map<string, {
        encryptedData: EncryptedData;
        userId: string;
        pending: boolean;
    }>;
    constructor(streamId: string);
    addEncryptedData(eventId: string, encryptedData: EncryptedData, userId: string, pending: boolean | undefined, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onConfirmEvent(eventId: string, emitter?: TypedEmitter<StreamStateEvents>): void;
    onDecryptedContent(eventId: string, content: string, emitter?: TypedEmitter<StreamStateEvents>): void;
    private emitDisplayNameUpdated;
    private removeEventForUserId;
    private addEventForUserId;
    info(userId: string): {
        displayName: string;
        displayNameEncrypted: boolean;
    };
}
//# sourceMappingURL=userMetadata_DisplayNames.d.ts.map