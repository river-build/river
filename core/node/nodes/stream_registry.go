package nodes

import (
	"context"
	"hash/fnv"
	"sync/atomic"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/puzpuzpuz/xsync/v3"

	"github.com/river-build/river/core/contracts/river"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	. "github.com/river-build/river/core/node/shared"
)

type StreamRegistry interface {
	// GetStreamInfo: returns nodes, error
	GetStreamInfo(ctx context.Context, streamId StreamId) (StreamNodes, error)
	// GetStreamInfo: returns nodes, error
	AllocateStream(
		ctx context.Context,
		streamId StreamId,
		genesisMiniblockHash common.Hash,
		genesisMiniblock []byte,
	) ([]common.Address, error)
}

type streamDescriptor struct {
	nodes  StreamNodes
	lastMb MiniblockRef
}

type streamRegistryImpl struct {
	localNodeAddress common.Address
	nodeRegistry     NodeRegistry
	onChainConfig    crypto.OnChainConfiguration
	contract         *registries.RiverRegistryContract

	onBlock         atomic.Uint64
	streamNodeCache *xsync.MapOf[StreamId, *streamDescriptor]
}

var _ StreamRegistry = (*streamRegistryImpl)(nil)

func NewStreamRegistry(
	ctx context.Context,
	blockchain *crypto.Blockchain,
	localNodeAddress common.Address,
	nodeRegistry NodeRegistry,
	contract *registries.RiverRegistryContract,
	onChainConfig crypto.OnChainConfiguration,
) (*streamRegistryImpl, error) {
	blockNum, err := blockchain.GetBlockNumber(ctx)
	if err != nil {
		return nil, err
	}

	impl := &streamRegistryImpl{
		localNodeAddress: localNodeAddress,
		nodeRegistry:     nodeRegistry,
		onChainConfig:    onChainConfig,
		contract:         contract,
		streamNodeCache:  xsync.NewMapOf[StreamId, *streamDescriptor](), // TODO: set custom hasher for effeciency?
	}

	impl.onBlock.Store(blockNum.AsUint64())

	blockchain.ChainMonitor.OnBlockWithLogs(blockNum+1, impl.onBlockWithLogs)

	return impl, nil
}

func (sr *streamRegistryImpl) onBlockWithLogs(ctx context.Context, blockNum crypto.BlockNumber, logs []*types.Log) {
	sr.onBlock.Store(blockNum.AsUint64())
}

func (sr *streamRegistryImpl) GetStreamInfo(ctx context.Context, streamId StreamId) (StreamNodes, error) {
	d, ok := sr.streamNodeCache.Load(streamId)
	if ok {
		return d.nodes, nil
	}

	result, err := sr.contract.GetStream(ctx, streamId, crypto.BlockNumber(sr.onBlock.Load()))
	if err != nil {
		return nil, err
	}
	d, _ = sr.streamNodeCache.LoadOrStore(streamId, &streamDescriptor{
		nodes: NewStreamNodes(result.Nodes, sr.localNodeAddress),
		lastMb: MiniblockRef{
			Hash: result.LastMiniblockHash,
			Num:  int64(result.LastMiniblockNum),
		},
	})
	return d.nodes, nil
}

func (sr *streamRegistryImpl) AllocateStream(
	ctx context.Context,
	streamId StreamId,
	genesisMiniblockHash common.Hash,
	genesisMiniblock []byte,
) ([]common.Address, error) {
	addrs, err := sr.chooseStreamNodes(ctx, streamId)
	if err != nil {
		return nil, err
	}

	err = sr.contract.AllocateStream(ctx, streamId, addrs, genesisMiniblockHash, genesisMiniblock)
	if err != nil {
		return nil, err
	}

	return addrs, nil
}

func (sr *streamRegistryImpl) chooseStreamNodes(ctx context.Context, streamId StreamId) ([]common.Address, error) {
	allNodes := sr.nodeRegistry.GetAllNodes()
	nodes := make([]*NodeRecord, 0, len(allNodes))

	for _, n := range allNodes {
		if n.Status() == river.NodeStatus_Operational {
			nodes = append(nodes, n)
		}
	}

	replFactor := int(sr.onChainConfig.Get().ReplicationFactor)

	if len(nodes) < replFactor {
		return nil, RiverError(
			Err_BAD_CONFIG,
			"replication factor is greater than number of operational nodes",
			"replication_factor",
			replFactor,
			"num_nodes",
			len(nodes),
		)
	}

	h := fnv.New64a()
	addrs := make([]common.Address, replFactor)
	for i := 0; i < replFactor; i++ {
		h.Write(streamId[:])
		index := i + int(h.Sum64()%uint64(len(nodes)-i))
		tt := nodes[index]
		nodes[index] = nodes[i]
		nodes[i] = tt
		addrs[i] = nodes[i].Address()
	}

	return addrs, nil
}
