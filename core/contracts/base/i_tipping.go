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

// ITippingBaseTipRequest is an auto generated low-level Go binding around an user-defined struct.
type ITippingBaseTipRequest struct {
	TokenId   *big.Int
	Currency  common.Address
	Amount    *big.Int
	MessageId [32]byte
	ChannelId [32]byte
}

// ITippingMetaData contains all meta data concerning the ITipping contract.
var ITippingMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"function\",\"name\":\"tip\",\"inputs\":[{\"name\":\"tipRequest\",\"type\":\"tuple\",\"internalType\":\"structITippingBase.TipRequest\",\"components\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"currency\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"amount\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"messageId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"channelId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}]}],\"outputs\":[],\"stateMutability\":\"payable\"},{\"type\":\"function\",\"name\":\"tipAmountByCurrency\",\"inputs\":[{\"name\":\"currency\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"tippingCurrencies\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"tipsByCurrencyAndTokenId\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"currency\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"totalTipsByCurrency\",\"inputs\":[{\"name\":\"currency\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"event\",\"name\":\"Tip\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"currency\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"sender\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"receiver\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"messageId\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"},{\"name\":\"channelId\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"TipMessage\",\"inputs\":[{\"name\":\"messageId\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"channelId\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"AmountIsZero\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"CannotTipSelf\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"CurrencyIsZero\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"ReceiverIsNotMember\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"SenderIsNotMember\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"TokenDoesNotExist\",\"inputs\":[]}]",
}

// ITippingABI is the input ABI used to generate the binding from.
// Deprecated: Use ITippingMetaData.ABI instead.
var ITippingABI = ITippingMetaData.ABI

// ITipping is an auto generated Go binding around an Ethereum contract.
type ITipping struct {
	ITippingCaller     // Read-only binding to the contract
	ITippingTransactor // Write-only binding to the contract
	ITippingFilterer   // Log filterer for contract events
}

// ITippingCaller is an auto generated read-only Go binding around an Ethereum contract.
type ITippingCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ITippingTransactor is an auto generated write-only Go binding around an Ethereum contract.
type ITippingTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ITippingFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ITippingFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ITippingSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ITippingSession struct {
	Contract     *ITipping         // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// ITippingCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ITippingCallerSession struct {
	Contract *ITippingCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts   // Call options to use throughout this session
}

// ITippingTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ITippingTransactorSession struct {
	Contract     *ITippingTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts   // Transaction auth options to use throughout this session
}

// ITippingRaw is an auto generated low-level Go binding around an Ethereum contract.
type ITippingRaw struct {
	Contract *ITipping // Generic contract binding to access the raw methods on
}

// ITippingCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ITippingCallerRaw struct {
	Contract *ITippingCaller // Generic read-only contract binding to access the raw methods on
}

// ITippingTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ITippingTransactorRaw struct {
	Contract *ITippingTransactor // Generic write-only contract binding to access the raw methods on
}

// NewITipping creates a new instance of ITipping, bound to a specific deployed contract.
func NewITipping(address common.Address, backend bind.ContractBackend) (*ITipping, error) {
	contract, err := bindITipping(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &ITipping{ITippingCaller: ITippingCaller{contract: contract}, ITippingTransactor: ITippingTransactor{contract: contract}, ITippingFilterer: ITippingFilterer{contract: contract}}, nil
}

// NewITippingCaller creates a new read-only instance of ITipping, bound to a specific deployed contract.
func NewITippingCaller(address common.Address, caller bind.ContractCaller) (*ITippingCaller, error) {
	contract, err := bindITipping(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ITippingCaller{contract: contract}, nil
}

// NewITippingTransactor creates a new write-only instance of ITipping, bound to a specific deployed contract.
func NewITippingTransactor(address common.Address, transactor bind.ContractTransactor) (*ITippingTransactor, error) {
	contract, err := bindITipping(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ITippingTransactor{contract: contract}, nil
}

// NewITippingFilterer creates a new log filterer instance of ITipping, bound to a specific deployed contract.
func NewITippingFilterer(address common.Address, filterer bind.ContractFilterer) (*ITippingFilterer, error) {
	contract, err := bindITipping(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ITippingFilterer{contract: contract}, nil
}

// bindITipping binds a generic wrapper to an already deployed contract.
func bindITipping(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := ITippingMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ITipping *ITippingRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ITipping.Contract.ITippingCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ITipping *ITippingRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ITipping.Contract.ITippingTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ITipping *ITippingRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ITipping.Contract.ITippingTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ITipping *ITippingCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ITipping.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ITipping *ITippingTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ITipping.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ITipping *ITippingTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ITipping.Contract.contract.Transact(opts, method, params...)
}

// TipAmountByCurrency is a free data retrieval call binding the contract method 0x0a7bb41b.
//
// Solidity: function tipAmountByCurrency(address currency) view returns(uint256)
func (_ITipping *ITippingCaller) TipAmountByCurrency(opts *bind.CallOpts, currency common.Address) (*big.Int, error) {
	var out []interface{}
	err := _ITipping.contract.Call(opts, &out, "tipAmountByCurrency", currency)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// TipAmountByCurrency is a free data retrieval call binding the contract method 0x0a7bb41b.
//
// Solidity: function tipAmountByCurrency(address currency) view returns(uint256)
func (_ITipping *ITippingSession) TipAmountByCurrency(currency common.Address) (*big.Int, error) {
	return _ITipping.Contract.TipAmountByCurrency(&_ITipping.CallOpts, currency)
}

// TipAmountByCurrency is a free data retrieval call binding the contract method 0x0a7bb41b.
//
// Solidity: function tipAmountByCurrency(address currency) view returns(uint256)
func (_ITipping *ITippingCallerSession) TipAmountByCurrency(currency common.Address) (*big.Int, error) {
	return _ITipping.Contract.TipAmountByCurrency(&_ITipping.CallOpts, currency)
}

// TippingCurrencies is a free data retrieval call binding the contract method 0x6e7ef3fa.
//
// Solidity: function tippingCurrencies() view returns(address[])
func (_ITipping *ITippingCaller) TippingCurrencies(opts *bind.CallOpts) ([]common.Address, error) {
	var out []interface{}
	err := _ITipping.contract.Call(opts, &out, "tippingCurrencies")

	if err != nil {
		return *new([]common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)

	return out0, err

}

// TippingCurrencies is a free data retrieval call binding the contract method 0x6e7ef3fa.
//
// Solidity: function tippingCurrencies() view returns(address[])
func (_ITipping *ITippingSession) TippingCurrencies() ([]common.Address, error) {
	return _ITipping.Contract.TippingCurrencies(&_ITipping.CallOpts)
}

// TippingCurrencies is a free data retrieval call binding the contract method 0x6e7ef3fa.
//
// Solidity: function tippingCurrencies() view returns(address[])
func (_ITipping *ITippingCallerSession) TippingCurrencies() ([]common.Address, error) {
	return _ITipping.Contract.TippingCurrencies(&_ITipping.CallOpts)
}

// TipsByCurrencyAndTokenId is a free data retrieval call binding the contract method 0x568922a6.
//
// Solidity: function tipsByCurrencyAndTokenId(uint256 tokenId, address currency) view returns(uint256)
func (_ITipping *ITippingCaller) TipsByCurrencyAndTokenId(opts *bind.CallOpts, tokenId *big.Int, currency common.Address) (*big.Int, error) {
	var out []interface{}
	err := _ITipping.contract.Call(opts, &out, "tipsByCurrencyAndTokenId", tokenId, currency)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// TipsByCurrencyAndTokenId is a free data retrieval call binding the contract method 0x568922a6.
//
// Solidity: function tipsByCurrencyAndTokenId(uint256 tokenId, address currency) view returns(uint256)
func (_ITipping *ITippingSession) TipsByCurrencyAndTokenId(tokenId *big.Int, currency common.Address) (*big.Int, error) {
	return _ITipping.Contract.TipsByCurrencyAndTokenId(&_ITipping.CallOpts, tokenId, currency)
}

// TipsByCurrencyAndTokenId is a free data retrieval call binding the contract method 0x568922a6.
//
// Solidity: function tipsByCurrencyAndTokenId(uint256 tokenId, address currency) view returns(uint256)
func (_ITipping *ITippingCallerSession) TipsByCurrencyAndTokenId(tokenId *big.Int, currency common.Address) (*big.Int, error) {
	return _ITipping.Contract.TipsByCurrencyAndTokenId(&_ITipping.CallOpts, tokenId, currency)
}

// TotalTipsByCurrency is a free data retrieval call binding the contract method 0xe4177d0b.
//
// Solidity: function totalTipsByCurrency(address currency) view returns(uint256)
func (_ITipping *ITippingCaller) TotalTipsByCurrency(opts *bind.CallOpts, currency common.Address) (*big.Int, error) {
	var out []interface{}
	err := _ITipping.contract.Call(opts, &out, "totalTipsByCurrency", currency)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// TotalTipsByCurrency is a free data retrieval call binding the contract method 0xe4177d0b.
//
// Solidity: function totalTipsByCurrency(address currency) view returns(uint256)
func (_ITipping *ITippingSession) TotalTipsByCurrency(currency common.Address) (*big.Int, error) {
	return _ITipping.Contract.TotalTipsByCurrency(&_ITipping.CallOpts, currency)
}

// TotalTipsByCurrency is a free data retrieval call binding the contract method 0xe4177d0b.
//
// Solidity: function totalTipsByCurrency(address currency) view returns(uint256)
func (_ITipping *ITippingCallerSession) TotalTipsByCurrency(currency common.Address) (*big.Int, error) {
	return _ITipping.Contract.TotalTipsByCurrency(&_ITipping.CallOpts, currency)
}

// Tip is a paid mutator transaction binding the contract method 0x89b10db8.
//
// Solidity: function tip((uint256,address,uint256,bytes32,bytes32) tipRequest) payable returns()
func (_ITipping *ITippingTransactor) Tip(opts *bind.TransactOpts, tipRequest ITippingBaseTipRequest) (*types.Transaction, error) {
	return _ITipping.contract.Transact(opts, "tip", tipRequest)
}

// Tip is a paid mutator transaction binding the contract method 0x89b10db8.
//
// Solidity: function tip((uint256,address,uint256,bytes32,bytes32) tipRequest) payable returns()
func (_ITipping *ITippingSession) Tip(tipRequest ITippingBaseTipRequest) (*types.Transaction, error) {
	return _ITipping.Contract.Tip(&_ITipping.TransactOpts, tipRequest)
}

// Tip is a paid mutator transaction binding the contract method 0x89b10db8.
//
// Solidity: function tip((uint256,address,uint256,bytes32,bytes32) tipRequest) payable returns()
func (_ITipping *ITippingTransactorSession) Tip(tipRequest ITippingBaseTipRequest) (*types.Transaction, error) {
	return _ITipping.Contract.Tip(&_ITipping.TransactOpts, tipRequest)
}

// ITippingTipIterator is returned from FilterTip and is used to iterate over the raw logs and unpacked data for Tip events raised by the ITipping contract.
type ITippingTipIterator struct {
	Event *ITippingTip // Event containing the contract specifics and raw log

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
func (it *ITippingTipIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ITippingTip)
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
		it.Event = new(ITippingTip)
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
func (it *ITippingTipIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ITippingTipIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ITippingTip represents a Tip event raised by the ITipping contract.
type ITippingTip struct {
	TokenId   *big.Int
	Currency  common.Address
	Sender    common.Address
	Receiver  common.Address
	Amount    *big.Int
	MessageId [32]byte
	ChannelId [32]byte
	Raw       types.Log // Blockchain specific contextual infos
}

// FilterTip is a free log retrieval operation binding the contract event 0x854db29cbd1986b670c0d596bf56847152a0d66e5ddef710408c1fa4ada78f2b.
//
// Solidity: event Tip(uint256 indexed tokenId, address indexed currency, address sender, address receiver, uint256 amount, bytes32 messageId, bytes32 channelId)
func (_ITipping *ITippingFilterer) FilterTip(opts *bind.FilterOpts, tokenId []*big.Int, currency []common.Address) (*ITippingTipIterator, error) {

	var tokenIdRule []interface{}
	for _, tokenIdItem := range tokenId {
		tokenIdRule = append(tokenIdRule, tokenIdItem)
	}
	var currencyRule []interface{}
	for _, currencyItem := range currency {
		currencyRule = append(currencyRule, currencyItem)
	}

	logs, sub, err := _ITipping.contract.FilterLogs(opts, "Tip", tokenIdRule, currencyRule)
	if err != nil {
		return nil, err
	}
	return &ITippingTipIterator{contract: _ITipping.contract, event: "Tip", logs: logs, sub: sub}, nil
}

// WatchTip is a free log subscription operation binding the contract event 0x854db29cbd1986b670c0d596bf56847152a0d66e5ddef710408c1fa4ada78f2b.
//
// Solidity: event Tip(uint256 indexed tokenId, address indexed currency, address sender, address receiver, uint256 amount, bytes32 messageId, bytes32 channelId)
func (_ITipping *ITippingFilterer) WatchTip(opts *bind.WatchOpts, sink chan<- *ITippingTip, tokenId []*big.Int, currency []common.Address) (event.Subscription, error) {

	var tokenIdRule []interface{}
	for _, tokenIdItem := range tokenId {
		tokenIdRule = append(tokenIdRule, tokenIdItem)
	}
	var currencyRule []interface{}
	for _, currencyItem := range currency {
		currencyRule = append(currencyRule, currencyItem)
	}

	logs, sub, err := _ITipping.contract.WatchLogs(opts, "Tip", tokenIdRule, currencyRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ITippingTip)
				if err := _ITipping.contract.UnpackLog(event, "Tip", log); err != nil {
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

// ParseTip is a log parse operation binding the contract event 0x854db29cbd1986b670c0d596bf56847152a0d66e5ddef710408c1fa4ada78f2b.
//
// Solidity: event Tip(uint256 indexed tokenId, address indexed currency, address sender, address receiver, uint256 amount, bytes32 messageId, bytes32 channelId)
func (_ITipping *ITippingFilterer) ParseTip(log types.Log) (*ITippingTip, error) {
	event := new(ITippingTip)
	if err := _ITipping.contract.UnpackLog(event, "Tip", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ITippingTipMessageIterator is returned from FilterTipMessage and is used to iterate over the raw logs and unpacked data for TipMessage events raised by the ITipping contract.
type ITippingTipMessageIterator struct {
	Event *ITippingTipMessage // Event containing the contract specifics and raw log

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
func (it *ITippingTipMessageIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ITippingTipMessage)
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
		it.Event = new(ITippingTipMessage)
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
func (it *ITippingTipMessageIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ITippingTipMessageIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ITippingTipMessage represents a TipMessage event raised by the ITipping contract.
type ITippingTipMessage struct {
	MessageId [32]byte
	ChannelId [32]byte
	Raw       types.Log // Blockchain specific contextual infos
}

// FilterTipMessage is a free log retrieval operation binding the contract event 0x9d14d80afa6bf0fc7cc78520e92d2ede60f2a3667728687f6a47e18f01af9b72.
//
// Solidity: event TipMessage(bytes32 indexed messageId, bytes32 indexed channelId)
func (_ITipping *ITippingFilterer) FilterTipMessage(opts *bind.FilterOpts, messageId [][32]byte, channelId [][32]byte) (*ITippingTipMessageIterator, error) {

	var messageIdRule []interface{}
	for _, messageIdItem := range messageId {
		messageIdRule = append(messageIdRule, messageIdItem)
	}
	var channelIdRule []interface{}
	for _, channelIdItem := range channelId {
		channelIdRule = append(channelIdRule, channelIdItem)
	}

	logs, sub, err := _ITipping.contract.FilterLogs(opts, "TipMessage", messageIdRule, channelIdRule)
	if err != nil {
		return nil, err
	}
	return &ITippingTipMessageIterator{contract: _ITipping.contract, event: "TipMessage", logs: logs, sub: sub}, nil
}

// WatchTipMessage is a free log subscription operation binding the contract event 0x9d14d80afa6bf0fc7cc78520e92d2ede60f2a3667728687f6a47e18f01af9b72.
//
// Solidity: event TipMessage(bytes32 indexed messageId, bytes32 indexed channelId)
func (_ITipping *ITippingFilterer) WatchTipMessage(opts *bind.WatchOpts, sink chan<- *ITippingTipMessage, messageId [][32]byte, channelId [][32]byte) (event.Subscription, error) {

	var messageIdRule []interface{}
	for _, messageIdItem := range messageId {
		messageIdRule = append(messageIdRule, messageIdItem)
	}
	var channelIdRule []interface{}
	for _, channelIdItem := range channelId {
		channelIdRule = append(channelIdRule, channelIdItem)
	}

	logs, sub, err := _ITipping.contract.WatchLogs(opts, "TipMessage", messageIdRule, channelIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ITippingTipMessage)
				if err := _ITipping.contract.UnpackLog(event, "TipMessage", log); err != nil {
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

// ParseTipMessage is a log parse operation binding the contract event 0x9d14d80afa6bf0fc7cc78520e92d2ede60f2a3667728687f6a47e18f01af9b72.
//
// Solidity: event TipMessage(bytes32 indexed messageId, bytes32 indexed channelId)
func (_ITipping *ITippingFilterer) ParseTipMessage(log types.Log) (*ITippingTipMessage, error) {
	event := new(ITippingTipMessage)
	if err := _ITipping.contract.UnpackLog(event, "TipMessage", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
