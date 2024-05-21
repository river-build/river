package config

import (
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	infra "github.com/river-build/river/core/node/infra/config"
	"github.com/river-build/river/core/node/shared"
)

type ContractVersion string

const (
	VersionDev ContractVersion = "dev"
	VersionV3  ContractVersion = "v3"
)

type TLSConfig struct {
	Cert   string // Path to certificate file or BASE64 encoded certificate
	Key    string `dlog:"omit" json:"-"` // Path to key file or BASE64 encoded key. Sensitive data, omitted from logging.
	TestCA string // Path to CA certificate file or BASE64 encoded CA certificate
}

// Viper uses mapstructure module to marshal settings into config struct.
type Config struct {
	// Network
	// 0 can be used in tests to elect a free available port.
	Port int
	// DNS name of the node. Used to select interface to listen on. Can be empty.
	Address string

	UseHttps  bool // If TRUE TLSConfig must be set.
	TLSConfig TLSConfig

	// Storage
	Database    DatabaseConfig
	StorageType string

	// Blockchain configuration
	BaseChain  ChainConfig
	RiverChain ChainConfig

	// Base chain contract configuration
	ArchitectContract ContractConfig

	// Contract configuration
	RegistryContract ContractConfig

	// Logging
	Log infra.LogConfig

	// Metrics
	Metrics             infra.MetricsConfig
	PerformanceTracking PerformanceTrackingConfig

	// Stream configuration
	Stream StreamConfig

	// Network configuration
	Network NetworkConfig

	// Go in stand-by mode on start checking if public address resolves to this node instance.
	// This allows to reduce downtime when new version of the node is deployed in the new container or VM.
	// Depending on the network routing configuration this approach may not work.
	StandByOnStart    bool
	StandByPollPeriod time.Duration

	// ShutdownTimeout is the time the node waits for the graceful shutdown of the server.
	// Then all active connections are closed and the node exits.
	// If StandByOnStart is true, it's recommended to set it to the half of DatabaseConfig.StartupDelay.
	// If set to 0, then default value is used. To disable the timeout set to 1ms or less.
	ShutdownTimeout time.Duration

	// Graffiti is returned in status and info requests.
	Graffiti string

	// Should be set if node is run in archive mode.
	Archive ArchiveConfig

	// Feature flags
	// Used to disable functionality for some testing setups.

	// Disable base chain contract usage.
	DisableBaseChain bool

	// xChain configuration
	ChainsString                  string            `mapstructure:"chains"`
	Chains                        map[uint64]string `mapstructure:"-"` // This is a derived field
	EntitlementContract           ContractConfig    `mapstructure:"entitlement_contract"`
	WalletLinkContract            ContractConfig    `mapstructure:"wallet_link_contract"`
	contractVersion               ContractVersion   `mapstructure:"contract_version"`
	TestEntitlementContract       ContractConfig    `mapstructure:"test_contract"`
	TestCustomEntitlementContract ContractConfig    `mapstructure:"test_custom_entitlement_contract"`

	// History indicates how far back xchain must look for entitlement check requests after start
	History        time.Duration
	EnableTestAPIs bool
}

type NetworkConfig struct {
	NumRetries int
	// RequestTimeout only applies to unary requests.
	RequestTimeout time.Duration

	// If unset or <= 0, 5 seconds is used.
	HttpRequestTimeout time.Duration
}

func (nc *NetworkConfig) GetHttpRequestTimeout() time.Duration {
	if nc.HttpRequestTimeout <= 0 {
		return 5 * time.Second
	}
	return nc.HttpRequestTimeout
}

type DatabaseConfig struct {
	Url                       string `dlog:"omit" json:"-"` // Sensitive data, omitted from logging.
	Host                      string
	Port                      int
	User                      string
	Password                  string `dlog:"omit" json:"-"` // Sensitive data, omitted from logging.
	Database                  string
	Extra                     string
	StreamingConnectionsRatio float32

	// StartupDelay is the time the node waits between taking control of the database and starting the server
	// if other nodes' records are found in the database.
	// If StandByOnStart is true, it's recommended to set it to the double of Config.ShutdownTimeout.
	// If set to 0, then default value is used. To disable the delay set to 1ms or less.
	StartupDelay time.Duration
}

// TransactionPoolConfig specifies when it is time for a replacement transaction and its gas fee costs.
type TransactionPoolConfig struct {
	// TransactionTimeout is the duration in which a transaction must be included in the chain before it is marked
	// eligible for replacement. It is advisable to set the timeout as a multiple of the block period. If not set it
	// estimates the chains block period and sets Timeout to 3x block period.
	TransactionTimeout time.Duration

	// GasFeeCap determines for EIP-1559 transaction the maximum amount fee per gas the node operator is willing to
	// pay. If set to 0 the node will use 2 * chain.BaseFee by default. The base fee + miner tip must be below this
	// cap, if not the transaction could not be made.
	GasFeeCap int

	// MinerTipFeeReplacementPercentage is the percentage the miner tip for EIP-1559 transactions is incremented when
	// replaced. Nodes accept replacements only when the miner tip is at least 10% higher than the original transaction.
	// The node will add 1 Wei to the miner tip and therefore 10% is the least recommended value. Default is 10.
	MinerTipFeeReplacementPercentage int

	// GasFeeIncreasePercentage is the percentage by which the gas fee for legacy transaction is incremented when it is
	// replaced. Recommended is >= 10% since nodes typically only accept replacements transactions with at least 10%
	// higher gas price. The node will add 1 Wei, therefore 10% will also work. Default is 10.
	GasFeeIncreasePercentage int
}

type ChainConfig struct {
	NetworkUrl  string
	ChainId     uint64
	BlockTimeMs uint64

	TransactionPool TransactionPoolConfig

	// TODO: these need to be removed from here
	LinkedWalletsLimit                        int
	ContractCallsTimeoutMs                    int
	PositiveEntitlementCacheSize              int
	PositiveEntitlementCacheTTLSeconds        int
	NegativeEntitlementCacheSize              int
	NegativeEntitlementCacheTTLSeconds        int
	PositiveEntitlementManagerCacheSize       int
	PositiveEntitlementManagerCacheTTLSeconds int
	NegativeEntitlementManagerCacheSize       int
	NegativeEntitlementManagerCacheTTLSeconds int
}

type PerformanceTrackingConfig struct {
	ProfilingEnabled bool
	TracingEnabled   bool
}

type StreamConfig struct {
	Media                       MediaStreamConfig
	StreamMembershipLimits      map[string]int
	RecencyConstraints          RecencyConstraintsConfig
	ReplicationFactor           int
	DefaultMinEventsPerSnapshot int
	MinEventsPerSnapshot        map[string]int
	// CacheExpiration is the interval (secs) after streams with no activity in the cache are expired and evicted
	CacheExpiration time.Duration
	// CacheExpirationPollIntervalSec is the interval to check for inactive streams in the cache
	// (default=CacheExpiration/10)
	CacheExpirationPollInterval time.Duration
}

type MediaStreamConfig struct {
	MaxChunkCount int
	MaxChunkSize  int
}

type RecencyConstraintsConfig struct {
	AgeSeconds  int
	Generations int
}

type ContractConfig struct {
	// Address of the contract
	Address common.Address
	// Version of the contract to use.
	Version string
}

type ArchiveConfig struct {
	// ArchiveId is the unique identifier of the archive node. Must be set for nodes in archive mode.
	ArchiveId string

	Filter FilterConfig

	// Number of miniblocks to read at once from the remote node.
	ReadMiniblcocksSize uint64
}

func (ac *ArchiveConfig) GetReadMiniblocksSize() uint64 {
	if ac.ReadMiniblcocksSize <= 0 {
		return 100
	}
	return ac.ReadMiniblcocksSize
}

type FilterConfig struct {
	// If set, only archive streams hosted on the nodes with the specified addresses.
	Nodes []string

	// If set, only archive stream if Nodes list contains first hosting node for the stream.
	// This may be used to archive only once copy of replicated stream
	// if multiple archival nodes are used in conjunction.
	FirstOnly bool

	// If set, partition all stream names using hash into specified number of shards and
	// archive only listed shards.
	NumShards uint64
	Shards    []uint64
}

func (cfg *StreamConfig) GetMembershipLimit(streamId shared.StreamId) int {
	if cfg.StreamMembershipLimits != nil {
		streamPrefix := hex.EncodeToString(streamId[:1])
		if value, ok := cfg.StreamMembershipLimits[streamPrefix]; ok {
			return value
		}
	}
	return 0
}

func (c *Config) GetGraffiti() string {
	if c.Graffiti == "" {
		return "River Node welcomes you!"
	}
	return c.Graffiti
}

func (c *Config) GetContractVersion() ContractVersion {
	if c.contractVersion == VersionV3 {
		return VersionV3
	} else {
		return VersionDev
	}
}

func (c *Config) GetEntitlementContractAddress() common.Address {
	return c.EntitlementContract.Address
}

func (c *Config) GetWalletLinkContractAddress() common.Address {
	return c.WalletLinkContract.Address
}

func (c *Config) GetTestEntitlementContractAddress() common.Address {
	return c.TestEntitlementContract.Address
}

func (c *Config) GetTestCustomEntitlementContractAddress() common.Address {
	return c.TestCustomEntitlementContract.Address
}

func (c *Config) Init() {
	c.parseChains()
}

func (c *Config) parseChains() {
	chainUrls := make(map[uint64]string)
	chainPairs := strings.Split(c.ChainsString, ",")
	for _, pair := range chainPairs {
		parts := strings.SplitN(pair, ":", 2) // Use SplitN to split into exactly two parts
		if len(parts) == 2 {
			chainID, err := strconv.Atoi(parts[0])
			if err != nil {
				fmt.Printf("Error converting chainID to int: %v\n", err)
				continue
			}
			chainUrls[uint64(chainID)] = parts[1]
		}
	}
	c.Chains = chainUrls
}
