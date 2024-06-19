package config

import (
	"encoding/json"
	"os"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/mitchellh/mapstructure"
	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/protocol"
)

var (
	commonAddressType = reflect.TypeOf(common.Address{})
	timeDurationType  = reflect.TypeOf(time.Duration(0))
	uint64SliceType   = reflect.TypeOf([]uint64{})
)

func DecodeAddressOrAddressFileHook() mapstructure.DecodeHookFuncType {
	return func(from reflect.Type, to reflect.Type, data interface{}) (interface{}, error) {
		if from.Kind() == reflect.String && to == commonAddressType {
			addr, err := parseOrLoadAddress(data.(string))
			if err != nil {
				return nil, base.AsRiverError(err, protocol.Err_BAD_CONFIG).
					Message("Failed to parse address").
					Func("DecodeAddressOrAddressFileHook")
			}
			return addr, nil
		}
		return data, nil
	}
}

func DecodeDurationHook() mapstructure.DecodeHookFuncType {
	return func(from reflect.Type, to reflect.Type, data interface{}) (interface{}, error) {
		if from.Kind() == reflect.String && to == timeDurationType {
			duration, err := time.ParseDuration(data.(string))
			if err != nil {
				return nil, base.AsRiverError(err, protocol.Err_BAD_CONFIG).
					Message("Failed to parse duration").
					Func("DecodeDurationHook")
			}
			return duration, nil
		}
		return data, nil
	}
}

func DecodeUint64SliceHook() mapstructure.DecodeHookFuncType {
	return func(from reflect.Type, to reflect.Type, data interface{}) (interface{}, error) {
		if from.Kind() == reflect.String && to == uint64SliceType {
			str := data.(string)
			if str == "" {
				return []uint64{}, nil
			}

			parts := strings.Split(str, ",")
			result := make([]uint64, 0, len(parts))
			for _, part := range parts {
				val, err := strconv.ParseUint(part, 10, 64)
				if err != nil {
					return nil, base.AsRiverError(err, protocol.Err_BAD_CONFIG).
						Message("Failed to parse uint64 slice").
						Func("DecodeUint64SliceHook")
				}
				result = append(result, val)
			}
			return result, nil
		}
		return data, nil
	}
}

func parseOrLoadAddress(addrOrFile string) (common.Address, error) {
	if addrOrFile == "" {
		return common.Address{}, nil
	}

	if common.IsHexAddress(addrOrFile) {
		return common.HexToAddress(addrOrFile), nil
	}

	fileData, err := os.ReadFile(addrOrFile)
	if err != nil {
		return common.Address{}, base.AsRiverError(err).
			Tag("file", addrOrFile).
			Func("parseOrLoadAddress")
	}

	var data struct {
		Address string `json:"address"`
	}

	if err := json.Unmarshal(fileData, &data); err != nil {
		return common.Address{}, base.AsRiverError(err).
			Tag("file", addrOrFile).
			Func("parseOrLoadAddress")
	}

	if common.IsHexAddress(data.Address) {
		return common.HexToAddress(data.Address), nil
	}

	return common.Address{}, base.AsRiverError(err).
		Tag("file", addrOrFile).
		Tag("loaded_address", data.Address).
		Func("parseOrLoadAddress")
}
