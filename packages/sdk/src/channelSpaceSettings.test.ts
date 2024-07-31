/**
 * @group main
 */

import { setupWalletsAndContexts, createSpaceAndDefaultChannel, everyoneMembershipStruct, createChannel, waitFor } from './util.test'
import { Client } from './client'
import { check } from '@river-build/dlog'

describe ('channelSpaceSettingsTests', () => {
    test('autojoin channels', async () => {
        const { bob, bobProvider, bobSpaceDapp } = await setupWalletsAndContexts()
        const everyoneMembership = await everyoneMembershipStruct(bobSpaceDapp, bob)
        
        bob.on('spaceChannelAutojoinUpdated', (spaceId, channelId, autojoin) => {
            console.log("spaceChannelAutojoinUpdated", spaceId, channelId, autojoin)
        })
        console.log("creating town and default channel")
        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            "bob's town",
            everyoneMembership,
        )
        console.log("town and default channel created")

        const { channelId: channel1Id, error } = await createChannel(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            "channel1",
            [1], // member role created on town creation
            bobProvider.wallet,
        )
        expect(error).toBeUndefined()

        const { channelId: channel2Id, error: error2 } = await createChannel(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            "channel2",
            [1], // member role created on town creation
            bobProvider.wallet,
        )
        expect(error2).toBeUndefined()

        const spaceStream = bob.streams.get(spaceId)
        expect(spaceStream).toBeDefined()
        const spaceStreamView = spaceStream!.view.spaceContent
        expect(spaceStreamView).toBeDefined()

        // Expect channel state to sync to space stream view
        await waitFor(() => {
            const channelMetadata = spaceStreamView.spaceChannelsMetadata
            check(channelMetadata.size === 3)
            check(channelMetadata.get(defaultChannelId)?.isAutojoin === true)
            check(channelMetadata.get(channel1Id!)?.isAutojoin === false)
            check(channelMetadata.get(channel2Id!)?.isAutojoin === false)
        })

        // create space, two non-default channels
        // set listener on client for autojoin changes
        // check channel setting on space stream -> default channel should be autojoin
        // any other channels are not

        // set one non-default channel to autojoin
        // validate that the autojoin channel has setting updated in local
        // client event emitted with expected values
        // space stream view

        // alice joins space
        // is autojoined to autojoin channels - default, and the one set to autojoin
        // is not autojoined to non-autojoin channel
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