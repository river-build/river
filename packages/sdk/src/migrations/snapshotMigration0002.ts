import { Snapshot } from '@river-build/proto'
import { isDefaultChannelId, streamIdFromBytes } from '../id'

export function snapshotMigration0002(snapshot: Snapshot): Snapshot {
    switch (snapshot.content?.case) {
        case 'spaceContent': {
            snapshot.content.value.channels = snapshot.content.value.channels.map((c) => {
                if (isDefaultChannelId(streamIdFromBytes(c.channelId))) {
                    c.autojoin = true
                } else {
                    c.autojoin = false
                }
                c.showUserJoinLeaveEvents = true
                return c
            })
        }
    }
    return snapshot
}
