import TypedEmitter from 'typed-emitter';
import { MemberPayload_Nft } from '@river-build/proto';
import { StreamStateEvents } from './streamEvents';
export declare class userMetadata_Nft {
    log: import("@river-build/dlog").DLogger;
    readonly streamId: string;
    readonly userIdToEventId: Map<string, string>;
    readonly confirmedNfts: Map<string, MemberPayload_Nft>;
    readonly nftEvents: Map<string, {
        nft: MemberPayload_Nft;
        userId: string;
        pending: boolean;
    }>;
    constructor(streamId: string);
    applySnapshot(nfts: {
        userId: string;
        nft: MemberPayload_Nft;
    }[]): void;
    addNftEvent(eventId: string, nft: MemberPayload_Nft, userId: string, pending: boolean, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    private removeEventForUserId;
    onConfirmEvent(eventId: string, emitter?: TypedEmitter<StreamStateEvents>): void;
    private addEventForUserId;
    private emitNftUpdated;
    info(userId: string): {
        tokenId: string;
        contractAddress: string;
        chainId: number;
    } | undefined;
    isValidNft(nft: MemberPayload_Nft): boolean;
}
//# sourceMappingURL=userMetadata_Nft.d.ts.map