package statusinfo

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/storage"
)


type BlockchainPing struct {
	Result  string `json:"result"`
	ChainId uint64 `json:"chain_id"`
	Block   uint64 `json:"block,omitempty"`
	Latency string `json:"latency"`
}

type StatusResponse struct {
	Status            string           `json:"status"`
	InstanceId        string           `json:"instance_id"`
	Address           string           `json:"address"`
	Version           string           `json:"version"`
	StartTime         string           `json:"start_time"`
	Uptime            string           `json:"uptime"`
	Graffiti          string           `json:"graffiti,omitempty"`
	River             *BlockchainPing  `json:"river,omitempty"`
	Base              *BlockchainPing  `json:"base,omitempty"`
	OtherChains       []BlockchainPing `json:"other_chains,omitempty"`
	XChainBlockchains []uint64         `json:"x_chain_blockchains"`
}

func StatusResponseFromJson(data []byte) (StatusResponse, error) {
	var result StatusResponse
	err := json.Unmarshal(data, &result)
	return result, err
}

func (r StatusResponse) ToPrettyJson() string {
	return toPrettyJson(r)
}

type RegistryNodeInfo struct {
	Address    string `json:"address"`
	Url        string `json:"url"`
	Operator   string `json:"operator"`
	Status     int    `json:"status"`
	StatusText string `json:"status_text"`
}

type HttpResult struct {
	Success       bool           `json:"success"`
	Status        int            `json:"status"`
	StatusText    string         `json:"status_text"`
	Elapsed       string         `json:"elapsed"`
	Timeline      Timeline       `json:"timeline"`
	Response      StatusResponse `json:"response"`
	Protocol      string         `json:"protocol"`
	UsedTLS       bool           `json:"used_tls"`
	RemoteAddress string         `json:"remote_address"`
	DNSAddresses  []string       `json:"dns_addresses"`
}

type PostgresStatusResult struct {
        TotalConns              int32         `json:"total_conns"`
        AcquiredConns           int32         `json:"acquired_conns"`
        IdleConns               int32         `json:"idle_conns"`
        ConstructingConns       int32         `json:"constructing_conns"`
        MaxConns                int32         `json:"max_conns"`
        NewConnsCount           int64         `json:"new_conns_count"`
        AcquireCount            int64         `json:"acquire_count"`
        EmptyAcquireCount       int64         `json:"empty_acquire_count"`
        CanceledAcquireCount    int64         `json:"canceled_acquire_count"`
        AcquireDuration         time.Duration `json:"acquire_duration"`
        MaxLifetimeDestroyCount int64         `json:"max_lifetime_destroy_count"`
        MaxIdleDestroyCount     int64         `json:"max_idle_destroy_count"`
		Version string `json:"version"`
		EsCount string `json:"es_count"`
		SystemId string `json:"system_id"`
}

func PreparePostgresStatus(	ctx context.Context,
	 pool *storage.PgxPoolInfo) PostgresStatusResult {
	poolStat:= pool.Pool.Stat()
	 // Query to get PostgreSQL version
	 var version string
	 err := pool.Pool.QueryRow(ctx, "SELECT version()").Scan(&version)
	 if err != nil {
		version = fmt.Sprintf("Error: %v", err)
		dlog.FromCtx(ctx).Error("failed to get PostgreSQL version", "err", err)
	 }

	// Query to count rows in the es table
	var esCount string
	var count int64
	err = pool.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM es").Scan(&count)
	if err != nil {
		esCount = fmt.Sprintf("Error: %v", err)
	} else {
		esCount = fmt.Sprintf("%d", count)
	}

	var systemId string
    err = pool.Pool.QueryRow(ctx, "SELECT system_identifier FROM pg_control_system()").Scan(&systemId)
    if err != nil {
        systemId = fmt.Sprintf("Error: %v", err)
    }

    return PostgresStatusResult {
            TotalConns:              poolStat.TotalConns(),
            AcquiredConns:           poolStat.AcquiredConns(),
            IdleConns:               poolStat.IdleConns(),
            ConstructingConns:       poolStat.ConstructingConns(),
            MaxConns:                poolStat.MaxConns(),
            NewConnsCount:           poolStat.NewConnsCount(),
            AcquireCount:            poolStat.AcquireCount(),
            EmptyAcquireCount:       poolStat.EmptyAcquireCount(),
            CanceledAcquireCount:    poolStat.CanceledAcquireCount(),
            AcquireDuration:         poolStat.AcquireDuration(),
            MaxLifetimeDestroyCount: poolStat.MaxLifetimeDestroyCount(),
            MaxIdleDestroyCount:     poolStat.MaxIdleDestroyCount(),
			Version: version,
			EsCount: esCount,
			SystemId: systemId,
        }
}

func (r HttpResult) ToPrettyJson() string {
	return toPrettyJson(r)
}

type GrpcResult struct {
	Success       bool     `json:"success"`
	StatusText    string   `json:"status_text"`
	Elapsed       string   `json:"elapsed"`
	Timeline      Timeline `json:"timeline"`
	Version       string   `json:"version"`
	StartTime     string   `json:"start_time"`
	Uptime        string   `json:"uptime"`
	Graffiti      string   `json:"graffiti,omitempty"`
	Protocol      string   `json:"protocol"`
	XHttpVersion  string   `json:"x_http_version"`
	RemoteAddress string   `json:"remote_address"`
	DNSAddresses  []string `json:"dns_addresses"`
}

type Timeline struct {
	DNSDone              string `json:"dns_done"`
	ConnectDone          string `json:"connect_done"`
	TLSHandshakeDone     string `json:"tls_handshake_done"`
	WroteRequest         string `json:"wrote_request"`
	GotFirstResponseByte string `json:"got_first_response_byte"`
	Total                string `json:"total"`
}

func (r GrpcResult) ToPrettyJson() string {
	return toPrettyJson(r)
}

type NodeStatus struct {
	Record          RegistryNodeInfo `json:"record"`
	Local           bool             `json:"local,omitempty"`
	Http11          HttpResult       `json:"http11"`
	Http20          HttpResult       `json:"http20"`
	Grpc            GrpcResult       `json:"grpc"`
	RiverEthBalance string           `json:"river_eth_balance"`
	BaseEthBalance  string           `json:"base_eth_balance"`
	PostgresStatus  PostgresStatusResult `json:"postgres_status"`
}

type RiverStatus struct {
	Nodes     []*NodeStatus `json:"nodes"`
	QueryTime string        `json:"query_time"`
	Elapsed   string        `json:"elapsed"`
}

func (r RiverStatus) ToPrettyJson() string {
	return toPrettyJson(r)
}

func toPrettyJson(v any) string {
	b, err := json.MarshalIndent(v, "", "  ")
	if err == nil {
		return string(b)
	} else {
		return "\"FAILED\""
	}
}
