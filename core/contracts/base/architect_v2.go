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
	_	= errors.New
	_	= big.NewInt
	_	= strings.NewReader
	_	= ethereum.NotFound
	_	= bind.Bind
	_	= common.Big1
	_	= types.BloomLookup
	_	= event.NewSubscription
	_	= abi.ConvertType
)

type IArchitectBaseMembershipRequirementsV2 struct {
	Everyone	bool
	Users		[]common.Address
	RuleDataV2	[]byte
}

type IArchitectBaseMembershipV2 struct {
	Settings	IMembershipBaseMembership
	Requirements	IArchitectBaseMembershipRequirementsV2
	Permissions	[]string
}

type IArchitectBaseSpaceInfoV2 struct {
	Name			string
	Uri			string
	Membership		IArchitectBaseMembershipV2
	Channel			IArchitectBaseChannelInfo
	ShortDescription	string
	LongDescription		string
}

// ArchitectV2MetaData contains all meta data concerning the ArchitectV2 contract.
var ArchitectV2MetaData = &bind.MetaData{
	ABI: "[{\"type\":\"function\",\"name\":\"createSpace\",\"inputs\":[{\"name\":\"SpaceInfo\",\"type\":\"tuple\",\"internalType\":\"structIArchitectBase.SpaceInfo\",\"components\":[{\"name\":\"name\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"uri\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"membership\",\"type\":\"tuple\",\"internalType\":\"structIArchitectBase.Membership\",\"components\":[{\"name\":\"settings\",\"type\":\"tuple\",\"internalType\":\"structIMembershipBase.Membership\",\"components\":[{\"name\":\"name\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"symbol\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"price\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"maxSupply\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"duration\",\"type\":\"uint64\",\"internalType\":\"uint64\"},{\"name\":\"currency\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"feeRecipient\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"freeAllocation\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"pricingModule\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"name\":\"requirements\",\"type\":\"tuple\",\"internalType\":\"structIArchitectBase.MembershipRequirements\",\"components\":[{\"name\":\"everyone\",\"type\":\"bool\",\"internalType\":\"bool\"},{\"name\":\"users\",\"type\":\"address[]\",\"internalType\":\"address[]\"},{\"name\":\"ruleData\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}]},{\"name\":\"permissions\",\"type\":\"string[]\",\"internalType\":\"string[]\"}]},{\"name\":\"channel\",\"type\":\"tuple\",\"internalType\":\"structIArchitectBase.ChannelInfo\",\"components\":[{\"name\":\"metadata\",\"type\":\"string\",\"internalType\":\"string\"}]},{\"name\":\"shortDescription\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"longDescription\",\"type\":\"string\",\"internalType\":\"string\"}]}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"createSpaceV2\",\"inputs\":[{\"name\":\"SpaceInfo\",\"type\":\"tuple\",\"internalType\":\"structIArchitectBase.SpaceInfoV2\",\"components\":[{\"name\":\"name\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"uri\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"membership\",\"type\":\"tuple\",\"internalType\":\"structIArchitectBase.MembershipV2\",\"components\":[{\"name\":\"settings\",\"type\":\"tuple\",\"internalType\":\"structIMembershipBase.Membership\",\"components\":[{\"name\":\"name\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"symbol\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"price\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"maxSupply\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"duration\",\"type\":\"uint64\",\"internalType\":\"uint64\"},{\"name\":\"currency\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"feeRecipient\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"freeAllocation\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"pricingModule\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"name\":\"requirements\",\"type\":\"tuple\",\"internalType\":\"structIArchitectBase.MembershipRequirementsV2\",\"components\":[{\"name\":\"everyone\",\"type\":\"bool\",\"internalType\":\"bool\"},{\"name\":\"users\",\"type\":\"address[]\",\"internalType\":\"address[]\"},{\"name\":\"ruleDataV2\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]},{\"name\":\"permissions\",\"type\":\"string[]\",\"internalType\":\"string[]\"}]},{\"name\":\"channel\",\"type\":\"tuple\",\"internalType\":\"structIArchitectBase.ChannelInfo\",\"components\":[{\"name\":\"metadata\",\"type\":\"string\",\"internalType\":\"string\"}]},{\"name\":\"shortDescription\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"longDescription\",\"type\":\"string\",\"internalType\":\"string\"}]}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getSpaceArchitectImplementations\",\"inputs\":[],\"outputs\":[{\"name\":\"ownerTokenImplementation\",\"type\":\"address\",\"internalType\":\"contractISpaceOwner\"},{\"name\":\"userEntitlementImplementation\",\"type\":\"address\",\"internalType\":\"contractIUserEntitlement\"},{\"name\":\"ruleEntitlementImplementation\",\"type\":\"address\",\"internalType\":\"contractIRuleEntitlement\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getSpaceByTokenId\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"space\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getTokenIdBySpace\",\"inputs\":[{\"name\":\"space\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"setSpaceArchitectImplementations\",\"inputs\":[{\"name\":\"ownerTokenImplementation\",\"type\":\"address\",\"internalType\":\"contractISpaceOwner\"},{\"name\":\"userEntitlementImplementation\",\"type\":\"address\",\"internalType\":\"contractIUserEntitlement\"},{\"name\":\"ruleEntitlementImplementation\",\"type\":\"address\",\"internalType\":\"contractIRuleEntitlement\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"SpaceCreated\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"tokenId\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"space\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"Architect__InvalidAddress\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Architect__InvalidEntitlementVersion\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Architect__InvalidNetworkId\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Architect__InvalidStringLength\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Architect__NotContract\",\"inputs\":[]}]",
}

// ArchitectV2ABI is the input ABI used to generate the binding from.
// Deprecated: Use ArchitectV2MetaData.ABI instead.
var ArchitectV2ABI = ArchitectV2MetaData.ABI

// ArchitectV2 is an auto generated Go binding around an Ethereum contract.
type ArchitectV2 struct {
	ArchitectV2Caller	// Read-only binding to the contract
	ArchitectV2Transactor	// Write-only binding to the contract
	ArchitectV2Filterer	// Log filterer for contract events
}

// ArchitectV2Caller is an auto generated read-only Go binding around an Ethereum contract.
type ArchitectV2Caller struct {
	contract *bind.BoundContract	// Generic contract wrapper for the low level calls
}

// ArchitectV2Transactor is an auto generated write-only Go binding around an Ethereum contract.
type ArchitectV2Transactor struct {
	contract *bind.BoundContract	// Generic contract wrapper for the low level calls
}

// ArchitectV2Filterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ArchitectV2Filterer struct {
	contract *bind.BoundContract	// Generic contract wrapper for the low level calls
}

// ArchitectV2Session is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ArchitectV2Session struct {
	Contract	*ArchitectV2		// Generic contract binding to set the session for
	CallOpts	bind.CallOpts		// Call options to use throughout this session
	TransactOpts	bind.TransactOpts	// Transaction auth options to use throughout this session
}

// ArchitectV2CallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ArchitectV2CallerSession struct {
	Contract	*ArchitectV2Caller	// Generic contract caller binding to set the session for
	CallOpts	bind.CallOpts		// Call options to use throughout this session
}

// ArchitectV2TransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ArchitectV2TransactorSession struct {
	Contract	*ArchitectV2Transactor	// Generic contract transactor binding to set the session for
	TransactOpts	bind.TransactOpts	// Transaction auth options to use throughout this session
}

// ArchitectV2Raw is an auto generated low-level Go binding around an Ethereum contract.
type ArchitectV2Raw struct {
	Contract *ArchitectV2	// Generic contract binding to access the raw methods on
}

// ArchitectV2CallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ArchitectV2CallerRaw struct {
	Contract *ArchitectV2Caller	// Generic read-only contract binding to access the raw methods on
}

// ArchitectV2TransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ArchitectV2TransactorRaw struct {
	Contract *ArchitectV2Transactor	// Generic write-only contract binding to access the raw methods on
}

// NewArchitectV2 creates a new instance of ArchitectV2, bound to a specific deployed contract.
func NewArchitectV2(address common.Address, backend bind.ContractBackend) (*ArchitectV2, error) {
	contract, err := bindArchitectV2(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &ArchitectV2{ArchitectV2Caller: ArchitectV2Caller{contract: contract}, ArchitectV2Transactor: ArchitectV2Transactor{contract: contract}, ArchitectV2Filterer: ArchitectV2Filterer{contract: contract}}, nil
}

// NewArchitectV2Caller creates a new read-only instance of ArchitectV2, bound to a specific deployed contract.
func NewArchitectV2Caller(address common.Address, caller bind.ContractCaller) (*ArchitectV2Caller, error) {
	contract, err := bindArchitectV2(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ArchitectV2Caller{contract: contract}, nil
}

// NewArchitectV2Transactor creates a new write-only instance of ArchitectV2, bound to a specific deployed contract.
func NewArchitectV2Transactor(address common.Address, transactor bind.ContractTransactor) (*ArchitectV2Transactor, error) {
	contract, err := bindArchitectV2(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ArchitectV2Transactor{contract: contract}, nil
}

// NewArchitectV2Filterer creates a new log filterer instance of ArchitectV2, bound to a specific deployed contract.
func NewArchitectV2Filterer(address common.Address, filterer bind.ContractFilterer) (*ArchitectV2Filterer, error) {
	contract, err := bindArchitectV2(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ArchitectV2Filterer{contract: contract}, nil
}

// bindArchitectV2 binds a generic wrapper to an already deployed contract.
func bindArchitectV2(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := ArchitectV2MetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ArchitectV2 *ArchitectV2Raw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ArchitectV2.Contract.ArchitectV2Caller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ArchitectV2 *ArchitectV2Raw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ArchitectV2.Contract.ArchitectV2Transactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ArchitectV2 *ArchitectV2Raw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ArchitectV2.Contract.ArchitectV2Transactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ArchitectV2 *ArchitectV2CallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ArchitectV2.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ArchitectV2 *ArchitectV2TransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ArchitectV2.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ArchitectV2 *ArchitectV2TransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ArchitectV2.Contract.contract.Transact(opts, method, params...)
}

// GetSpaceArchitectImplementations is a free data retrieval call binding the contract method 0x545efb2d.
//
// Solidity: function getSpaceArchitectImplementations() view returns(address ownerTokenImplementation, address userEntitlementImplementation, address ruleEntitlementImplementation)
func (_ArchitectV2 *ArchitectV2Caller) GetSpaceArchitectImplementations(opts *bind.CallOpts) (struct {
	OwnerTokenImplementation	common.Address
	UserEntitlementImplementation	common.Address
	RuleEntitlementImplementation	common.Address
}, error) {
	var out []interface{}
	err := _ArchitectV2.contract.Call(opts, &out, "getSpaceArchitectImplementations")

	outstruct := new(struct {
		OwnerTokenImplementation	common.Address
		UserEntitlementImplementation	common.Address
		RuleEntitlementImplementation	common.Address
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.OwnerTokenImplementation = *abi.ConvertType(out[0], new(common.Address)).(*common.Address)
	outstruct.UserEntitlementImplementation = *abi.ConvertType(out[1], new(common.Address)).(*common.Address)
	outstruct.RuleEntitlementImplementation = *abi.ConvertType(out[2], new(common.Address)).(*common.Address)

	return *outstruct, err

}

// GetSpaceArchitectImplementations is a free data retrieval call binding the contract method 0x545efb2d.
//
// Solidity: function getSpaceArchitectImplementations() view returns(address ownerTokenImplementation, address userEntitlementImplementation, address ruleEntitlementImplementation)
func (_ArchitectV2 *ArchitectV2Session) GetSpaceArchitectImplementations() (struct {
	OwnerTokenImplementation	common.Address
	UserEntitlementImplementation	common.Address
	RuleEntitlementImplementation	common.Address
}, error) {
	return _ArchitectV2.Contract.GetSpaceArchitectImplementations(&_ArchitectV2.CallOpts)
}

// GetSpaceArchitectImplementations is a free data retrieval call binding the contract method 0x545efb2d.
//
// Solidity: function getSpaceArchitectImplementations() view returns(address ownerTokenImplementation, address userEntitlementImplementation, address ruleEntitlementImplementation)
func (_ArchitectV2 *ArchitectV2CallerSession) GetSpaceArchitectImplementations() (struct {
	OwnerTokenImplementation	common.Address
	UserEntitlementImplementation	common.Address
	RuleEntitlementImplementation	common.Address
}, error) {
	return _ArchitectV2.Contract.GetSpaceArchitectImplementations(&_ArchitectV2.CallOpts)
}

// GetSpaceByTokenId is a free data retrieval call binding the contract method 0x673f0dd5.
//
// Solidity: function getSpaceByTokenId(uint256 tokenId) view returns(address space)
func (_ArchitectV2 *ArchitectV2Caller) GetSpaceByTokenId(opts *bind.CallOpts, tokenId *big.Int) (common.Address, error) {
	var out []interface{}
	err := _ArchitectV2.contract.Call(opts, &out, "getSpaceByTokenId", tokenId)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetSpaceByTokenId is a free data retrieval call binding the contract method 0x673f0dd5.
//
// Solidity: function getSpaceByTokenId(uint256 tokenId) view returns(address space)
func (_ArchitectV2 *ArchitectV2Session) GetSpaceByTokenId(tokenId *big.Int) (common.Address, error) {
	return _ArchitectV2.Contract.GetSpaceByTokenId(&_ArchitectV2.CallOpts, tokenId)
}

// GetSpaceByTokenId is a free data retrieval call binding the contract method 0x673f0dd5.
//
// Solidity: function getSpaceByTokenId(uint256 tokenId) view returns(address space)
func (_ArchitectV2 *ArchitectV2CallerSession) GetSpaceByTokenId(tokenId *big.Int) (common.Address, error) {
	return _ArchitectV2.Contract.GetSpaceByTokenId(&_ArchitectV2.CallOpts, tokenId)
}

// GetTokenIdBySpace is a free data retrieval call binding the contract method 0xc0bc6796.
//
// Solidity: function getTokenIdBySpace(address space) view returns(uint256)
func (_ArchitectV2 *ArchitectV2Caller) GetTokenIdBySpace(opts *bind.CallOpts, space common.Address) (*big.Int, error) {
	var out []interface{}
	err := _ArchitectV2.contract.Call(opts, &out, "getTokenIdBySpace", space)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTokenIdBySpace is a free data retrieval call binding the contract method 0xc0bc6796.
//
// Solidity: function getTokenIdBySpace(address space) view returns(uint256)
func (_ArchitectV2 *ArchitectV2Session) GetTokenIdBySpace(space common.Address) (*big.Int, error) {
	return _ArchitectV2.Contract.GetTokenIdBySpace(&_ArchitectV2.CallOpts, space)
}

// GetTokenIdBySpace is a free data retrieval call binding the contract method 0xc0bc6796.
//
// Solidity: function getTokenIdBySpace(address space) view returns(uint256)
func (_ArchitectV2 *ArchitectV2CallerSession) GetTokenIdBySpace(space common.Address) (*big.Int, error) {
	return _ArchitectV2.Contract.GetTokenIdBySpace(&_ArchitectV2.CallOpts, space)
}

// CreateSpace is a paid mutator transaction binding the contract method 0xef009225.
//
// Solidity: function createSpace((string,string,((string,string,uint256,uint256,uint64,address,address,uint256,address),(bool,address[],((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[])),string[]),(string),string,string) SpaceInfo) returns(address)
func (_ArchitectV2 *ArchitectV2Transactor) CreateSpace(opts *bind.TransactOpts, SpaceInfo IArchitectBaseSpaceInfo) (*types.Transaction, error) {
	return _ArchitectV2.contract.Transact(opts, "createSpace", SpaceInfo)
}

// CreateSpace is a paid mutator transaction binding the contract method 0xef009225.
//
// Solidity: function createSpace((string,string,((string,string,uint256,uint256,uint64,address,address,uint256,address),(bool,address[],((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[])),string[]),(string),string,string) SpaceInfo) returns(address)
func (_ArchitectV2 *ArchitectV2Session) CreateSpace(SpaceInfo IArchitectBaseSpaceInfo) (*types.Transaction, error) {
	return _ArchitectV2.Contract.CreateSpace(&_ArchitectV2.TransactOpts, SpaceInfo)
}

// CreateSpace is a paid mutator transaction binding the contract method 0xef009225.
//
// Solidity: function createSpace((string,string,((string,string,uint256,uint256,uint64,address,address,uint256,address),(bool,address[],((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[])),string[]),(string),string,string) SpaceInfo) returns(address)
func (_ArchitectV2 *ArchitectV2TransactorSession) CreateSpace(SpaceInfo IArchitectBaseSpaceInfo) (*types.Transaction, error) {
	return _ArchitectV2.Contract.CreateSpace(&_ArchitectV2.TransactOpts, SpaceInfo)
}

// CreateSpaceV2 is a paid mutator transaction binding the contract method 0x9826bcc9.
//
// Solidity: function createSpaceV2((string,string,((string,string,uint256,uint256,uint64,address,address,uint256,address),(bool,address[],bytes),string[]),(string),string,string) SpaceInfo) returns(address)
func (_ArchitectV2 *ArchitectV2Transactor) CreateSpaceV2(opts *bind.TransactOpts, SpaceInfo IArchitectBaseSpaceInfoV2) (*types.Transaction, error) {
	return _ArchitectV2.contract.Transact(opts, "createSpaceV2", SpaceInfo)
}

// CreateSpaceV2 is a paid mutator transaction binding the contract method 0x9826bcc9.
//
// Solidity: function createSpaceV2((string,string,((string,string,uint256,uint256,uint64,address,address,uint256,address),(bool,address[],bytes),string[]),(string),string,string) SpaceInfo) returns(address)
func (_ArchitectV2 *ArchitectV2Session) CreateSpaceV2(SpaceInfo IArchitectBaseSpaceInfoV2) (*types.Transaction, error) {
	return _ArchitectV2.Contract.CreateSpaceV2(&_ArchitectV2.TransactOpts, SpaceInfo)
}

// CreateSpaceV2 is a paid mutator transaction binding the contract method 0x9826bcc9.
//
// Solidity: function createSpaceV2((string,string,((string,string,uint256,uint256,uint64,address,address,uint256,address),(bool,address[],bytes),string[]),(string),string,string) SpaceInfo) returns(address)
func (_ArchitectV2 *ArchitectV2TransactorSession) CreateSpaceV2(SpaceInfo IArchitectBaseSpaceInfoV2) (*types.Transaction, error) {
	return _ArchitectV2.Contract.CreateSpaceV2(&_ArchitectV2.TransactOpts, SpaceInfo)
}

// SetSpaceArchitectImplementations is a paid mutator transaction binding the contract method 0x8bfc94b9.
//
// Solidity: function setSpaceArchitectImplementations(address ownerTokenImplementation, address userEntitlementImplementation, address ruleEntitlementImplementation) returns()
func (_ArchitectV2 *ArchitectV2Transactor) SetSpaceArchitectImplementations(opts *bind.TransactOpts, ownerTokenImplementation common.Address, userEntitlementImplementation common.Address, ruleEntitlementImplementation common.Address) (*types.Transaction, error) {
	return _ArchitectV2.contract.Transact(opts, "setSpaceArchitectImplementations", ownerTokenImplementation, userEntitlementImplementation, ruleEntitlementImplementation)
}

// SetSpaceArchitectImplementations is a paid mutator transaction binding the contract method 0x8bfc94b9.
//
// Solidity: function setSpaceArchitectImplementations(address ownerTokenImplementation, address userEntitlementImplementation, address ruleEntitlementImplementation) returns()
func (_ArchitectV2 *ArchitectV2Session) SetSpaceArchitectImplementations(ownerTokenImplementation common.Address, userEntitlementImplementation common.Address, ruleEntitlementImplementation common.Address) (*types.Transaction, error) {
	return _ArchitectV2.Contract.SetSpaceArchitectImplementations(&_ArchitectV2.TransactOpts, ownerTokenImplementation, userEntitlementImplementation, ruleEntitlementImplementation)
}

// SetSpaceArchitectImplementations is a paid mutator transaction binding the contract method 0x8bfc94b9.
//
// Solidity: function setSpaceArchitectImplementations(address ownerTokenImplementation, address userEntitlementImplementation, address ruleEntitlementImplementation) returns()
func (_ArchitectV2 *ArchitectV2TransactorSession) SetSpaceArchitectImplementations(ownerTokenImplementation common.Address, userEntitlementImplementation common.Address, ruleEntitlementImplementation common.Address) (*types.Transaction, error) {
	return _ArchitectV2.Contract.SetSpaceArchitectImplementations(&_ArchitectV2.TransactOpts, ownerTokenImplementation, userEntitlementImplementation, ruleEntitlementImplementation)
}

// ArchitectV2SpaceCreatedIterator is returned from FilterSpaceCreated and is used to iterate over the raw logs and unpacked data for SpaceCreated events raised by the ArchitectV2 contract.
type ArchitectV2SpaceCreatedIterator struct {
	Event	*ArchitectV2SpaceCreated	// Event containing the contract specifics and raw log

	contract	*bind.BoundContract	// Generic contract to use for unpacking event data
	event		string			// Event name to use for unpacking event data

	logs	chan types.Log		// Log channel receiving the found contract events
	sub	ethereum.Subscription	// Subscription for errors, completion and termination
	done	bool			// Whether the subscription completed delivering logs
	fail	error			// Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *ArchitectV2SpaceCreatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ArchitectV2SpaceCreated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(ArchitectV2SpaceCreated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *ArchitectV2SpaceCreatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ArchitectV2SpaceCreatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ArchitectV2SpaceCreated represents a SpaceCreated event raised by the ArchitectV2 contract.
type ArchitectV2SpaceCreated struct {
	Owner	common.Address
	TokenId	*big.Int
	Space	common.Address
	Raw	types.Log	// Blockchain specific contextual infos
}

// FilterSpaceCreated is a free log retrieval operation binding the contract event 0xe50fc3942f8a2d7e5a7c8fb9488499eba5255b41e18bc3f1b4791402976d1d0b.
//
// Solidity: event SpaceCreated(address indexed owner, uint256 indexed tokenId, address indexed space)
func (_ArchitectV2 *ArchitectV2Filterer) FilterSpaceCreated(opts *bind.FilterOpts, owner []common.Address, tokenId []*big.Int, space []common.Address) (*ArchitectV2SpaceCreatedIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var tokenIdRule []interface{}
	for _, tokenIdItem := range tokenId {
		tokenIdRule = append(tokenIdRule, tokenIdItem)
	}
	var spaceRule []interface{}
	for _, spaceItem := range space {
		spaceRule = append(spaceRule, spaceItem)
	}

	logs, sub, err := _ArchitectV2.contract.FilterLogs(opts, "SpaceCreated", ownerRule, tokenIdRule, spaceRule)
	if err != nil {
		return nil, err
	}
	return &ArchitectV2SpaceCreatedIterator{contract: _ArchitectV2.contract, event: "SpaceCreated", logs: logs, sub: sub}, nil
}

// WatchSpaceCreated is a free log subscription operation binding the contract event 0xe50fc3942f8a2d7e5a7c8fb9488499eba5255b41e18bc3f1b4791402976d1d0b.
//
// Solidity: event SpaceCreated(address indexed owner, uint256 indexed tokenId, address indexed space)
func (_ArchitectV2 *ArchitectV2Filterer) WatchSpaceCreated(opts *bind.WatchOpts, sink chan<- *ArchitectV2SpaceCreated, owner []common.Address, tokenId []*big.Int, space []common.Address) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var tokenIdRule []interface{}
	for _, tokenIdItem := range tokenId {
		tokenIdRule = append(tokenIdRule, tokenIdItem)
	}
	var spaceRule []interface{}
	for _, spaceItem := range space {
		spaceRule = append(spaceRule, spaceItem)
	}

	logs, sub, err := _ArchitectV2.contract.WatchLogs(opts, "SpaceCreated", ownerRule, tokenIdRule, spaceRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ArchitectV2SpaceCreated)
				if err := _ArchitectV2.contract.UnpackLog(event, "SpaceCreated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseSpaceCreated is a log parse operation binding the contract event 0xe50fc3942f8a2d7e5a7c8fb9488499eba5255b41e18bc3f1b4791402976d1d0b.
//
// Solidity: event SpaceCreated(address indexed owner, uint256 indexed tokenId, address indexed space)
func (_ArchitectV2 *ArchitectV2Filterer) ParseSpaceCreated(log types.Log) (*ArchitectV2SpaceCreated, error) {
	event := new(ArchitectV2SpaceCreated)
	if err := _ArchitectV2.contract.UnpackLog(event, "SpaceCreated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
