package entitlement

import (
	"context"
	"encoding/hex"
	"fmt"
	"math/big"
	"os"
	"slices"
	"sort"
	"strings"

	"github.com/acarl005/stripansi"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/fatih/color"
	"github.com/river-build/river/core/contracts/base"
	"github.com/rodaine/table"
	"github.com/spf13/cobra"
	"unicode/utf8"
)

type EntitlementCheckVote struct {
	Result uint8
	RoleID *big.Int
	Count  int // keep track how many times a node has voted (should be 1, but...)
}

type EntitlementCheck struct {
	Request base.IEntitlementCheckerEntitlementCheckRequested
	Votes   map[common.Address]*EntitlementCheckVote
}

func (check *EntitlementCheck) Processed() bool {
	n := len(check.Request.SelectedNodes) / 2
	return len(check.Votes) > n
}

func (check *EntitlementCheck) Responded() string {
	var result strings.Builder
	for node := range check.Votes {
		if result.Len() > 0 {
			result.WriteString(",")
		}
		result.WriteString(node.Hex())
		result.WriteString(fmt.Sprintf(" (%d)", check.Votes[node].Count))
	}
	if result.Len() == 0 {
		return ""
	}
	return "[" + result.String() + "]"
}

func (check *EntitlementCheck) NoResponse() string {
	var result strings.Builder

	for _, node := range check.Request.SelectedNodes {
		if _, ok := check.Votes[node]; !ok {
			if result.Len() > 0 {
				result.WriteString(",")
			}
			result.WriteString(node.Hex())
		}
	}
	if result.Len() == 0 {
		return ""
	}
	return "[" + result.String() + "]"
}

func Run(cmd *cobra.Command, args []string) {
	var (
		ctx = cmd.Context()
		cfg = config(cmd, args)
	)

	client, err := ethclient.DialContext(ctx, cfg.RPCEndpoint)
	if err != nil {
		panic(err)
	}
	defer client.Close()

	requests := fetchEntitlementRequests(ctx, client, cfg)
	results := fetchEntitlementResults(ctx, client, requests)

	headerFmt := color.New(color.FgGreen, color.Underline).SprintfFunc()
	columnFmt := color.New(color.FgYellow).SprintfFunc()
	colorAwareWidthFunc := func(s string) int { return utf8.RuneCountInString(stripansi.Strip(s)) }

	tbl := table.New("Entitlement.TxId", "Processed", "Req.Transaction", "Req.Block", "Responded", "No Response")
	tbl.WithHeaderFormatter(headerFmt).
		WithFirstColumnFormatter(columnFmt).
		WithWidthFunc(colorAwareWidthFunc)

	for _, req := range results {
		processed := color.HiRedString("NO")
		if req.Processed() {
			processed = color.HiGreenString("YES")
		}

		tbl.AddRow(
			common.Hash(req.Request.TransactionId),
			processed,
			req.Request.Raw.TxHash,
			req.Request.Raw.BlockNumber,
			color.HiGreenString(req.Responded()),
			color.HiRedString(req.NoResponse()))
	}

	tbl.Print()
}

func fetchEntitlementRequests(ctx context.Context, client *ethclient.Client, cfg *Config) []*EntitlementCheck {
	var (
		from                        = cfg.BlockRange.From
		to                          = cfg.BlockRange.To
		checkerABI, _               = base.IEntitlementCheckerMetaData.GetAbi()
		EntitlementCheckRequestedID = checkerABI.Events["EntitlementCheckRequested"].ID
		requests                    []*EntitlementCheck
		blockRangeSize              = int64(10 * 1024)
	)

	if to == nil {
		head, err := client.HeaderByNumber(ctx, nil)
		if err != nil {
			panic(err)
		}
		to = head.Number
	}

	for i := from.Int64(); i < to.Int64(); i += blockRangeSize {
		logs, err := client.FilterLogs(ctx, ethereum.FilterQuery{
			FromBlock: big.NewInt(i),
			ToBlock:   big.NewInt(min(i+blockRangeSize, to.Int64())),
			Addresses: []common.Address{cfg.BaseRegistery}, // Define the slice with the single value
			Topics: [][]common.Hash{{
				EntitlementCheckRequestedID,
			}},
		})
		if err != nil {
			panic(err)
		}

		for _, log := range logs {
			switch log.Topics[0] {
			case EntitlementCheckRequestedID:
				var req base.IEntitlementCheckerEntitlementCheckRequested
				err := checkerABI.UnpackIntoInterface(&req, "EntitlementCheckRequested", log.Data)
				if err != nil {
					panic(err)
				}
				req.Raw = log

				sort.Slice(req.SelectedNodes, func(i, j int) bool {
					return req.SelectedNodes[i].Cmp(req.SelectedNodes[j]) < 0
				})

				requests = append(requests, &EntitlementCheck{
					Request: req,
					Votes:   make(map[common.Address]*EntitlementCheckVote),
				})

			}
		}
	}

	// most recent entitlement check requests first
	slices.Reverse(requests)

	return requests
}

func fetchEntitlementResults(ctx context.Context, client *ethclient.Client, requests []*EntitlementCheck) []*EntitlementCheck {
	var (
		gatedABI, _                        = base.IEntitlementGatedMetaData.GetAbi()
		EntitlementCheckResultPostedID     = gatedABI.Methods["postEntitlementCheckResult"].ID
		postFuncSelector                   = hex.EncodeToString(EntitlementCheckResultPostedID[:4])
		EntitlementCheckResultPostedInputs = gatedABI.Methods["postEntitlementCheckResult"].Inputs
	)

	for _, req := range requests {
		start := int64(req.Request.Raw.BlockNumber)
		end := int64(req.Request.Raw.BlockNumber + 10) // 20 seconds

		for blockNumber := start; blockNumber <= end; blockNumber++ {
			block, err := client.BlockByNumber(ctx, big.NewInt(blockNumber))
			if err != nil {
				fmt.Printf("Failed to retrieve block: %v\n", err)
				os.Exit(1)
			}

			resultContract := req.Request.ContractAddress

			for _, tx := range block.Transactions() {
				if tx.To() != nil && *tx.To() == resultContract {
					txData := tx.Data()
					if len(txData) >= 4 {
						txFuncSelector := hex.EncodeToString(txData[:4])
						if txFuncSelector == postFuncSelector {
							from, err := types.Sender(types.LatestSignerForChainID(tx.ChainId()), tx)
							if err == nil {
								parsedData, err := EntitlementCheckResultPostedInputs.Unpack(txData[4:])
								if err != nil {
									fmt.Printf("Failed to unpack data: %v\n", err)
								}

								entitlementCheckResult := parsedData[0].([32]byte)
								transactionId := common.BytesToHash(entitlementCheckResult[:])

								if transactionId == req.Request.TransactionId {
									//receipt, err := client.TransactionReceipt(ctx, tx.Hash())
									//if err != nil {
									//	panic(err)
									//}
									//
									//receipt.GasUsed
									//receipt.EffectiveGasPrice

									if vote, alreadyVoted := req.Votes[from]; alreadyVoted {
										vote.Count++
									} else {
										req.Votes[from] = &EntitlementCheckVote{
											RoleID: parsedData[1].(*big.Int),
											Result: parsedData[2].(uint8),
											Count:  1,
										}
									}
								}
							} else {
								fmt.Printf("Failed to recover address: %v\n", err)
							}
						}
					}
				}
			}
		}
	}

	return requests
}
