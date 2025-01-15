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

// EntitlementCheckerMetaData contains all meta data concerning the EntitlementChecker contract.
var EntitlementCheckerMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"function\",\"name\":\"__EntitlementChecker_init\",\"inputs\":[],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getNodeAtIndex\",\"inputs\":[{\"name\":\"index\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getNodeCount\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getNodesByOperator\",\"inputs\":[{\"name\":\"operator\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"nodes\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRandomNodes\",\"inputs\":[{\"name\":\"count\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"isValidNode\",\"inputs\":[{\"name\":\"node\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"registerNode\",\"inputs\":[{\"name\":\"node\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"requestEntitlementCheck\",\"inputs\":[{\"name\":\"walletAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"nodes\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"requestEntitlementCheckV2\",\"inputs\":[{\"name\":\"walletAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"requestId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[],\"stateMutability\":\"payable\"},{\"type\":\"function\",\"name\":\"unregisterNode\",\"inputs\":[{\"name\":\"node\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"EntitlementCheckRequested\",\"inputs\":[{\"name\":\"callerAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"transactionId\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"selectedNodes\",\"type\":\"address[]\",\"indexed\":false,\"internalType\":\"address[]\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"EntitlementCheckRequestedV2\",\"inputs\":[{\"name\":\"walletAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"spaceAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"resolverAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"transactionId\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"selectedNodes\",\"type\":\"address[]\",\"indexed\":false,\"internalType\":\"address[]\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Initialized\",\"inputs\":[{\"name\":\"version\",\"type\":\"uint32\",\"indexed\":false,\"internalType\":\"uint32\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceAdded\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceRemoved\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"NodeRegistered\",\"inputs\":[{\"name\":\"nodeAddress\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"NodeUnregistered\",\"inputs\":[{\"name\":\"nodeAddress\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"EntitlementChecker_InsufficientNumberOfNodes\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_InvalidNodeOperator\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_InvalidOperator\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_NodeAlreadyRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_NodeNotRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementChecker_OperatorNotActive\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_InInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_NotInInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_AlreadySupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_NotSupported\",\"inputs\":[]}]",
	Bin: "0x608060405234801561001057600080fd5b5061001961001e565b6100c4565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff161561006a576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156100c157805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b610f86806100d36000396000f3fe6080604052600436106100915760003560e01c8063541da4e511610059578063541da4e51461015a578063672d7a0d1461017a57806374b626821461019a5780639ebd11ef146101ad578063c5e41cf6146101dd57600080fd5b806339bf397e1461009657806339dc5b3e146100be5780633c59f126146100d557806343024ac91461010d5780634f8454451461013a575b600080fd5b3480156100a257600080fd5b506100ab6101fd565b6040519081526020015b60405180910390f35b3480156100ca57600080fd5b506100d361021d565b005b3480156100e157600080fd5b506100f56100f0366004610c73565b610279565b6040516001600160a01b0390911681526020016100b5565b34801561011957600080fd5b5061012d610128366004610ca8565b6102ec565b6040516100b59190610d08565b34801561014657600080fd5b5061012d610155366004610c73565b6103de565b34801561016657600080fd5b506100d3610175366004610d31565b6103ef565b34801561018657600080fd5b506100d3610195366004610ca8565b610434565b6100d36101a8366004610e1a565b610559565b3480156101b957600080fd5b506101cd6101c8366004610ca8565b610699565b60405190151581526020016100b5565b3480156101e957600080fd5b506100d36101f8366004610ca8565b6106b4565b6000600080516020610f66833981519152610217816107b7565b91505090565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff1661026757604051630ef4733760e31b815260040160405180910390fd5b6102776315bf23a760e01b6107c1565b565b6000600080516020610f66833981519152610293816107b7565b83106102db5760405162461bcd60e51b8152602060048201526013602482015272496e646578206f7574206f6620626f756e647360681b604482015260640160405180910390fd5b6102e5818461089a565b9392505050565b6060600080516020610f668339815191526000610308826107b7565b90508067ffffffffffffffff81111561032357610323610d1b565b60405190808252806020026020018201604052801561034c578160200160208202803683370190505b5092506000805b828110156103d3576000610367858361089a565b6001600160a01b0380821660009081526002880160205260409020549192508089169116036103ca57808684806001019550815181106103a9576103a9610e4d565b60200260200101906001600160a01b031690816001600160a01b0316815250505b50600101610353565b508352509092915050565b60606103e9826108a6565b92915050565b7f4675e3cc15801ffde520a3076d6ad75c0c6dbe8f23bdbea1dd45b676caffe4f38433858585604051610426959493929190610e63565b60405180910390a150505050565b7f988e8266be98e92aff755bdd688f8f4a2421e26daa6089c7e2668053a3bf550061045f8133610a71565b61047c5760405163c931a1fb60e01b815260040160405180910390fd5b600080516020610f668339815191526104958184610a71565b156104b35760405163d1922fc160e01b815260040160405180910390fd5b6104bd8184610a93565b506001600160a01b038316600081815260028301602052604080822080546001600160a01b03191633179055517f564728e6a7c8edd446557d94e0339d5e6ca2e05f42188914efdbdc87bcbbabf69190a250600233600090815260028301602052604090205460ff16600381111561053757610537610ea8565b1461055557604051637164de9160e01b815260040160405180910390fd5b5050565b6040805180820182523380825234602080840191825260008781527ff501c51c066c21fd640901535874a71171bb35113f6dc2832fce1b1f9da0cc01909152938420925183546001600160a01b0319166001600160a01b0390911617835551600190920191909155906105cc60056108a6565b60008581527ff501c51c066c21fd640901535874a71171bb35113f6dc2832fce1b1f9da0cc02602052604081209192505b825181101561064f5761064683828151811061061b5761061b610e4d565b6020026020010151836001016000888152602001908152602001600020610a9390919063ffffffff16565b506001016105fd565b507ff116223a7f59f1061fd42fcd9ff757b06a05709a822d38873fbbc5b5fda148bf86843088888760405161068996959493929190610ebe565b60405180910390a1505050505050565b6000600080516020610f668339815191526102e58184610a71565b6001600160a01b0380821660009081527f180c1d0b9e5eeea9f2f078bc2712cd77acc6afea03b37705abe96dda6f602602602052604090205482913391600080516020610f66833981519152911682146107215760405163fd2dc62f60e01b815260040160405180910390fd5b600080516020610f6683398151915261073a8186610a71565b610757576040516317e3e0b960e01b815260040160405180910390fd5b6107618186610aa8565b506001600160a01b038516600081815260028301602052604080822080546001600160a01b0319169055517fb1864577e4f285436a80ebc833984755393e2450d58622a65fb4fce87ea3573a9190a25050505050565b60006103e9825490565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff16610849576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff19166001179055610862565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b60006102e58383610abd565b6060600080516020610f6683398151915260006108c2826107b7565b9050808411156108e557604051631762997d60e01b815260040160405180910390fd5b60008467ffffffffffffffff81111561090057610900610d1b565b604051908082528060200260200182016040528015610929578160200160208202803683370190505b50905060008267ffffffffffffffff81111561094757610947610d1b565b604051908082528060200260200182016040528015610970578160200160208202803683370190505b50905060005b838110156109a4578082828151811061099157610991610e4d565b6020908102919091010152600101610976565b5060005b86811015610a665760006109bc8286610ae7565b90506109ed8382815181106109d3576109d3610e4d565b60200260200101518760000161089a90919063ffffffff16565b8483815181106109ff576109ff610e4d565b60200260200101906001600160a01b031690816001600160a01b03168152505082856001900395508581518110610a3857610a38610e4d565b6020026020010151838281518110610a5257610a52610e4d565b6020908102919091010152506001016109a8565b509095945050505050565b6001600160a01b038116600090815260018301602052604081205415156102e5565b60006102e5836001600160a01b038416610b31565b60006102e5836001600160a01b038416610b80565b6000826000018281548110610ad457610ad4610e4d565b9060005260206000200154905092915050565b60408051446020820152429181019190915260608101839052336080820152600090829060a0016040516020818303038152906040528051906020012060001c6102e59190610f0c565b6000818152600183016020526040812054610b78575081546001818101845560008481526020808220909301849055845484825282860190935260409020919091556103e9565b5060006103e9565b60008181526001830160205260408120548015610c69576000610ba4600183610f2e565b8554909150600090610bb890600190610f2e565b9050808214610c1d576000866000018281548110610bd857610bd8610e4d565b9060005260206000200154905080876000018481548110610bfb57610bfb610e4d565b6000918252602080832090910192909255918252600188019052604090208390555b8554869080610c2e57610c2e610f4f565b6001900381819060005260206000200160009055905585600101600086815260200190815260200160002060009055600193505050506103e9565b60009150506103e9565b600060208284031215610c8557600080fd5b5035919050565b80356001600160a01b0381168114610ca357600080fd5b919050565b600060208284031215610cba57600080fd5b6102e582610c8c565b60008151808452602080850194506020840160005b83811015610cfd5781516001600160a01b031687529582019590820190600101610cd8565b509495945050505050565b6020815260006102e56020830184610cc3565b634e487b7160e01b600052604160045260246000fd5b60008060008060808587031215610d4757600080fd5b610d5085610c8c565b9350602080860135935060408601359250606086013567ffffffffffffffff80821115610d7c57600080fd5b818801915088601f830112610d9057600080fd5b813581811115610da257610da2610d1b565b8060051b604051601f19603f83011681018181108582111715610dc757610dc7610d1b565b60405291825284820192508381018501918b831115610de557600080fd5b938501935b82851015610e0a57610dfb85610c8c565b84529385019392850192610dea565b989b979a50959850505050505050565b600080600060608486031215610e2f57600080fd5b610e3884610c8c565b95602085013595506040909401359392505050565b634e487b7160e01b600052603260045260246000fd5b6001600160a01b03868116825285166020820152604081018490526060810183905260a060808201819052600090610e9d90830184610cc3565b979650505050505050565b634e487b7160e01b600052602160045260246000fd5b6001600160a01b038781168252868116602083015285166040820152606081018490526080810183905260c060a08201819052600090610f0090830184610cc3565b98975050505050505050565b600082610f2957634e487b7160e01b600052601260045260246000fd5b500690565b818103818111156103e957634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052603160045260246000fdfe180c1d0b9e5eeea9f2f078bc2712cd77acc6afea03b37705abe96dda6f602600",
}

// EntitlementCheckerABI is the input ABI used to generate the binding from.
// Deprecated: Use EntitlementCheckerMetaData.ABI instead.
var EntitlementCheckerABI = EntitlementCheckerMetaData.ABI

// EntitlementCheckerBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use EntitlementCheckerMetaData.Bin instead.
var EntitlementCheckerBin = EntitlementCheckerMetaData.Bin

// DeployEntitlementChecker deploys a new Ethereum contract, binding an instance of EntitlementChecker to it.
func DeployEntitlementChecker(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *EntitlementChecker, error) {
	parsed, err := EntitlementCheckerMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(EntitlementCheckerBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &EntitlementChecker{EntitlementCheckerCaller: EntitlementCheckerCaller{contract: contract}, EntitlementCheckerTransactor: EntitlementCheckerTransactor{contract: contract}, EntitlementCheckerFilterer: EntitlementCheckerFilterer{contract: contract}}, nil
}

// EntitlementChecker is an auto generated Go binding around an Ethereum contract.
type EntitlementChecker struct {
	EntitlementCheckerCaller     // Read-only binding to the contract
	EntitlementCheckerTransactor // Write-only binding to the contract
	EntitlementCheckerFilterer   // Log filterer for contract events
}

// EntitlementCheckerCaller is an auto generated read-only Go binding around an Ethereum contract.
type EntitlementCheckerCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EntitlementCheckerTransactor is an auto generated write-only Go binding around an Ethereum contract.
type EntitlementCheckerTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EntitlementCheckerFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type EntitlementCheckerFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EntitlementCheckerSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type EntitlementCheckerSession struct {
	Contract     *EntitlementChecker // Generic contract binding to set the session for
	CallOpts     bind.CallOpts       // Call options to use throughout this session
	TransactOpts bind.TransactOpts   // Transaction auth options to use throughout this session
}

// EntitlementCheckerCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type EntitlementCheckerCallerSession struct {
	Contract *EntitlementCheckerCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts             // Call options to use throughout this session
}

// EntitlementCheckerTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type EntitlementCheckerTransactorSession struct {
	Contract     *EntitlementCheckerTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts             // Transaction auth options to use throughout this session
}

// EntitlementCheckerRaw is an auto generated low-level Go binding around an Ethereum contract.
type EntitlementCheckerRaw struct {
	Contract *EntitlementChecker // Generic contract binding to access the raw methods on
}

// EntitlementCheckerCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type EntitlementCheckerCallerRaw struct {
	Contract *EntitlementCheckerCaller // Generic read-only contract binding to access the raw methods on
}

// EntitlementCheckerTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type EntitlementCheckerTransactorRaw struct {
	Contract *EntitlementCheckerTransactor // Generic write-only contract binding to access the raw methods on
}

// NewEntitlementChecker creates a new instance of EntitlementChecker, bound to a specific deployed contract.
func NewEntitlementChecker(address common.Address, backend bind.ContractBackend) (*EntitlementChecker, error) {
	contract, err := bindEntitlementChecker(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &EntitlementChecker{EntitlementCheckerCaller: EntitlementCheckerCaller{contract: contract}, EntitlementCheckerTransactor: EntitlementCheckerTransactor{contract: contract}, EntitlementCheckerFilterer: EntitlementCheckerFilterer{contract: contract}}, nil
}

// NewEntitlementCheckerCaller creates a new read-only instance of EntitlementChecker, bound to a specific deployed contract.
func NewEntitlementCheckerCaller(address common.Address, caller bind.ContractCaller) (*EntitlementCheckerCaller, error) {
	contract, err := bindEntitlementChecker(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerCaller{contract: contract}, nil
}

// NewEntitlementCheckerTransactor creates a new write-only instance of EntitlementChecker, bound to a specific deployed contract.
func NewEntitlementCheckerTransactor(address common.Address, transactor bind.ContractTransactor) (*EntitlementCheckerTransactor, error) {
	contract, err := bindEntitlementChecker(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerTransactor{contract: contract}, nil
}

// NewEntitlementCheckerFilterer creates a new log filterer instance of EntitlementChecker, bound to a specific deployed contract.
func NewEntitlementCheckerFilterer(address common.Address, filterer bind.ContractFilterer) (*EntitlementCheckerFilterer, error) {
	contract, err := bindEntitlementChecker(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerFilterer{contract: contract}, nil
}

// bindEntitlementChecker binds a generic wrapper to an already deployed contract.
func bindEntitlementChecker(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := EntitlementCheckerMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_EntitlementChecker *EntitlementCheckerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _EntitlementChecker.Contract.EntitlementCheckerCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_EntitlementChecker *EntitlementCheckerRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.EntitlementCheckerTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_EntitlementChecker *EntitlementCheckerRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.EntitlementCheckerTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_EntitlementChecker *EntitlementCheckerCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _EntitlementChecker.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_EntitlementChecker *EntitlementCheckerTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_EntitlementChecker *EntitlementCheckerTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.contract.Transact(opts, method, params...)
}

// GetNodeAtIndex is a free data retrieval call binding the contract method 0x3c59f126.
//
// Solidity: function getNodeAtIndex(uint256 index) view returns(address)
func (_EntitlementChecker *EntitlementCheckerCaller) GetNodeAtIndex(opts *bind.CallOpts, index *big.Int) (common.Address, error) {
	var out []interface{}
	err := _EntitlementChecker.contract.Call(opts, &out, "getNodeAtIndex", index)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetNodeAtIndex is a free data retrieval call binding the contract method 0x3c59f126.
//
// Solidity: function getNodeAtIndex(uint256 index) view returns(address)
func (_EntitlementChecker *EntitlementCheckerSession) GetNodeAtIndex(index *big.Int) (common.Address, error) {
	return _EntitlementChecker.Contract.GetNodeAtIndex(&_EntitlementChecker.CallOpts, index)
}

// GetNodeAtIndex is a free data retrieval call binding the contract method 0x3c59f126.
//
// Solidity: function getNodeAtIndex(uint256 index) view returns(address)
func (_EntitlementChecker *EntitlementCheckerCallerSession) GetNodeAtIndex(index *big.Int) (common.Address, error) {
	return _EntitlementChecker.Contract.GetNodeAtIndex(&_EntitlementChecker.CallOpts, index)
}

// GetNodeCount is a free data retrieval call binding the contract method 0x39bf397e.
//
// Solidity: function getNodeCount() view returns(uint256)
func (_EntitlementChecker *EntitlementCheckerCaller) GetNodeCount(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _EntitlementChecker.contract.Call(opts, &out, "getNodeCount")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetNodeCount is a free data retrieval call binding the contract method 0x39bf397e.
//
// Solidity: function getNodeCount() view returns(uint256)
func (_EntitlementChecker *EntitlementCheckerSession) GetNodeCount() (*big.Int, error) {
	return _EntitlementChecker.Contract.GetNodeCount(&_EntitlementChecker.CallOpts)
}

// GetNodeCount is a free data retrieval call binding the contract method 0x39bf397e.
//
// Solidity: function getNodeCount() view returns(uint256)
func (_EntitlementChecker *EntitlementCheckerCallerSession) GetNodeCount() (*big.Int, error) {
	return _EntitlementChecker.Contract.GetNodeCount(&_EntitlementChecker.CallOpts)
}

// GetNodesByOperator is a free data retrieval call binding the contract method 0x43024ac9.
//
// Solidity: function getNodesByOperator(address operator) view returns(address[] nodes)
func (_EntitlementChecker *EntitlementCheckerCaller) GetNodesByOperator(opts *bind.CallOpts, operator common.Address) ([]common.Address, error) {
	var out []interface{}
	err := _EntitlementChecker.contract.Call(opts, &out, "getNodesByOperator", operator)

	if err != nil {
		return *new([]common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)

	return out0, err

}

// GetNodesByOperator is a free data retrieval call binding the contract method 0x43024ac9.
//
// Solidity: function getNodesByOperator(address operator) view returns(address[] nodes)
func (_EntitlementChecker *EntitlementCheckerSession) GetNodesByOperator(operator common.Address) ([]common.Address, error) {
	return _EntitlementChecker.Contract.GetNodesByOperator(&_EntitlementChecker.CallOpts, operator)
}

// GetNodesByOperator is a free data retrieval call binding the contract method 0x43024ac9.
//
// Solidity: function getNodesByOperator(address operator) view returns(address[] nodes)
func (_EntitlementChecker *EntitlementCheckerCallerSession) GetNodesByOperator(operator common.Address) ([]common.Address, error) {
	return _EntitlementChecker.Contract.GetNodesByOperator(&_EntitlementChecker.CallOpts, operator)
}

// GetRandomNodes is a free data retrieval call binding the contract method 0x4f845445.
//
// Solidity: function getRandomNodes(uint256 count) view returns(address[])
func (_EntitlementChecker *EntitlementCheckerCaller) GetRandomNodes(opts *bind.CallOpts, count *big.Int) ([]common.Address, error) {
	var out []interface{}
	err := _EntitlementChecker.contract.Call(opts, &out, "getRandomNodes", count)

	if err != nil {
		return *new([]common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)

	return out0, err

}

// GetRandomNodes is a free data retrieval call binding the contract method 0x4f845445.
//
// Solidity: function getRandomNodes(uint256 count) view returns(address[])
func (_EntitlementChecker *EntitlementCheckerSession) GetRandomNodes(count *big.Int) ([]common.Address, error) {
	return _EntitlementChecker.Contract.GetRandomNodes(&_EntitlementChecker.CallOpts, count)
}

// GetRandomNodes is a free data retrieval call binding the contract method 0x4f845445.
//
// Solidity: function getRandomNodes(uint256 count) view returns(address[])
func (_EntitlementChecker *EntitlementCheckerCallerSession) GetRandomNodes(count *big.Int) ([]common.Address, error) {
	return _EntitlementChecker.Contract.GetRandomNodes(&_EntitlementChecker.CallOpts, count)
}

// IsValidNode is a free data retrieval call binding the contract method 0x9ebd11ef.
//
// Solidity: function isValidNode(address node) view returns(bool)
func (_EntitlementChecker *EntitlementCheckerCaller) IsValidNode(opts *bind.CallOpts, node common.Address) (bool, error) {
	var out []interface{}
	err := _EntitlementChecker.contract.Call(opts, &out, "isValidNode", node)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsValidNode is a free data retrieval call binding the contract method 0x9ebd11ef.
//
// Solidity: function isValidNode(address node) view returns(bool)
func (_EntitlementChecker *EntitlementCheckerSession) IsValidNode(node common.Address) (bool, error) {
	return _EntitlementChecker.Contract.IsValidNode(&_EntitlementChecker.CallOpts, node)
}

// IsValidNode is a free data retrieval call binding the contract method 0x9ebd11ef.
//
// Solidity: function isValidNode(address node) view returns(bool)
func (_EntitlementChecker *EntitlementCheckerCallerSession) IsValidNode(node common.Address) (bool, error) {
	return _EntitlementChecker.Contract.IsValidNode(&_EntitlementChecker.CallOpts, node)
}

// EntitlementCheckerInit is a paid mutator transaction binding the contract method 0x39dc5b3e.
//
// Solidity: function __EntitlementChecker_init() returns()
func (_EntitlementChecker *EntitlementCheckerTransactor) EntitlementCheckerInit(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EntitlementChecker.contract.Transact(opts, "__EntitlementChecker_init")
}

// EntitlementCheckerInit is a paid mutator transaction binding the contract method 0x39dc5b3e.
//
// Solidity: function __EntitlementChecker_init() returns()
func (_EntitlementChecker *EntitlementCheckerSession) EntitlementCheckerInit() (*types.Transaction, error) {
	return _EntitlementChecker.Contract.EntitlementCheckerInit(&_EntitlementChecker.TransactOpts)
}

// EntitlementCheckerInit is a paid mutator transaction binding the contract method 0x39dc5b3e.
//
// Solidity: function __EntitlementChecker_init() returns()
func (_EntitlementChecker *EntitlementCheckerTransactorSession) EntitlementCheckerInit() (*types.Transaction, error) {
	return _EntitlementChecker.Contract.EntitlementCheckerInit(&_EntitlementChecker.TransactOpts)
}

// RegisterNode is a paid mutator transaction binding the contract method 0x672d7a0d.
//
// Solidity: function registerNode(address node) returns()
func (_EntitlementChecker *EntitlementCheckerTransactor) RegisterNode(opts *bind.TransactOpts, node common.Address) (*types.Transaction, error) {
	return _EntitlementChecker.contract.Transact(opts, "registerNode", node)
}

// RegisterNode is a paid mutator transaction binding the contract method 0x672d7a0d.
//
// Solidity: function registerNode(address node) returns()
func (_EntitlementChecker *EntitlementCheckerSession) RegisterNode(node common.Address) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.RegisterNode(&_EntitlementChecker.TransactOpts, node)
}

// RegisterNode is a paid mutator transaction binding the contract method 0x672d7a0d.
//
// Solidity: function registerNode(address node) returns()
func (_EntitlementChecker *EntitlementCheckerTransactorSession) RegisterNode(node common.Address) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.RegisterNode(&_EntitlementChecker.TransactOpts, node)
}

// RequestEntitlementCheck is a paid mutator transaction binding the contract method 0x541da4e5.
//
// Solidity: function requestEntitlementCheck(address walletAddress, bytes32 transactionId, uint256 roleId, address[] nodes) returns()
func (_EntitlementChecker *EntitlementCheckerTransactor) RequestEntitlementCheck(opts *bind.TransactOpts, walletAddress common.Address, transactionId [32]byte, roleId *big.Int, nodes []common.Address) (*types.Transaction, error) {
	return _EntitlementChecker.contract.Transact(opts, "requestEntitlementCheck", walletAddress, transactionId, roleId, nodes)
}

// RequestEntitlementCheck is a paid mutator transaction binding the contract method 0x541da4e5.
//
// Solidity: function requestEntitlementCheck(address walletAddress, bytes32 transactionId, uint256 roleId, address[] nodes) returns()
func (_EntitlementChecker *EntitlementCheckerSession) RequestEntitlementCheck(walletAddress common.Address, transactionId [32]byte, roleId *big.Int, nodes []common.Address) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.RequestEntitlementCheck(&_EntitlementChecker.TransactOpts, walletAddress, transactionId, roleId, nodes)
}

// RequestEntitlementCheck is a paid mutator transaction binding the contract method 0x541da4e5.
//
// Solidity: function requestEntitlementCheck(address walletAddress, bytes32 transactionId, uint256 roleId, address[] nodes) returns()
func (_EntitlementChecker *EntitlementCheckerTransactorSession) RequestEntitlementCheck(walletAddress common.Address, transactionId [32]byte, roleId *big.Int, nodes []common.Address) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.RequestEntitlementCheck(&_EntitlementChecker.TransactOpts, walletAddress, transactionId, roleId, nodes)
}

// RequestEntitlementCheckV2 is a paid mutator transaction binding the contract method 0x74b62682.
//
// Solidity: function requestEntitlementCheckV2(address walletAddress, bytes32 transactionId, uint256 requestId) payable returns()
func (_EntitlementChecker *EntitlementCheckerTransactor) RequestEntitlementCheckV2(opts *bind.TransactOpts, walletAddress common.Address, transactionId [32]byte, requestId *big.Int) (*types.Transaction, error) {
	return _EntitlementChecker.contract.Transact(opts, "requestEntitlementCheckV2", walletAddress, transactionId, requestId)
}

// RequestEntitlementCheckV2 is a paid mutator transaction binding the contract method 0x74b62682.
//
// Solidity: function requestEntitlementCheckV2(address walletAddress, bytes32 transactionId, uint256 requestId) payable returns()
func (_EntitlementChecker *EntitlementCheckerSession) RequestEntitlementCheckV2(walletAddress common.Address, transactionId [32]byte, requestId *big.Int) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.RequestEntitlementCheckV2(&_EntitlementChecker.TransactOpts, walletAddress, transactionId, requestId)
}

// RequestEntitlementCheckV2 is a paid mutator transaction binding the contract method 0x74b62682.
//
// Solidity: function requestEntitlementCheckV2(address walletAddress, bytes32 transactionId, uint256 requestId) payable returns()
func (_EntitlementChecker *EntitlementCheckerTransactorSession) RequestEntitlementCheckV2(walletAddress common.Address, transactionId [32]byte, requestId *big.Int) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.RequestEntitlementCheckV2(&_EntitlementChecker.TransactOpts, walletAddress, transactionId, requestId)
}

// UnregisterNode is a paid mutator transaction binding the contract method 0xc5e41cf6.
//
// Solidity: function unregisterNode(address node) returns()
func (_EntitlementChecker *EntitlementCheckerTransactor) UnregisterNode(opts *bind.TransactOpts, node common.Address) (*types.Transaction, error) {
	return _EntitlementChecker.contract.Transact(opts, "unregisterNode", node)
}

// UnregisterNode is a paid mutator transaction binding the contract method 0xc5e41cf6.
//
// Solidity: function unregisterNode(address node) returns()
func (_EntitlementChecker *EntitlementCheckerSession) UnregisterNode(node common.Address) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.UnregisterNode(&_EntitlementChecker.TransactOpts, node)
}

// UnregisterNode is a paid mutator transaction binding the contract method 0xc5e41cf6.
//
// Solidity: function unregisterNode(address node) returns()
func (_EntitlementChecker *EntitlementCheckerTransactorSession) UnregisterNode(node common.Address) (*types.Transaction, error) {
	return _EntitlementChecker.Contract.UnregisterNode(&_EntitlementChecker.TransactOpts, node)
}

// EntitlementCheckerEntitlementCheckRequestedIterator is returned from FilterEntitlementCheckRequested and is used to iterate over the raw logs and unpacked data for EntitlementCheckRequested events raised by the EntitlementChecker contract.
type EntitlementCheckerEntitlementCheckRequestedIterator struct {
	Event *EntitlementCheckerEntitlementCheckRequested // Event containing the contract specifics and raw log

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
func (it *EntitlementCheckerEntitlementCheckRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(EntitlementCheckerEntitlementCheckRequested)
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
		it.Event = new(EntitlementCheckerEntitlementCheckRequested)
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
func (it *EntitlementCheckerEntitlementCheckRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *EntitlementCheckerEntitlementCheckRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// EntitlementCheckerEntitlementCheckRequested represents a EntitlementCheckRequested event raised by the EntitlementChecker contract.
type EntitlementCheckerEntitlementCheckRequested struct {
	CallerAddress   common.Address
	ContractAddress common.Address
	TransactionId   [32]byte
	RoleId          *big.Int
	SelectedNodes   []common.Address
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterEntitlementCheckRequested is a free log retrieval operation binding the contract event 0x4675e3cc15801ffde520a3076d6ad75c0c6dbe8f23bdbea1dd45b676caffe4f3.
//
// Solidity: event EntitlementCheckRequested(address callerAddress, address contractAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_EntitlementChecker *EntitlementCheckerFilterer) FilterEntitlementCheckRequested(opts *bind.FilterOpts) (*EntitlementCheckerEntitlementCheckRequestedIterator, error) {

	logs, sub, err := _EntitlementChecker.contract.FilterLogs(opts, "EntitlementCheckRequested")
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerEntitlementCheckRequestedIterator{contract: _EntitlementChecker.contract, event: "EntitlementCheckRequested", logs: logs, sub: sub}, nil
}

// WatchEntitlementCheckRequested is a free log subscription operation binding the contract event 0x4675e3cc15801ffde520a3076d6ad75c0c6dbe8f23bdbea1dd45b676caffe4f3.
//
// Solidity: event EntitlementCheckRequested(address callerAddress, address contractAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_EntitlementChecker *EntitlementCheckerFilterer) WatchEntitlementCheckRequested(opts *bind.WatchOpts, sink chan<- *EntitlementCheckerEntitlementCheckRequested) (event.Subscription, error) {

	logs, sub, err := _EntitlementChecker.contract.WatchLogs(opts, "EntitlementCheckRequested")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(EntitlementCheckerEntitlementCheckRequested)
				if err := _EntitlementChecker.contract.UnpackLog(event, "EntitlementCheckRequested", log); err != nil {
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
func (_EntitlementChecker *EntitlementCheckerFilterer) ParseEntitlementCheckRequested(log types.Log) (*EntitlementCheckerEntitlementCheckRequested, error) {
	event := new(EntitlementCheckerEntitlementCheckRequested)
	if err := _EntitlementChecker.contract.UnpackLog(event, "EntitlementCheckRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// EntitlementCheckerEntitlementCheckRequestedV2Iterator is returned from FilterEntitlementCheckRequestedV2 and is used to iterate over the raw logs and unpacked data for EntitlementCheckRequestedV2 events raised by the EntitlementChecker contract.
type EntitlementCheckerEntitlementCheckRequestedV2Iterator struct {
	Event *EntitlementCheckerEntitlementCheckRequestedV2 // Event containing the contract specifics and raw log

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
func (it *EntitlementCheckerEntitlementCheckRequestedV2Iterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(EntitlementCheckerEntitlementCheckRequestedV2)
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
		it.Event = new(EntitlementCheckerEntitlementCheckRequestedV2)
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
func (it *EntitlementCheckerEntitlementCheckRequestedV2Iterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *EntitlementCheckerEntitlementCheckRequestedV2Iterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// EntitlementCheckerEntitlementCheckRequestedV2 represents a EntitlementCheckRequestedV2 event raised by the EntitlementChecker contract.
type EntitlementCheckerEntitlementCheckRequestedV2 struct {
	WalletAddress   common.Address
	SpaceAddress    common.Address
	ResolverAddress common.Address
	TransactionId   [32]byte
	RoleId          *big.Int
	SelectedNodes   []common.Address
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterEntitlementCheckRequestedV2 is a free log retrieval operation binding the contract event 0xf116223a7f59f1061fd42fcd9ff757b06a05709a822d38873fbbc5b5fda148bf.
//
// Solidity: event EntitlementCheckRequestedV2(address walletAddress, address spaceAddress, address resolverAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_EntitlementChecker *EntitlementCheckerFilterer) FilterEntitlementCheckRequestedV2(opts *bind.FilterOpts) (*EntitlementCheckerEntitlementCheckRequestedV2Iterator, error) {

	logs, sub, err := _EntitlementChecker.contract.FilterLogs(opts, "EntitlementCheckRequestedV2")
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerEntitlementCheckRequestedV2Iterator{contract: _EntitlementChecker.contract, event: "EntitlementCheckRequestedV2", logs: logs, sub: sub}, nil
}

// WatchEntitlementCheckRequestedV2 is a free log subscription operation binding the contract event 0xf116223a7f59f1061fd42fcd9ff757b06a05709a822d38873fbbc5b5fda148bf.
//
// Solidity: event EntitlementCheckRequestedV2(address walletAddress, address spaceAddress, address resolverAddress, bytes32 transactionId, uint256 roleId, address[] selectedNodes)
func (_EntitlementChecker *EntitlementCheckerFilterer) WatchEntitlementCheckRequestedV2(opts *bind.WatchOpts, sink chan<- *EntitlementCheckerEntitlementCheckRequestedV2) (event.Subscription, error) {

	logs, sub, err := _EntitlementChecker.contract.WatchLogs(opts, "EntitlementCheckRequestedV2")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(EntitlementCheckerEntitlementCheckRequestedV2)
				if err := _EntitlementChecker.contract.UnpackLog(event, "EntitlementCheckRequestedV2", log); err != nil {
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
func (_EntitlementChecker *EntitlementCheckerFilterer) ParseEntitlementCheckRequestedV2(log types.Log) (*EntitlementCheckerEntitlementCheckRequestedV2, error) {
	event := new(EntitlementCheckerEntitlementCheckRequestedV2)
	if err := _EntitlementChecker.contract.UnpackLog(event, "EntitlementCheckRequestedV2", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// EntitlementCheckerInitializedIterator is returned from FilterInitialized and is used to iterate over the raw logs and unpacked data for Initialized events raised by the EntitlementChecker contract.
type EntitlementCheckerInitializedIterator struct {
	Event *EntitlementCheckerInitialized // Event containing the contract specifics and raw log

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
func (it *EntitlementCheckerInitializedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(EntitlementCheckerInitialized)
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
		it.Event = new(EntitlementCheckerInitialized)
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
func (it *EntitlementCheckerInitializedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *EntitlementCheckerInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// EntitlementCheckerInitialized represents a Initialized event raised by the EntitlementChecker contract.
type EntitlementCheckerInitialized struct {
	Version uint32
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterInitialized is a free log retrieval operation binding the contract event 0xe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c.
//
// Solidity: event Initialized(uint32 version)
func (_EntitlementChecker *EntitlementCheckerFilterer) FilterInitialized(opts *bind.FilterOpts) (*EntitlementCheckerInitializedIterator, error) {

	logs, sub, err := _EntitlementChecker.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerInitializedIterator{contract: _EntitlementChecker.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

// WatchInitialized is a free log subscription operation binding the contract event 0xe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c.
//
// Solidity: event Initialized(uint32 version)
func (_EntitlementChecker *EntitlementCheckerFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *EntitlementCheckerInitialized) (event.Subscription, error) {

	logs, sub, err := _EntitlementChecker.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(EntitlementCheckerInitialized)
				if err := _EntitlementChecker.contract.UnpackLog(event, "Initialized", log); err != nil {
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
func (_EntitlementChecker *EntitlementCheckerFilterer) ParseInitialized(log types.Log) (*EntitlementCheckerInitialized, error) {
	event := new(EntitlementCheckerInitialized)
	if err := _EntitlementChecker.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// EntitlementCheckerInterfaceAddedIterator is returned from FilterInterfaceAdded and is used to iterate over the raw logs and unpacked data for InterfaceAdded events raised by the EntitlementChecker contract.
type EntitlementCheckerInterfaceAddedIterator struct {
	Event *EntitlementCheckerInterfaceAdded // Event containing the contract specifics and raw log

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
func (it *EntitlementCheckerInterfaceAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(EntitlementCheckerInterfaceAdded)
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
		it.Event = new(EntitlementCheckerInterfaceAdded)
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
func (it *EntitlementCheckerInterfaceAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *EntitlementCheckerInterfaceAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// EntitlementCheckerInterfaceAdded represents a InterfaceAdded event raised by the EntitlementChecker contract.
type EntitlementCheckerInterfaceAdded struct {
	InterfaceId [4]byte
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterInterfaceAdded is a free log retrieval operation binding the contract event 0x78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f22.
//
// Solidity: event InterfaceAdded(bytes4 indexed interfaceId)
func (_EntitlementChecker *EntitlementCheckerFilterer) FilterInterfaceAdded(opts *bind.FilterOpts, interfaceId [][4]byte) (*EntitlementCheckerInterfaceAddedIterator, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _EntitlementChecker.contract.FilterLogs(opts, "InterfaceAdded", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerInterfaceAddedIterator{contract: _EntitlementChecker.contract, event: "InterfaceAdded", logs: logs, sub: sub}, nil
}

// WatchInterfaceAdded is a free log subscription operation binding the contract event 0x78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f22.
//
// Solidity: event InterfaceAdded(bytes4 indexed interfaceId)
func (_EntitlementChecker *EntitlementCheckerFilterer) WatchInterfaceAdded(opts *bind.WatchOpts, sink chan<- *EntitlementCheckerInterfaceAdded, interfaceId [][4]byte) (event.Subscription, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _EntitlementChecker.contract.WatchLogs(opts, "InterfaceAdded", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(EntitlementCheckerInterfaceAdded)
				if err := _EntitlementChecker.contract.UnpackLog(event, "InterfaceAdded", log); err != nil {
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
func (_EntitlementChecker *EntitlementCheckerFilterer) ParseInterfaceAdded(log types.Log) (*EntitlementCheckerInterfaceAdded, error) {
	event := new(EntitlementCheckerInterfaceAdded)
	if err := _EntitlementChecker.contract.UnpackLog(event, "InterfaceAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// EntitlementCheckerInterfaceRemovedIterator is returned from FilterInterfaceRemoved and is used to iterate over the raw logs and unpacked data for InterfaceRemoved events raised by the EntitlementChecker contract.
type EntitlementCheckerInterfaceRemovedIterator struct {
	Event *EntitlementCheckerInterfaceRemoved // Event containing the contract specifics and raw log

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
func (it *EntitlementCheckerInterfaceRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(EntitlementCheckerInterfaceRemoved)
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
		it.Event = new(EntitlementCheckerInterfaceRemoved)
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
func (it *EntitlementCheckerInterfaceRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *EntitlementCheckerInterfaceRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// EntitlementCheckerInterfaceRemoved represents a InterfaceRemoved event raised by the EntitlementChecker contract.
type EntitlementCheckerInterfaceRemoved struct {
	InterfaceId [4]byte
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterInterfaceRemoved is a free log retrieval operation binding the contract event 0x8bd383568d0bc57b64b8e424138fc19ae827e694e05757faa8fea8f63fb87315.
//
// Solidity: event InterfaceRemoved(bytes4 indexed interfaceId)
func (_EntitlementChecker *EntitlementCheckerFilterer) FilterInterfaceRemoved(opts *bind.FilterOpts, interfaceId [][4]byte) (*EntitlementCheckerInterfaceRemovedIterator, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _EntitlementChecker.contract.FilterLogs(opts, "InterfaceRemoved", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerInterfaceRemovedIterator{contract: _EntitlementChecker.contract, event: "InterfaceRemoved", logs: logs, sub: sub}, nil
}

// WatchInterfaceRemoved is a free log subscription operation binding the contract event 0x8bd383568d0bc57b64b8e424138fc19ae827e694e05757faa8fea8f63fb87315.
//
// Solidity: event InterfaceRemoved(bytes4 indexed interfaceId)
func (_EntitlementChecker *EntitlementCheckerFilterer) WatchInterfaceRemoved(opts *bind.WatchOpts, sink chan<- *EntitlementCheckerInterfaceRemoved, interfaceId [][4]byte) (event.Subscription, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _EntitlementChecker.contract.WatchLogs(opts, "InterfaceRemoved", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(EntitlementCheckerInterfaceRemoved)
				if err := _EntitlementChecker.contract.UnpackLog(event, "InterfaceRemoved", log); err != nil {
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
func (_EntitlementChecker *EntitlementCheckerFilterer) ParseInterfaceRemoved(log types.Log) (*EntitlementCheckerInterfaceRemoved, error) {
	event := new(EntitlementCheckerInterfaceRemoved)
	if err := _EntitlementChecker.contract.UnpackLog(event, "InterfaceRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// EntitlementCheckerNodeRegisteredIterator is returned from FilterNodeRegistered and is used to iterate over the raw logs and unpacked data for NodeRegistered events raised by the EntitlementChecker contract.
type EntitlementCheckerNodeRegisteredIterator struct {
	Event *EntitlementCheckerNodeRegistered // Event containing the contract specifics and raw log

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
func (it *EntitlementCheckerNodeRegisteredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(EntitlementCheckerNodeRegistered)
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
		it.Event = new(EntitlementCheckerNodeRegistered)
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
func (it *EntitlementCheckerNodeRegisteredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *EntitlementCheckerNodeRegisteredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// EntitlementCheckerNodeRegistered represents a NodeRegistered event raised by the EntitlementChecker contract.
type EntitlementCheckerNodeRegistered struct {
	NodeAddress common.Address
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterNodeRegistered is a free log retrieval operation binding the contract event 0x564728e6a7c8edd446557d94e0339d5e6ca2e05f42188914efdbdc87bcbbabf6.
//
// Solidity: event NodeRegistered(address indexed nodeAddress)
func (_EntitlementChecker *EntitlementCheckerFilterer) FilterNodeRegistered(opts *bind.FilterOpts, nodeAddress []common.Address) (*EntitlementCheckerNodeRegisteredIterator, error) {

	var nodeAddressRule []interface{}
	for _, nodeAddressItem := range nodeAddress {
		nodeAddressRule = append(nodeAddressRule, nodeAddressItem)
	}

	logs, sub, err := _EntitlementChecker.contract.FilterLogs(opts, "NodeRegistered", nodeAddressRule)
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerNodeRegisteredIterator{contract: _EntitlementChecker.contract, event: "NodeRegistered", logs: logs, sub: sub}, nil
}

// WatchNodeRegistered is a free log subscription operation binding the contract event 0x564728e6a7c8edd446557d94e0339d5e6ca2e05f42188914efdbdc87bcbbabf6.
//
// Solidity: event NodeRegistered(address indexed nodeAddress)
func (_EntitlementChecker *EntitlementCheckerFilterer) WatchNodeRegistered(opts *bind.WatchOpts, sink chan<- *EntitlementCheckerNodeRegistered, nodeAddress []common.Address) (event.Subscription, error) {

	var nodeAddressRule []interface{}
	for _, nodeAddressItem := range nodeAddress {
		nodeAddressRule = append(nodeAddressRule, nodeAddressItem)
	}

	logs, sub, err := _EntitlementChecker.contract.WatchLogs(opts, "NodeRegistered", nodeAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(EntitlementCheckerNodeRegistered)
				if err := _EntitlementChecker.contract.UnpackLog(event, "NodeRegistered", log); err != nil {
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
func (_EntitlementChecker *EntitlementCheckerFilterer) ParseNodeRegistered(log types.Log) (*EntitlementCheckerNodeRegistered, error) {
	event := new(EntitlementCheckerNodeRegistered)
	if err := _EntitlementChecker.contract.UnpackLog(event, "NodeRegistered", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// EntitlementCheckerNodeUnregisteredIterator is returned from FilterNodeUnregistered and is used to iterate over the raw logs and unpacked data for NodeUnregistered events raised by the EntitlementChecker contract.
type EntitlementCheckerNodeUnregisteredIterator struct {
	Event *EntitlementCheckerNodeUnregistered // Event containing the contract specifics and raw log

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
func (it *EntitlementCheckerNodeUnregisteredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(EntitlementCheckerNodeUnregistered)
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
		it.Event = new(EntitlementCheckerNodeUnregistered)
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
func (it *EntitlementCheckerNodeUnregisteredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *EntitlementCheckerNodeUnregisteredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// EntitlementCheckerNodeUnregistered represents a NodeUnregistered event raised by the EntitlementChecker contract.
type EntitlementCheckerNodeUnregistered struct {
	NodeAddress common.Address
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterNodeUnregistered is a free log retrieval operation binding the contract event 0xb1864577e4f285436a80ebc833984755393e2450d58622a65fb4fce87ea3573a.
//
// Solidity: event NodeUnregistered(address indexed nodeAddress)
func (_EntitlementChecker *EntitlementCheckerFilterer) FilterNodeUnregistered(opts *bind.FilterOpts, nodeAddress []common.Address) (*EntitlementCheckerNodeUnregisteredIterator, error) {

	var nodeAddressRule []interface{}
	for _, nodeAddressItem := range nodeAddress {
		nodeAddressRule = append(nodeAddressRule, nodeAddressItem)
	}

	logs, sub, err := _EntitlementChecker.contract.FilterLogs(opts, "NodeUnregistered", nodeAddressRule)
	if err != nil {
		return nil, err
	}
	return &EntitlementCheckerNodeUnregisteredIterator{contract: _EntitlementChecker.contract, event: "NodeUnregistered", logs: logs, sub: sub}, nil
}

// WatchNodeUnregistered is a free log subscription operation binding the contract event 0xb1864577e4f285436a80ebc833984755393e2450d58622a65fb4fce87ea3573a.
//
// Solidity: event NodeUnregistered(address indexed nodeAddress)
func (_EntitlementChecker *EntitlementCheckerFilterer) WatchNodeUnregistered(opts *bind.WatchOpts, sink chan<- *EntitlementCheckerNodeUnregistered, nodeAddress []common.Address) (event.Subscription, error) {

	var nodeAddressRule []interface{}
	for _, nodeAddressItem := range nodeAddress {
		nodeAddressRule = append(nodeAddressRule, nodeAddressItem)
	}

	logs, sub, err := _EntitlementChecker.contract.WatchLogs(opts, "NodeUnregistered", nodeAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(EntitlementCheckerNodeUnregistered)
				if err := _EntitlementChecker.contract.UnpackLog(event, "NodeUnregistered", log); err != nil {
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
func (_EntitlementChecker *EntitlementCheckerFilterer) ParseNodeUnregistered(log types.Log) (*EntitlementCheckerNodeUnregistered, error) {
	event := new(EntitlementCheckerNodeUnregistered)
	if err := _EntitlementChecker.contract.UnpackLog(event, "NodeUnregistered", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
