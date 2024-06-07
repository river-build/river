import TypedEmitter from 'typed-emitter';
import { StreamStateEvents } from './streamEvents';
export declare class userMetadata_EnsAddresses {
    log: import("@river-build/dlog").DLogger;
    readonly streamId: string;
    readonly userIdToEventId: Map<string, string>;
    readonly confirmedEnsAddresses: Map<string, string>;
    readonly ensAddressEvents: Map<string, {
        ensAddress: Uint8Array;
        userId: string;
        pending: boolean;
    }>;
    constructor(streamId: string);
    applySnapshot(ensAddresses: {
        userId: string;
        ensAddress: Uint8Array;
    }[]): void;
    addEnsAddressEvent(eventId: string, ensAddress: Uint8Array, userId: string, pending: boolean, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onConfirmEvent(eventId: string, emitter?: TypedEmitter<StreamStateEvents>): void;
    private emitEnsAddressUpdated;
    private removeEventForUserId;
    private addEventForUserId;
    info(userId: string): string | undefined;
}
//# sourceMappingURL=userMetadata_EnsAddresses.d.ts.map