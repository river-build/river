package sync

import (
	"context"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/track_streams"
)

type StreamsTracker struct {
	config         config.BotRegistryConfig
	nodeRegistries []nodes.NodeRegistry
	riverRegistry  *registries.RiverRegistryContract
	onChainConfig  crypto.OnChainConfiguration
	metrics        *track_streams.TrackStreamsSyncMetrics
	listener       track_streams.StreamEventListener
}

func NewStreamsTracker(
	ctx context.Context,
	config config.BotRegistryConfig,
	onChainConfig crypto.OnChainConfiguration,
	riverRegistry *registries.RiverRegistryContract,
	nodes []nodes.NodeRegistry,
	metricsFactory infra.MetricsFactory,
	listener track_streams.StreamEventListener,
) (*StreamsTracker, error) {
	metrics := track_streams.NewTrackStreamsSyncMetrics(metricsFactory)
	return &StreamsTracker{
		config:         config,
		nodeRegistries: nodes,
		riverRegistry:  riverRegistry,
		onChainConfig:  onChainConfig,
		metrics:        metrics,
		listener:       listener,
	}, nil
}
