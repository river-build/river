package migrations

import (
	"bytes"

	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
)

func snapshot_migration_0002(iSnapshot *Snapshot) *Snapshot {
	switch snapshot := iSnapshot.Content.(type) {
	case *Snapshot_SpaceContent:
		spaceStreamId, err := shared.StreamIdFromBytes(snapshot.SpaceContent.Inception.StreamId)
		if err != nil {
			panic(err)
		}
		defaultChannelId, err := shared.MakeDefaultChannelId(spaceStreamId)
		if err != nil {
			panic(err)
		}
		for _, channel := range snapshot.SpaceContent.Channels {
			if bytes.Equal(channel.ChannelId, defaultChannelId[:]) {
				channel.Autojoin = true
			} else {
				channel.Autojoin = false
			}
			channel.ShowUserJoinLeaveEvents = true
		}
	}
	return iSnapshot
}
