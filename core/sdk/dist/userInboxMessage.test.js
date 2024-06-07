/**
 * @group main
 */
import { makeDonePromise, makeTestClient, makeUniqueSpaceStreamId } from './util.test';
import { dlog } from '@river-build/dlog';
import { makeUniqueChannelStreamId, streamIdAsString } from './id';
const log = dlog('test:inboxMessage');
describe('inboxMessageTest', () => {
    let bobsClient;
    let alicesClient;
    beforeEach(async () => {
        bobsClient = await makeTestClient();
        alicesClient = await makeTestClient();
    });
    afterEach(async () => {
        await bobsClient.stop();
        await alicesClient.stop();
    });
    test('bobSendsAliceInboxMessage', async () => {
        log('bobSendsAliceInboxMessage');
        // Bob gets created, creates a space, and creates a channel.
        await expect(bobsClient.initializeUser()).toResolve();
        bobsClient.startSync();
        // Alice gets created.
        await expect(alicesClient.initializeUser()).toResolve();
        const aliceUserStreamId = alicesClient.userStreamId;
        log('aliceUserStreamId', aliceUserStreamId);
        alicesClient.startSync();
        const fakeStreamId = makeUniqueChannelStreamId(makeUniqueSpaceStreamId());
        const aliceSelfInbox = makeDonePromise();
        alicesClient.once('newGroupSessions', (sessions, senderUserId) => {
            log('inboxMessage for Alice', sessions, senderUserId);
            aliceSelfInbox.runAndDone(() => {
                expect(senderUserId).toEqual(bobsClient.userId);
                expect(streamIdAsString(sessions.streamId)).toEqual(fakeStreamId);
                expect(sessions.sessionIds).toEqual(['300']);
                expect(sessions.ciphertexts[alicesClient.userDeviceKey().deviceKey]).toBeDefined();
            });
        });
        const recipients = {};
        recipients[alicesClient.userId] = [alicesClient.userDeviceKey()];
        // bob sends a message to Alice's device.
        await expect(bobsClient.encryptAndShareGroupSessions(fakeStreamId, [
            {
                streamId: fakeStreamId,
                sessionId: '300',
                sessionKey: '400',
                algorithm: '',
            },
        ], recipients)).toResolve();
        await aliceSelfInbox.expectToSucceed();
    });
});
//# sourceMappingURL=userInboxMessage.test.js.map