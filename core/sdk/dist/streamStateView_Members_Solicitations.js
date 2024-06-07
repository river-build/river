import { removeCommon } from './utils';
export class StreamStateView_Members_Solicitations {
    streamId;
    constructor(streamId) {
        this.streamId = streamId;
    }
    initSolicitations(members, encryptionEmitter) {
        for (const member of members) {
            for (const event of member.solicitations) {
                encryptionEmitter?.emit('newKeySolicitation', this.streamId, member.userId, member.userAddress, event);
            }
        }
    }
    applySolicitation(user, solicitation, encryptionEmitter) {
        user.solicitations = user.solicitations.filter((x) => x.deviceKey !== solicitation.deviceKey);
        user.solicitations.push({
            deviceKey: solicitation.deviceKey,
            fallbackKey: solicitation.fallbackKey,
            isNewDevice: solicitation.isNewDevice,
            sessionIds: [...solicitation.sessionIds.sort()],
        });
        encryptionEmitter?.emit('newKeySolicitation', this.streamId, user.userId, user.userAddress, solicitation);
    }
    applyFulfillment(user, fulfillment, encryptionEmitter) {
        const index = user.solicitations.findIndex((x) => x.deviceKey === fulfillment.deviceKey);
        if (index === undefined || index === -1) {
            return;
        }
        const prev = user.solicitations[index];
        const newEvent = {
            deviceKey: prev.deviceKey,
            fallbackKey: prev.fallbackKey,
            isNewDevice: false,
            sessionIds: [...removeCommon(prev.sessionIds, fulfillment.sessionIds.sort())],
        };
        user.solicitations[index] = newEvent;
        encryptionEmitter?.emit('updatedKeySolicitation', this.streamId, user.userId, user.userAddress, newEvent);
    }
}
//# sourceMappingURL=streamStateView_Members_Solicitations.js.map