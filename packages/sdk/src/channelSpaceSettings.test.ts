/**
 * @group main
 */

import exp from 'constants'
import {
    setupWalletsAndContexts,
    createSpaceAndDefaultChannel,
    everyoneMembershipStruct,
    createChannel,
    waitFor,
    expectUserCanJoin,
    createRole,
} from './util.test'
import { check } from '@river-build/dlog'
import { Permission, NoopRuleData } from '@river-build/web3'

describe('channelSpaceSettingsTests', () => {
    test('set autojoin for channel', async () => {
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

        // Create channel on contract
        const { channelId: channel1Id, error } = await createChannel(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'channel1',
            [1], // member role created on town creation
            bobProvider.wallet,
        )
        expect(error).toBeUndefined()

        // Create channel stream
        const { streamId: channelStream1Id } = await bob.createChannel(
            spaceId,
            'channel1',
            'channel1 topic',
            channel1Id!,
        )
        expect(channelStream1Id).toEqual(channel1Id)

        const spaceStream = bob.streams.get(spaceId)
        expect(spaceStream).toBeDefined()
        const spaceStreamView = spaceStream!.view.spaceContent
        expect(spaceStreamView).toBeDefined()

        // Default channel only should be autojoin by default
        await waitFor(() => {
            const channelMetadata = spaceStreamView.spaceChannelsMetadata
            console.log('channelMetadata', channelMetadata)
            check(channelMetadata.size === 2)
            check(channelMetadata.get(defaultChannelId)?.isAutojoin === true)
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

    test('unpermitted user cannot update channel autojoin', async () => {
        const {
            bob,
            bobProvider,
            bobSpaceDapp,
            alice,
            aliceSpaceDapp,
            aliceProvider,
            carol,
            carolsWallet,
            carolProvider,
            carolSpaceDapp,
        } = await setupWalletsAndContexts()
        const everyoneMembership = await everyoneMembershipStruct(bobSpaceDapp, bob)

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            "bob's town",
            everyoneMembership,
        )

        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            aliceProvider.wallet.address,
            aliceProvider.wallet,
        )

        await expect(alice.updateChannelAutojoin(spaceId, defaultChannelId, false)).rejects.toThrow(
            /7:PERMISSION_DENIED/,
        )

        // Add Carol to a role that gives her AddRemoveChannels permission so she can update autojoin
        const { roleId, error: roleError } = await createRole(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'gated role',
            [Permission.AddRemoveChannels],
            [carolsWallet.address],
            NoopRuleData,
            bobProvider.wallet,
        )
        expect(roleError).toBeUndefined()

        // Add Carol to the space
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'carol',
            carol,
            carolSpaceDapp,
            carolProvider.wallet.address,
            carolProvider.wallet,
        )

        await expect(carol.updateChannelAutojoin(spaceId, defaultChannelId, false)).toResolve()

        // Validate autojoin event was applied on client
        const spaceStream = bob.streams.get(spaceId)
        expect(spaceStream).toBeDefined()
        const spaceStreamView = spaceStream!.view.spaceContent
        expect(spaceStreamView).toBeDefined()
        await waitFor(() => {
            const channelMetadata = spaceStreamView.spaceChannelsMetadata
            check(channelMetadata.size === 1)
            check(channelMetadata.get(defaultChannelId)?.isAutojoin === false)
        })
    })

    test('set showUserJoinLeaveEvents on channels', async () => {
        const { bob, bobProvider, bobSpaceDapp } = await setupWalletsAndContexts()
        const everyoneMembership = await everyoneMembershipStruct(bobSpaceDapp, bob)

        // Track showJoinLeaveEvent state of channels via emitted client events
        const updatedChannelShowJoinLeaveEventsState = new Map<string, boolean>()
        bob.on(
            'spaceChannelShowUserJoinLeaveEventsUpdated',
            (_spaceId, channelId, showJoinLeaveEvents) => {
                updatedChannelShowJoinLeaveEventsState.set(channelId, showJoinLeaveEvents)
            },
        )

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            "bob's town",
            everyoneMembership,
        )

        // Create channel on contract
        const { channelId: channel1Id, error } = await createChannel(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'channel1',
            [1], // member role created on town creation
            bobProvider.wallet,
        )
        expect(error).toBeUndefined()

        // Create channel stream
        const { streamId: channelStream1Id } = await bob.createChannel(
            spaceId,
            'channel1',
            'channel1 topic',
            channel1Id!,
        )
        expect(channelStream1Id).toEqual(channel1Id)

        const spaceStream = bob.streams.get(spaceId)
        expect(spaceStream).toBeDefined()
        const spaceStreamView = spaceStream!.view.spaceContent
        expect(spaceStreamView).toBeDefined()

        // All channels show join/leave events by default
        await waitFor(() => {
            const channelMetadata = spaceStreamView.spaceChannelsMetadata
            console.log('channelMetadata', channelMetadata)
            check(channelMetadata.size === 2)
            check(channelMetadata.get(defaultChannelId)?.showUserJoinLeaveEvents === true)
            check(channelMetadata.get(channel1Id!)?.showUserJoinLeaveEvents === true)
        })

        // Set channel1 to showUserJoinLeaveEvents=false
        const { eventId, error: error2 } = await bob.updateChannelShowUserJoinLeaveEvents(
            spaceId,
            channel1Id!,
            false,
        )
        expect(error2).toBeUndefined()
        expect(eventId).toBeDefined()

        // Validate updateShowUserJoinLeaveEvent event was emitted for channel1
        expect(updatedChannelShowJoinLeaveEventsState.size).toBe(1)
        expect(updatedChannelShowJoinLeaveEventsState.get(channel1Id!)).toBe(false)

        // Expect showUserJoinLeaveEvents change to sync to space stream view
        await waitFor(() => {
            const channelMetadata = spaceStreamView.spaceChannelsMetadata
            check(channelMetadata.get(channel1Id!)?.showUserJoinLeaveEvents === false)
        })
    })

    test('unpermitted user cannot update channel showuserjoinleaveevents', async () => {
        const {
            bob,
            bobProvider,
            bobSpaceDapp,
            alice,
            aliceSpaceDapp,
            aliceProvider,
            carol,
            carolsWallet,
            carolSpaceDapp,
            carolProvider,
        } = await setupWalletsAndContexts()
        const everyoneMembership = await everyoneMembershipStruct(bobSpaceDapp, bob)

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            "bob's town",
            everyoneMembership,
        )

        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            aliceProvider.wallet.address,
            aliceProvider.wallet,
        )

        await expect(
            alice.updateChannelShowUserJoinLeaveEvents(spaceId, defaultChannelId, false),
        ).rejects.toThrow(/7:PERMISSION_DENIED/)

        // Add Carol to a role that gives her AddRemoveChannels permission so she can update
        // showUserJoinLeaveEvents
        const { roleId, error: roleError } = await createRole(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'gated role',
            [Permission.AddRemoveChannels],
            [carolsWallet.address],
            NoopRuleData,
            bobProvider.wallet,
        )
        expect(roleError).toBeUndefined()

        // Add Carol to the space
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'carol',
            carol,
            carolSpaceDapp,
            carolProvider.wallet.address,
            carolProvider.wallet,
        )

        await expect(
            carol.updateChannelShowUserJoinLeaveEvents(spaceId, defaultChannelId, false),
        ).toResolve()

        // Validate updateShowUserJoinLeaveEvents event was applied on client
        const spaceStream = bob.streams.get(spaceId)
        expect(spaceStream).toBeDefined()
        const spaceStreamView = spaceStream!.view.spaceContent
        expect(spaceStreamView).toBeDefined()
        await waitFor(() => {
            const channelMetadata = spaceStreamView.spaceChannelsMetadata
            check(channelMetadata.size === 1)
            check(channelMetadata.get(defaultChannelId)?.showUserJoinLeaveEvents === false)
        })
    })
})
