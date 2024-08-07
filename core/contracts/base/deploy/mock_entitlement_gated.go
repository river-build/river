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

// IRuleEntitlementBaseCheckOperation is an auto generated low-level Go binding around an user-defined struct.
type IRuleEntitlementBaseCheckOperation struct {
	OpType          uint8
	ChainId         *big.Int
	ContractAddress common.Address
	Threshold       *big.Int
}

// IRuleEntitlementBaseLogicalOperation is an auto generated low-level Go binding around an user-defined struct.
type IRuleEntitlementBaseLogicalOperation struct {
	LogOpType           uint8
	LeftOperationIndex  uint8
	RightOperationIndex uint8
}

// IRuleEntitlementBaseOperation is an auto generated low-level Go binding around an user-defined struct.
type IRuleEntitlementBaseOperation struct {
	OpType uint8
	Index  uint8
}

// IRuleEntitlementBaseRuleData is an auto generated low-level Go binding around an user-defined struct.
type IRuleEntitlementBaseRuleData struct {
	Operations        []IRuleEntitlementBaseOperation
	CheckOperations   []IRuleEntitlementBaseCheckOperation
	LogicalOperations []IRuleEntitlementBaseLogicalOperation
}

// MockEntitlementGatedMetaData contains all meta data concerning the MockEntitlementGated contract.
var MockEntitlementGatedMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"constructor\",\"inputs\":[{\"name\":\"checker\",\"type\":\"address\",\"internalType\":\"contractIEntitlementChecker\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"__EntitlementGated_init\",\"inputs\":[{\"name\":\"entitlementChecker\",\"type\":\"address\",\"internalType\":\"contractIEntitlementChecker\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getRuleData\",\"inputs\":[{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRuleData\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"postEntitlementCheckResult\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"result\",\"type\":\"uint8\",\"internalType\":\"enumIEntitlementGatedBase.NodeVoteStatus\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"requestEntitlementCheck\",\"inputs\":[{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ruleData\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"outputs\":[{\"name\":\"\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"EntitlementCheckResultPosted\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"result\",\"type\":\"uint8\",\"indexed\":false,\"internalType\":\"enumIEntitlementGatedBase.NodeVoteStatus\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Initialized\",\"inputs\":[{\"name\":\"version\",\"type\":\"uint32\",\"indexed\":false,\"internalType\":\"uint32\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceAdded\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceRemoved\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"EntitlementGated_InvalidAddress\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeAlreadyVoted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeNotFound\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyCompleted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionNotRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_InInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_NotInInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_AlreadySupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_NotSupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"ReentrancyGuard__ReentrantCall\",\"inputs\":[]}]",
	Bin: "0x60806040523480156200001157600080fd5b5060405162001b6638038062001b66833981016040819052620000349162000127565b6200003e6200007f565b7f9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e0080546001600160a01b0319166001600160a01b0383161790555062000159565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff1615620000cc576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156200012457805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b6000602082840312156200013a57600080fd5b81516001600160a01b03811681146200015257600080fd5b9392505050565b6119fd80620001696000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c8063069a3ee91461005c5780634739e8051461008557806357e700271461009a5780637adc9cbe146100bb57806392c399ff146100ce575b600080fd5b61006f61006a366004610e10565b6100e1565b60405161007c9190610f1a565b60405180910390f35b610098610093366004610fc0565b610314565b005b6100ad6100a8366004610ff9565b6103b8565b60405190815260200161007c565b6100986100c936600461105c565b610426565b61006f6100dc366004611079565b61047c565b61010560405180606001604052806060815260200160608152602001606081525090565b6000828152602081815260408083208151815460809481028201850190935260608101838152909491938593919285929185015b828210156101a257600084815260209020604080518082019091529083018054829060ff16600281111561016f5761016f610e29565b600281111561018057610180610e29565b81529054610100900460ff166020918201529082526001929092019101610139565b50505050815260200160018201805480602002602001604051908101604052809291908181526020016000905b8282101561025a576000848152602090206040805160808101909152600484029091018054829060ff16600581111561020a5761020a610e29565b600581111561021b5761021b610e29565b815260018281015460208084019190915260028401546001600160a01b03166040840152600390930154606090920191909152918352920191016101cf565b50505050815260200160028201805480602002602001604051908101604052809291908181526020016000905b828210156103065760008481526020902060408051606081019091529083018054829060ff1660028111156102be576102be610e29565b60028111156102cf576102cf610e29565b8152905460ff6101008204811660208085019190915262010000909204166040909201919091529082526001929092019101610287565b505050915250909392505050565b60027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a00540361035657604051635db5c7cd60e11b815260040160405180910390fd5b61037f60027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b61038a8383836104aa565b6103b360017f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b505050565b600082815260208190526040812082906103d282826113e4565b50506040516bffffffffffffffffffffffff193260601b16602082015243603482015260009060540160405160208183030381529060405280519060200120905061041f8130600061072c565b9392505050565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff1661047057604051630ef4733760e31b815260040160405180910390fd5b610479816109eb565b50565b6104a060405180606001604052806060815260200160608152602001606081525090565b61041f8383610a26565b60008381526000805160206119dd8339815191526020526040902080546000805160206119bd833981519152919061010090046001600160a01b031615806104f45750805460ff16155b1561051257604051637ad5a43960e11b815260040160405180910390fd5b600084815260028201602052604090205460ff161561054457604051637912b73960e01b815260040160405180910390fd5b600084815260018201602052604081205481908190815b8181101561066b5760008981526001870160205260408120805483908110610585576105856114e8565b60009182526020909120018054909150336001600160a01b03909116036106115760008154600160a01b900460ff1660028111156105c5576105c5610e29565b146105e3576040516347592a4d60e01b815260040160405180910390fd5b80548990829060ff60a01b1916600160a01b83600281111561060757610607610e29565b0217905550600195505b8054600160a01b900460ff16600181600281111561063157610631610e29565b0361064157856001019550610661565b600281600281111561065557610655610e29565b03610661578460010194505b505060010161055b565b508361068a57604051638223a7e960e01b815260040160405180910390fd5b6106956002826114fe565b8311806106ab57506106a86002826114fe565b82115b156107215760008881526002860160205260408120805460ff191660011790558284116106d95760026106dc565b60015b9050897fb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c6338260405161070e9190611520565b60405180910390a261071f8a610b1c565b505b505050505050505050565b60008381526000805160206119dd8339815191526020526040902080546000805160206119bd833981519152919060ff16156107bc57600481015460005b818110156107b95784836004018281548110610788576107886114e8565b9060005260206000200154036107b1576040516301ab53df60e31b815260040160405180910390fd5b60010161076a565b50505b81546001600160a01b03166107d3576107d3610bf2565b8154604051634f84544560e01b8152600560048201526000916001600160a01b031690634f84544590602401600060405180830381865afa15801561081c573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f1916820160405261084491908101906115f7565b825490915060ff166108855781546003830180546001600160a01b0319166001600160a01b0388161790556001600160a81b03191661010033021760011782555b600482018054600181018255600091825260208220018590558151905b8181101561097a5783600101600087815260200190815260200160002060405180604001604052808584815181106108dc576108dc6114e8565b60200260200101516001600160a01b031681526020016000600281111561090557610905610e29565b9052815460018101835560009283526020928390208251910180546001600160a01b031981166001600160a01b03909316928317825593830151929390929183916001600160a81b03191617600160a01b83600281111561096857610968610e29565b021790555050508060010190506108a2565b50835460405163541da4e560e01b81526001600160a01b039091169063541da4e5906109b09033908b908a908890600401611696565b600060405180830381600087803b1580156109ca57600080fd5b505af11580156109de573d6000803e3d6000fd5b5050505050505050505050565b6109fb636afd38fd60e11b610cc3565b6000805160206119bd83398151915280546001600160a01b0319166001600160a01b03831617905550565b610a4a60405180606001604052806060815260200160608152602001606081525090565b60008381526000805160206119dd8339815191526020526040812080546000805160206119bd8339815191529260ff90911615159003610a9d57604051637ad5a43960e11b815260040160405180910390fd5b600381015460405163069a3ee960e01b8152600481018690526001600160a01b0390911690819063069a3ee990602401600060405180830381865afa158015610aea573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610b12919081019061185f565b9695505050505050565b60008181526000805160206119dd8339815191526020526040812060048101546000805160206119bd833981519152925b81811015610b9d57826001016000846004018381548110610b7057610b706114e8565b906000526020600020015481526020019081526020016000206000610b959190610d9c565b600101610b4d565b50610bac600483016000610dba565b6000848152600184016020526040812080546001600160a81b03191681556003810180546001600160a01b031916905590610bea6004830182610dba565b505050505050565b60006000805160206119bd833981519152905060007fc21004fcc619240a31f006438274d15cd813308303284436eef6055f0fdcb60060060154604051628956cd60e71b81526c29b830b1b2a7b832b930ba37b960991b60048201526001600160a01b03909116906344ab668090602401602060405180830381865afa158015610c80573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ca4919061199f565b82546001600160a01b0319166001600160a01b03919091161790915550565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff16610d4b576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff19166001179055610d64565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b50805460008255906000526020600020908101906104799190610dd8565b50805460008255906000526020600020908101906104799190610dfb565b5b80821115610df75780546001600160a81b0319168155600101610dd9565b5090565b5b80821115610df75760008155600101610dfc565b600060208284031215610e2257600080fd5b5035919050565b634e487b7160e01b600052602160045260246000fd5b6003811061047957610479610e29565b60008151808452602080850194506020840160005b83811015610eb9578151805160068110610e8057610e80610e29565b885280840151848901526040808201516001600160a01b0316908901526060908101519088015260809096019590820190600101610e64565b509495945050505050565b60008151808452602080850194506020840160005b83811015610eb95781518051610eee81610e3f565b88528084015160ff908116858a0152604091820151169088015260609096019590820190600101610ed9565b6020808252825160608383015280516080840181905260009291820190839060a08601905b80831015610f765783518051610f5481610e3f565b835285015160ff16858301529284019260019290920191604090910190610f3f565b50838701519350601f19925082868203016040870152610f968185610e4f565b93505050604085015181858403016060860152610b128382610ec4565b6003811061047957600080fd5b600080600060608486031215610fd557600080fd5b83359250602084013591506040840135610fee81610fb3565b809150509250925092565b6000806040838503121561100c57600080fd5b82359150602083013567ffffffffffffffff81111561102a57600080fd5b83016060818603121561103c57600080fd5b809150509250929050565b6001600160a01b038116811461047957600080fd5b60006020828403121561106e57600080fd5b813561041f81611047565b6000806040838503121561108c57600080fd5b50508035926020909101359150565b634e487b7160e01b600052604160045260246000fd5b600281901b6001600160fe1b03821682146110dc57634e487b7160e01b600052601160045260246000fd5b919050565b60ff8116811461047957600080fd5b81356110fb81610fb3565b61110481610e3f565b60ff1982541660ff82168117835550506020820135611122816110e1565b815461ff001916600882901b61ff0016178255505050565b6000808335601e1984360301811261115157600080fd5b83018035915067ffffffffffffffff82111561116c57600080fd5b6020019150600781901b360382131561118457600080fd5b9250929050565b6006811061047957600080fd5b81356111a38161118b565b600681106111b3576111b3610e29565b60ff1982541660ff8216811783555050602082013560018201556002810160408301356111df81611047565b81546001600160a01b0319166001600160a01b03919091161790556060919091013560039190910155565b600160401b83111561121e5761121e61109b565b80548382558084101561127c57611234816110b1565b61123d856110b1565b6000848152602081209283019291909101905b8282101561127857808255806001830155806002830155806003830155600482019150611250565b5050505b5060008181526020812083915b85811015610bea5761129b8383611198565b6080929092019160049190910190600101611289565b6000808335601e198436030181126112c857600080fd5b83018035915067ffffffffffffffff8211156112e357600080fd5b602001915060608102360382131561118457600080fd5b813561130581610fb3565b61130e81610e3f565b60ff1982541660ff8216811783555050602082013561132c816110e1565b815461ff001916600882901b61ff001617825550604082013561134e816110e1565b815462ff0000191660109190911b62ff00001617905550565b600160401b83111561137b5761137b61109b565b8054838255808410156113b2576000828152602081208581019083015b808210156113ae57828255600182019150611398565b5050505b5060008181526020812083915b85811015610bea576113d183836112fa565b60609290920191600191820191016113bf565b8135601e198336030181126113f857600080fd5b8201803567ffffffffffffffff81111561141157600080fd5b6020820191508060061b360382131561142957600080fd5b600160401b81111561143d5761143d61109b565b825481845580821015611474576000848152602081208381019083015b808210156114705782825560018201915061145a565b5050505b5060008381526020902060005b828110156114a65761149384836110f0565b6040939093019260019182019101611481565b505050506114b7602083018361113a565b6114c581836001860161120a565b50506114d460408301836112b1565b6114e2818360028601611367565b50505050565b634e487b7160e01b600052603260045260246000fd5b60008261151b57634e487b7160e01b600052601260045260246000fd5b500490565b6020810161152d83610e3f565b91905290565b6040516080810167ffffffffffffffff811182821017156115565761155661109b565b60405290565b6040516060810167ffffffffffffffff811182821017156115565761155661109b565b6040805190810167ffffffffffffffff811182821017156115565761155661109b565b604051601f8201601f1916810167ffffffffffffffff811182821017156115cb576115cb61109b565b604052919050565b600067ffffffffffffffff8211156115ed576115ed61109b565b5060051b60200190565b6000602080838503121561160a57600080fd5b825167ffffffffffffffff81111561162157600080fd5b8301601f8101851361163257600080fd5b8051611645611640826115d3565b6115a2565b81815260059190911b8201830190838101908783111561166457600080fd5b928401925b8284101561168b57835161167c81611047565b82529284019290840190611669565b979650505050505050565b60006080820160018060a01b03808816845260208760208601528660408601526080606086015282865180855260a08701915060208801945060005b818110156116f05785518516835294830194918301916001016116d2565b50909a9950505050505050505050565b600082601f83011261171157600080fd5b81516020611721611640836115d3565b82815260079290921b8401810191818101908684111561174057600080fd5b8286015b848110156117a5576080818903121561175d5760008081fd5b611765611533565b81516117708161118b565b8152818501518582015260408083015161178981611047565b9082015260608281015190820152835291830191608001611744565b509695505050505050565b600082601f8301126117c157600080fd5b815160206117d1611640836115d3565b828152606092830285018201928282019190878511156117f057600080fd5b8387015b858110156118525781818a03121561180c5760008081fd5b61181461155c565b815161181f81610fb3565b81528186015161182e816110e1565b81870152604082810151611841816110e1565b9082015284529284019281016117f4565b5090979650505050505050565b6000602080838503121561187257600080fd5b825167ffffffffffffffff8082111561188a57600080fd5b908401906060828703121561189e57600080fd5b6118a661155c565b8251828111156118b557600080fd5b8301601f810188136118c657600080fd5b80516118d4611640826115d3565b81815260069190911b8201860190868101908a8311156118f357600080fd5b928701925b82841015611949576040848c0312156119115760008081fd5b61191961157f565b845161192481610fb3565b815284890151611933816110e1565b818a0152825260409390930192908701906118f8565b8452505050828401518281111561195f57600080fd5b61196b88828601611700565b8583015250604083015193508184111561198457600080fd5b611990878585016117b0565b60408201529695505050505050565b6000602082840312156119b157600080fd5b815161041f8161104756fe9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e009075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e01",
}

// MockEntitlementGatedABI is the input ABI used to generate the binding from.
// Deprecated: Use MockEntitlementGatedMetaData.ABI instead.
var MockEntitlementGatedABI = MockEntitlementGatedMetaData.ABI

// MockEntitlementGatedBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use MockEntitlementGatedMetaData.Bin instead.
var MockEntitlementGatedBin = MockEntitlementGatedMetaData.Bin

// DeployMockEntitlementGated deploys a new Ethereum contract, binding an instance of MockEntitlementGated to it.
func DeployMockEntitlementGated(auth *bind.TransactOpts, backend bind.ContractBackend, checker common.Address) (common.Address, *types.Transaction, *MockEntitlementGated, error) {
	parsed, err := MockEntitlementGatedMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(MockEntitlementGatedBin), backend, checker)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &MockEntitlementGated{MockEntitlementGatedCaller: MockEntitlementGatedCaller{contract: contract}, MockEntitlementGatedTransactor: MockEntitlementGatedTransactor{contract: contract}, MockEntitlementGatedFilterer: MockEntitlementGatedFilterer{contract: contract}}, nil
}

// MockEntitlementGated is an auto generated Go binding around an Ethereum contract.
type MockEntitlementGated struct {
	MockEntitlementGatedCaller     // Read-only binding to the contract
	MockEntitlementGatedTransactor // Write-only binding to the contract
	MockEntitlementGatedFilterer   // Log filterer for contract events
}

// MockEntitlementGatedCaller is an auto generated read-only Go binding around an Ethereum contract.
type MockEntitlementGatedCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MockEntitlementGatedTransactor is an auto generated write-only Go binding around an Ethereum contract.
type MockEntitlementGatedTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MockEntitlementGatedFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type MockEntitlementGatedFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MockEntitlementGatedSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type MockEntitlementGatedSession struct {
	Contract     *MockEntitlementGated // Generic contract binding to set the session for
	CallOpts     bind.CallOpts         // Call options to use throughout this session
	TransactOpts bind.TransactOpts     // Transaction auth options to use throughout this session
}

// MockEntitlementGatedCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type MockEntitlementGatedCallerSession struct {
	Contract *MockEntitlementGatedCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts               // Call options to use throughout this session
}

// MockEntitlementGatedTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type MockEntitlementGatedTransactorSession struct {
	Contract     *MockEntitlementGatedTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts               // Transaction auth options to use throughout this session
}

// MockEntitlementGatedRaw is an auto generated low-level Go binding around an Ethereum contract.
type MockEntitlementGatedRaw struct {
	Contract *MockEntitlementGated // Generic contract binding to access the raw methods on
}

// MockEntitlementGatedCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type MockEntitlementGatedCallerRaw struct {
	Contract *MockEntitlementGatedCaller // Generic read-only contract binding to access the raw methods on
}

// MockEntitlementGatedTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type MockEntitlementGatedTransactorRaw struct {
	Contract *MockEntitlementGatedTransactor // Generic write-only contract binding to access the raw methods on
}

// NewMockEntitlementGated creates a new instance of MockEntitlementGated, bound to a specific deployed contract.
func NewMockEntitlementGated(address common.Address, backend bind.ContractBackend) (*MockEntitlementGated, error) {
	contract, err := bindMockEntitlementGated(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &MockEntitlementGated{MockEntitlementGatedCaller: MockEntitlementGatedCaller{contract: contract}, MockEntitlementGatedTransactor: MockEntitlementGatedTransactor{contract: contract}, MockEntitlementGatedFilterer: MockEntitlementGatedFilterer{contract: contract}}, nil
}

// NewMockEntitlementGatedCaller creates a new read-only instance of MockEntitlementGated, bound to a specific deployed contract.
func NewMockEntitlementGatedCaller(address common.Address, caller bind.ContractCaller) (*MockEntitlementGatedCaller, error) {
	contract, err := bindMockEntitlementGated(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &MockEntitlementGatedCaller{contract: contract}, nil
}

// NewMockEntitlementGatedTransactor creates a new write-only instance of MockEntitlementGated, bound to a specific deployed contract.
func NewMockEntitlementGatedTransactor(address common.Address, transactor bind.ContractTransactor) (*MockEntitlementGatedTransactor, error) {
	contract, err := bindMockEntitlementGated(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &MockEntitlementGatedTransactor{contract: contract}, nil
}

// NewMockEntitlementGatedFilterer creates a new log filterer instance of MockEntitlementGated, bound to a specific deployed contract.
func NewMockEntitlementGatedFilterer(address common.Address, filterer bind.ContractFilterer) (*MockEntitlementGatedFilterer, error) {
	contract, err := bindMockEntitlementGated(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &MockEntitlementGatedFilterer{contract: contract}, nil
}

// bindMockEntitlementGated binds a generic wrapper to an already deployed contract.
func bindMockEntitlementGated(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := MockEntitlementGatedMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_MockEntitlementGated *MockEntitlementGatedRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _MockEntitlementGated.Contract.MockEntitlementGatedCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_MockEntitlementGated *MockEntitlementGatedRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.MockEntitlementGatedTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_MockEntitlementGated *MockEntitlementGatedRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.MockEntitlementGatedTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_MockEntitlementGated *MockEntitlementGatedCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _MockEntitlementGated.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_MockEntitlementGated *MockEntitlementGatedTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_MockEntitlementGated *MockEntitlementGatedTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.contract.Transact(opts, method, params...)
}

// GetRuleData is a free data retrieval call binding the contract method 0x069a3ee9.
//
// Solidity: function getRuleData(uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_MockEntitlementGated *MockEntitlementGatedCaller) GetRuleData(opts *bind.CallOpts, roleId *big.Int) (IRuleEntitlementBaseRuleData, error) {
	var out []interface{}
	err := _MockEntitlementGated.contract.Call(opts, &out, "getRuleData", roleId)

	if err != nil {
		return *new(IRuleEntitlementBaseRuleData), err
	}

	out0 := *abi.ConvertType(out[0], new(IRuleEntitlementBaseRuleData)).(*IRuleEntitlementBaseRuleData)

	return out0, err

}

// GetRuleData is a free data retrieval call binding the contract method 0x069a3ee9.
//
// Solidity: function getRuleData(uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_MockEntitlementGated *MockEntitlementGatedSession) GetRuleData(roleId *big.Int) (IRuleEntitlementBaseRuleData, error) {
	return _MockEntitlementGated.Contract.GetRuleData(&_MockEntitlementGated.CallOpts, roleId)
}

// GetRuleData is a free data retrieval call binding the contract method 0x069a3ee9.
//
// Solidity: function getRuleData(uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_MockEntitlementGated *MockEntitlementGatedCallerSession) GetRuleData(roleId *big.Int) (IRuleEntitlementBaseRuleData, error) {
	return _MockEntitlementGated.Contract.GetRuleData(&_MockEntitlementGated.CallOpts, roleId)
}

// GetRuleData0 is a free data retrieval call binding the contract method 0x92c399ff.
//
// Solidity: function getRuleData(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_MockEntitlementGated *MockEntitlementGatedCaller) GetRuleData0(opts *bind.CallOpts, transactionId [32]byte, roleId *big.Int) (IRuleEntitlementBaseRuleData, error) {
	var out []interface{}
	err := _MockEntitlementGated.contract.Call(opts, &out, "getRuleData0", transactionId, roleId)

	if err != nil {
		return *new(IRuleEntitlementBaseRuleData), err
	}

	out0 := *abi.ConvertType(out[0], new(IRuleEntitlementBaseRuleData)).(*IRuleEntitlementBaseRuleData)

	return out0, err

}

// GetRuleData0 is a free data retrieval call binding the contract method 0x92c399ff.
//
// Solidity: function getRuleData(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_MockEntitlementGated *MockEntitlementGatedSession) GetRuleData0(transactionId [32]byte, roleId *big.Int) (IRuleEntitlementBaseRuleData, error) {
	return _MockEntitlementGated.Contract.GetRuleData0(&_MockEntitlementGated.CallOpts, transactionId, roleId)
}

// GetRuleData0 is a free data retrieval call binding the contract method 0x92c399ff.
//
// Solidity: function getRuleData(bytes32 transactionId, uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))
func (_MockEntitlementGated *MockEntitlementGatedCallerSession) GetRuleData0(transactionId [32]byte, roleId *big.Int) (IRuleEntitlementBaseRuleData, error) {
	return _MockEntitlementGated.Contract.GetRuleData0(&_MockEntitlementGated.CallOpts, transactionId, roleId)
}

// EntitlementGatedInit is a paid mutator transaction binding the contract method 0x7adc9cbe.
//
// Solidity: function __EntitlementGated_init(address entitlementChecker) returns()
func (_MockEntitlementGated *MockEntitlementGatedTransactor) EntitlementGatedInit(opts *bind.TransactOpts, entitlementChecker common.Address) (*types.Transaction, error) {
	return _MockEntitlementGated.contract.Transact(opts, "__EntitlementGated_init", entitlementChecker)
}

// EntitlementGatedInit is a paid mutator transaction binding the contract method 0x7adc9cbe.
//
// Solidity: function __EntitlementGated_init(address entitlementChecker) returns()
func (_MockEntitlementGated *MockEntitlementGatedSession) EntitlementGatedInit(entitlementChecker common.Address) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.EntitlementGatedInit(&_MockEntitlementGated.TransactOpts, entitlementChecker)
}

// EntitlementGatedInit is a paid mutator transaction binding the contract method 0x7adc9cbe.
//
// Solidity: function __EntitlementGated_init(address entitlementChecker) returns()
func (_MockEntitlementGated *MockEntitlementGatedTransactorSession) EntitlementGatedInit(entitlementChecker common.Address) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.EntitlementGatedInit(&_MockEntitlementGated.TransactOpts, entitlementChecker)
}

// PostEntitlementCheckResult is a paid mutator transaction binding the contract method 0x4739e805.
//
// Solidity: function postEntitlementCheckResult(bytes32 transactionId, uint256 roleId, uint8 result) returns()
func (_MockEntitlementGated *MockEntitlementGatedTransactor) PostEntitlementCheckResult(opts *bind.TransactOpts, transactionId [32]byte, roleId *big.Int, result uint8) (*types.Transaction, error) {
	return _MockEntitlementGated.contract.Transact(opts, "postEntitlementCheckResult", transactionId, roleId, result)
}

// PostEntitlementCheckResult is a paid mutator transaction binding the contract method 0x4739e805.
//
// Solidity: function postEntitlementCheckResult(bytes32 transactionId, uint256 roleId, uint8 result) returns()
func (_MockEntitlementGated *MockEntitlementGatedSession) PostEntitlementCheckResult(transactionId [32]byte, roleId *big.Int, result uint8) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.PostEntitlementCheckResult(&_MockEntitlementGated.TransactOpts, transactionId, roleId, result)
}

// PostEntitlementCheckResult is a paid mutator transaction binding the contract method 0x4739e805.
//
// Solidity: function postEntitlementCheckResult(bytes32 transactionId, uint256 roleId, uint8 result) returns()
func (_MockEntitlementGated *MockEntitlementGatedTransactorSession) PostEntitlementCheckResult(transactionId [32]byte, roleId *big.Int, result uint8) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.PostEntitlementCheckResult(&_MockEntitlementGated.TransactOpts, transactionId, roleId, result)
}

// RequestEntitlementCheck is a paid mutator transaction binding the contract method 0x57e70027.
//
// Solidity: function requestEntitlementCheck(uint256 roleId, ((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]) ruleData) returns(bytes32)
func (_MockEntitlementGated *MockEntitlementGatedTransactor) RequestEntitlementCheck(opts *bind.TransactOpts, roleId *big.Int, ruleData IRuleEntitlementBaseRuleData) (*types.Transaction, error) {
	return _MockEntitlementGated.contract.Transact(opts, "requestEntitlementCheck", roleId, ruleData)
}

// RequestEntitlementCheck is a paid mutator transaction binding the contract method 0x57e70027.
//
// Solidity: function requestEntitlementCheck(uint256 roleId, ((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]) ruleData) returns(bytes32)
func (_MockEntitlementGated *MockEntitlementGatedSession) RequestEntitlementCheck(roleId *big.Int, ruleData IRuleEntitlementBaseRuleData) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.RequestEntitlementCheck(&_MockEntitlementGated.TransactOpts, roleId, ruleData)
}

// RequestEntitlementCheck is a paid mutator transaction binding the contract method 0x57e70027.
//
// Solidity: function requestEntitlementCheck(uint256 roleId, ((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]) ruleData) returns(bytes32)
func (_MockEntitlementGated *MockEntitlementGatedTransactorSession) RequestEntitlementCheck(roleId *big.Int, ruleData IRuleEntitlementBaseRuleData) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.RequestEntitlementCheck(&_MockEntitlementGated.TransactOpts, roleId, ruleData)
}

// MockEntitlementGatedEntitlementCheckResultPostedIterator is returned from FilterEntitlementCheckResultPosted and is used to iterate over the raw logs and unpacked data for EntitlementCheckResultPosted events raised by the MockEntitlementGated contract.
type MockEntitlementGatedEntitlementCheckResultPostedIterator struct {
	Event *MockEntitlementGatedEntitlementCheckResultPosted // Event containing the contract specifics and raw log

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
func (it *MockEntitlementGatedEntitlementCheckResultPostedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MockEntitlementGatedEntitlementCheckResultPosted)
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
		it.Event = new(MockEntitlementGatedEntitlementCheckResultPosted)
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
func (it *MockEntitlementGatedEntitlementCheckResultPostedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MockEntitlementGatedEntitlementCheckResultPostedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MockEntitlementGatedEntitlementCheckResultPosted represents a EntitlementCheckResultPosted event raised by the MockEntitlementGated contract.
type MockEntitlementGatedEntitlementCheckResultPosted struct {
	TransactionId [32]byte
	Result        uint8
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterEntitlementCheckResultPosted is a free log retrieval operation binding the contract event 0xb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c633.
//
// Solidity: event EntitlementCheckResultPosted(bytes32 indexed transactionId, uint8 result)
func (_MockEntitlementGated *MockEntitlementGatedFilterer) FilterEntitlementCheckResultPosted(opts *bind.FilterOpts, transactionId [][32]byte) (*MockEntitlementGatedEntitlementCheckResultPostedIterator, error) {

	var transactionIdRule []interface{}
	for _, transactionIdItem := range transactionId {
		transactionIdRule = append(transactionIdRule, transactionIdItem)
	}

	logs, sub, err := _MockEntitlementGated.contract.FilterLogs(opts, "EntitlementCheckResultPosted", transactionIdRule)
	if err != nil {
		return nil, err
	}
	return &MockEntitlementGatedEntitlementCheckResultPostedIterator{contract: _MockEntitlementGated.contract, event: "EntitlementCheckResultPosted", logs: logs, sub: sub}, nil
}

// WatchEntitlementCheckResultPosted is a free log subscription operation binding the contract event 0xb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c633.
//
// Solidity: event EntitlementCheckResultPosted(bytes32 indexed transactionId, uint8 result)
func (_MockEntitlementGated *MockEntitlementGatedFilterer) WatchEntitlementCheckResultPosted(opts *bind.WatchOpts, sink chan<- *MockEntitlementGatedEntitlementCheckResultPosted, transactionId [][32]byte) (event.Subscription, error) {

	var transactionIdRule []interface{}
	for _, transactionIdItem := range transactionId {
		transactionIdRule = append(transactionIdRule, transactionIdItem)
	}

	logs, sub, err := _MockEntitlementGated.contract.WatchLogs(opts, "EntitlementCheckResultPosted", transactionIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MockEntitlementGatedEntitlementCheckResultPosted)
				if err := _MockEntitlementGated.contract.UnpackLog(event, "EntitlementCheckResultPosted", log); err != nil {
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
func (_MockEntitlementGated *MockEntitlementGatedFilterer) ParseEntitlementCheckResultPosted(log types.Log) (*MockEntitlementGatedEntitlementCheckResultPosted, error) {
	event := new(MockEntitlementGatedEntitlementCheckResultPosted)
	if err := _MockEntitlementGated.contract.UnpackLog(event, "EntitlementCheckResultPosted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MockEntitlementGatedInitializedIterator is returned from FilterInitialized and is used to iterate over the raw logs and unpacked data for Initialized events raised by the MockEntitlementGated contract.
type MockEntitlementGatedInitializedIterator struct {
	Event *MockEntitlementGatedInitialized // Event containing the contract specifics and raw log

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
func (it *MockEntitlementGatedInitializedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MockEntitlementGatedInitialized)
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
		it.Event = new(MockEntitlementGatedInitialized)
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
func (it *MockEntitlementGatedInitializedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MockEntitlementGatedInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MockEntitlementGatedInitialized represents a Initialized event raised by the MockEntitlementGated contract.
type MockEntitlementGatedInitialized struct {
	Version uint32
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterInitialized is a free log retrieval operation binding the contract event 0xe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c.
//
// Solidity: event Initialized(uint32 version)
func (_MockEntitlementGated *MockEntitlementGatedFilterer) FilterInitialized(opts *bind.FilterOpts) (*MockEntitlementGatedInitializedIterator, error) {

	logs, sub, err := _MockEntitlementGated.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &MockEntitlementGatedInitializedIterator{contract: _MockEntitlementGated.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

// WatchInitialized is a free log subscription operation binding the contract event 0xe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c.
//
// Solidity: event Initialized(uint32 version)
func (_MockEntitlementGated *MockEntitlementGatedFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *MockEntitlementGatedInitialized) (event.Subscription, error) {

	logs, sub, err := _MockEntitlementGated.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MockEntitlementGatedInitialized)
				if err := _MockEntitlementGated.contract.UnpackLog(event, "Initialized", log); err != nil {
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
func (_MockEntitlementGated *MockEntitlementGatedFilterer) ParseInitialized(log types.Log) (*MockEntitlementGatedInitialized, error) {
	event := new(MockEntitlementGatedInitialized)
	if err := _MockEntitlementGated.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MockEntitlementGatedInterfaceAddedIterator is returned from FilterInterfaceAdded and is used to iterate over the raw logs and unpacked data for InterfaceAdded events raised by the MockEntitlementGated contract.
type MockEntitlementGatedInterfaceAddedIterator struct {
	Event *MockEntitlementGatedInterfaceAdded // Event containing the contract specifics and raw log

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
func (it *MockEntitlementGatedInterfaceAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MockEntitlementGatedInterfaceAdded)
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
		it.Event = new(MockEntitlementGatedInterfaceAdded)
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
func (it *MockEntitlementGatedInterfaceAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MockEntitlementGatedInterfaceAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MockEntitlementGatedInterfaceAdded represents a InterfaceAdded event raised by the MockEntitlementGated contract.
type MockEntitlementGatedInterfaceAdded struct {
	InterfaceId [4]byte
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterInterfaceAdded is a free log retrieval operation binding the contract event 0x78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f22.
//
// Solidity: event InterfaceAdded(bytes4 indexed interfaceId)
func (_MockEntitlementGated *MockEntitlementGatedFilterer) FilterInterfaceAdded(opts *bind.FilterOpts, interfaceId [][4]byte) (*MockEntitlementGatedInterfaceAddedIterator, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _MockEntitlementGated.contract.FilterLogs(opts, "InterfaceAdded", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return &MockEntitlementGatedInterfaceAddedIterator{contract: _MockEntitlementGated.contract, event: "InterfaceAdded", logs: logs, sub: sub}, nil
}

// WatchInterfaceAdded is a free log subscription operation binding the contract event 0x78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f22.
//
// Solidity: event InterfaceAdded(bytes4 indexed interfaceId)
func (_MockEntitlementGated *MockEntitlementGatedFilterer) WatchInterfaceAdded(opts *bind.WatchOpts, sink chan<- *MockEntitlementGatedInterfaceAdded, interfaceId [][4]byte) (event.Subscription, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _MockEntitlementGated.contract.WatchLogs(opts, "InterfaceAdded", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MockEntitlementGatedInterfaceAdded)
				if err := _MockEntitlementGated.contract.UnpackLog(event, "InterfaceAdded", log); err != nil {
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
func (_MockEntitlementGated *MockEntitlementGatedFilterer) ParseInterfaceAdded(log types.Log) (*MockEntitlementGatedInterfaceAdded, error) {
	event := new(MockEntitlementGatedInterfaceAdded)
	if err := _MockEntitlementGated.contract.UnpackLog(event, "InterfaceAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MockEntitlementGatedInterfaceRemovedIterator is returned from FilterInterfaceRemoved and is used to iterate over the raw logs and unpacked data for InterfaceRemoved events raised by the MockEntitlementGated contract.
type MockEntitlementGatedInterfaceRemovedIterator struct {
	Event *MockEntitlementGatedInterfaceRemoved // Event containing the contract specifics and raw log

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
func (it *MockEntitlementGatedInterfaceRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MockEntitlementGatedInterfaceRemoved)
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
		it.Event = new(MockEntitlementGatedInterfaceRemoved)
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
func (it *MockEntitlementGatedInterfaceRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MockEntitlementGatedInterfaceRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MockEntitlementGatedInterfaceRemoved represents a InterfaceRemoved event raised by the MockEntitlementGated contract.
type MockEntitlementGatedInterfaceRemoved struct {
	InterfaceId [4]byte
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterInterfaceRemoved is a free log retrieval operation binding the contract event 0x8bd383568d0bc57b64b8e424138fc19ae827e694e05757faa8fea8f63fb87315.
//
// Solidity: event InterfaceRemoved(bytes4 indexed interfaceId)
func (_MockEntitlementGated *MockEntitlementGatedFilterer) FilterInterfaceRemoved(opts *bind.FilterOpts, interfaceId [][4]byte) (*MockEntitlementGatedInterfaceRemovedIterator, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _MockEntitlementGated.contract.FilterLogs(opts, "InterfaceRemoved", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return &MockEntitlementGatedInterfaceRemovedIterator{contract: _MockEntitlementGated.contract, event: "InterfaceRemoved", logs: logs, sub: sub}, nil
}

// WatchInterfaceRemoved is a free log subscription operation binding the contract event 0x8bd383568d0bc57b64b8e424138fc19ae827e694e05757faa8fea8f63fb87315.
//
// Solidity: event InterfaceRemoved(bytes4 indexed interfaceId)
func (_MockEntitlementGated *MockEntitlementGatedFilterer) WatchInterfaceRemoved(opts *bind.WatchOpts, sink chan<- *MockEntitlementGatedInterfaceRemoved, interfaceId [][4]byte) (event.Subscription, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _MockEntitlementGated.contract.WatchLogs(opts, "InterfaceRemoved", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MockEntitlementGatedInterfaceRemoved)
				if err := _MockEntitlementGated.contract.UnpackLog(event, "InterfaceRemoved", log); err != nil {
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
func (_MockEntitlementGated *MockEntitlementGatedFilterer) ParseInterfaceRemoved(log types.Log) (*MockEntitlementGatedInterfaceRemoved, error) {
	event := new(MockEntitlementGatedInterfaceRemoved)
	if err := _MockEntitlementGated.contract.UnpackLog(event, "InterfaceRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
