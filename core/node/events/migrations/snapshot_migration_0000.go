package migrations

import (
	. "github.com/towns-protocol/towns/core/node/protocol"
)

// a no-op migration for the initial snapshot, use as a template for new migrations
func snapshot_migration_0000(iSnapshot *Snapshot) *Snapshot {
	return iSnapshot
}
