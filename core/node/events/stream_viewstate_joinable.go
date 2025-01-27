package events

import (
	"bytes"

	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"

	mapset "github.com/deckarep/golang-set/v2"
	"google.golang.org/protobuf/proto"
)

type JoinableStreamView interface {
	GetChannelMembers() (mapset.Set[string], error)
	GetMembership(userAddress []byte) (protocol.MembershipOp, error)
	GetKeySolicitations(userAddress []byte) ([]*protocol.MemberPayload_KeySolicitation, error)
	GetPinnedMessages() ([]*protocol.MemberPayload_SnappedPin, error)
	HasTransaction(receipt *protocol.BlockchainTransactionReceipt) (bool, error) // defined in userStreamView
}

var _ JoinableStreamView = (*StreamViewImpl)(nil)

func (r *StreamViewImpl) GetChannelMembers() (mapset.Set[string], error) {
	members := mapset.NewSet[string]()

	for _, member := range r.snapshot.Members.Joined {
		userId, err := shared.AddressHex(member.UserAddress)
		if err != nil {
			return nil, err
		}
		members.Add(userId)
	}

	updateFn := func(e *ParsedEvent, minibockNum int64, eventNum int64) (bool, error) {
		switch payload := e.Event.Payload.(type) {
		case *protocol.StreamEvent_MemberPayload:
			switch payload := payload.MemberPayload.Content.(type) {
			case *protocol.MemberPayload_Membership_:
				user, err := shared.AddressHex(payload.Membership.UserAddress)
				if err != nil {
					return false, err
				}
				if payload.Membership.GetOp() == protocol.MembershipOp_SO_JOIN {
					members.Add(user)
				} else if payload.Membership.GetOp() == protocol.MembershipOp_SO_LEAVE {
					members.Remove(user)
				}
			default:
				break
			}
		}
		return true, nil
	}

	err := r.forEachEvent(r.snapshotIndex+1, updateFn)
	if err != nil {
		return nil, err
	}

	return members, nil
}

func (r *StreamViewImpl) GetMembership(userAddress []byte) (protocol.MembershipOp, error) {
	retValue := protocol.MembershipOp_SO_UNSPECIFIED

	member, _ := findMember(r.snapshot.Members.Joined, userAddress)
	if member != nil {
		retValue = protocol.MembershipOp_SO_JOIN
	}

	updateFn := func(e *ParsedEvent, minibockNum int64, eventNum int64) (bool, error) {
		switch payload := e.Event.Payload.(type) {
		case *protocol.StreamEvent_MemberPayload:
			switch payload := payload.MemberPayload.Content.(type) {
			case *protocol.MemberPayload_Membership_:
				if bytes.Equal(payload.Membership.UserAddress, userAddress) {
					retValue = payload.Membership.Op
				}
			default:
				break
			}
		}
		return true, nil
	}

	err := r.forEachEvent(r.snapshotIndex+1, updateFn)
	if err != nil {
		return retValue, err
	}

	return retValue, nil
}

// Get an up to date solicitations for a channel member
// this function duplicates code in the snapshot.go logic and
// could go away if we kept an up to date snapshot
func (r *StreamViewImpl) GetKeySolicitations(userAddress []byte) ([]*protocol.MemberPayload_KeySolicitation, error) {
	member, _ := findMember(r.snapshot.Members.Joined, userAddress)

	// clone so we don't modify the snapshot
	if member != nil {
		member = proto.Clone(member).(*protocol.MemberPayload_Snapshot_Member)
	}

	updateFn := func(e *ParsedEvent, minibockNum int64, eventNum int64) (bool, error) {
		switch payload := e.Event.Payload.(type) {
		case *protocol.StreamEvent_MemberPayload:
			switch payload := payload.MemberPayload.Content.(type) {
			case *protocol.MemberPayload_Membership_:
				if bytes.Equal(payload.Membership.UserAddress, userAddress) {
					if payload.Membership.GetOp() == protocol.MembershipOp_SO_JOIN {
						member = &protocol.MemberPayload_Snapshot_Member{
							UserAddress: payload.Membership.UserAddress,
						}
					} else if payload.Membership.GetOp() == protocol.MembershipOp_SO_LEAVE {
						member = nil
					}
				}
			case *protocol.MemberPayload_KeySolicitation_:
				if member != nil && bytes.Equal(e.Event.CreatorAddress, userAddress) {
					applyKeySolicitation(member, payload.KeySolicitation)
				}
			case *protocol.MemberPayload_KeyFulfillment_:
				if member != nil && bytes.Equal(payload.KeyFulfillment.UserAddress, userAddress) {
					applyKeyFulfillment(member, payload.KeyFulfillment)
				}
			default:
				break
			}
		}
		return true, nil
	}

	err := r.forEachEvent(r.snapshotIndex+1, updateFn)
	if err != nil {
		return nil, err
	}

	if member == nil {
		return nil, nil
	} else {
		return member.Solicitations, nil
	}
}

func (r *StreamViewImpl) GetPinnedMessages() ([]*protocol.MemberPayload_SnappedPin, error) {
	s := r.snapshot

	// make a copy of the pins
	pins := make([]*protocol.MemberPayload_SnappedPin, len(s.Members.Pins))
	copy(pins, s.Members.Pins)

	updateFn := func(e *ParsedEvent, minibockNum int64, eventNum int64) (bool, error) {
		switch payload := e.Event.Payload.(type) {
		case *protocol.StreamEvent_MemberPayload:
			switch payload := payload.MemberPayload.Content.(type) {
			case *protocol.MemberPayload_Pin_:
				snappedPin := &protocol.MemberPayload_SnappedPin{
					CreatorAddress: e.Event.CreatorAddress,
					Pin:            payload.Pin,
				}
				pins = append(pins, snappedPin)
			case *protocol.MemberPayload_Unpin_:
				for i, snappedPin := range pins {
					if bytes.Equal(snappedPin.Pin.EventId, payload.Unpin.EventId) {
						pins = append(pins[:i], pins[i+1:]...)
						break
					}
				}
			default:
				break
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
	return pins, nil
}
