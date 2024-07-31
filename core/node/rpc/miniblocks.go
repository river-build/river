package rpc

import (
	"connectrpc.com/connect"
	"context"
	"github.com/ethereum/go-ethereum/common"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
)

var _ RemoteMiniblockProvider = (*Service)(nil)

func (s *Service) GetMbProposal(
	ctx context.Context,
	node common.Address,
	streamId StreamId,
	forceSnapshot bool,
) (*MiniblockProposal, error) {
	stub, err := s.nodeRegistry.GetNodeToNodeClientForAddress(node)
	if err != nil {
		return nil, err
	}

	resp, err := stub.ProposeMiniblock(
		ctx,
		connect.NewRequest(&ProposeMiniblockRequest{
			StreamId:           streamId[:],
			DebugForceSnapshot: forceSnapshot,
		}),
	)
	if err != nil {
		return nil, err
	}

	return resp.Msg.Proposal, nil
}

func (s *Service) SaveMbCandidate(
	ctx context.Context,
	node common.Address,
	streamId StreamId,
	mb *Miniblock,
) error {
	stub, err := s.nodeRegistry.GetNodeToNodeClientForAddress(node)
	if err != nil {
		return err
	}

	_, err = stub.SaveMiniblockCandidate(
		ctx,
		connect.NewRequest(&SaveMiniblockCandidateRequest{
			StreamId:  streamId[:],
			Miniblock: mb,
		}),
	)

	return err
}

// GetMiniBlocksStreamed returns a range of miniblocks from the given stream.
func (s *Service) GetMiniBlocksStreamed(
	ctx context.Context,
	node common.Address,
	streamId StreamId,
	fromInclusive uint64, // inclusive
	toExclusive uint64, // exclusive
) (<-chan *Miniblock, <-chan error) {
	var (
		miniBlocks = make(chan *Miniblock)
		errors     = make(chan error)
	)

	go func() {
		defer close(errors)
		defer close(miniBlocks)

		remote, err := s.nodeRegistry.GetStreamServiceClientForAddress(node)
		if err != nil {
			errors <- err
			return
		}

		// TODO: switch over to a streaming call
		miniblocksResp, err := remote.GetMiniblocks(ctx, connect.NewRequest(&GetMiniblocksRequest{
			StreamId:      streamId[:],
			FromInclusive: int64(fromInclusive),
			ToExclusive:   int64(toExclusive),
		}))

		if err != nil {
			errors <- err
			return
		}

		if err != nil {
			errors <- err
			return
		}

		for _, blk := range miniblocksResp.Msg.GetMiniblocks() {
			miniBlocks <- blk
		}
	}()

	return miniBlocks, errors
}
