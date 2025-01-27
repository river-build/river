package events

import (
	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/protocol"
)

type DMChannelStreamView interface {
	JoinableStreamView
	GetDMChannelInception() (*DmChannelPayload_Inception, error)
}

var _ DMChannelStreamView = (*StreamViewImpl)(nil)

func (r *StreamViewImpl) GetDMChannelInception() (*DmChannelPayload_Inception, error) {
	i := r.InceptionPayload()
	c, ok := i.(*DmChannelPayload_Inception)
	if ok {
		return c, nil
	} else {
		return nil, RiverError(Err_WRONG_STREAM_TYPE, "Expected dm stream", "streamId", i.GetStreamId())
	}
}
