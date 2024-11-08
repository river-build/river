/**
 * @group main
 */

import { MembershipOp } from '@river-build/proto'
import { makeTestClient, makeUniqueSpaceStreamId, waitFor } from './test-utils'

describe('streamStateView_User', () => {
    it('userStreamMembershipsJoin', async () => {
        const bob = await makeTestClient()
        const alice = await makeTestClient()
        await bob.initializeUser()
        await alice.initializeUser()
        bob.startSync()
        alice.startSync()
        const spaceId = makeUniqueSpaceStreamId()
        await expect(bob.createSpace(spaceId)).resolves.not.toThrow()
        await expect(bob.waitForStream(spaceId)).resolves.not.toThrow()

        await expect(bob.inviteUser(spaceId, alice.userId)).resolves.not.toThrow()
        const aliceUserStream = await alice.waitForStream(alice.userStreamId!)
        await waitFor(
            () =>
                aliceUserStream.view.userContent.streamMemberships[spaceId].op ===
                MembershipOp.SO_INVITE,
        )
        await expect(alice.joinStream(spaceId)).resolves.not.toThrow()
        await waitFor(
            () =>
                aliceUserStream.view.userContent.streamMemberships[spaceId].op ===
                MembershipOp.SO_JOIN,
        )

        await expect(alice.leaveStream(spaceId)).resolves.not.toThrow()
        await waitFor(
            () =>
                aliceUserStream.view.userContent.streamMemberships[spaceId].op ===
                MembershipOp.SO_LEAVE,
        )

        await bob.stop()
        await alice.stop()
    })
})
