package entitlement

import (
	"math/big"
	"strconv"

	"github.com/ethereum/go-ethereum/common"
	"github.com/spf13/cobra"
)

var (
	Omega = &Config{
		BaseRegistery: common.HexToAddress("0x7c0422b31401C936172C897802CF0373B35B7698"),
		RPCEndpoint:   "https://mainnet.base.org",
	}

	Gamma = &Config{
		BaseRegistery: common.HexToAddress("0x08cC41b782F27d62995056a4EF2fCBAe0d3c266F"),
		RPCEndpoint:   "https://sepolia.base.org",
	}

	Alpha = &Config{
		BaseRegistery: common.HexToAddress("0x0230a9d28bc48a90d6f5e5112b24319ec1b14c52"),
		RPCEndpoint:   "https://sepolia.base.org",
	}
)

type (
	Config struct {
		BaseRegistery common.Address
		RPCEndpoint   string
		BlockRange    struct {
			From *big.Int
			To   *big.Int
		}
	}

	RequestedCheck struct {
		TxID string
	}
)

func config(cmd *cobra.Command, args []string) *Config {
	from, err := strconv.ParseInt(args[0], 10, 64)
	if err != nil {
		panic("Invalid from-block " + args[0])
	}

	var to *big.Int
	if len(args) > 1 {
		toBlock, err := strconv.ParseInt(args[1], 10, 64)
		if err != nil {
			panic("Invalid to-block " + args[1])
		}
		to = big.NewInt(toBlock)
	}

	customRpcProvider, _ := cmd.Flags().GetString("rpc.endpoint")

	env, _ := cmd.Flags().GetString("env")
	switch env {
	case "omega":
		if customRpcProvider != "" {
			Omega.RPCEndpoint = customRpcProvider
		}
		Omega.BlockRange.From = big.NewInt(from)
		Omega.BlockRange.To = to
		return Omega
	case "gamma":
		if customRpcProvider != "" {
			Gamma.RPCEndpoint = customRpcProvider
		}
		Gamma.BlockRange.From = big.NewInt(from)
		Gamma.BlockRange.To = to
		return Gamma
	case "alpha":
		if customRpcProvider != "" {
			Alpha.RPCEndpoint = customRpcProvider
		}
		Alpha.BlockRange.From = big.NewInt(from)
		Alpha.BlockRange.To = to
		return Alpha
	default:
		panic("Unsupported environment " + env)
	}
}
