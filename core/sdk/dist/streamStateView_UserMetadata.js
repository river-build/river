import { UserMetadata_Usernames } from './userMetadata_Usernames';
import { UserMetadata_DisplayNames } from './userMetadata_DisplayNames';
import { bin_toHexString } from '@river-build/dlog';
import { userMetadata_EnsAddresses } from './userMetadata_EnsAddresses';
import { userMetadata_Nft } from './userMetadata_Nft';
export class StreamStateView_UserMetadata {
    usernames;
    displayNames;
    ensAddresses;
    nfts;
    constructor(streamId) {
        this.usernames = new UserMetadata_Usernames(streamId);
        this.displayNames = new UserMetadata_DisplayNames(streamId);
        this.ensAddresses = new userMetadata_EnsAddresses(streamId);
        this.nfts = new userMetadata_Nft(streamId);
    }
    applySnapshot(usernames, displayNames, ensAddresses, nfts, cleartexts, encryptionEmitter) {
        // Sort the payloads — this is necessary because we want to
        // make sure that whoever claimed a username first gets it.
        const sortedUsernames = sortPayloads(usernames);
        for (const payload of sortedUsernames) {
            if (!payload.wrappedEncryptedData.data) {
                continue;
            }
            const data = payload.wrappedEncryptedData.data;
            const userId = payload.userId;
            const eventId = bin_toHexString(payload.wrappedEncryptedData.eventHash);
            const clearText = cleartexts?.[eventId];
            this.usernames.addEncryptedData(eventId, data, userId, false, clearText, encryptionEmitter, undefined);
        }
        const sortedDisplayNames = sortPayloads(displayNames);
        for (const payload of sortedDisplayNames) {
            if (!payload.wrappedEncryptedData.data) {
                continue;
            }
            const data = payload.wrappedEncryptedData.data;
            const userId = payload.userId;
            const eventId = bin_toHexString(payload.wrappedEncryptedData.eventHash);
            const clearText = cleartexts?.[eventId];
            this.displayNames.addEncryptedData(eventId, data, userId, false, clearText, encryptionEmitter, undefined);
        }
        this.ensAddresses.applySnapshot(ensAddresses);
        this.nfts.applySnapshot(nfts);
    }
    onConfirmedEvent(confirmedEvent, stateEmitter) {
        const eventId = confirmedEvent.hashStr;
        this.usernames.onConfirmEvent(eventId, stateEmitter);
        this.displayNames.onConfirmEvent(eventId, stateEmitter);
        this.ensAddresses.onConfirmEvent(eventId, stateEmitter);
        this.nfts.onConfirmEvent(eventId, stateEmitter);
    }
    prependEvent(_event, _cleartext, _encryptionEmitter, _stateEmitter) {
        // usernames were conveyed in the snapshot
    }
    appendDisplayName(eventId, data, userId, cleartext, encryptionEmitter, stateEmitter) {
        this.displayNames.addEncryptedData(eventId, data, userId, true, cleartext, encryptionEmitter, stateEmitter);
    }
    appendUsername(eventId, data, userId, cleartext, encryptionEmitter, stateEmitter) {
        this.usernames.addEncryptedData(eventId, data, userId, true, cleartext, encryptionEmitter, stateEmitter);
    }
    appendEnsAddress(eventId, EnsAddress, userId, stateEmitter) {
        this.ensAddresses.addEnsAddressEvent(eventId, EnsAddress, userId, true, stateEmitter);
    }
    appendNft(eventId, nft, userId, stateEmitter) {
        this.nfts.addNftEvent(eventId, nft, userId, true, stateEmitter);
    }
    onDecryptedContent(eventId, content, emitter) {
        this.displayNames.onDecryptedContent(eventId, content, emitter);
        this.usernames.onDecryptedContent(eventId, content, emitter);
    }
    userInfo(userId) {
        const usernameInfo = this.usernames.info(userId);
        const displayNameInfo = this.displayNames.info(userId);
        const ensAddress = this.ensAddresses.info(userId);
        const nft = this.nfts.info(userId);
        return {
            ...usernameInfo,
            ...displayNameInfo,
            ensAddress,
            nft,
        };
    }
}
function sortPayloads(payloads) {
    return payloads.sort((a, b) => {
        if (a.wrappedEncryptedData.eventNum > b.wrappedEncryptedData.eventNum) {
            return 1;
        }
        else if (a.wrappedEncryptedData.eventNum < b.wrappedEncryptedData.eventNum) {
            return -1;
        }
        else {
            return 0;
        }
    });
}
//# sourceMappingURL=streamStateView_UserMetadata.js.map