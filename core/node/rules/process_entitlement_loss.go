package rules

import (
	"context"

	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
)

type PropogateEntitlementLossEvent struct {
	Payload  IsStreamEvent_Payload
	StreamId shared.StreamId
}

// ProcessEntitlementLoss constructs a PropogateEntitlementLossEvent that is meant to be sent out
// whenever a user experiences an entitlement loss.
// Concrete example: a user is admitted to a channel via an nft-gated role and then transfers
// their nft. In this case the user would fail the entitlement check for adding key solicitations to
// the channel and the server would need to propogate a channel leave event
func ProcessEntitlementLoss(
	ctx context.Context,
	parsedEvent *events.ParsedEvent,
	streamView events.StreamView,
) (entitlementLossEvent *PropogateEntitlementLossEvent, err error) {
	switch payload := parsedEvent.Event.Payload.(type) {
	case *StreamEvent_MemberPayload:
		return processMembershipEntitlementLoss(ctx, parsedEvent, payload, streamView)
	}
	return nil, nil
}

// When a key solicitation to a channel is received, the event is addable, and the chain auth args fail,
// the user should be removed from the channel.
func processMembershipEntitlementLoss(
	ctx context.Context,
	event *events.ParsedEvent,
	payload *StreamEvent_MemberPayload,
	streamView events.StreamView,
) (entitlementLossEvent *PropogateEntitlementLossEvent, err error) {
	switch payload.MemberPayload.Content.(type) {
	case *MemberPayload_KeySolicitation_:
		if shared.ValidChannelStreamId(streamView.StreamId()) {
			log := dlog.FromCtx(ctx)
			isMember, err := streamView.IsMember(event.Event.CreatorAddress)
			if err != nil {
				return nil, err
			}

			// If the user has already been removed from the channel, no need to remove them.
			if !isMember {
				log.Info("user already removed from channel", "user", event.Event.CreatorAddress, "channel", streamView.StreamId())
				return nil, nil
			}

			userStreamId, err := shared.UserStreamIdFromBytes(event.Event.CreatorAddress)
			if err != nil {
				return nil, err
			}
			initiatorId, err := shared.AddressHex(event.Event.CreatorAddress)
			if err != nil {
				return nil, err
			}
			return &PropogateEntitlementLossEvent{
				Payload: events.Make_UserPayload_Membership(
					MembershipOp_SO_LEAVE,
					*streamView.StreamId(), // channel stream id
					&initiatorId,
					(*streamView.StreamParentId())[:], // space stream id
				),
				StreamId: userStreamId, // user stream id
			}, nil
		}
	}
	return nil, nil
}
