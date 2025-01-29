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

// XchainMetaData contains all meta data concerning the Xchain contract.
var XchainMetaData = &bind.MetaData{
	ABI:	"[{\"type\":\"function\",\"name\":\"__XChain_init\",\"inputs\":[],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getRuleData\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"isCompleted\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"requestId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"postEntitlementCheckResult\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"requestId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"result\",\"type\":\"uint8\",\"internalType\":\"enumIEntitlementGatedBase.NodeVoteStatus\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"EntitlementCheckRequested\",\"inputs\":[{\"name\":\"callerAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"transactionId\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"selectedNodes\",\"type\":\"address[]\",\"indexed\":false,\"internalType\":\"address[]\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"EntitlementCheckRequestedV2\",\"inputs\":[{\"name\":\"walletAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"spaceAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"resolverAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"transactionId\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"selectedNodes\",\"type\":\"address[]\",\"indexed\":false,\"internalType\":\"address[]\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"EntitlementCheckResultPosted\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"result\",\"type\":\"uint8\",\"indexed\":false,\"internalType\":\"enumIEntitlementGatedBase.NodeVoteStatus\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Initialized\",\"inputs\":[{\"name\":\"version\",\"type\":\"uint32\",\"indexed\":false,\"internalType\":\"uint32\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceAdded\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceRemoved\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"NodeRegistered\",\"inputs\":[{\"name\":\"nodeAddress\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"NodeUnregistered\",\"inputs\":[{\"name\":\"nodeAddress\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"EntitlementChecker_InsufficientFunds\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_InsufficientNumberOfNodes\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_InvalidNodeOperator\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_InvalidOperator\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_NoPendingRequests\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_NoRefundsAvailable\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_NodeAlreadyRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_NodeNotRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_OperatorNotActive\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_InvalidAddress\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_InvalidEntitlement\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeAlreadyVoted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeNotFound\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_OnlyEntitlementChecker\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_RequestIdNotFound\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyCompleted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionNotRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_InInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_NotInInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_AlreadySupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_NotSupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Reentrancy\",\"inputs\":[]}]",
	Bin:	"0x608060405234801561001057600080fd5b5061001961001e565b6100c4565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff161561006a576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156100c157805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b610ae5806100d36000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80634739e8051461005157806392c399ff1461006657806398ddb51b1461008f578063bbbcb94b146100f0575b600080fd5b61006461005f36600461085b565b6100f8565b005b610079610074366004610898565b6104ec565b60405161008691906109ae565b60405180910390f35b6100e061009d366004610898565b60009182527ff501c51c066c21fd640901535874a71171bb35113f6dc2832fce1b1f9da0cc03602090815260408084209284526004909201905290205460ff1690565b6040519015158152602001610086565b610064610516565b3068929eee149b4bd2126854036101175763ab143c066000526004601cfd5b3068929eee149b4bd212685560008381527ff501c51c066c21fd640901535874a71171bb35113f6dc2832fce1b1f9da0cc02602052604090206002810154600160a01b900460ff161561017d57604051637912b73960e01b815260040160405180910390fd5b60008481527ff501c51c066c21fd640901535874a71171bb35113f6dc2832fce1b1f9da0cc03602052604090206101b48185610572565b6101c8576101c8630829702360e41b61058d565b600084815260028201602052604090206101e29033610597565b6101f6576101f6638223a7e960e01b61058d565b600084815260048201602052604090205460ff161561021f5761021f637912b73960e01b61058d565b6000848152600282016020526040812081908190819061023e906105b9565b905060005b8181101561035c576000898152600387016020526040812080548390811061026d5761026d610a51565b60009182526020909120018054909150336001600160a01b03909116036102f95760008154600160a01b900460ff1660028111156102ad576102ad6108ba565b146102cb576040516347592a4d60e01b815260040160405180910390fd5b80548990829060ff60a01b1916600160a01b8360028111156102ef576102ef6108ba565b0217905550600195505b60018154600160a01b900460ff166002811115610318576103186108ba565b0361032857846001019450610353565b60028154600160a01b900460ff166002811115610347576103476108ba565b03610353578360010193505b50600101610243565b508361037b57604051638223a7e960e01b815260040160405180910390fd5b610386600282610a67565b83118061039c5750610399600282610a67565b82115b156104d55760008881526004860160205260408120805460ff191660011790558284116103ca5760026103cd565b60015b905060006103da8b6105c3565b905060018260028111156103f0576103f06108ba565b14806103f95750805b156104d25760028801805460ff60a01b1916600160a01b1790556104648b61043e7ff501c51c066c21fd640901535874a71171bb35113f6dc2832fce1b1f9da0cc0090565b60028b01546001600160a01b03166000908152600191909101602052604090209061064d565b50600288015488546040516372c3487960e11b81526001600160a01b039092169163e58690f2919061049f908f906000908890600401610a89565b6000604051808303818588803b1580156104b857600080fd5b505af11580156104cc573d6000803e3d6000fd5b50505050505b50505b5050505050503868929eee149b4bd2126855505050565b61051060405180606001604052806060815260200160608152602001606081525090565b92915050565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff1661056057604051630ef4733760e31b815260040160405180910390fd5b610570636afd38fd60e11b610659565b565b600081815260018301602052604081205415155b9392505050565b8060005260046000fd5b6001600160a01b03811660009081526001830160205260408120541515610586565b6000610510825490565b60008181527ff501c51c066c21fd640901535874a71171bb35113f6dc2832fce1b1f9da0cc0360205260408120816105fa826105b9565b905060005b81811015610642576004830160006106178584610732565b815260208101919091526040016000205460ff1661063a57506000949350505050565b6001016105ff565b506001949350505050565b6000610586838361073e565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff166106e1576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff191660011790556106fa565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b60006105868383610831565b60008181526001830160205260408120548015610827576000610762600183610aae565b855490915060009061077690600190610aae565b90508082146107db57600086600001828154811061079657610796610a51565b90600052602060002001549050808760000184815481106107b9576107b9610a51565b6000918252602080832090910192909255918252600188019052604090208390555b85548690806107ec576107ec610acf565b600190038181906000526020600020016000905590558560010160008681526020019081526020016000206000905560019350505050610510565b6000915050610510565b600082600001828154811061084857610848610a51565b9060005260206000200154905092915050565b60008060006060848603121561087057600080fd5b833592506020840135915060408401356003811061088d57600080fd5b809150509250925092565b600080604083850312156108ab57600080fd5b50508035926020909101359150565b634e487b7160e01b600052602160045260246000fd5b600381106108e0576108e06108ba565b50565b60008151808452602080850194506020840160005b8381101561094d578151805160078110610914576109146108ba565b885280840151848901526040808201516001600160a01b03169089015260609081015190880152608090960195908201906001016108f8565b509495945050505050565b60008151808452602080850194506020840160005b8381101561094d5781518051610982816108d0565b88528084015160ff908116858a015260409182015116908801526060909601959082019060010161096d565b6020808252825160608383015280516080840181905260009291820190839060a08601905b80831015610a0a57835180516109e8816108d0565b835285015160ff168583015292840192600192909201916040909101906109d3565b50838701519350601f19925082868203016040870152610a2a81856108e3565b93505050604085015181858403016060860152610a478382610958565b9695505050505050565b634e487b7160e01b600052603260045260246000fd5b600082610a8457634e487b7160e01b600052601260045260246000fd5b500490565b8381526020810183905260608101610aa0836108d0565b826040830152949350505050565b8181038181111561051057634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052603160045260246000fd",
}

// XchainABI is the input ABI used to generate the binding from.
// Deprecated: Use XchainMetaData.ABI instead.
var XchainABI = XchainMetaData.ABI

// XchainBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use XchainMetaData.Bin instead.
var XchainBin = XchainMetaData.Bin

// DeployXchain deploys a new Ethereum contract, binding an instance of Xchain to it.
func DeployXchain(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *Xchain, error) {
	parsed, err := XchainMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(XchainBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &Xchain{XchainCaller: XchainCaller{contract: contract}, XchainTransactor: XchainTransactor{contract: contract}, XchainFilterer: XchainFilterer{contract: contract}}, nil
}

// Xchain is an auto generated Go binding around an Ethereum contract.
type Xchain struct {
	XchainCaller		// Read-only binding to the contract
	XchainTransactor	// Write-only binding to the contract
	XchainFilterer		// Log filterer for contract events
}

// XchainCaller is an auto generated read-only Go binding around an Ethereum contract.
type XchainCaller struct {
	contract *bind.BoundContract	// Generic contract wrapper for the low level calls
}

// XchainTransactor is an auto generated write-only Go binding around an Ethereum contract.
type XchainTransactor struct {
	contract *bind.BoundContract	// Generic contract wrapper for the low level calls
}

// XchainFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type XchainFilterer struct {
	contract *bind.BoundContract	// Generic contract wrapper for the low level calls
}

// XchainSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type XchainSession struct {
	Contract	*Xchain			// Generic contract binding to set the session for
	CallOpts	bind.CallOpts		// Call options to use throughout this session
	TransactOpts	bind.TransactOpts	// Transaction auth options to use throughout this session
}

// XchainCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type XchainCallerSession struct {
	Contract	*XchainCaller	// Generic contract caller binding to set the session for
	CallOpts	bind.CallOpts	// Call options to use throughout this session
}

// XchainTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type XchainTransactorSession struct {
	Contract	*XchainTransactor	// Generic contract transactor binding to set the session for
	TransactOpts	bind.TransactOpts	// Transaction auth options to use throughout this session
}

// XchainRaw is an auto generated low-level Go binding around an Ethereum contract.
type XchainRaw struct {
	Contract *Xchain	// Generic contract binding to access the raw methods on
}

// XchainCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type XchainCallerRaw struct {
	Contract *XchainCaller	// Generic read-only contract binding to access the raw methods on
}

// XchainTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type XchainTransactorRaw struct {
	Contract *XchainTransactor	// Generic write-only contract binding to access the raw methods on
}

// NewXchain creates a new instance of Xchain, bound to a specific deployed contract.
func NewXchain(address common.Address, backend bind.ContractBackend) (*Xchain, error) {
	contract, err := bindXchain(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Xchain{XchainCaller: XchainCaller{contract: contract}, XchainTransactor: XchainTransactor{contract: contract}, XchainFilterer: XchainFilterer{contract: contract}}, nil
}

// NewXchainCaller creates a new read-only instance of Xchain, bound to a specific deployed contract.
func NewXchainCaller(address common.Address, caller bind.ContractCaller) (*XchainCaller, error) {
	contract, err := bindXchain(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &XchainCaller{contract: contract}, nil
}

// NewXchainTransactor creates a new write-only instance of Xchain, bound to a specific deployed contract.
func NewXchainTransactor(address common.Address, transactor bind.ContractTransactor) (*XchainTransactor, error) {
	contract, err := bindXchain(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &XchainTransactor{contract: contract}, nil
}

// NewXchainFilterer creates a new log filterer instance of Xchain, bound to a specific deployed contract.
func NewXchainFilterer(address common.Address, filterer bind.ContractFilterer) (*XchainFilterer, error) {
	contract, err := bindXchain(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &XchainFilterer{contract: contract}, nil
}

// bindXchain binds a generic wrapper to an already deployed contract.
func bindXchain(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := XchainMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Xchain *XchainRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Xchain.Contract.XchainCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Xchain *XchainRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Xchain.Contract.XchainTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Xchain *XchainRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Xchain.Contract.XchainTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Xchain *XchainCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Xchain.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Xchain *XchainTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Xchain.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Xchain *XchainTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Xchain.Contract.contract.Transact(opts, method, params...)
}

// GetRuleData is a free data retrieval call binding the contract method 0x92c399ff.
//
// Solidity: function getRuleData(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_Xchain *XchainCaller) GetRuleData(opts *bind.CallOpts, transactionId [32]byte, roleId *big.Int) (IRuleEntitlementBaseRuleData, error) {
	var out []interface{}
	err := _Xchain.contract.Call(opts, &out, "getRuleData", transactionId, roleId)

	if err != nil {
		return *new(IRuleEntitlementBaseRuleData), err
	}

	out0 := *abi.ConvertType(out[0], new(IRuleEntitlementBaseRuleData)).(*IRuleEntitlementBaseRuleData)

	return out0, err

}

// GetRuleData is a free data retrieval call binding the contract method 0x92c399ff.
//
// Solidity: function getRuleData(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_Xchain *XchainSession) GetRuleData(transactionId [32]byte, roleId *big.Int) (IRuleEntitlementBaseRuleData, error) {
	return _Xchain.Contract.GetRuleData(&_Xchain.CallOpts, transactionId, roleId)
}

// GetRuleData is a free data retrieval call binding the contract method 0x92c399ff.
//
// Solidity: function getRuleData(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_Xchain *XchainCallerSession) GetRuleData(transactionId [32]byte, roleId *big.Int) (IRuleEntitlementBaseRuleData, error) {
	return _Xchain.Contract.GetRuleData(&_Xchain.CallOpts, transactionId, roleId)
}

// IsCompleted is a free data retrieval call binding the contract method 0x98ddb51b.
//
// Solidity: function isCompleted(bytes32 transactionId, uint256 requestId) view returns(bool)
func (_Xchain *XchainCaller) IsCompleted(opts *bind.CallOpts, transactionId [32]byte, requestId *big.Int) (bool, error) {
	var out []interface{}
	err := _Xchain.contract.Call(opts, &out, "isCompleted", transactionId, requestId)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsCompleted is a free data retrieval call binding the contract method 0x98ddb51b.
//
// Solidity: function isCompleted(bytes32 transactionId, uint256 requestId) view returns(bool)
func (_Xchain *XchainSession) IsCompleted(transactionId [32]byte, requestId *big.Int) (bool, error) {
	return _Xchain.Contract.IsCompleted(&_Xchain.CallOpts, transactionId, requestId)
}

// IsCompleted is a free data retrieval call binding the contract method 0x98ddb51b.
//
// Solidity: function isCompleted(bytes32 transactionId, uint256 requestId) view returns(bool)
func (_Xchain *XchainCallerSession) IsCompleted(transactionId [32]byte, requestId *big.Int) (bool, error) {
	return _Xchain.Contract.IsCompleted(&_Xchain.CallOpts, transactionId, requestId)
}

// XChainInit is a paid mutator transaction binding the contract method 0xbbbcb94b.
//
// Solidity: function __XChain_init() returns()
func (_Xchain *XchainTransactor) XChainInit(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Xchain.contract.Transact(opts, "__XChain_init")
}

// XChainInit is a paid mutator transaction binding the contract method 0xbbbcb94b.
//
// Solidity: function __XChain_init() returns()
func (_Xchain *XchainSession) XChainInit() (*types.Transaction, error) {
	return _Xchain.Contract.XChainInit(&_Xchain.TransactOpts)
}

// XChainInit is a paid mutator transaction binding the contract method 0xbbbcb94b.
//
// Solidity: function __XChain_init() returns()
func (_Xchain *XchainTransactorSession) XChainInit() (*types.Transaction, error) {
	return _Xchain.Contract.XChainInit(&_Xchain.TransactOpts)
}

// PostEntitlementCheckResult is a paid mutator transaction binding the contract method 0x4739e805.
//
// Solidity: function postEntitlementCheckResult(bytes32 transactionId, uint256 requestId, uint8 result) returns()
func (_Xchain *XchainTransactor) PostEntitlementCheckResult(opts *bind.TransactOpts, transactionId [32]byte, requestId *big.Int, result uint8) (*types.Transaction, error) {
	return _Xchain.contract.Transact(opts, "postEntitlementCheckResult", transactionId, requestId, result)
}

// PostEntitlementCheckResult is a paid mutator transaction binding the contract method 0x4739e805.
//
// Solidity: function postEntitlementCheckResult(bytes32 transactionId, uint256 requestId, uint8 result) returns()
func (_Xchain *XchainSession) PostEntitlementCheckResult(transactionId [32]byte, requestId *big.Int, result uint8) (*types.Transaction, error) {
	return _Xchain.Contract.PostEntitlementCheckResult(&_Xchain.TransactOpts, transactionId, requestId, result)
}

// PostEntitlementCheckResult is a paid mutator transaction binding the contract method 0x4739e805.
//
// Solidity: function postEntitlementCheckResult(bytes32 transactionId, uint256 requestId, uint8 result) returns()
func (_Xchain *XchainTransactorSession) PostEntitlementCheckResult(transactionId [32]byte, requestId *big.Int, result uint8) (*types.Transaction, error) {
	return _Xchain.Contract.PostEntitlementCheckResult(&_Xchain.TransactOpts, transactionId, requestId, result)
}

// XchainEntitlementCheckRequestedIterator is returned from FilterEntitlementCheckRequested and is used to iterate over the raw logs and unpacked data for EntitlementCheckRequested events raised by the Xchain contract.
type XchainEntitlementCheckRequestedIterator struct {
	Event	*XchainEntitlementCheckRequested	// Event containing the contract specifics and raw log

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
func (it *XchainEntitlementCheckRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(XchainEntitlementCheckRequested)
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
		it.Event = new(XchainEntitlementCheckRequested)
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
func (it *XchainEntitlementCheckRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *XchainEntitlementCheckRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// XchainEntitlementCheckRequested represents a EntitlementCheckRequested event raised by the Xchain contract.
type XchainEntitlementCheckRequested struct {
	CallerAddress	common.Address
	ContractAddress	common.Address
	TransactionId	[32]byte
	RoleId		*big.Int
	SelectedNodes	[]common.Address
	Raw		types.Log	// Blockchain specific contextual infos
}

// FilterEntitlementCheckRequested is a free log retrieval operation binding the contract event 0x4675e3cc15801ffde520a3076d6ad75c0c6dbe8f23bdbea1dd45b676caffe4f3.
//
// Solidity: event EntitlementCheckRequested(address callerAddress, address contractAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_Xchain *XchainFilterer) FilterEntitlementCheckRequested(opts *bind.FilterOpts) (*XchainEntitlementCheckRequestedIterator, error) {

	logs, sub, err := _Xchain.contract.FilterLogs(opts, "EntitlementCheckRequested")
	if err != nil {
		return nil, err
	}
	return &XchainEntitlementCheckRequestedIterator{contract: _Xchain.contract, event: "EntitlementCheckRequested", logs: logs, sub: sub}, nil
}

// WatchEntitlementCheckRequested is a free log subscription operation binding the contract event 0x4675e3cc15801ffde520a3076d6ad75c0c6dbe8f23bdbea1dd45b676caffe4f3.
//
// Solidity: event EntitlementCheckRequested(address callerAddress, address contractAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_Xchain *XchainFilterer) WatchEntitlementCheckRequested(opts *bind.WatchOpts, sink chan<- *XchainEntitlementCheckRequested) (event.Subscription, error) {

	logs, sub, err := _Xchain.contract.WatchLogs(opts, "EntitlementCheckRequested")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(XchainEntitlementCheckRequested)
				if err := _Xchain.contract.UnpackLog(event, "EntitlementCheckRequested", log); err != nil {
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

// ParseEntitlementCheckRequested is a log parse operation binding the contract event 0x4675e3cc15801ffde520a3076d6ad75c0c6dbe8f23bdbea1dd45b676caffe4f3.
//
// Solidity: event EntitlementCheckRequested(address callerAddress, address contractAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_Xchain *XchainFilterer) ParseEntitlementCheckRequested(log types.Log) (*XchainEntitlementCheckRequested, error) {
	event := new(XchainEntitlementCheckRequested)
	if err := _Xchain.contract.UnpackLog(event, "EntitlementCheckRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// XchainEntitlementCheckRequestedV2Iterator is returned from FilterEntitlementCheckRequestedV2 and is used to iterate over the raw logs and unpacked data for EntitlementCheckRequestedV2 events raised by the Xchain contract.
type XchainEntitlementCheckRequestedV2Iterator struct {
	Event	*XchainEntitlementCheckRequestedV2	// Event containing the contract specifics and raw log

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
func (it *XchainEntitlementCheckRequestedV2Iterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(XchainEntitlementCheckRequestedV2)
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
		it.Event = new(XchainEntitlementCheckRequestedV2)
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
func (it *XchainEntitlementCheckRequestedV2Iterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *XchainEntitlementCheckRequestedV2Iterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// XchainEntitlementCheckRequestedV2 represents a EntitlementCheckRequestedV2 event raised by the Xchain contract.
type XchainEntitlementCheckRequestedV2 struct {
	WalletAddress	common.Address
	SpaceAddress	common.Address
	ResolverAddress	common.Address
	TransactionId	[32]byte
	RoleId		*big.Int
	SelectedNodes	[]common.Address
	Raw		types.Log	// Blockchain specific contextual infos
}

// FilterEntitlementCheckRequestedV2 is a free log retrieval operation binding the contract event 0xf116223a7f59f1061fd42fcd9ff757b06a05709a822d38873fbbc5b5fda148bf.
//
// Solidity: event EntitlementCheckRequestedV2(address walletAddress, address spaceAddress, address resolverAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_Xchain *XchainFilterer) FilterEntitlementCheckRequestedV2(opts *bind.FilterOpts) (*XchainEntitlementCheckRequestedV2Iterator, error) {

	logs, sub, err := _Xchain.contract.FilterLogs(opts, "EntitlementCheckRequestedV2")
	if err != nil {
		return nil, err
	}
	return &XchainEntitlementCheckRequestedV2Iterator{contract: _Xchain.contract, event: "EntitlementCheckRequestedV2", logs: logs, sub: sub}, nil
}

// WatchEntitlementCheckRequestedV2 is a free log subscription operation binding the contract event 0xf116223a7f59f1061fd42fcd9ff757b06a05709a822d38873fbbc5b5fda148bf.
//
// Solidity: event EntitlementCheckRequestedV2(address walletAddress, address spaceAddress, address resolverAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_Xchain *XchainFilterer) WatchEntitlementCheckRequestedV2(opts *bind.WatchOpts, sink chan<- *XchainEntitlementCheckRequestedV2) (event.Subscription, error) {

	logs, sub, err := _Xchain.contract.WatchLogs(opts, "EntitlementCheckRequestedV2")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(XchainEntitlementCheckRequestedV2)
				if err := _Xchain.contract.UnpackLog(event, "EntitlementCheckRequestedV2", log); err != nil {
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

// ParseEntitlementCheckRequestedV2 is a log parse operation binding the contract event 0xf116223a7f59f1061fd42fcd9ff757b06a05709a822d38873fbbc5b5fda148bf.
//
// Solidity: event EntitlementCheckRequestedV2(address walletAddress, address spaceAddress, address resolverAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_Xchain *XchainFilterer) ParseEntitlementCheckRequestedV2(log types.Log) (*XchainEntitlementCheckRequestedV2, error) {
	event := new(XchainEntitlementCheckRequestedV2)
	if err := _Xchain.contract.UnpackLog(event, "EntitlementCheckRequestedV2", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// XchainEntitlementCheckResultPostedIterator is returned from FilterEntitlementCheckResultPosted and is used to iterate over the raw logs and unpacked data for EntitlementCheckResultPosted events raised by the Xchain contract.
type XchainEntitlementCheckResultPostedIterator struct {
	Event	*XchainEntitlementCheckResultPosted	// Event containing the contract specifics and raw log

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
func (it *XchainEntitlementCheckResultPostedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(XchainEntitlementCheckResultPosted)
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
		it.Event = new(XchainEntitlementCheckResultPosted)
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
func (it *XchainEntitlementCheckResultPostedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *XchainEntitlementCheckResultPostedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// XchainEntitlementCheckResultPosted represents a EntitlementCheckResultPosted event raised by the Xchain contract.
type XchainEntitlementCheckResultPosted struct {
	TransactionId	[32]byte
	Result		uint8
	Raw		types.Log	// Blockchain specific contextual infos
}

// FilterEntitlementCheckResultPosted is a free log retrieval operation binding the contract event 0xb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c633.
//
// Solidity: event EntitlementCheckResultPosted(bytes32 indexed transactionId, uint8 result)
func (_Xchain *XchainFilterer) FilterEntitlementCheckResultPosted(opts *bind.FilterOpts, transactionId [][32]byte) (*XchainEntitlementCheckResultPostedIterator, error) {

	var transactionIdRule []interface{}
	for _, transactionIdItem := range transactionId {
		transactionIdRule = append(transactionIdRule, transactionIdItem)
	}

	logs, sub, err := _Xchain.contract.FilterLogs(opts, "EntitlementCheckResultPosted", transactionIdRule)
	if err != nil {
		return nil, err
	}
	return &XchainEntitlementCheckResultPostedIterator{contract: _Xchain.contract, event: "EntitlementCheckResultPosted", logs: logs, sub: sub}, nil
}

// WatchEntitlementCheckResultPosted is a free log subscription operation binding the contract event 0xb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c633.
//
// Solidity: event EntitlementCheckResultPosted(bytes32 indexed transactionId, uint8 result)
func (_Xchain *XchainFilterer) WatchEntitlementCheckResultPosted(opts *bind.WatchOpts, sink chan<- *XchainEntitlementCheckResultPosted, transactionId [][32]byte) (event.Subscription, error) {

	var transactionIdRule []interface{}
	for _, transactionIdItem := range transactionId {
		transactionIdRule = append(transactionIdRule, transactionIdItem)
	}

	logs, sub, err := _Xchain.contract.WatchLogs(opts, "EntitlementCheckResultPosted", transactionIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(XchainEntitlementCheckResultPosted)
				if err := _Xchain.contract.UnpackLog(event, "EntitlementCheckResultPosted", log); err != nil {
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
func (_Xchain *XchainFilterer) ParseEntitlementCheckResultPosted(log types.Log) (*XchainEntitlementCheckResultPosted, error) {
	event := new(XchainEntitlementCheckResultPosted)
	if err := _Xchain.contract.UnpackLog(event, "EntitlementCheckResultPosted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// XchainInitializedIterator is returned from FilterInitialized and is used to iterate over the raw logs and unpacked data for Initialized events raised by the Xchain contract.
type XchainInitializedIterator struct {
	Event	*XchainInitialized	// Event containing the contract specifics and raw log

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
func (it *XchainInitializedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(XchainInitialized)
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
		it.Event = new(XchainInitialized)
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
func (it *XchainInitializedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *XchainInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// XchainInitialized represents a Initialized event raised by the Xchain contract.
type XchainInitialized struct {
	Version	uint32
	Raw	types.Log	// Blockchain specific contextual infos
}

// FilterInitialized is a free log retrieval operation binding the contract event 0xe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c.
//
// Solidity: event Initialized(uint32 version)
func (_Xchain *XchainFilterer) FilterInitialized(opts *bind.FilterOpts) (*XchainInitializedIterator, error) {

	logs, sub, err := _Xchain.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &XchainInitializedIterator{contract: _Xchain.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

// WatchInitialized is a free log subscription operation binding the contract event 0xe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c.
//
// Solidity: event Initialized(uint32 version)
func (_Xchain *XchainFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *XchainInitialized) (event.Subscription, error) {

	logs, sub, err := _Xchain.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(XchainInitialized)
				if err := _Xchain.contract.UnpackLog(event, "Initialized", log); err != nil {
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

// ParseInitialized is a log parse operation binding the contract event 0xe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c.
//
// Solidity: event Initialized(uint32 version)
func (_Xchain *XchainFilterer) ParseInitialized(log types.Log) (*XchainInitialized, error) {
	event := new(XchainInitialized)
	if err := _Xchain.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// XchainInterfaceAddedIterator is returned from FilterInterfaceAdded and is used to iterate over the raw logs and unpacked data for InterfaceAdded events raised by the Xchain contract.
type XchainInterfaceAddedIterator struct {
	Event	*XchainInterfaceAdded	// Event containing the contract specifics and raw log

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
func (it *XchainInterfaceAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(XchainInterfaceAdded)
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
		it.Event = new(XchainInterfaceAdded)
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
func (it *XchainInterfaceAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *XchainInterfaceAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// XchainInterfaceAdded represents a InterfaceAdded event raised by the Xchain contract.
type XchainInterfaceAdded struct {
	InterfaceId	[4]byte
	Raw		types.Log	// Blockchain specific contextual infos
}

// FilterInterfaceAdded is a free log retrieval operation binding the contract event 0x78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f22.
//
// Solidity: event InterfaceAdded(bytes4 indexed interfaceId)
func (_Xchain *XchainFilterer) FilterInterfaceAdded(opts *bind.FilterOpts, interfaceId [][4]byte) (*XchainInterfaceAddedIterator, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _Xchain.contract.FilterLogs(opts, "InterfaceAdded", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return &XchainInterfaceAddedIterator{contract: _Xchain.contract, event: "InterfaceAdded", logs: logs, sub: sub}, nil
}

// WatchInterfaceAdded is a free log subscription operation binding the contract event 0x78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f22.
//
// Solidity: event InterfaceAdded(bytes4 indexed interfaceId)
func (_Xchain *XchainFilterer) WatchInterfaceAdded(opts *bind.WatchOpts, sink chan<- *XchainInterfaceAdded, interfaceId [][4]byte) (event.Subscription, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _Xchain.contract.WatchLogs(opts, "InterfaceAdded", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(XchainInterfaceAdded)
				if err := _Xchain.contract.UnpackLog(event, "InterfaceAdded", log); err != nil {
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

// ParseInterfaceAdded is a log parse operation binding the contract event 0x78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f22.
//
// Solidity: event InterfaceAdded(bytes4 indexed interfaceId)
func (_Xchain *XchainFilterer) ParseInterfaceAdded(log types.Log) (*XchainInterfaceAdded, error) {
	event := new(XchainInterfaceAdded)
	if err := _Xchain.contract.UnpackLog(event, "InterfaceAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// XchainInterfaceRemovedIterator is returned from FilterInterfaceRemoved and is used to iterate over the raw logs and unpacked data for InterfaceRemoved events raised by the Xchain contract.
type XchainInterfaceRemovedIterator struct {
	Event	*XchainInterfaceRemoved	// Event containing the contract specifics and raw log

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
func (it *XchainInterfaceRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(XchainInterfaceRemoved)
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
		it.Event = new(XchainInterfaceRemoved)
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
func (it *XchainInterfaceRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *XchainInterfaceRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// XchainInterfaceRemoved represents a InterfaceRemoved event raised by the Xchain contract.
type XchainInterfaceRemoved struct {
	InterfaceId	[4]byte
	Raw		types.Log	// Blockchain specific contextual infos
}

// FilterInterfaceRemoved is a free log retrieval operation binding the contract event 0x8bd383568d0bc57b64b8e424138fc19ae827e694e05757faa8fea8f63fb87315.
//
// Solidity: event InterfaceRemoved(bytes4 indexed interfaceId)
func (_Xchain *XchainFilterer) FilterInterfaceRemoved(opts *bind.FilterOpts, interfaceId [][4]byte) (*XchainInterfaceRemovedIterator, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _Xchain.contract.FilterLogs(opts, "InterfaceRemoved", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return &XchainInterfaceRemovedIterator{contract: _Xchain.contract, event: "InterfaceRemoved", logs: logs, sub: sub}, nil
}

// WatchInterfaceRemoved is a free log subscription operation binding the contract event 0x8bd383568d0bc57b64b8e424138fc19ae827e694e05757faa8fea8f63fb87315.
//
// Solidity: event InterfaceRemoved(bytes4 indexed interfaceId)
func (_Xchain *XchainFilterer) WatchInterfaceRemoved(opts *bind.WatchOpts, sink chan<- *XchainInterfaceRemoved, interfaceId [][4]byte) (event.Subscription, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _Xchain.contract.WatchLogs(opts, "InterfaceRemoved", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(XchainInterfaceRemoved)
				if err := _Xchain.contract.UnpackLog(event, "InterfaceRemoved", log); err != nil {
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

// ParseInterfaceRemoved is a log parse operation binding the contract event 0x8bd383568d0bc57b64b8e424138fc19ae827e694e05757faa8fea8f63fb87315.
//
// Solidity: event InterfaceRemoved(bytes4 indexed interfaceId)
func (_Xchain *XchainFilterer) ParseInterfaceRemoved(log types.Log) (*XchainInterfaceRemoved, error) {
	event := new(XchainInterfaceRemoved)
	if err := _Xchain.contract.UnpackLog(event, "InterfaceRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// XchainNodeRegisteredIterator is returned from FilterNodeRegistered and is used to iterate over the raw logs and unpacked data for NodeRegistered events raised by the Xchain contract.
type XchainNodeRegisteredIterator struct {
	Event	*XchainNodeRegistered	// Event containing the contract specifics and raw log

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
func (it *XchainNodeRegisteredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(XchainNodeRegistered)
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
		it.Event = new(XchainNodeRegistered)
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
func (it *XchainNodeRegisteredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *XchainNodeRegisteredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// XchainNodeRegistered represents a NodeRegistered event raised by the Xchain contract.
type XchainNodeRegistered struct {
	NodeAddress	common.Address
	Raw		types.Log	// Blockchain specific contextual infos
}

// FilterNodeRegistered is a free log retrieval operation binding the contract event 0x564728e6a7c8edd446557d94e0339d5e6ca2e05f42188914efdbdc87bcbbabf6.
//
// Solidity: event NodeRegistered(address indexed nodeAddress)
func (_Xchain *XchainFilterer) FilterNodeRegistered(opts *bind.FilterOpts, nodeAddress []common.Address) (*XchainNodeRegisteredIterator, error) {

	var nodeAddressRule []interface{}
	for _, nodeAddressItem := range nodeAddress {
		nodeAddressRule = append(nodeAddressRule, nodeAddressItem)
	}

	logs, sub, err := _Xchain.contract.FilterLogs(opts, "NodeRegistered", nodeAddressRule)
	if err != nil {
		return nil, err
	}
	return &XchainNodeRegisteredIterator{contract: _Xchain.contract, event: "NodeRegistered", logs: logs, sub: sub}, nil
}

// WatchNodeRegistered is a free log subscription operation binding the contract event 0x564728e6a7c8edd446557d94e0339d5e6ca2e05f42188914efdbdc87bcbbabf6.
//
// Solidity: event NodeRegistered(address indexed nodeAddress)
func (_Xchain *XchainFilterer) WatchNodeRegistered(opts *bind.WatchOpts, sink chan<- *XchainNodeRegistered, nodeAddress []common.Address) (event.Subscription, error) {

	var nodeAddressRule []interface{}
	for _, nodeAddressItem := range nodeAddress {
		nodeAddressRule = append(nodeAddressRule, nodeAddressItem)
	}

	logs, sub, err := _Xchain.contract.WatchLogs(opts, "NodeRegistered", nodeAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(XchainNodeRegistered)
				if err := _Xchain.contract.UnpackLog(event, "NodeRegistered", log); err != nil {
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

// ParseNodeRegistered is a log parse operation binding the contract event 0x564728e6a7c8edd446557d94e0339d5e6ca2e05f42188914efdbdc87bcbbabf6.
//
// Solidity: event NodeRegistered(address indexed nodeAddress)
func (_Xchain *XchainFilterer) ParseNodeRegistered(log types.Log) (*XchainNodeRegistered, error) {
	event := new(XchainNodeRegistered)
	if err := _Xchain.contract.UnpackLog(event, "NodeRegistered", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// XchainNodeUnregisteredIterator is returned from FilterNodeUnregistered and is used to iterate over the raw logs and unpacked data for NodeUnregistered events raised by the Xchain contract.
type XchainNodeUnregisteredIterator struct {
	Event	*XchainNodeUnregistered	// Event containing the contract specifics and raw log

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
func (it *XchainNodeUnregisteredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(XchainNodeUnregistered)
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
		it.Event = new(XchainNodeUnregistered)
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
func (it *XchainNodeUnregisteredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *XchainNodeUnregisteredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// XchainNodeUnregistered represents a NodeUnregistered event raised by the Xchain contract.
type XchainNodeUnregistered struct {
	NodeAddress	common.Address
	Raw		types.Log	// Blockchain specific contextual infos
}

// FilterNodeUnregistered is a free log retrieval operation binding the contract event 0xb1864577e4f285436a80ebc833984755393e2450d58622a65fb4fce87ea3573a.
//
// Solidity: event NodeUnregistered(address indexed nodeAddress)
func (_Xchain *XchainFilterer) FilterNodeUnregistered(opts *bind.FilterOpts, nodeAddress []common.Address) (*XchainNodeUnregisteredIterator, error) {

	var nodeAddressRule []interface{}
	for _, nodeAddressItem := range nodeAddress {
		nodeAddressRule = append(nodeAddressRule, nodeAddressItem)
	}

	logs, sub, err := _Xchain.contract.FilterLogs(opts, "NodeUnregistered", nodeAddressRule)
	if err != nil {
		return nil, err
	}
	return &XchainNodeUnregisteredIterator{contract: _Xchain.contract, event: "NodeUnregistered", logs: logs, sub: sub}, nil
}

// WatchNodeUnregistered is a free log subscription operation binding the contract event 0xb1864577e4f285436a80ebc833984755393e2450d58622a65fb4fce87ea3573a.
//
// Solidity: event NodeUnregistered(address indexed nodeAddress)
func (_Xchain *XchainFilterer) WatchNodeUnregistered(opts *bind.WatchOpts, sink chan<- *XchainNodeUnregistered, nodeAddress []common.Address) (event.Subscription, error) {

	var nodeAddressRule []interface{}
	for _, nodeAddressItem := range nodeAddress {
		nodeAddressRule = append(nodeAddressRule, nodeAddressItem)
	}

	logs, sub, err := _Xchain.contract.WatchLogs(opts, "NodeUnregistered", nodeAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(XchainNodeUnregistered)
				if err := _Xchain.contract.UnpackLog(event, "NodeUnregistered", log); err != nil {
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

// ParseNodeUnregistered is a log parse operation binding the contract event 0xb1864577e4f285436a80ebc833984755393e2450d58622a65fb4fce87ea3573a.
//
// Solidity: event NodeUnregistered(address indexed nodeAddress)
func (_Xchain *XchainFilterer) ParseNodeUnregistered(log types.Log) (*XchainNodeUnregistered, error) {
	event := new(XchainNodeUnregistered)
	if err := _Xchain.contract.UnpackLog(event, "NodeUnregistered", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
