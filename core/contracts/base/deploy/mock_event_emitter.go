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

// MockEventEmitterMetaData contains all meta data concerning the MockEventEmitter contract.
var MockEventEmitterMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"function\",\"name\":\"emitEvent\",\"inputs\":[{\"name\":\"value\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"TestEvent\",\"inputs\":[{\"name\":\"value\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"}],\"anonymous\":false}]",
	Bin: "0x608060405234801561001057600080fd5b5060848061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634d43bec914602d575b600080fd5b603c6038366004606c565b603e565b005b60405181907f1440c4dd67b4344ea1905ec0318995133b550f168b4ee959a0da6b503d7d241490600090a250565b600060208284031215607d57600080fd5b503591905056",
}

// MockEventEmitterABI is the input ABI used to generate the binding from.
// Deprecated: Use MockEventEmitterMetaData.ABI instead.
var MockEventEmitterABI = MockEventEmitterMetaData.ABI

// MockEventEmitterBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use MockEventEmitterMetaData.Bin instead.
var MockEventEmitterBin = MockEventEmitterMetaData.Bin

// DeployMockEventEmitter deploys a new Ethereum contract, binding an instance of MockEventEmitter to it.
func DeployMockEventEmitter(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *MockEventEmitter, error) {
	parsed, err := MockEventEmitterMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(MockEventEmitterBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &MockEventEmitter{MockEventEmitterCaller: MockEventEmitterCaller{contract: contract}, MockEventEmitterTransactor: MockEventEmitterTransactor{contract: contract}, MockEventEmitterFilterer: MockEventEmitterFilterer{contract: contract}}, nil
}

// MockEventEmitter is an auto generated Go binding around an Ethereum contract.
type MockEventEmitter struct {
	MockEventEmitterCaller     // Read-only binding to the contract
	MockEventEmitterTransactor // Write-only binding to the contract
	MockEventEmitterFilterer   // Log filterer for contract events
}

// MockEventEmitterCaller is an auto generated read-only Go binding around an Ethereum contract.
type MockEventEmitterCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MockEventEmitterTransactor is an auto generated write-only Go binding around an Ethereum contract.
type MockEventEmitterTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MockEventEmitterFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type MockEventEmitterFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MockEventEmitterSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type MockEventEmitterSession struct {
	Contract     *MockEventEmitter // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// MockEventEmitterCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type MockEventEmitterCallerSession struct {
	Contract *MockEventEmitterCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts           // Call options to use throughout this session
}

// MockEventEmitterTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type MockEventEmitterTransactorSession struct {
	Contract     *MockEventEmitterTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts           // Transaction auth options to use throughout this session
}

// MockEventEmitterRaw is an auto generated low-level Go binding around an Ethereum contract.
type MockEventEmitterRaw struct {
	Contract *MockEventEmitter // Generic contract binding to access the raw methods on
}

// MockEventEmitterCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type MockEventEmitterCallerRaw struct {
	Contract *MockEventEmitterCaller // Generic read-only contract binding to access the raw methods on
}

// MockEventEmitterTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type MockEventEmitterTransactorRaw struct {
	Contract *MockEventEmitterTransactor // Generic write-only contract binding to access the raw methods on
}

// NewMockEventEmitter creates a new instance of MockEventEmitter, bound to a specific deployed contract.
func NewMockEventEmitter(address common.Address, backend bind.ContractBackend) (*MockEventEmitter, error) {
	contract, err := bindMockEventEmitter(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &MockEventEmitter{MockEventEmitterCaller: MockEventEmitterCaller{contract: contract}, MockEventEmitterTransactor: MockEventEmitterTransactor{contract: contract}, MockEventEmitterFilterer: MockEventEmitterFilterer{contract: contract}}, nil
}

// NewMockEventEmitterCaller creates a new read-only instance of MockEventEmitter, bound to a specific deployed contract.
func NewMockEventEmitterCaller(address common.Address, caller bind.ContractCaller) (*MockEventEmitterCaller, error) {
	contract, err := bindMockEventEmitter(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &MockEventEmitterCaller{contract: contract}, nil
}

// NewMockEventEmitterTransactor creates a new write-only instance of MockEventEmitter, bound to a specific deployed contract.
func NewMockEventEmitterTransactor(address common.Address, transactor bind.ContractTransactor) (*MockEventEmitterTransactor, error) {
	contract, err := bindMockEventEmitter(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &MockEventEmitterTransactor{contract: contract}, nil
}

// NewMockEventEmitterFilterer creates a new log filterer instance of MockEventEmitter, bound to a specific deployed contract.
func NewMockEventEmitterFilterer(address common.Address, filterer bind.ContractFilterer) (*MockEventEmitterFilterer, error) {
	contract, err := bindMockEventEmitter(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &MockEventEmitterFilterer{contract: contract}, nil
}

// bindMockEventEmitter binds a generic wrapper to an already deployed contract.
func bindMockEventEmitter(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := MockEventEmitterMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_MockEventEmitter *MockEventEmitterRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _MockEventEmitter.Contract.MockEventEmitterCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_MockEventEmitter *MockEventEmitterRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _MockEventEmitter.Contract.MockEventEmitterTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_MockEventEmitter *MockEventEmitterRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _MockEventEmitter.Contract.MockEventEmitterTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_MockEventEmitter *MockEventEmitterCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _MockEventEmitter.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_MockEventEmitter *MockEventEmitterTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _MockEventEmitter.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_MockEventEmitter *MockEventEmitterTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _MockEventEmitter.Contract.contract.Transact(opts, method, params...)
}

// EmitEvent is a paid mutator transaction binding the contract method 0x4d43bec9.
//
// Solidity: function emitEvent(uint256 value) returns()
func (_MockEventEmitter *MockEventEmitterTransactor) EmitEvent(opts *bind.TransactOpts, value *big.Int) (*types.Transaction, error) {
	return _MockEventEmitter.contract.Transact(opts, "emitEvent", value)
}

// EmitEvent is a paid mutator transaction binding the contract method 0x4d43bec9.
//
// Solidity: function emitEvent(uint256 value) returns()
func (_MockEventEmitter *MockEventEmitterSession) EmitEvent(value *big.Int) (*types.Transaction, error) {
	return _MockEventEmitter.Contract.EmitEvent(&_MockEventEmitter.TransactOpts, value)
}

// EmitEvent is a paid mutator transaction binding the contract method 0x4d43bec9.
//
// Solidity: function emitEvent(uint256 value) returns()
func (_MockEventEmitter *MockEventEmitterTransactorSession) EmitEvent(value *big.Int) (*types.Transaction, error) {
	return _MockEventEmitter.Contract.EmitEvent(&_MockEventEmitter.TransactOpts, value)
}

// MockEventEmitterTestEventIterator is returned from FilterTestEvent and is used to iterate over the raw logs and unpacked data for TestEvent events raised by the MockEventEmitter contract.
type MockEventEmitterTestEventIterator struct {
	Event *MockEventEmitterTestEvent // Event containing the contract specifics and raw log

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
func (it *MockEventEmitterTestEventIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MockEventEmitterTestEvent)
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
		it.Event = new(MockEventEmitterTestEvent)
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
func (it *MockEventEmitterTestEventIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MockEventEmitterTestEventIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MockEventEmitterTestEvent represents a TestEvent event raised by the MockEventEmitter contract.
type MockEventEmitterTestEvent struct {
	Value *big.Int
	Raw   types.Log // Blockchain specific contextual infos
}

// FilterTestEvent is a free log retrieval operation binding the contract event 0x1440c4dd67b4344ea1905ec0318995133b550f168b4ee959a0da6b503d7d2414.
//
// Solidity: event TestEvent(uint256 indexed value)
func (_MockEventEmitter *MockEventEmitterFilterer) FilterTestEvent(opts *bind.FilterOpts, value []*big.Int) (*MockEventEmitterTestEventIterator, error) {

	var valueRule []interface{}
	for _, valueItem := range value {
		valueRule = append(valueRule, valueItem)
	}

	logs, sub, err := _MockEventEmitter.contract.FilterLogs(opts, "TestEvent", valueRule)
	if err != nil {
		return nil, err
	}
	return &MockEventEmitterTestEventIterator{contract: _MockEventEmitter.contract, event: "TestEvent", logs: logs, sub: sub}, nil
}

// WatchTestEvent is a free log subscription operation binding the contract event 0x1440c4dd67b4344ea1905ec0318995133b550f168b4ee959a0da6b503d7d2414.
//
// Solidity: event TestEvent(uint256 indexed value)
func (_MockEventEmitter *MockEventEmitterFilterer) WatchTestEvent(opts *bind.WatchOpts, sink chan<- *MockEventEmitterTestEvent, value []*big.Int) (event.Subscription, error) {

	var valueRule []interface{}
	for _, valueItem := range value {
		valueRule = append(valueRule, valueItem)
	}

	logs, sub, err := _MockEventEmitter.contract.WatchLogs(opts, "TestEvent", valueRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MockEventEmitterTestEvent)
				if err := _MockEventEmitter.contract.UnpackLog(event, "TestEvent", log); err != nil {
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
func (_MockEventEmitter *MockEventEmitterFilterer) ParseTestEvent(log types.Log) (*MockEventEmitterTestEvent, error) {
	event := new(MockEventEmitterTestEvent)
	if err := _MockEventEmitter.contract.UnpackLog(event, "TestEvent", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
