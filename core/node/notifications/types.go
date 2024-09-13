package notifications

import "github.com/ethereum/go-ethereum/common"

type (
	UserSettings struct {
		// List with user id's this user doesn't want to receive notifications for
		BlockedUserIDs []common.Address
		// DM indicates if the user wants to receive notifications for DM messages
		// Default = true
		DM       bool
		Mentions bool
		ReplyTo  bool
	}

	ChannelSetting struct {
	}

	SpaceSetting struct {
	}

	Settings struct {
		UserID        common.Address
		UserSettings  UserSettings
		SpaceSettings []SpaceSetting
	}
)
