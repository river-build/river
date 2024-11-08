/**
 * @group main
 */

import { makeTestClient, createEventDecryptedPromise, waitFor } from './test-utils'
import { Client } from './client'
import { addressFromUserId, makeDMStreamId, streamIdAsBytes } from './id'
import { makeEvent } from './sign'
import { make_DMChannelPayload_Inception, make_MemberPayload_Membership2 } from './types'
import { MembershipOp } from '@river-build/proto'

describe('dmsTests', () => {
    let clients: Client[] = []
    const makeInitAndStartClient = async () => {
        const client = await makeTestClient()
        await client.initializeUser()
        client.startSync()
        clients.push(client)
        return client
    }

    beforeEach(async () => {})

    afterEach(async () => {
        for (const client of clients) {
            await client.stop()
        }
        clients = []
    })

    it('clientCanCreateDM', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)
        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )
    })

    it('clientsAreJoinedAutomaticallyAndCanLeaveDM', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)
        await waitFor(() => {
            expect(stream.view.getMembers().membership.joinedUsers).toEqual(
                new Set([bobsClient.userId, alicesClient.userId]),
            )
        })

        await expect(alicesClient.leaveStream(streamId)).resolves.not.toThrow()
        await waitFor(
            () => {
                expect(stream.view.getMembers().membership.joinedUsers).toEqual(
                    new Set([bobsClient.userId]),
                )
            },
            { timeoutMS: 15000 },
        )
    })

    it('clientsCanSendMessages', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(bobsClient.waitForStream(streamId)).resolves.not.toThrow()
        await expect(bobsClient.sendMessage(streamId, 'hello')).resolves.not.toThrow()

        await expect(alicesClient.waitForStream(streamId)).resolves.not.toThrow()
        await expect(alicesClient.sendMessage(streamId, 'hello')).resolves.not.toThrow()
    })

    it('otherUsersCantJoinDM', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const charliesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(
            charliesClient.joinStream(streamId, { skipWaitForMiniblockConfirmation: true }),
        ).rejects.toThrow()
    })

    it('otherUsersCantSendMessages', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const charliesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(
            charliesClient.joinStream(streamId, { skipWaitForMiniblockConfirmation: true }),
        ).rejects.toThrow()
        await expect(charliesClient.sendMessage(streamId, 'hello')).rejects.toThrow()
    })

    it('usersCantInviteOtherUsers', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const charliesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(bobsClient.inviteUser(streamId, charliesClient.userId)).rejects.toThrow()
    })

    it('creatingDMChannelTwiceReturnsStreamId', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(bobsClient.waitForStream(streamId)).resolves.not.toThrow()
        // stop syncing and remove stream from cache
        await bobsClient.streams.removeStreamFromSync(streamId)
        const { streamId: streamId2 } = await bobsClient.createDMChannel(alicesClient.userId)
        expect(streamId).toEqual(streamId2)
    })

    it('usersReceiveKeys', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(bobsClient.waitForStream(streamId)).resolves.not.toThrow()
        await expect(alicesClient.waitForStream(streamId)).resolves.not.toThrow()

        const aliceEventDecryptedPromise = createEventDecryptedPromise(
            alicesClient,
            'hello this is bob',
        )
        const bobEventDecryptedPromise = createEventDecryptedPromise(
            bobsClient,
            'hello bob, this is alice',
        )

        await expect(bobsClient.sendMessage(streamId, 'hello this is bob')).resolves.not.toThrow()
        await expect(
            alicesClient.sendMessage(streamId, 'hello bob, this is alice'),
        ).resolves.not.toThrow()

        await expect(
            Promise.all([aliceEventDecryptedPromise, bobEventDecryptedPromise]),
        ).resolves.not.toThrow()
    })

    it('clientCanCreateSingleParticipantDM', async () => {
        const bobsClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(bobsClient.userId)
        const stream = await bobsClient.waitForStream(streamId)
        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId]),
        )
    })

    // Alice should not be allowed to create a 1:1 DM between Bob and himself.
    it('clientCannotCreateSingleParticipantDMForOtherUser', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const channelIdStr = makeDMStreamId(bobsClient.userId, bobsClient.userId)
        const channelId = streamIdAsBytes(channelIdStr)
        const inceptionEvent = await makeEvent(
            alicesClient.signerContext,
            make_DMChannelPayload_Inception({
                streamId: channelId,
                firstPartyAddress: bobsClient.signerContext.creatorAddress,
                secondPartyAddress: addressFromUserId(bobsClient.userId),
            }),
        )

        const joinEvent = await makeEvent(
            alicesClient.signerContext,
            make_MemberPayload_Membership2({
                userId: bobsClient.userId,
                op: MembershipOp.SO_JOIN,
                initiatorId: bobsClient.userId,
            }),
        )

        const inviteEvent = await makeEvent(
            alicesClient.signerContext,
            make_MemberPayload_Membership2({
                userId: bobsClient.userId,
                op: MembershipOp.SO_JOIN,
                initiatorId: bobsClient.userId,
            }),
        )

        await expect(
            alicesClient.rpcClient.createStream({
                events: [inceptionEvent, joinEvent, inviteEvent],
                streamId: channelId,
            }),
        ).rejects.toThrow(new RegExp('creator must be first party for dm channel'))
    })
})
