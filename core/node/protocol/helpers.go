package protocol

import (
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/protobuf/proto"
)

func (e *StreamEvent) GetStreamSettings() *StreamSettings {
	if e == nil {
		return nil
	}
	i := e.GetInceptionPayload()
	if i == nil {
		return nil
	}
	return i.GetSettings()
}

// Scan implements the pgx custom type interface.
func (m *Miniblock) Scan(src any) error {
	if src == nil {
		return nil
	}

	switch src := src.(type) {
	case []byte:
		// Assume the data is serialized protobuf bytes
		return proto.Unmarshal(src, m)
	case string:
		// If the data is stored as JSON string
		return json.Unmarshal([]byte(src), m)
	default:
		return pgtype.ErrScanTargetTypeChanged
	}
}
