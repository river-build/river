import { bin_toString, dlog } from '@river-build/dlog';
import { userIdFromAddress } from './id';
export class userMetadata_Nft {
    log = dlog('csb:streams:Nft');
    streamId;
    userIdToEventId = new Map();
    confirmedNfts = new Map();
    nftEvents = new Map();
    constructor(streamId) {
        this.streamId = streamId;
    }
    applySnapshot(nfts) {
        for (const item of nfts) {
            if (this.isValidNft(item.nft)) {
                this.confirmedNfts.set(item.userId, item.nft);
            }
        }
    }
    addNftEvent(eventId, nft, userId, pending, stateEmitter) {
        this.removeEventForUserId(userId);
        if (!pending) {
            if (this.isValidNft(nft)) {
                this.confirmedNfts.set(userId, nft);
            }
            else {
                this.confirmedNfts.delete(userId);
            }
        }
        this.addEventForUserId(userId, eventId, nft, pending);
        this.emitNftUpdated(eventId, stateEmitter);
    }
    removeEventForUserId(userId) {
        // remove any traces of old events for this user
        const eventId = this.userIdToEventId.get(userId);
        if (!eventId) {
            this.log(`no existing ens event for user ${userId}`);
            return;
        }
        const event = this.nftEvents.get(eventId);
        if (!event) {
            this.log(`no existing event for user ${userId} — this is a programmer error`);
            return;
        }
        this.nftEvents.delete(eventId);
        this.log(`deleted old event for user ${userId}`);
    }
    onConfirmEvent(eventId, emitter) {
        const event = this.nftEvents.get(eventId);
        if (!event) {
            return;
        }
        this.nftEvents.set(eventId, { ...event, pending: false });
        if (this.isValidNft(event.nft)) {
            this.confirmedNfts.set(event.userId, event.nft);
        }
        else {
            this.confirmedNfts.delete(event.userId);
        }
        this.emitNftUpdated(eventId, emitter);
    }
    addEventForUserId(userId, eventId, nft, pending) {
        // add to the userId -> eventId mapping for fast lookup later
        this.userIdToEventId.set(userId, eventId);
        this.nftEvents.set(eventId, {
            userId,
            nft: nft,
            pending: pending,
        });
    }
    emitNftUpdated(eventId, emitter) {
        const event = this.nftEvents.get(eventId);
        if (!event) {
            return;
        }
        if (event.pending) {
            return;
        }
        emitter?.emit('streamNftUpdated', this.streamId, event.userId);
    }
    info(userId) {
        const nft = this.confirmedNfts.get(userId);
        if (!nft) {
            return undefined;
        }
        return {
            tokenId: bin_toString(nft.tokenId),
            contractAddress: userIdFromAddress(nft.contractAddress),
            chainId: nft.chainId,
        };
    }
    isValidNft(nft) {
        return nft.tokenId.length > 0 && nft.contractAddress.length > 0 && nft.chainId > 0;
    }
}
//# sourceMappingURL=userMetadata_Nft.js.map