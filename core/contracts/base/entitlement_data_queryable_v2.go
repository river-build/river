// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package base

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// IEntitlementDataQueryableBaseEntitlementData is an auto generated low-level Go binding around an user-defined struct.
type IEntitlementDataQueryableBaseEntitlementData struct {
	EntitlementType string
	EntitlementData []byte
}

// IEntitlementDataQueryableBaseV2EntitlementData is an auto generated low-level Go binding around an user-defined struct.
type IEntitlementDataQueryableBaseV2EntitlementData struct {
	EntitlementType string
	EntitlementData []byte
}

// EntitlementDataQueryableV2MetaData contains all meta data concerning the EntitlementDataQueryableV2 contract.
var EntitlementDataQueryableV2MetaData = &bind.MetaData{
	ABI: "[{\"type\":\"function\",\"name\":\"getChannelEntitlementDataByPermission\",\"inputs\":[{\"name\":\"channelId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"permission\",\"type\":\"string\",\"internalType\":\"string\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple[]\",\"internalType\":\"structIEntitlementDataQueryableBase.EntitlementData[]\",\"components\":[{\"name\":\"entitlementType\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"entitlementData\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getChannelEntitlementDataByPermissionV2\",\"inputs\":[{\"name\":\"channelId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"permission\",\"type\":\"string\",\"internalType\":\"string\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple[]\",\"internalType\":\"structIEntitlementDataQueryableBaseV2.EntitlementData[]\",\"components\":[{\"name\":\"entitlementType\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"entitlementData\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getEntitlementDataByPermission\",\"inputs\":[{\"name\":\"permission\",\"type\":\"string\",\"internalType\":\"string\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple[]\",\"internalType\":\"structIEntitlementDataQueryableBase.EntitlementData[]\",\"components\":[{\"name\":\"entitlementType\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"entitlementData\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getEntitlementDataByPermissionV2\",\"inputs\":[{\"name\":\"permission\",\"type\":\"string\",\"internalType\":\"string\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple[]\",\"internalType\":\"structIEntitlementDataQueryableBaseV2.EntitlementData[]\",\"components\":[{\"name\":\"entitlementType\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"entitlementData\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]}],\"stateMutability\":\"view\"}]",
}

// EntitlementDataQueryableV2ABI is the input ABI used to generate the binding from.
// Deprecated: Use EntitlementDataQueryableV2MetaData.ABI instead.
var EntitlementDataQueryableV2ABI = EntitlementDataQueryableV2MetaData.ABI

// EntitlementDataQueryableV2 is an auto generated Go binding around an Ethereum contract.
type EntitlementDataQueryableV2 struct {
	EntitlementDataQueryableV2Caller     // Read-only binding to the contract
	EntitlementDataQueryableV2Transactor // Write-only binding to the contract
	EntitlementDataQueryableV2Filterer   // Log filterer for contract events
}

// EntitlementDataQueryableV2Caller is an auto generated read-only Go binding around an Ethereum contract.
type EntitlementDataQueryableV2Caller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EntitlementDataQueryableV2Transactor is an auto generated write-only Go binding around an Ethereum contract.
type EntitlementDataQueryableV2Transactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EntitlementDataQueryableV2Filterer is an auto generated log filtering Go binding around an Ethereum contract events.
type EntitlementDataQueryableV2Filterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EntitlementDataQueryableV2Session is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type EntitlementDataQueryableV2Session struct {
	Contract     *EntitlementDataQueryableV2 // Generic contract binding to set the session for
	CallOpts     bind.CallOpts               // Call options to use throughout this session
	TransactOpts bind.TransactOpts           // Transaction auth options to use throughout this session
}

// EntitlementDataQueryableV2CallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type EntitlementDataQueryableV2CallerSession struct {
	Contract *EntitlementDataQueryableV2Caller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts                     // Call options to use throughout this session
}

// EntitlementDataQueryableV2TransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type EntitlementDataQueryableV2TransactorSession struct {
	Contract     *EntitlementDataQueryableV2Transactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts                     // Transaction auth options to use throughout this session
}

// EntitlementDataQueryableV2Raw is an auto generated low-level Go binding around an Ethereum contract.
type EntitlementDataQueryableV2Raw struct {
	Contract *EntitlementDataQueryableV2 // Generic contract binding to access the raw methods on
}

// EntitlementDataQueryableV2CallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type EntitlementDataQueryableV2CallerRaw struct {
	Contract *EntitlementDataQueryableV2Caller // Generic read-only contract binding to access the raw methods on
}

// EntitlementDataQueryableV2TransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type EntitlementDataQueryableV2TransactorRaw struct {
	Contract *EntitlementDataQueryableV2Transactor // Generic write-only contract binding to access the raw methods on
}

// NewEntitlementDataQueryableV2 creates a new instance of EntitlementDataQueryableV2, bound to a specific deployed contract.
func NewEntitlementDataQueryableV2(address common.Address, backend bind.ContractBackend) (*EntitlementDataQueryableV2, error) {
	contract, err := bindEntitlementDataQueryableV2(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &EntitlementDataQueryableV2{EntitlementDataQueryableV2Caller: EntitlementDataQueryableV2Caller{contract: contract}, EntitlementDataQueryableV2Transactor: EntitlementDataQueryableV2Transactor{contract: contract}, EntitlementDataQueryableV2Filterer: EntitlementDataQueryableV2Filterer{contract: contract}}, nil
}

// NewEntitlementDataQueryableV2Caller creates a new read-only instance of EntitlementDataQueryableV2, bound to a specific deployed contract.
func NewEntitlementDataQueryableV2Caller(address common.Address, caller bind.ContractCaller) (*EntitlementDataQueryableV2Caller, error) {
	contract, err := bindEntitlementDataQueryableV2(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &EntitlementDataQueryableV2Caller{contract: contract}, nil
}

// NewEntitlementDataQueryableV2Transactor creates a new write-only instance of EntitlementDataQueryableV2, bound to a specific deployed contract.
func NewEntitlementDataQueryableV2Transactor(address common.Address, transactor bind.ContractTransactor) (*EntitlementDataQueryableV2Transactor, error) {
	contract, err := bindEntitlementDataQueryableV2(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &EntitlementDataQueryableV2Transactor{contract: contract}, nil
}

// NewEntitlementDataQueryableV2Filterer creates a new log filterer instance of EntitlementDataQueryableV2, bound to a specific deployed contract.
func NewEntitlementDataQueryableV2Filterer(address common.Address, filterer bind.ContractFilterer) (*EntitlementDataQueryableV2Filterer, error) {
	contract, err := bindEntitlementDataQueryableV2(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &EntitlementDataQueryableV2Filterer{contract: contract}, nil
}

// bindEntitlementDataQueryableV2 binds a generic wrapper to an already deployed contract.
func bindEntitlementDataQueryableV2(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := EntitlementDataQueryableV2MetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Raw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _EntitlementDataQueryableV2.Contract.EntitlementDataQueryableV2Caller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Raw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EntitlementDataQueryableV2.Contract.EntitlementDataQueryableV2Transactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Raw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _EntitlementDataQueryableV2.Contract.EntitlementDataQueryableV2Transactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2CallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _EntitlementDataQueryableV2.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2TransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EntitlementDataQueryableV2.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2TransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _EntitlementDataQueryableV2.Contract.contract.Transact(opts, method, params...)
}

// GetChannelEntitlementDataByPermission is a free data retrieval call binding the contract method 0x40cd83fb.
//
// Solidity: function getChannelEntitlementDataByPermission(bytes32 channelId, string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Caller) GetChannelEntitlementDataByPermission(opts *bind.CallOpts, channelId [32]byte, permission string) ([]IEntitlementDataQueryableBaseEntitlementData, error) {
	var out []interface{}
	err := _EntitlementDataQueryableV2.contract.Call(opts, &out, "getChannelEntitlementDataByPermission", channelId, permission)

	if err != nil {
		return *new([]IEntitlementDataQueryableBaseEntitlementData), err
	}

	out0 := *abi.ConvertType(out[0], new([]IEntitlementDataQueryableBaseEntitlementData)).(*[]IEntitlementDataQueryableBaseEntitlementData)

	return out0, err

}

// GetChannelEntitlementDataByPermission is a free data retrieval call binding the contract method 0x40cd83fb.
//
// Solidity: function getChannelEntitlementDataByPermission(bytes32 channelId, string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Session) GetChannelEntitlementDataByPermission(channelId [32]byte, permission string) ([]IEntitlementDataQueryableBaseEntitlementData, error) {
	return _EntitlementDataQueryableV2.Contract.GetChannelEntitlementDataByPermission(&_EntitlementDataQueryableV2.CallOpts, channelId, permission)
}

// GetChannelEntitlementDataByPermission is a free data retrieval call binding the contract method 0x40cd83fb.
//
// Solidity: function getChannelEntitlementDataByPermission(bytes32 channelId, string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2CallerSession) GetChannelEntitlementDataByPermission(channelId [32]byte, permission string) ([]IEntitlementDataQueryableBaseEntitlementData, error) {
	return _EntitlementDataQueryableV2.Contract.GetChannelEntitlementDataByPermission(&_EntitlementDataQueryableV2.CallOpts, channelId, permission)
}

// GetChannelEntitlementDataByPermissionV2 is a free data retrieval call binding the contract method 0xc15df21b.
//
// Solidity: function getChannelEntitlementDataByPermissionV2(bytes32 channelId, string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Caller) GetChannelEntitlementDataByPermissionV2(opts *bind.CallOpts, channelId [32]byte, permission string) ([]IEntitlementDataQueryableBaseV2EntitlementData, error) {
	var out []interface{}
	err := _EntitlementDataQueryableV2.contract.Call(opts, &out, "getChannelEntitlementDataByPermissionV2", channelId, permission)

	if err != nil {
		return *new([]IEntitlementDataQueryableBaseV2EntitlementData), err
	}

	out0 := *abi.ConvertType(out[0], new([]IEntitlementDataQueryableBaseV2EntitlementData)).(*[]IEntitlementDataQueryableBaseV2EntitlementData)

	return out0, err

}

// GetChannelEntitlementDataByPermissionV2 is a free data retrieval call binding the contract method 0xc15df21b.
//
// Solidity: function getChannelEntitlementDataByPermissionV2(bytes32 channelId, string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Session) GetChannelEntitlementDataByPermissionV2(channelId [32]byte, permission string) ([]IEntitlementDataQueryableBaseV2EntitlementData, error) {
	return _EntitlementDataQueryableV2.Contract.GetChannelEntitlementDataByPermissionV2(&_EntitlementDataQueryableV2.CallOpts, channelId, permission)
}

// GetChannelEntitlementDataByPermissionV2 is a free data retrieval call binding the contract method 0xc15df21b.
//
// Solidity: function getChannelEntitlementDataByPermissionV2(bytes32 channelId, string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2CallerSession) GetChannelEntitlementDataByPermissionV2(channelId [32]byte, permission string) ([]IEntitlementDataQueryableBaseV2EntitlementData, error) {
	return _EntitlementDataQueryableV2.Contract.GetChannelEntitlementDataByPermissionV2(&_EntitlementDataQueryableV2.CallOpts, channelId, permission)
}

// GetEntitlementDataByPermission is a free data retrieval call binding the contract method 0xdb0a69a8.
//
// Solidity: function getEntitlementDataByPermission(string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Caller) GetEntitlementDataByPermission(opts *bind.CallOpts, permission string) ([]IEntitlementDataQueryableBaseEntitlementData, error) {
	var out []interface{}
	err := _EntitlementDataQueryableV2.contract.Call(opts, &out, "getEntitlementDataByPermission", permission)

	if err != nil {
		return *new([]IEntitlementDataQueryableBaseEntitlementData), err
	}

	out0 := *abi.ConvertType(out[0], new([]IEntitlementDataQueryableBaseEntitlementData)).(*[]IEntitlementDataQueryableBaseEntitlementData)

	return out0, err

}

// GetEntitlementDataByPermission is a free data retrieval call binding the contract method 0xdb0a69a8.
//
// Solidity: function getEntitlementDataByPermission(string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Session) GetEntitlementDataByPermission(permission string) ([]IEntitlementDataQueryableBaseEntitlementData, error) {
	return _EntitlementDataQueryableV2.Contract.GetEntitlementDataByPermission(&_EntitlementDataQueryableV2.CallOpts, permission)
}

// GetEntitlementDataByPermission is a free data retrieval call binding the contract method 0xdb0a69a8.
//
// Solidity: function getEntitlementDataByPermission(string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2CallerSession) GetEntitlementDataByPermission(permission string) ([]IEntitlementDataQueryableBaseEntitlementData, error) {
	return _EntitlementDataQueryableV2.Contract.GetEntitlementDataByPermission(&_EntitlementDataQueryableV2.CallOpts, permission)
}

// GetEntitlementDataByPermissionV2 is a free data retrieval call binding the contract method 0xfce159c4.
//
// Solidity: function getEntitlementDataByPermissionV2(string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Caller) GetEntitlementDataByPermissionV2(opts *bind.CallOpts, permission string) ([]IEntitlementDataQueryableBaseV2EntitlementData, error) {
	var out []interface{}
	err := _EntitlementDataQueryableV2.contract.Call(opts, &out, "getEntitlementDataByPermissionV2", permission)

	if err != nil {
		return *new([]IEntitlementDataQueryableBaseV2EntitlementData), err
	}

	out0 := *abi.ConvertType(out[0], new([]IEntitlementDataQueryableBaseV2EntitlementData)).(*[]IEntitlementDataQueryableBaseV2EntitlementData)

	return out0, err

}

// GetEntitlementDataByPermissionV2 is a free data retrieval call binding the contract method 0xfce159c4.
//
// Solidity: function getEntitlementDataByPermissionV2(string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2Session) GetEntitlementDataByPermissionV2(permission string) ([]IEntitlementDataQueryableBaseV2EntitlementData, error) {
	return _EntitlementDataQueryableV2.Contract.GetEntitlementDataByPermissionV2(&_EntitlementDataQueryableV2.CallOpts, permission)
}

// GetEntitlementDataByPermissionV2 is a free data retrieval call binding the contract method 0xfce159c4.
//
// Solidity: function getEntitlementDataByPermissionV2(string permission) view returns((string,bytes)[])
func (_EntitlementDataQueryableV2 *EntitlementDataQueryableV2CallerSession) GetEntitlementDataByPermissionV2(permission string) ([]IEntitlementDataQueryableBaseV2EntitlementData, error) {
	return _EntitlementDataQueryableV2.Contract.GetEntitlementDataByPermissionV2(&_EntitlementDataQueryableV2.CallOpts, permission)
}
