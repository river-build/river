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

// IEntitlementGatedV2MetaData contains all meta data concerning the IEntitlementGatedV2 contract.
var IEntitlementGatedV2MetaData = &bind.MetaData{
	ABI: "[{\"type\":\"function\",\"name\":\"getRuleData\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlement.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlement.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlement.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlement.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlement.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlement.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlement.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRuleDataV2\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementV2.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementV2.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementV2.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementV2.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementV2.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"params\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementV2.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementV2.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"postEntitlementCheckResult\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"result\",\"type\":\"uint8\",\"internalType\":\"enumIEntitlementGatedBaseV2.NodeVoteStatus\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"EntitlementCheckResultPosted\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"result\",\"type\":\"uint8\",\"indexed\":false,\"internalType\":\"enumIEntitlementGatedBaseV2.NodeVoteStatus\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"EntitlementGated_InvalidAddress\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeAlreadyVoted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeNotFound\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyCompleted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionNotRegistered\",\"inputs\":[]}]",
}

// IEntitlementGatedV2ABI is the input ABI used to generate the binding from.
// Deprecated: Use IEntitlementGatedV2MetaData.ABI instead.
var IEntitlementGatedV2ABI = IEntitlementGatedV2MetaData.ABI

// IEntitlementGatedV2 is an auto generated Go binding around an Ethereum contract.
type IEntitlementGatedV2 struct {
	IEntitlementGatedV2Caller	// Read-only binding to the contract
	IEntitlementGatedV2Transactor	// Write-only binding to the contract
	IEntitlementGatedV2Filterer	// Log filterer for contract events
}

// IEntitlementGatedV2Caller is an auto generated read-only Go binding around an Ethereum contract.
type IEntitlementGatedV2Caller struct {
	contract *bind.BoundContract	// Generic contract wrapper for the low level calls
}

// IEntitlementGatedV2Transactor is an auto generated write-only Go binding around an Ethereum contract.
type IEntitlementGatedV2Transactor struct {
	contract *bind.BoundContract	// Generic contract wrapper for the low level calls
}

// IEntitlementGatedV2Filterer is an auto generated log filtering Go binding around an Ethereum contract events.
type IEntitlementGatedV2Filterer struct {
	contract *bind.BoundContract	// Generic contract wrapper for the low level calls
}

// IEntitlementGatedV2Session is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type IEntitlementGatedV2Session struct {
	Contract	*IEntitlementGatedV2	// Generic contract binding to set the session for
	CallOpts	bind.CallOpts		// Call options to use throughout this session
	TransactOpts	bind.TransactOpts	// Transaction auth options to use throughout this session
}

// IEntitlementGatedV2CallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type IEntitlementGatedV2CallerSession struct {
	Contract	*IEntitlementGatedV2Caller	// Generic contract caller binding to set the session for
	CallOpts	bind.CallOpts			// Call options to use throughout this session
}

// IEntitlementGatedV2TransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type IEntitlementGatedV2TransactorSession struct {
	Contract	*IEntitlementGatedV2Transactor	// Generic contract transactor binding to set the session for
	TransactOpts	bind.TransactOpts		// Transaction auth options to use throughout this session
}

// IEntitlementGatedV2Raw is an auto generated low-level Go binding around an Ethereum contract.
type IEntitlementGatedV2Raw struct {
	Contract *IEntitlementGatedV2	// Generic contract binding to access the raw methods on
}

// IEntitlementGatedV2CallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type IEntitlementGatedV2CallerRaw struct {
	Contract *IEntitlementGatedV2Caller	// Generic read-only contract binding to access the raw methods on
}

// IEntitlementGatedV2TransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type IEntitlementGatedV2TransactorRaw struct {
	Contract *IEntitlementGatedV2Transactor	// Generic write-only contract binding to access the raw methods on
}

// NewIEntitlementGatedV2 creates a new instance of IEntitlementGatedV2, bound to a specific deployed contract.
func NewIEntitlementGatedV2(address common.Address, backend bind.ContractBackend) (*IEntitlementGatedV2, error) {
	contract, err := bindIEntitlementGatedV2(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &IEntitlementGatedV2{IEntitlementGatedV2Caller: IEntitlementGatedV2Caller{contract: contract}, IEntitlementGatedV2Transactor: IEntitlementGatedV2Transactor{contract: contract}, IEntitlementGatedV2Filterer: IEntitlementGatedV2Filterer{contract: contract}}, nil
}

// NewIEntitlementGatedV2Caller creates a new read-only instance of IEntitlementGatedV2, bound to a specific deployed contract.
func NewIEntitlementGatedV2Caller(address common.Address, caller bind.ContractCaller) (*IEntitlementGatedV2Caller, error) {
	contract, err := bindIEntitlementGatedV2(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &IEntitlementGatedV2Caller{contract: contract}, nil
}

// NewIEntitlementGatedV2Transactor creates a new write-only instance of IEntitlementGatedV2, bound to a specific deployed contract.
func NewIEntitlementGatedV2Transactor(address common.Address, transactor bind.ContractTransactor) (*IEntitlementGatedV2Transactor, error) {
	contract, err := bindIEntitlementGatedV2(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &IEntitlementGatedV2Transactor{contract: contract}, nil
}

// NewIEntitlementGatedV2Filterer creates a new log filterer instance of IEntitlementGatedV2, bound to a specific deployed contract.
func NewIEntitlementGatedV2Filterer(address common.Address, filterer bind.ContractFilterer) (*IEntitlementGatedV2Filterer, error) {
	contract, err := bindIEntitlementGatedV2(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &IEntitlementGatedV2Filterer{contract: contract}, nil
}

// bindIEntitlementGatedV2 binds a generic wrapper to an already deployed contract.
func bindIEntitlementGatedV2(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := IEntitlementGatedV2MetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_IEntitlementGatedV2 *IEntitlementGatedV2Raw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _IEntitlementGatedV2.Contract.IEntitlementGatedV2Caller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_IEntitlementGatedV2 *IEntitlementGatedV2Raw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _IEntitlementGatedV2.Contract.IEntitlementGatedV2Transactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_IEntitlementGatedV2 *IEntitlementGatedV2Raw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _IEntitlementGatedV2.Contract.IEntitlementGatedV2Transactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_IEntitlementGatedV2 *IEntitlementGatedV2CallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _IEntitlementGatedV2.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_IEntitlementGatedV2 *IEntitlementGatedV2TransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _IEntitlementGatedV2.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_IEntitlementGatedV2 *IEntitlementGatedV2TransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _IEntitlementGatedV2.Contract.contract.Transact(opts, method, params...)
}

// GetRuleData is a free data retrieval call binding the contract method 0x92c399ff.
//
// Solidity: function getRuleData(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_IEntitlementGatedV2 *IEntitlementGatedV2Caller) GetRuleData(opts *bind.CallOpts, transactionId [32]byte, roleId *big.Int) (IRuleEntitlementRuleData, error) {
	var out []interface{}
	err := _IEntitlementGatedV2.contract.Call(opts, &out, "getRuleData", transactionId, roleId)

	if err != nil {
		return *new(IRuleEntitlementRuleData), err
	}

	out0 := *abi.ConvertType(out[0], new(IRuleEntitlementRuleData)).(*IRuleEntitlementRuleData)

	return out0, err

}

// GetRuleData is a free data retrieval call binding the contract method 0x92c399ff.
//
// Solidity: function getRuleData(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_IEntitlementGatedV2 *IEntitlementGatedV2Session) GetRuleData(transactionId [32]byte, roleId *big.Int) (IRuleEntitlementRuleData, error) {
	return _IEntitlementGatedV2.Contract.GetRuleData(&_IEntitlementGatedV2.CallOpts, transactionId, roleId)
}

// GetRuleData is a free data retrieval call binding the contract method 0x92c399ff.
//
// Solidity: function getRuleData(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_IEntitlementGatedV2 *IEntitlementGatedV2CallerSession) GetRuleData(transactionId [32]byte, roleId *big.Int) (IRuleEntitlementRuleData, error) {
	return _IEntitlementGatedV2.Contract.GetRuleData(&_IEntitlementGatedV2.CallOpts, transactionId, roleId)
}

// GetRuleDataV2 is a free data retrieval call binding the contract method 0x6fe67411.
//
// Solidity: function getRuleDataV2(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]))
func (_IEntitlementGatedV2 *IEntitlementGatedV2Caller) GetRuleDataV2(opts *bind.CallOpts, transactionId [32]byte, roleId *big.Int) (IRuleEntitlementV2RuleData, error) {
	var out []interface{}
	err := _IEntitlementGatedV2.contract.Call(opts, &out, "getRuleDataV2", transactionId, roleId)

	if err != nil {
		return *new(IRuleEntitlementV2RuleData), err
	}

	out0 := *abi.ConvertType(out[0], new(IRuleEntitlementV2RuleData)).(*IRuleEntitlementV2RuleData)

	return out0, err

}

// GetRuleDataV2 is a free data retrieval call binding the contract method 0x6fe67411.
//
// Solidity: function getRuleDataV2(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]))
func (_IEntitlementGatedV2 *IEntitlementGatedV2Session) GetRuleDataV2(transactionId [32]byte, roleId *big.Int) (IRuleEntitlementV2RuleData, error) {
	return _IEntitlementGatedV2.Contract.GetRuleDataV2(&_IEntitlementGatedV2.CallOpts, transactionId, roleId)
}

// GetRuleDataV2 is a free data retrieval call binding the contract method 0x6fe67411.
//
// Solidity: function getRuleDataV2(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]))
func (_IEntitlementGatedV2 *IEntitlementGatedV2CallerSession) GetRuleDataV2(transactionId [32]byte, roleId *big.Int) (IRuleEntitlementV2RuleData, error) {
	return _IEntitlementGatedV2.Contract.GetRuleDataV2(&_IEntitlementGatedV2.CallOpts, transactionId, roleId)
}

// PostEntitlementCheckResult is a paid mutator transaction binding the contract method 0x4739e805.
//
// Solidity: function postEntitlementCheckResult(bytes32 transactionId, uint256 roleId, uint8 result) returns()
func (_IEntitlementGatedV2 *IEntitlementGatedV2Transactor) PostEntitlementCheckResult(opts *bind.TransactOpts, transactionId [32]byte, roleId *big.Int, result uint8) (*types.Transaction, error) {
	return _IEntitlementGatedV2.contract.Transact(opts, "postEntitlementCheckResult", transactionId, roleId, result)
}

// PostEntitlementCheckResult is a paid mutator transaction binding the contract method 0x4739e805.
//
// Solidity: function postEntitlementCheckResult(bytes32 transactionId, uint256 roleId, uint8 result) returns()
func (_IEntitlementGatedV2 *IEntitlementGatedV2Session) PostEntitlementCheckResult(transactionId [32]byte, roleId *big.Int, result uint8) (*types.Transaction, error) {
	return _IEntitlementGatedV2.Contract.PostEntitlementCheckResult(&_IEntitlementGatedV2.TransactOpts, transactionId, roleId, result)
}

// PostEntitlementCheckResult is a paid mutator transaction binding the contract method 0x4739e805.
//
// Solidity: function postEntitlementCheckResult(bytes32 transactionId, uint256 roleId, uint8 result) returns()
func (_IEntitlementGatedV2 *IEntitlementGatedV2TransactorSession) PostEntitlementCheckResult(transactionId [32]byte, roleId *big.Int, result uint8) (*types.Transaction, error) {
	return _IEntitlementGatedV2.Contract.PostEntitlementCheckResult(&_IEntitlementGatedV2.TransactOpts, transactionId, roleId, result)
}

// IEntitlementGatedV2EntitlementCheckResultPostedIterator is returned from FilterEntitlementCheckResultPosted and is used to iterate over the raw logs and unpacked data for EntitlementCheckResultPosted events raised by the IEntitlementGatedV2 contract.
type IEntitlementGatedV2EntitlementCheckResultPostedIterator struct {
	Event	*IEntitlementGatedV2EntitlementCheckResultPosted	// Event containing the contract specifics and raw log

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
func (it *IEntitlementGatedV2EntitlementCheckResultPostedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(IEntitlementGatedV2EntitlementCheckResultPosted)
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
		it.Event = new(IEntitlementGatedV2EntitlementCheckResultPosted)
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
func (it *IEntitlementGatedV2EntitlementCheckResultPostedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *IEntitlementGatedV2EntitlementCheckResultPostedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// IEntitlementGatedV2EntitlementCheckResultPosted represents a EntitlementCheckResultPosted event raised by the IEntitlementGatedV2 contract.
type IEntitlementGatedV2EntitlementCheckResultPosted struct {
	TransactionId	[32]byte
	Result		uint8
	Raw		types.Log	// Blockchain specific contextual infos
}

// FilterEntitlementCheckResultPosted is a free log retrieval operation binding the contract event 0xb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c633.
//
// Solidity: event EntitlementCheckResultPosted(bytes32 indexed transactionId, uint8 result)
func (_IEntitlementGatedV2 *IEntitlementGatedV2Filterer) FilterEntitlementCheckResultPosted(opts *bind.FilterOpts, transactionId [][32]byte) (*IEntitlementGatedV2EntitlementCheckResultPostedIterator, error) {

	var transactionIdRule []interface{}
	for _, transactionIdItem := range transactionId {
		transactionIdRule = append(transactionIdRule, transactionIdItem)
	}

	logs, sub, err := _IEntitlementGatedV2.contract.FilterLogs(opts, "EntitlementCheckResultPosted", transactionIdRule)
	if err != nil {
		return nil, err
	}
	return &IEntitlementGatedV2EntitlementCheckResultPostedIterator{contract: _IEntitlementGatedV2.contract, event: "EntitlementCheckResultPosted", logs: logs, sub: sub}, nil
}

// WatchEntitlementCheckResultPosted is a free log subscription operation binding the contract event 0xb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c633.
//
// Solidity: event EntitlementCheckResultPosted(bytes32 indexed transactionId, uint8 result)
func (_IEntitlementGatedV2 *IEntitlementGatedV2Filterer) WatchEntitlementCheckResultPosted(opts *bind.WatchOpts, sink chan<- *IEntitlementGatedV2EntitlementCheckResultPosted, transactionId [][32]byte) (event.Subscription, error) {

	var transactionIdRule []interface{}
	for _, transactionIdItem := range transactionId {
		transactionIdRule = append(transactionIdRule, transactionIdItem)
	}

	logs, sub, err := _IEntitlementGatedV2.contract.WatchLogs(opts, "EntitlementCheckResultPosted", transactionIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(IEntitlementGatedV2EntitlementCheckResultPosted)
				if err := _IEntitlementGatedV2.contract.UnpackLog(event, "EntitlementCheckResultPosted", log); err != nil {
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

// ParseEntitlementCheckResultPosted is a log parse operation binding the contract event 0xb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c633.
//
// Solidity: event EntitlementCheckResultPosted(bytes32 indexed transactionId, uint8 result)
func (_IEntitlementGatedV2 *IEntitlementGatedV2Filterer) ParseEntitlementCheckResultPosted(log types.Log) (*IEntitlementGatedV2EntitlementCheckResultPosted, error) {
	event := new(IEntitlementGatedV2EntitlementCheckResultPosted)
	if err := _IEntitlementGatedV2.contract.UnpackLog(event, "EntitlementCheckResultPosted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
