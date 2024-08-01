package migrations

import (
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
)

func snapshot_migration_0002(iSnapshot *Snapshot) *Snapshot {
	switch snapshot := iSnapshot.Content.(type) {
	case *Snapshot_SpaceContent:
		for _, channel := range snapshot.SpaceContent.Channels {
			if channel.Settings == nil {
				channel.Settings = &SpacePayload_ChannelSettings{}
			}
			channelId, err := shared.StreamIdFromBytes(channel.ChannelId)
			if err != nil {
				panic(err)
			}
			if shared.IsDefaultChannelId(channelId) {
				channel.Settings.Autojoin = true
			}
		}
	}
	return iSnapshot
}
