/**
 * @group main
 */

import { Snapshot } from '@river-build/proto'
import { snapshotMigration0002 } from './snapshotMigration0002'
import { makeUniqueSpaceStreamId } from '../util.test'
import { makeDefaultChannelStreamId, makeUniqueChannelStreamId, streamIdAsBytes, isDefaultChannelId } from '../id'
import { check } from '@river-build/dlog'

describe('snapshotMigration0002', () => {
    test('run migration', () => {
        const spaceId = makeUniqueSpaceStreamId()
        const defaultChannelId = makeDefaultChannelStreamId(spaceId)
        const channelId = makeUniqueChannelStreamId(spaceId)

        const snap = new Snapshot({
            content: {
                case: 'spaceContent',
                value: {
                    channels: [
                        { channelId: streamIdAsBytes(defaultChannelId) },
                        { channelId: streamIdAsBytes(channelId) },
                    ],
                },
            },
        })
        const result = snapshotMigration0002(snap)
        check(result.content?.case === 'spaceContent')
        expect(result.content?.value.channels[0].autojoin).toBe(true)
        expect(result.content?.value.channels[0].showUserJoinLeaveEvents).toBe(true)

        expect(result.content?.value.channels[1].autojoin).toBe(false)
        expect(result.content?.value.channels[1].showUserJoinLeaveEvents).toBe(true)
    })
})