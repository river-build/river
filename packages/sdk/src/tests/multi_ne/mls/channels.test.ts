/**
 * @group main
 */

import { makeTestClient, makeUniqueSpaceStreamId } from '../../testUtils'
import { dlog } from '@river-build/dlog'
import { MembershipOp } from '@river-build/proto'
import { makeUniqueChannelStreamId } from '../../../id'
import { MLS_ALGORITHM } from '../../../mls'

const log = dlog('test:mls:channel')

async function makeInitAndStartClient(nickname?: string) {
    const clientLog = log.extend(nickname ?? 'client')
    const client = await makeTestClient({ mlsOpts: { nickname, log: clientLog } })
    await client.initializeUser()
    client.startSync()
    return client
}

describe('channelMlsTests', () => {
    it('should work', { timeout: 30_000 }, async () => {
        const alice = await makeInitAndStartClient('alice')
        const bob = await makeInitAndStartClient('bob')

        bob.on('userInvitedToStream', (streamId: string) => {
            void bob.joinStream(streamId)
        })

        const spaceId = makeUniqueSpaceStreamId()
        await alice.createSpace(spaceId)
        await alice.waitForStream(spaceId)

        await alice.inviteUser(spaceId, bob.userId)
        const bobSpaceStream = await bob.waitForStream(spaceId)
        await bobSpaceStream.waitForMembership(MembershipOp.SO_JOIN)

        const channelId = makeUniqueChannelStreamId(spaceId)

        await alice.createChannel(spaceId, 'channel', 'topic', channelId)
        await alice.waitForStream(channelId)
        await alice.setStreamEncryptionAlgorithm(channelId, MLS_ALGORITHM)
        await alice.sendMessage(channelId, 'hello')

        await alice.inviteUser(channelId, bob.userId)
        const bobChannelStream = await bob.waitForStream(channelId)
        await bobChannelStream.waitForMembership(MembershipOp.SO_JOIN)

        await alice.stop()
        await bob.stop()
    })
})
