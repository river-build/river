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

// IEventEmitterMetaData contains all meta data concerning the IEventEmitter contract.
var IEventEmitterMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"function\",\"name\":\"emitEvent\",\"inputs\":[{\"name\":\"value\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"TestEvent\",\"inputs\":[{\"name\":\"value\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"}],\"anonymous\":false}]",
}

// IEventEmitterABI is the input ABI used to generate the binding from.
// Deprecated: Use IEventEmitterMetaData.ABI instead.
var IEventEmitterABI = IEventEmitterMetaData.ABI

// IEventEmitter is an auto generated Go binding around an Ethereum contract.
type IEventEmitter struct {
	IEventEmitterCaller     // Read-only binding to the contract
	IEventEmitterTransactor // Write-only binding to the contract
	IEventEmitterFilterer   // Log filterer for contract events
}

// IEventEmitterCaller is an auto generated read-only Go binding around an Ethereum contract.
type IEventEmitterCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// IEventEmitterTransactor is an auto generated write-only Go binding around an Ethereum contract.
type IEventEmitterTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// IEventEmitterFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type IEventEmitterFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// IEventEmitterSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type IEventEmitterSession struct {
	Contract     *IEventEmitter    // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// IEventEmitterCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type IEventEmitterCallerSession struct {
	Contract *IEventEmitterCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts        // Call options to use throughout this session
}

// IEventEmitterTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type IEventEmitterTransactorSession struct {
	Contract     *IEventEmitterTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts        // Transaction auth options to use throughout this session
}

// IEventEmitterRaw is an auto generated low-level Go binding around an Ethereum contract.
type IEventEmitterRaw struct {
	Contract *IEventEmitter // Generic contract binding to access the raw methods on
}

// IEventEmitterCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type IEventEmitterCallerRaw struct {
	Contract *IEventEmitterCaller // Generic read-only contract binding to access the raw methods on
}

// IEventEmitterTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type IEventEmitterTransactorRaw struct {
	Contract *IEventEmitterTransactor // Generic write-only contract binding to access the raw methods on
}

// NewIEventEmitter creates a new instance of IEventEmitter, bound to a specific deployed contract.
func NewIEventEmitter(address common.Address, backend bind.ContractBackend) (*IEventEmitter, error) {
	contract, err := bindIEventEmitter(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &IEventEmitter{IEventEmitterCaller: IEventEmitterCaller{contract: contract}, IEventEmitterTransactor: IEventEmitterTransactor{contract: contract}, IEventEmitterFilterer: IEventEmitterFilterer{contract: contract}}, nil
}

// NewIEventEmitterCaller creates a new read-only instance of IEventEmitter, bound to a specific deployed contract.
func NewIEventEmitterCaller(address common.Address, caller bind.ContractCaller) (*IEventEmitterCaller, error) {
	contract, err := bindIEventEmitter(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &IEventEmitterCaller{contract: contract}, nil
}

// NewIEventEmitterTransactor creates a new write-only instance of IEventEmitter, bound to a specific deployed contract.
func NewIEventEmitterTransactor(address common.Address, transactor bind.ContractTransactor) (*IEventEmitterTransactor, error) {
	contract, err := bindIEventEmitter(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &IEventEmitterTransactor{contract: contract}, nil
}

// NewIEventEmitterFilterer creates a new log filterer instance of IEventEmitter, bound to a specific deployed contract.
func NewIEventEmitterFilterer(address common.Address, filterer bind.ContractFilterer) (*IEventEmitterFilterer, error) {
	contract, err := bindIEventEmitter(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &IEventEmitterFilterer{contract: contract}, nil
}

// bindIEventEmitter binds a generic wrapper to an already deployed contract.
func bindIEventEmitter(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := IEventEmitterMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_IEventEmitter *IEventEmitterRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _IEventEmitter.Contract.IEventEmitterCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_IEventEmitter *IEventEmitterRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _IEventEmitter.Contract.IEventEmitterTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_IEventEmitter *IEventEmitterRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _IEventEmitter.Contract.IEventEmitterTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_IEventEmitter *IEventEmitterCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _IEventEmitter.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_IEventEmitter *IEventEmitterTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _IEventEmitter.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_IEventEmitter *IEventEmitterTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _IEventEmitter.Contract.contract.Transact(opts, method, params...)
}

// EmitEvent is a paid mutator transaction binding the contract method 0x4d43bec9.
//
// Solidity: function emitEvent(uint256 value) returns()
func (_IEventEmitter *IEventEmitterTransactor) EmitEvent(opts *bind.TransactOpts, value *big.Int) (*types.Transaction, error) {
	return _IEventEmitter.contract.Transact(opts, "emitEvent", value)
}

// EmitEvent is a paid mutator transaction binding the contract method 0x4d43bec9.
//
// Solidity: function emitEvent(uint256 value) returns()
func (_IEventEmitter *IEventEmitterSession) EmitEvent(value *big.Int) (*types.Transaction, error) {
	return _IEventEmitter.Contract.EmitEvent(&_IEventEmitter.TransactOpts, value)
}

// EmitEvent is a paid mutator transaction binding the contract method 0x4d43bec9.
//
// Solidity: function emitEvent(uint256 value) returns()
func (_IEventEmitter *IEventEmitterTransactorSession) EmitEvent(value *big.Int) (*types.Transaction, error) {
	return _IEventEmitter.Contract.EmitEvent(&_IEventEmitter.TransactOpts, value)
}

// IEventEmitterTestEventIterator is returned from FilterTestEvent and is used to iterate over the raw logs and unpacked data for TestEvent events raised by the IEventEmitter contract.
type IEventEmitterTestEventIterator struct {
	Event *IEventEmitterTestEvent // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *IEventEmitterTestEventIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(IEventEmitterTestEvent)
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
		it.Event = new(IEventEmitterTestEvent)
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
func (it *IEventEmitterTestEventIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *IEventEmitterTestEventIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// IEventEmitterTestEvent represents a TestEvent event raised by the IEventEmitter contract.
type IEventEmitterTestEvent struct {
	Value *big.Int
	Raw   types.Log // Blockchain specific contextual infos
}

// FilterTestEvent is a free log retrieval operation binding the contract event 0x1440c4dd67b4344ea1905ec0318995133b550f168b4ee959a0da6b503d7d2414.
//
// Solidity: event TestEvent(uint256 indexed value)
func (_IEventEmitter *IEventEmitterFilterer) FilterTestEvent(opts *bind.FilterOpts, value []*big.Int) (*IEventEmitterTestEventIterator, error) {

	var valueRule []interface{}
	for _, valueItem := range value {
		valueRule = append(valueRule, valueItem)
	}

	logs, sub, err := _IEventEmitter.contract.FilterLogs(opts, "TestEvent", valueRule)
	if err != nil {
		return nil, err
	}
	return &IEventEmitterTestEventIterator{contract: _IEventEmitter.contract, event: "TestEvent", logs: logs, sub: sub}, nil
}

// WatchTestEvent is a free log subscription operation binding the contract event 0x1440c4dd67b4344ea1905ec0318995133b550f168b4ee959a0da6b503d7d2414.
//
// Solidity: event TestEvent(uint256 indexed value)
func (_IEventEmitter *IEventEmitterFilterer) WatchTestEvent(opts *bind.WatchOpts, sink chan<- *IEventEmitterTestEvent, value []*big.Int) (event.Subscription, error) {

	var valueRule []interface{}
	for _, valueItem := range value {
		valueRule = append(valueRule, valueItem)
	}

	logs, sub, err := _IEventEmitter.contract.WatchLogs(opts, "TestEvent", valueRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(IEventEmitterTestEvent)
				if err := _IEventEmitter.contract.UnpackLog(event, "TestEvent", log); err != nil {
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

// ParseTestEvent is a log parse operation binding the contract event 0x1440c4dd67b4344ea1905ec0318995133b550f168b4ee959a0da6b503d7d2414.
//
// Solidity: event TestEvent(uint256 indexed value)
func (_IEventEmitter *IEventEmitterFilterer) ParseTestEvent(log types.Log) (*IEventEmitterTestEvent, error) {
	event := new(IEventEmitterTestEvent)
	if err := _IEventEmitter.contract.UnpackLog(event, "TestEvent", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
