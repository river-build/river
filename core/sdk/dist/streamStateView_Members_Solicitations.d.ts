import TypedEmitter from 'typed-emitter';
import { MemberPayload_KeyFulfillment, MemberPayload_KeySolicitation } from '@river-build/proto';
import { StreamEncryptionEvents } from './streamEvents';
import { StreamMember } from './streamStateView_Members';
export declare class StreamStateView_Members_Solicitations {
    readonly streamId: string;
    constructor(streamId: string);
    initSolicitations(members: StreamMember[], encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    applySolicitation(user: StreamMember, solicitation: MemberPayload_KeySolicitation, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    applyFulfillment(user: StreamMember, fulfillment: MemberPayload_KeyFulfillment, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
}
//# sourceMappingURL=streamStateView_Members_Solicitations.d.ts.map