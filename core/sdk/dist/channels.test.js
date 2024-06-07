/**
 * @group main
 */
import { getChannelMessagePayload, makeTestClient, makeUniqueSpaceStreamId, waitFor, } from './util.test';
import { makeUniqueChannelStreamId } from './id';
import { bin_toHexString } from '@river-build/dlog';
describe('channelsTests', () => {
    let bobsClient;
    let alicesClient;
    beforeEach(async () => {
        bobsClient = await makeTestClient();
        await bobsClient.initializeUser();
        bobsClient.startSync();
        alicesClient = await makeTestClient();
        await alicesClient.initializeUser();
        alicesClient.startSync();
    });
    afterEach(async () => {
        await bobsClient.stop();
        await alicesClient.stop();
    });
    test('clientsCanSendRedactionEvents', async () => {
        const spaceId = makeUniqueSpaceStreamId();
        await expect(bobsClient.createSpace(spaceId)).toResolve();
        const channelId = makeUniqueChannelStreamId(spaceId);
        await expect(bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId)).toResolve();
        await bobsClient.sendMessage(channelId, 'Very bad message!');
        const stream = await bobsClient.waitForStream(channelId);
        let eventId;
        await waitFor(() => {
            const event = stream.view.timeline.find((e) => getChannelMessagePayload(e.localEvent?.channelMessage) === 'Very bad message!');
            expect(event).toBeDefined();
            eventId = event?.hashStr;
        });
        expect(stream).toBeDefined();
        expect(eventId).toBeDefined();
        await expect(bobsClient.redactMessage(channelId, eventId)).toResolve();
        await waitFor(() => {
            const event = stream.view.timeline.find((e) => e.remoteEvent?.event.payload.case === 'channelPayload' &&
                e.remoteEvent.event.payload.value.content.case === 'redaction' &&
                bin_toHexString(e.remoteEvent.event.payload.value.content.value.eventId) ===
                    eventId);
            expect(event).toBeDefined();
        });
    });
});
//# sourceMappingURL=channels.test.js.map