// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package deploy

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

// MockCustomEntitlementMetaData contains all meta data concerning the MockCustomEntitlement contract.
var MockCustomEntitlementMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"constructor\",\"inputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"isEntitled\",\"inputs\":[{\"name\":\"\",\"type\":\"address[]\",\"internalType\":\"address[]\"},{\"name\":\"\",\"type\":\"bytes\",\"internalType\":\"bytes\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"pure\"},{\"type\":\"function\",\"name\":\"isEntitled\",\"inputs\":[{\"name\":\"users\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"setEntitled\",\"inputs\":[{\"name\":\"users\",\"type\":\"address[]\",\"internalType\":\"address[]\"},{\"name\":\"userIsEntitled\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"supportsInterface\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"internalType\":\"bytes4\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"}]",
	Bin: "0x608060405234801561001057600080fd5b50610455806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806301ffc9a71461005157806316089f65146100895780633f4c4d831461009f578063ddc6e68e146100b4575b600080fd5b61007561005f3660046101e6565b6001600160e01b03191663cbce79eb60e01b1490565b604051901515815260200160405180910390f35b6100756100973660046102f4565b600192915050565b6100b26100ad3660046103ab565b6100c7565b005b6100756100c2366004610402565b610151565b60005b825181101561014c57816000808584815181106100e9576100e961043f565b602002602001015160405160200161011091906001600160a01b0391909116815260200190565b60408051808303601f19018152918152815160209283012083529082019290925201600020805460ff19169115159190911790556001016100ca565b505050565b6000805b82518110156101dd576000808483815181106101735761017361043f565b602002602001015160405160200161019a91906001600160a01b0391909116815260200190565b60408051601f198184030181529181528151602092830120835290820192909252016000205460ff1615156001036101d55750600192915050565b600101610155565b50600092915050565b6000602082840312156101f857600080fd5b81356001600160e01b03198116811461021057600080fd5b9392505050565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff8111828210171561025657610256610217565b604052919050565b600082601f83011261026f57600080fd5b8135602067ffffffffffffffff82111561028b5761028b610217565b8160051b61029a82820161022d565b92835284810182019282810190878511156102b457600080fd5b83870192505b848310156102e95782356001600160a01b03811681146102da5760008081fd5b825291830191908301906102ba565b979650505050505050565b6000806040838503121561030757600080fd5b823567ffffffffffffffff8082111561031f57600080fd5b61032b8683870161025e565b935060209150818501358181111561034257600080fd5b8501601f8101871361035357600080fd5b80358281111561036557610365610217565b610377601f8201601f1916850161022d565b9250808352878482840101111561038d57600080fd5b80848301858501376000848285010152505080925050509250929050565b600080604083850312156103be57600080fd5b823567ffffffffffffffff8111156103d557600080fd5b6103e18582860161025e565b925050602083013580151581146103f757600080fd5b809150509250929050565b60006020828403121561041457600080fd5b813567ffffffffffffffff81111561042b57600080fd5b6104378482850161025e565b949350505050565b634e487b7160e01b600052603260045260246000fd",
}

// MockCustomEntitlementABI is the input ABI used to generate the binding from.
// Deprecated: Use MockCustomEntitlementMetaData.ABI instead.
var MockCustomEntitlementABI = MockCustomEntitlementMetaData.ABI

// MockCustomEntitlementBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use MockCustomEntitlementMetaData.Bin instead.
var MockCustomEntitlementBin = MockCustomEntitlementMetaData.Bin

// DeployMockCustomEntitlement deploys a new Ethereum contract, binding an instance of MockCustomEntitlement to it.
func DeployMockCustomEntitlement(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *MockCustomEntitlement, error) {
	parsed, err := MockCustomEntitlementMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(MockCustomEntitlementBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &MockCustomEntitlement{MockCustomEntitlementCaller: MockCustomEntitlementCaller{contract: contract}, MockCustomEntitlementTransactor: MockCustomEntitlementTransactor{contract: contract}, MockCustomEntitlementFilterer: MockCustomEntitlementFilterer{contract: contract}}, nil
}

// MockCustomEntitlement is an auto generated Go binding around an Ethereum contract.
type MockCustomEntitlement struct {
	MockCustomEntitlementCaller     // Read-only binding to the contract
	MockCustomEntitlementTransactor // Write-only binding to the contract
	MockCustomEntitlementFilterer   // Log filterer for contract events
}

// MockCustomEntitlementCaller is an auto generated read-only Go binding around an Ethereum contract.
type MockCustomEntitlementCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MockCustomEntitlementTransactor is an auto generated write-only Go binding around an Ethereum contract.
type MockCustomEntitlementTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MockCustomEntitlementFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type MockCustomEntitlementFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MockCustomEntitlementSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type MockCustomEntitlementSession struct {
	Contract     *MockCustomEntitlement // Generic contract binding to set the session for
	CallOpts     bind.CallOpts          // Call options to use throughout this session
	TransactOpts bind.TransactOpts      // Transaction auth options to use throughout this session
}

// MockCustomEntitlementCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type MockCustomEntitlementCallerSession struct {
	Contract *MockCustomEntitlementCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts                // Call options to use throughout this session
}

// MockCustomEntitlementTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type MockCustomEntitlementTransactorSession struct {
	Contract     *MockCustomEntitlementTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts                // Transaction auth options to use throughout this session
}

// MockCustomEntitlementRaw is an auto generated low-level Go binding around an Ethereum contract.
type MockCustomEntitlementRaw struct {
	Contract *MockCustomEntitlement // Generic contract binding to access the raw methods on
}

// MockCustomEntitlementCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type MockCustomEntitlementCallerRaw struct {
	Contract *MockCustomEntitlementCaller // Generic read-only contract binding to access the raw methods on
}

// MockCustomEntitlementTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type MockCustomEntitlementTransactorRaw struct {
	Contract *MockCustomEntitlementTransactor // Generic write-only contract binding to access the raw methods on
}

// NewMockCustomEntitlement creates a new instance of MockCustomEntitlement, bound to a specific deployed contract.
func NewMockCustomEntitlement(address common.Address, backend bind.ContractBackend) (*MockCustomEntitlement, error) {
	contract, err := bindMockCustomEntitlement(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &MockCustomEntitlement{MockCustomEntitlementCaller: MockCustomEntitlementCaller{contract: contract}, MockCustomEntitlementTransactor: MockCustomEntitlementTransactor{contract: contract}, MockCustomEntitlementFilterer: MockCustomEntitlementFilterer{contract: contract}}, nil
}

// NewMockCustomEntitlementCaller creates a new read-only instance of MockCustomEntitlement, bound to a specific deployed contract.
func NewMockCustomEntitlementCaller(address common.Address, caller bind.ContractCaller) (*MockCustomEntitlementCaller, error) {
	contract, err := bindMockCustomEntitlement(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &MockCustomEntitlementCaller{contract: contract}, nil
}

// NewMockCustomEntitlementTransactor creates a new write-only instance of MockCustomEntitlement, bound to a specific deployed contract.
func NewMockCustomEntitlementTransactor(address common.Address, transactor bind.ContractTransactor) (*MockCustomEntitlementTransactor, error) {
	contract, err := bindMockCustomEntitlement(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &MockCustomEntitlementTransactor{contract: contract}, nil
}

// NewMockCustomEntitlementFilterer creates a new log filterer instance of MockCustomEntitlement, bound to a specific deployed contract.
func NewMockCustomEntitlementFilterer(address common.Address, filterer bind.ContractFilterer) (*MockCustomEntitlementFilterer, error) {
	contract, err := bindMockCustomEntitlement(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &MockCustomEntitlementFilterer{contract: contract}, nil
}

// bindMockCustomEntitlement binds a generic wrapper to an already deployed contract.
func bindMockCustomEntitlement(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := MockCustomEntitlementMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_MockCustomEntitlement *MockCustomEntitlementRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _MockCustomEntitlement.Contract.MockCustomEntitlementCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_MockCustomEntitlement *MockCustomEntitlementRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _MockCustomEntitlement.Contract.MockCustomEntitlementTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_MockCustomEntitlement *MockCustomEntitlementRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _MockCustomEntitlement.Contract.MockCustomEntitlementTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_MockCustomEntitlement *MockCustomEntitlementCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _MockCustomEntitlement.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_MockCustomEntitlement *MockCustomEntitlementTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _MockCustomEntitlement.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_MockCustomEntitlement *MockCustomEntitlementTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _MockCustomEntitlement.Contract.contract.Transact(opts, method, params...)
}

// IsEntitled is a free data retrieval call binding the contract method 0x16089f65.
//
// Solidity: function isEntitled(address[] , bytes ) pure returns(bool)
func (_MockCustomEntitlement *MockCustomEntitlementCaller) IsEntitled(opts *bind.CallOpts, arg0 []common.Address, arg1 []byte) (bool, error) {
	var out []interface{}
	err := _MockCustomEntitlement.contract.Call(opts, &out, "isEntitled", arg0, arg1)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsEntitled is a free data retrieval call binding the contract method 0x16089f65.
//
// Solidity: function isEntitled(address[] , bytes ) pure returns(bool)
func (_MockCustomEntitlement *MockCustomEntitlementSession) IsEntitled(arg0 []common.Address, arg1 []byte) (bool, error) {
	return _MockCustomEntitlement.Contract.IsEntitled(&_MockCustomEntitlement.CallOpts, arg0, arg1)
}

// IsEntitled is a free data retrieval call binding the contract method 0x16089f65.
//
// Solidity: function isEntitled(address[] , bytes ) pure returns(bool)
func (_MockCustomEntitlement *MockCustomEntitlementCallerSession) IsEntitled(arg0 []common.Address, arg1 []byte) (bool, error) {
	return _MockCustomEntitlement.Contract.IsEntitled(&_MockCustomEntitlement.CallOpts, arg0, arg1)
}

// IsEntitled0 is a free data retrieval call binding the contract method 0xddc6e68e.
//
// Solidity: function isEntitled(address[] users) view returns(bool)
func (_MockCustomEntitlement *MockCustomEntitlementCaller) IsEntitled0(opts *bind.CallOpts, users []common.Address) (bool, error) {
	var out []interface{}
	err := _MockCustomEntitlement.contract.Call(opts, &out, "isEntitled0", users)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsEntitled0 is a free data retrieval call binding the contract method 0xddc6e68e.
//
// Solidity: function isEntitled(address[] users) view returns(bool)
func (_MockCustomEntitlement *MockCustomEntitlementSession) IsEntitled0(users []common.Address) (bool, error) {
	return _MockCustomEntitlement.Contract.IsEntitled0(&_MockCustomEntitlement.CallOpts, users)
}

// IsEntitled0 is a free data retrieval call binding the contract method 0xddc6e68e.
//
// Solidity: function isEntitled(address[] users) view returns(bool)
func (_MockCustomEntitlement *MockCustomEntitlementCallerSession) IsEntitled0(users []common.Address) (bool, error) {
	return _MockCustomEntitlement.Contract.IsEntitled0(&_MockCustomEntitlement.CallOpts, users)
}

// SupportsInterface is a free data retrieval call binding the contract method 0x01ffc9a7.
//
// Solidity: function supportsInterface(bytes4 interfaceId) view returns(bool)
func (_MockCustomEntitlement *MockCustomEntitlementCaller) SupportsInterface(opts *bind.CallOpts, interfaceId [4]byte) (bool, error) {
	var out []interface{}
	err := _MockCustomEntitlement.contract.Call(opts, &out, "supportsInterface", interfaceId)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// SupportsInterface is a free data retrieval call binding the contract method 0x01ffc9a7.
//
// Solidity: function supportsInterface(bytes4 interfaceId) view returns(bool)
func (_MockCustomEntitlement *MockCustomEntitlementSession) SupportsInterface(interfaceId [4]byte) (bool, error) {
	return _MockCustomEntitlement.Contract.SupportsInterface(&_MockCustomEntitlement.CallOpts, interfaceId)
}

// SupportsInterface is a free data retrieval call binding the contract method 0x01ffc9a7.
//
// Solidity: function supportsInterface(bytes4 interfaceId) view returns(bool)
func (_MockCustomEntitlement *MockCustomEntitlementCallerSession) SupportsInterface(interfaceId [4]byte) (bool, error) {
	return _MockCustomEntitlement.Contract.SupportsInterface(&_MockCustomEntitlement.CallOpts, interfaceId)
}

// SetEntitled is a paid mutator transaction binding the contract method 0x3f4c4d83.
//
// Solidity: function setEntitled(address[] users, bool userIsEntitled) returns()
func (_MockCustomEntitlement *MockCustomEntitlementTransactor) SetEntitled(opts *bind.TransactOpts, users []common.Address, userIsEntitled bool) (*types.Transaction, error) {
	return _MockCustomEntitlement.contract.Transact(opts, "setEntitled", users, userIsEntitled)
}

// SetEntitled is a paid mutator transaction binding the contract method 0x3f4c4d83.
//
// Solidity: function setEntitled(address[] users, bool userIsEntitled) returns()
func (_MockCustomEntitlement *MockCustomEntitlementSession) SetEntitled(users []common.Address, userIsEntitled bool) (*types.Transaction, error) {
	return _MockCustomEntitlement.Contract.SetEntitled(&_MockCustomEntitlement.TransactOpts, users, userIsEntitled)
}

// SetEntitled is a paid mutator transaction binding the contract method 0x3f4c4d83.
//
// Solidity: function setEntitled(address[] users, bool userIsEntitled) returns()
func (_MockCustomEntitlement *MockCustomEntitlementTransactorSession) SetEntitled(users []common.Address, userIsEntitled bool) (*types.Transaction, error) {
	return _MockCustomEntitlement.Contract.SetEntitled(&_MockCustomEntitlement.TransactOpts, users, userIsEntitled)
}
