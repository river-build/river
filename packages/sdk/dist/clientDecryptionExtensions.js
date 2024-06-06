import { BaseDecryptionExtensions, } from '@river-build/encryption';
import { make_MemberPayload_KeyFulfillment, make_MemberPayload_KeySolicitation } from './types';
import { Permission } from '@river-build/web3';
import { check } from '@river-build/dlog';
import chunk from 'lodash/chunk';
import { isDefined } from './check';
import { isMobileSafari } from './utils';
export class ClientDecryptionExtensions extends BaseDecryptionExtensions {
    client;
    isMobileSafariBackgrounded = false;
    constructor(client, crypto, delegate, userId, userDevice) {
        const upToDateStreams = new Set();
        client.streams.getStreams().forEach((stream) => {
            if (stream.isUpToDate) {
                upToDateStreams.add(stream.streamId);
            }
        });
        super(client, crypto, delegate, userDevice, userId, upToDateStreams);
        this.client = client;
        const onMembershipChange = (streamId, userId) => {
            if (userId === this.userId) {
                this.retryDecryptionFailures(streamId);
            }
        };
        const onStreamUpToDate = (streamId) => this.setStreamUpToDate(streamId);
        const onNewGroupSessions = (sessions, senderId) => this.enqueueNewGroupSessions(sessions, senderId);
        const onNewEncryptedContent = (streamId, eventId, content) => this.enqueueNewEncryptedContent(streamId, eventId, content.kind, content.content);
        const onKeySolicitation = (streamId, fromUserId, fromUserAddress, keySolicitation) => this.enqueueKeySolicitation(streamId, fromUserId, fromUserAddress, keySolicitation);
        client.on('streamUpToDate', onStreamUpToDate);
        client.on('newGroupSessions', onNewGroupSessions);
        client.on('newEncryptedContent', onNewEncryptedContent);
        client.on('newKeySolicitation', onKeySolicitation);
        client.on('updatedKeySolicitation', onKeySolicitation);
        client.on('streamNewUserJoined', onMembershipChange);
        this._onStopFn = () => {
            client.off('streamUpToDate', onStreamUpToDate);
            client.off('newGroupSessions', onNewGroupSessions);
            client.off('newEncryptedContent', onNewEncryptedContent);
            client.off('newKeySolicitation', onKeySolicitation);
            client.off('updatedKeySolicitation', onKeySolicitation);
            client.off('streamNewUserJoined', onMembershipChange);
        };
        this.log.debug('new ClientDecryptionExtensions', { userDevice });
    }
    hasStream(streamId) {
        const stream = this.client.stream(streamId);
        return isDefined(stream);
    }
    isUserInboxStreamUpToDate(upToDateStreams) {
        return (this.client.userInboxStreamId !== undefined &&
            upToDateStreams.has(this.client.userInboxStreamId));
    }
    shouldPauseTicking() {
        return this.isMobileSafariBackgrounded;
    }
    async decryptGroupEvent(streamId, eventId, kind, // kind of data
    encryptedData) {
        return this.client.decryptGroupEvent(streamId, eventId, kind, encryptedData);
    }
    downloadNewMessages() {
        return this.client.downloadNewInboxMessages();
    }
    getKeySolicitations(streamId) {
        const stream = this.client.stream(streamId);
        return stream?.view.getMembers().joined.get(this.userId)?.solicitations ?? [];
    }
    /**
     * Override the default implementation to use the number of members in the stream
     * to determine the delay time.
     */
    getRespondDelayMSForKeySolicitation(streamId, userId) {
        const multiplier = userId === this.userId ? 0.5 : 1;
        const stream = this.client.stream(streamId);
        check(isDefined(stream), 'stream not found');
        const numMembers = stream.view.getMembers().participants().size;
        const maxWaitTimeSeconds = Math.max(5, Math.min(30, numMembers));
        const waitTime = maxWaitTimeSeconds * 1000 * Math.random(); // this could be much better
        this.log.debug('getRespondDelayMSForKeySolicitation', { streamId, userId, waitTime });
        return waitTime * multiplier;
    }
    hasUnprocessedSession(item) {
        check(isDefined(this.client.userInboxStreamId), 'userInboxStreamId not found');
        const inboxStream = this.client.stream(this.client.userInboxStreamId);
        check(isDefined(inboxStream), 'inboxStream not found');
        return inboxStream.view.userInboxContent.hasPendingSessionId(this.userDevice.deviceKey, item.encryptedData.sessionId);
    }
    async isUserEntitledToKeyExchange(streamId, userId, opts) {
        const stream = this.client.stream(streamId);
        check(isDefined(stream), 'stream not found');
        if (!stream.view.userIsEntitledToKeyExchange(userId)) {
            this.log.info(`user ${userId} is not a member of stream ${streamId} and cannot request keys`);
            return false;
        }
        if (stream.view.contentKind === 'channelContent' &&
            !(opts?.skipOnChainValidation === true)) {
            const channel = stream.view.channelContent;
            const entitlements = await this.entitlementDelegate.isEntitled(channel.spaceId, streamId, userId, Permission.Read);
            if (!entitlements) {
                this.log.info('user is not entitled to key exchange');
                return false;
            }
        }
        return true;
    }
    onDecryptionError(item, err) {
        this.client.stream(item.streamId)?.view.updateDecryptedContentError(item.eventId, {
            missingSession: err.missingSession,
            kind: err.kind,
            encryptedData: item.encryptedData,
            error: err,
        }, this.client);
    }
    async ackNewGroupSession(_session) {
        return this.client.ackInboxStream();
    }
    async encryptAndShareGroupSessions({ streamId, item, sessions, }) {
        const chunked = chunk(sessions, 100);
        for (const chunk of chunked) {
            await this.client.encryptAndShareGroupSessions(streamId, chunk, {
                [item.fromUserId]: [
                    {
                        deviceKey: item.solicitation.deviceKey,
                        fallbackKey: item.solicitation.fallbackKey,
                    },
                ],
            });
        }
    }
    async sendKeySolicitation({ streamId, isNewDevice, missingSessionIds, }) {
        const keySolicitation = make_MemberPayload_KeySolicitation({
            deviceKey: this.userDevice.deviceKey,
            fallbackKey: this.userDevice.fallbackKey,
            isNewDevice,
            sessionIds: isNewDevice ? [] : missingSessionIds,
        });
        await this.client.makeEventAndAddToStream(streamId, keySolicitation);
    }
    async sendKeyFulfillment({ streamId, userAddress, deviceKey, sessionIds, }) {
        const fulfillment = make_MemberPayload_KeyFulfillment({
            userAddress: userAddress,
            deviceKey: deviceKey,
            sessionIds: sessionIds,
        });
        const { error } = await this.client.makeEventAndAddToStream(streamId, fulfillment, {
            optional: true,
        });
        return { error };
    }
    async uploadDeviceKeys() {
        await this.client.uploadDeviceKeys();
    }
    onStart() {
        if (isMobileSafari()) {
            document.addEventListener('visibilitychange', this.mobileSafariPageVisibilityChanged);
        }
    }
    onStop() {
        if (isMobileSafari()) {
            document.removeEventListener('visibilitychange', this.mobileSafariPageVisibilityChanged);
        }
        return Promise.resolve();
    }
    mobileSafariPageVisibilityChanged = () => {
        this.log.debug('onMobileSafariBackgrounded', this.isMobileSafariBackgrounded);
        this.isMobileSafariBackgrounded = document.visibilityState === 'hidden';
        if (!this.isMobileSafariBackgrounded) {
            this.checkStartTicking();
        }
    };
}
//# sourceMappingURL=clientDecryptionExtensions.js.map