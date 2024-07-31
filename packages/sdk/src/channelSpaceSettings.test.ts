/**
 * @group main
 */

import exp from 'constants'
import { setupWalletsAndContexts, createSpaceAndDefaultChannel, everyoneMembershipStruct, createChannel, waitFor, expectUserCanJoin } from './util.test'
import { check } from '@river-build/dlog'

describe ('channelSpaceSettingsTests', () => {
    test('autojoin channels', async () => {
        const { bob, bobProvider, bobSpaceDapp } = await setupWalletsAndContexts()
        const everyoneMembership = await everyoneMembershipStruct(bobSpaceDapp, bob)
        
        // Track autojoin state of channels via emitted client events
        const updatedChannelAutojoinState = new Map<string, boolean>()
        bob.on('spaceChannelAutojoinUpdated', (_spaceId, channelId, autojoin) => {
            updatedChannelAutojoinState.set(channelId, autojoin)
        })

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            "bob's town",
            everyoneMembership,
        )

        const { channelId: channel1Id, error } = await 
        createChannel(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            "channel1",
            [1], // member role created on town creation
            bobProvider.wallet,
        )
        expect(error).toBeUndefined()
        const { streamId: channelStream1Id } = await bob.createChannel(
            spaceId,
            "channel1",
            "channel1 topic",
            channel1Id!,
        )
        expect(channelStream1Id).toEqual(channel1Id)

        const spaceStream = bob.streams.get(spaceId)
        expect(spaceStream).toBeDefined()
        const spaceStreamView = spaceStream!.view.spaceContent
        expect(spaceStreamView).toBeDefined()

        // All autojoin state should be false by default
        await waitFor(() => {
            const channelMetadata = spaceStreamView.spaceChannelsMetadata
            console.log("channelMetadata", channelMetadata)
            check(channelMetadata.size === 2)
            check(channelMetadata.get(defaultChannelId)?.isAutojoin === false)
            check(channelMetadata.get(channel1Id!)?.isAutojoin === false)
        })

        // Set channel1 to autojoin=true
        const { eventId, error: error3 } = await bob.updateChannelAutojoin(
            spaceId,
            channel1Id!,
            true,
        )
        expect(error3).toBeUndefined()
        expect(eventId).toBeDefined()


        // Validate autojoin event was emitted for channel1
        expect(updatedChannelAutojoinState.size).toBe(1)
        expect(updatedChannelAutojoinState.get(channel1Id!)).toBe(true)


        // Expect autojoin change to sync to space stream view
        await waitFor(() => {
            const channelMetadata = spaceStreamView.spaceChannelsMetadata
            check(channelMetadata.get(channel1Id!)?.isAutojoin === true)
        })
            })

    test.only('unpermitted user cannot update channel autojoin', async () => {
        const { bob, bobProvider, bobSpaceDapp, alice, aliceSpaceDapp, aliceProvider } = await setupWalletsAndContexts()
        const everyoneMembership = await everyoneMembershipStruct(bobSpaceDapp, bob)
        
        console.log("Bob about to create stuff")
        console.log("Bob wallet", bobProvider.wallet.address)
        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            "bob's town",
            everyoneMembership,
        )
        console.log("Bob has created space and default channel, is member of both")
        console.log("Bob wallet", bobProvider.wallet.address)
        console.log("spaceId", spaceId)
        console.log("defaultChannelId", defaultChannelId)
        console.log("Alice wallet", aliceProvider.wallet.address)

        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            aliceProvider.wallet.address,
            aliceProvider.wallet,
        )

        const { eventId, error } = await alice.updateChannelAutojoin(
            spaceId,
            defaultChannelId,
            false,
        )
        expect(error).toBeDefined()
        expect(eventId).toBeUndefined()
        expect(error?.code).toBe('ERR_STREAM_BAD_EVENT')
    })

    test('showUserJoinLeaveEvents on channels', async () => {
        // create space, two non-default channels
        // hook into client to listen for updates to channel settings
        // all channels should have showUserJoinLeaveEvents set to true

        // set default, one channel to false
        // validate the cached client state of space stream view has updated
        // client event should be emitted
    })
})