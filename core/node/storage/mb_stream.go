package storage

import (
	"github.com/jackc/pgx/v5"

	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
)

// miniblocksDataStream implements MiniblocksDataStream interface for reading miniblocks from a stream.
type miniblocksDataStream struct {
	rows     pgx.Rows
	err      error
	block    []byte
	seqNum   int
	prevSeq  int
	streamId StreamId
}

func newMiniblocksDataStream(rows pgx.Rows, streamId StreamId) *miniblocksDataStream {
	return &miniblocksDataStream{
		rows:     rows,
		prevSeq:  -1, // Initialize to -1 to indicate the first row
		streamId: streamId,
	}
}

// Next returns true if there are more miniblocks to read.
func (m *miniblocksDataStream) Next() bool {
	if m.err != nil {
		return false
	}

	if !m.rows.Next() {
		return false
	}

	var seqNum int
	if m.err = m.rows.Scan(&m.block, &seqNum); m.err != nil {
		return false
	}

	// Sequence consistency check
	if m.prevSeq != -1 && seqNum != m.prevSeq+1 {
		m.err = RiverError(Err_MINIBLOCKS_STORAGE_FAILURE, "Miniblocks consistency violation").
			Tag("ActualBlockNumber", seqNum).Tag("ExpectedBlockNumber", m.prevSeq+1).Tag("streamId", m.streamId)
		return false
	}

	m.prevSeq = seqNum

	return true
}

// Miniblock returns the current miniblock data.
func (m *miniblocksDataStream) Miniblock() []byte {
	return m.block
}

// Err returns any error encountered during iteration.
func (m *miniblocksDataStream) Err() error {
	return m.err
}

// Close closes the stream.
func (m *miniblocksDataStream) Close() {
	m.rows.Close()
}
