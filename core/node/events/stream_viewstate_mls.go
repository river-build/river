package events

import (
	"fmt"

	"github.com/river-build/river/core/node/mls_service/mls_tools"
	"github.com/river-build/river/core/node/protocol"
)

type MlsStreamView interface {
	StreamView
	IsMlsInitialized() (bool, error)
	GetMlsExternalJoinRequest() (*mls_tools.ExternalJoinRequest, error)
	GetMlsEpochSecrets() (map[uint64][]byte, error)
}

var _ MlsStreamView = (*streamViewImpl)(nil)

// returns true if the stream has an MLS group initialized 
// — the stream has processed exactly one MemberPayload_Mls_InitializeGroup
// - OR the ExternalGroupSnapshot on Members.Mls is not empty
func (r *streamViewImpl) IsMlsInitialized() (bool, error) {
	s := r.snapshot
	if s.Members.GetMls() == nil {
		return false, nil
	}

	if len(s.Members.GetMls().ExternalGroupSnapshot) > 0 {
		return true, nil
	}

	isInitialized := false
	updateFn := func(e *ParsedEvent, miniblockNum int64, eventNum int64) (bool, error) {
		switch payload := e.Event.Payload.(type) {
		case *protocol.StreamEvent_MemberPayload:
			switch content := payload.MemberPayload.Content.(type) {
			case *protocol.MemberPayload_Mls_:
				switch content.Mls.Content.(type) {
				case *protocol.MemberPayload_Mls_InitializeGroup_:
					isInitialized = true
				default:
					break
				}
			}
		default:
			break
		}
		return true, nil
	}
	err := r.forEachEvent(r.snapshotIndex+1, updateFn)
	if err != nil {
		return false, err
	}
	return isInitialized, nil
}

// populates an ExternalJoinRequest with the ExternalGroupSnapshot and all ExternalJoin commits
func (r *streamViewImpl) GetMlsExternalJoinRequest() (*mls_tools.ExternalJoinRequest, error) {
	s := r.snapshot
	
	if s.Members.GetMls() == nil {
		return nil, fmt.Errorf("MLS not initialized")
	}
	
	externalJoinRequest := mls_tools.ExternalJoinRequest{
		Commits: make([][]byte, 0),
		ExternalGroupSnapshot: s.Members.GetMls().ExternalGroupSnapshot,
	}

	updateFn := func(e *ParsedEvent, miniblockNum int64, eventNum int64) (bool, error) {
		switch payload := e.Event.Payload.(type) {
		case *protocol.StreamEvent_MemberPayload:
			switch content := payload.MemberPayload.Content.(type) {
			case *protocol.MemberPayload_Mls_:
				switch content.Mls.Content.(type) {
				case *protocol.MemberPayload_Mls_InitializeGroup_:
					externalJoinRequest.ExternalGroupSnapshot = content.Mls.GetInitializeGroup().ExternalGroupSnapshot
				case *protocol.MemberPayload_Mls_ExternalJoin_:
					externalJoinRequest.Commits = append(externalJoinRequest.Commits, content.Mls.GetExternalJoin().Commit)
				default:
					break
				}
			}
		default:
			break
		}
		return true, nil
	}
	err := r.forEachEvent(r.snapshotIndex+1, updateFn)
	if err != nil {
		return nil, err
	}

	return &externalJoinRequest, nil
}

func (r *streamViewImpl) GetMlsEpochSecrets() (map[uint64][]byte, error) {
	s := r.snapshot
	if s.Members.GetMls() == nil {
		return nil, fmt.Errorf("MLS not initialized")
	}
	epochSecrets := s.Members.Mls.GetEpochSecrets()
	if epochSecrets == nil {
		epochSecrets = make(map[uint64][]byte)
	}
	updateFn := func(e *ParsedEvent, minibockNum int64, eventNum int64) (bool, error) {
		switch payload := e.Event.Payload.(type) {
		case *protocol.StreamEvent_MemberPayload:
			switch content := payload.MemberPayload.Content.(type) {
			case *protocol.MemberPayload_Mls_:
				switch content.Mls.Content.(type) {
				case *protocol.MemberPayload_Mls_EpochSecrets_:
					for _, epochSecret := range content.Mls.GetEpochSecrets().GetSecrets() {
						epochSecrets[epochSecret.Epoch] = epochSecret.Secret
					}
				default:
					break
				}
			}
		default:
			break
		}
		return true, nil
	}
	err := r.forEachEvent(r.snapshotIndex+1, updateFn)
	if err != nil {
		return nil, err
	}
	return epochSecrets, nil
}
