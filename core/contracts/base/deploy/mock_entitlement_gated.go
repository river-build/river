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

// IRuleEntitlementBaseCheckOperationV2 is an auto generated low-level Go binding around an user-defined struct.
type IRuleEntitlementBaseCheckOperationV2 struct {
	OpType          uint8
	ChainId         *big.Int
	ContractAddress common.Address
	Params          []byte
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

// IRuleEntitlementBaseRuleDataV2 is an auto generated low-level Go binding around an user-defined struct.
type IRuleEntitlementBaseRuleDataV2 struct {
	Operations        []IRuleEntitlementBaseOperation
	CheckOperations   []IRuleEntitlementBaseCheckOperationV2
	LogicalOperations []IRuleEntitlementBaseLogicalOperation
}

// MockEntitlementGatedMetaData contains all meta data concerning the MockEntitlementGated contract.
var MockEntitlementGatedMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"constructor\",\"inputs\":[{\"name\":\"checker\",\"type\":\"address\",\"internalType\":\"contractIEntitlementChecker\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"__EntitlementGated_init\",\"inputs\":[{\"name\":\"entitlementChecker\",\"type\":\"address\",\"internalType\":\"contractIEntitlementChecker\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getRuleData\",\"inputs\":[{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRuleData\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRuleDataV2\",\"inputs\":[{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleDataV2\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperationV2[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"params\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"postEntitlementCheckResult\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"result\",\"type\":\"uint8\",\"internalType\":\"enumIEntitlementGatedBase.NodeVoteStatus\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"requestEntitlementCheck\",\"inputs\":[{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ruleData\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleDataV2\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperationV2[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"params\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"outputs\":[{\"name\":\"\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"EntitlementCheckResultPosted\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"result\",\"type\":\"uint8\",\"indexed\":false,\"internalType\":\"enumIEntitlementGatedBase.NodeVoteStatus\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Initialized\",\"inputs\":[{\"name\":\"version\",\"type\":\"uint32\",\"indexed\":false,\"internalType\":\"uint32\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceAdded\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceRemoved\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"EntitlementGated_InvalidAddress\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeAlreadyVoted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeNotFound\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyCompleted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionNotRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_InInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_NotInInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_AlreadySupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_NotSupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"ReentrancyGuard__ReentrantCall\",\"inputs\":[]}]",
	Bin: "0x60806040523480156200001157600080fd5b506040516200216838038062002168833981016040819052620000349162000127565b6200003e6200007f565b7f9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e0080546001600160a01b0319166001600160a01b0383161790555062000159565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff1615620000cc576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156200012457805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b6000602082840312156200013a57600080fd5b81516001600160a01b03811681146200015257600080fd5b9392505050565b611fff80620001696000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c8063069a3ee9146100675780634739e80514610090578063679b75cc146100a557806368ab7dd6146100c65780637adc9cbe146100e657806392c399ff146100f9575b600080fd5b61007a6100753660046110ec565b61010c565b60405161008791906111e8565b60405180910390f35b6100a361009e3660046112b2565b61033f565b005b6100b86100b33660046112eb565b6103e3565b604051908152602001610087565b6100d96100d43660046110ec565b610451565b6040516100879190611338565b6100a36100f4366004611459565b6106fe565b61007a610107366004611476565b610754565b61013060405180606001604052806060815260200160608152602001606081525090565b6000828152602081815260408083208151815460809481028201850190935260608101838152909491938593919285929185015b828210156101cd57600084815260209020604080518082019091529083018054829060ff16600281111561019a5761019a611105565b60028111156101ab576101ab611105565b81529054610100900460ff166020918201529082526001929092019101610164565b50505050815260200160018201805480602002602001604051908101604052809291908181526020016000905b82821015610285576000848152602090206040805160808101909152600484029091018054829060ff16600581111561023557610235611105565b600581111561024657610246611105565b815260018281015460208084019190915260028401546001600160a01b03166040840152600390930154606090920191909152918352920191016101fa565b50505050815260200160028201805480602002602001604051908101604052809291908181526020016000905b828210156103315760008481526020902060408051606081019091529083018054829060ff1660028111156102e9576102e9611105565b60028111156102fa576102fa611105565b8152905460ff61010082048116602080850191909152620100009092041660409092019190915290825260019290920191016102b2565b505050915250909392505050565b60027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a00540361038157604051635db5c7cd60e11b815260040160405180910390fd5b6103aa60027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b6103b5838383610782565b6103de60017f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b505050565b600082815260016020526040812082906103fd82826119f4565b50506040516bffffffffffffffffffffffff193260601b16602082015243603482015260009060540160405160208183030381529060405280519060200120905061044a81306000610a04565b9392505050565b61047560405180606001604052806060815260200160608152602001606081525090565b60008281526001602090815260408083208151815460809481028201850190935260608101838152909491938593919285929185015b8282101561051457600084815260209020604080518082019091529083018054829060ff1660028111156104e1576104e1611105565b60028111156104f2576104f2611105565b81529054610100900460ff1660209182015290825260019290920191016104ab565b50505050815260200160018201805480602002602001604051908101604052809291908181526020016000905b82821015610652576000848152602090206040805160808101909152600484029091018054829060ff16600581111561057c5761057c611105565b600581111561058d5761058d611105565b81526001820154602082015260028201546001600160a01b031660408201526003820180546060909201916105c1906115a7565b80601f01602080910402602001604051908101604052809291908181526020018280546105ed906115a7565b801561063a5780601f1061060f5761010080835404028352916020019161063a565b820191906000526020600020905b81548152906001019060200180831161061d57829003601f168201915b50505050508152505081526020019060010190610541565b50505050815260200160028201805480602002602001604051908101604052809291908181526020016000905b828210156103315760008481526020902060408051606081019091529083018054829060ff1660028111156106b6576106b6611105565b60028111156106c7576106c7611105565b8152905460ff610100820481166020808501919091526201000090920416604090920191909152908252600192909201910161067f565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff1661074857604051630ef4733760e31b815260040160405180910390fd5b61075181610cc3565b50565b61077860405180606001604052806060815260200160608152602001606081525090565b61044a8383610cfe565b6000838152600080516020611fdf833981519152602052604090208054600080516020611fbf833981519152919061010090046001600160a01b031615806107cc5750805460ff16155b156107ea57604051637ad5a43960e11b815260040160405180910390fd5b600084815260028201602052604090205460ff161561081c57604051637912b73960e01b815260040160405180910390fd5b600084815260018201602052604081205481908190815b81811015610943576000898152600187016020526040812080548390811061085d5761085d611af1565b60009182526020909120018054909150336001600160a01b03909116036108e95760008154600160a01b900460ff16600281111561089d5761089d611105565b146108bb576040516347592a4d60e01b815260040160405180910390fd5b80548990829060ff60a01b1916600160a01b8360028111156108df576108df611105565b0217905550600195505b8054600160a01b900460ff16600181600281111561090957610909611105565b0361091957856001019550610939565b600281600281111561092d5761092d611105565b03610939578460010194505b5050600101610833565b508361096257604051638223a7e960e01b815260040160405180910390fd5b61096d600282611b07565b8311806109835750610980600282611b07565b82115b156109f95760008881526002860160205260408120805460ff191660011790558284116109b15760026109b4565b60015b9050897fb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c633826040516109e69190611b29565b60405180910390a26109f78a610df8565b505b505050505050505050565b6000838152600080516020611fdf833981519152602052604090208054600080516020611fbf833981519152919060ff1615610a9457600481015460005b81811015610a915784836004018281548110610a6057610a60611af1565b906000526020600020015403610a89576040516301ab53df60e31b815260040160405180910390fd5b600101610a42565b50505b81546001600160a01b0316610aab57610aab610ece565b8154604051634f84544560e01b8152600560048201526000916001600160a01b031690634f84544590602401600060405180830381865afa158015610af4573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610b1c9190810190611bfb565b825490915060ff16610b5d5781546003830180546001600160a01b0319166001600160a01b0388161790556001600160a81b03191661010033021760011782555b600482018054600181018255600091825260208220018590558151905b81811015610c52578360010160008781526020019081526020016000206040518060400160405280858481518110610bb457610bb4611af1565b60200260200101516001600160a01b0316815260200160006002811115610bdd57610bdd611105565b9052815460018101835560009283526020928390208251910180546001600160a01b031981166001600160a01b03909316928317825593830151929390929183916001600160a81b03191617600160a01b836002811115610c4057610c40611105565b02179055505050806001019050610b7a565b50835460405163541da4e560e01b81526001600160a01b039091169063541da4e590610c889033908b908a908890600401611c99565b600060405180830381600087803b158015610ca257600080fd5b505af1158015610cb6573d6000803e3d6000fd5b5050505050505050505050565b610cd3636afd38fd60e11b610f9f565b600080516020611fbf83398151915280546001600160a01b0319166001600160a01b03831617905550565b610d2260405180606001604052806060815260200160608152602001606081525090565b6000838152600080516020611fdf833981519152602052604081208054600080516020611fbf8339815191529260ff90911615159003610d7557604051637ad5a43960e11b815260040160405180910390fd5b600381015460405163069a3ee960e01b8152600481018690526001600160a01b0390911690819063069a3ee990602401600060405180830381865afa158015610dc2573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610dea9190810190611e62565b9695505050505050565b5050565b6000818152600080516020611fdf833981519152602052604081206004810154600080516020611fbf833981519152925b81811015610e7957826001016000846004018381548110610e4c57610e4c611af1565b906000526020600020015481526020019081526020016000206000610e719190611078565b600101610e29565b50610e88600483016000611096565b6000848152600184016020526040812080546001600160a81b03191681556003810180546001600160a01b031916905590610ec66004830182611096565b505050505050565b6000600080516020611fbf833981519152905060007fc21004fcc619240a31f006438274d15cd813308303284436eef6055f0fdcb60060060154604051628956cd60e71b81526c29b830b1b2a7b832b930ba37b960991b60048201526001600160a01b03909116906344ab668090602401602060405180830381865afa158015610f5c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610f809190611fa1565b82546001600160a01b0319166001600160a01b03919091161790915550565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff16611027576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff19166001179055611040565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b508054600082559060005260206000209081019061075191906110b4565b508054600082559060005260206000209081019061075191906110d7565b5b808211156110d35780546001600160a81b03191681556001016110b5565b5090565b5b808211156110d357600081556001016110d8565b6000602082840312156110fe57600080fd5b5035919050565b634e487b7160e01b600052602160045260246000fd5b6003811061075157610751611105565b60008151808452602080850194506020840160005b8381101561117357815180516111558161111b565b885283015160ff168388015260409096019590820190600101611140565b509495945050505050565b6006811061118e5761118e611105565b9052565b60008151808452602080850194506020840160005b8381101561117357815180516111bc8161111b565b88528084015160ff908116858a01526040918201511690880152606090960195908201906001016111a7565b600060208083526080845160608084870152611207608087018361112b565b915083870151601f196040818986030160408a015284835180875288870191508885019650600094505b8085101561127a57865161124683825161117e565b808a0151838b0152838101516001600160a01b03168484015286015186830152958801956001949094019390870190611231565b5060408b01519750828a82030160608b01526112968189611192565b9b9a5050505050505050505050565b6003811061075157600080fd5b6000806000606084860312156112c757600080fd5b833592506020840135915060408401356112e0816112a5565b809150509250925092565b600080604083850312156112fe57600080fd5b8235915060208301356001600160401b0381111561131b57600080fd5b83016060818603121561132d57600080fd5b809150509250929050565b600060208083526080845160608084870152611357608087018361112b565b915083870151601f196040818986030160408a01528483518087528887019150888160051b88010189860195506000805b8381101561141657868a840301855287516113a484825161117e565b808d0151848e0152868101516001600160a01b0316878501528901518984018c905280518c8501819052835b818110156113ec578281018f015186820160a001528e016113d0565b5060a08186018101859052998e0199968e0196601f90910189169094019093019250600101611388565b505060408d01519950848c82030160608d0152611433818b611192565b9d9c50505050505050505050505050565b6001600160a01b038116811461075157600080fd5b60006020828403121561146b57600080fd5b813561044a81611444565b6000806040838503121561148957600080fd5b50508035926020909101359150565b634e487b7160e01b600052604160045260246000fd5b600281901b6001600160fe1b03821682146114d957634e487b7160e01b600052601160045260246000fd5b919050565b60ff8116811461075157600080fd5b81356114f8816112a5565b6115018161111b565b60ff1982541660ff8216811783555050602082013561151f816114de565b815461ff001916600882901b61ff0016178255505050565b6000808335601e1984360301811261154e57600080fd5b8301803591506001600160401b0382111561156857600080fd5b6020019150600581901b360382131561158057600080fd5b9250929050565b60008235607e1983360301811261159d57600080fd5b9190910192915050565b600181811c908216806115bb57607f821691505b6020821081036115db57634e487b7160e01b600052602260045260246000fd5b50919050565b5b81811015610df457600081556001016115e2565b6006811061075157600080fd5b601f8211156103de57806000526020600020601f840160051c8101602085101561162a5750805b61163c601f850160051c8301826115e1565b5050505050565b6001600160401b0383111561165a5761165a611498565b61166e8361166883546115a7565b83611603565b6000601f8411600181146116a2576000851561168a5750838201355b600019600387901b1c1916600186901b17835561163c565b600083815260209020601f19861690835b828110156116d357868501358255602094850194600190920191016116b3565b50868210156116f05760001960f88860031b161c19848701351681555b505060018560011b0183555050505050565b813561170d816115f6565b6006811061171d5761171d611105565b60ff1982541660ff82168117835550506020820135600182015560028101604083013561174981611444565b81546001600160a01b0319166001600160a01b0391909116179055606082013536839003601e1901811261177c57600080fd5b820180356001600160401b0381111561179457600080fd5b6020820191508036038213156117a957600080fd5b6117b7818360038601611643565b50505050565b600160401b8311156117d1576117d1611498565b805483825580841015611884576117e7816114ae565b6117f0856114ae565b6000848152602081209283019291909101905b8282101561188057808255600181818401558160028401556003830161182981546115a7565b801561187257601f808211600181146118445785845561186f565b60008481526020902061186083850160051c82018783016115e1565b50600084815260208120818655555b50505b505050600482019150611803565b5050505b5060008181526020812083915b85811015610ec6576118ac6118a68487611587565b83611702565b6020929092019160049190910190600101611891565b6000808335601e198436030181126118d957600080fd5b8301803591506001600160401b038211156118f357600080fd5b602001915060608102360382131561158057600080fd5b8135611915816112a5565b61191e8161111b565b60ff1982541660ff8216811783555050602082013561193c816114de565b815461ff001916600882901b61ff001617825550604082013561195e816114de565b815462ff0000191660109190911b62ff00001617905550565b600160401b83111561198b5761198b611498565b8054838255808410156119c2576000828152602081208581019083015b808210156119be578282556001820191506119a8565b5050505b5060008181526020812083915b85811015610ec6576119e1838361190a565b60609290920191600191820191016119cf565b8135601e19833603018112611a0857600080fd5b820180356001600160401b03811115611a2057600080fd5b6020820191508060061b3603821315611a3857600080fd5b600160401b811115611a4c57611a4c611498565b825481845580821015611a83576000848152602081208381019083015b80821015611a7f57828255600182019150611a69565b5050505b5060008381526020902060005b82811015611ab557611aa284836114ed565b6040939093019260019182019101611a90565b50505050611ac66020830183611537565b611ad48183600186016117bd565b5050611ae360408301836118c2565b6117b7818360028601611977565b634e487b7160e01b600052603260045260246000fd5b600082611b2457634e487b7160e01b600052601260045260246000fd5b500490565b60208101611b368361111b565b91905290565b604051608081016001600160401b0381118282101715611b5e57611b5e611498565b60405290565b604051606081016001600160401b0381118282101715611b5e57611b5e611498565b604080519081016001600160401b0381118282101715611b5e57611b5e611498565b604051601f8201601f191681016001600160401b0381118282101715611bd057611bd0611498565b604052919050565b60006001600160401b03821115611bf157611bf1611498565b5060051b60200190565b60006020808385031215611c0e57600080fd5b82516001600160401b03811115611c2457600080fd5b8301601f81018513611c3557600080fd5b8051611c48611c4382611bd8565b611ba8565b81815260059190911b82018301908381019087831115611c6757600080fd5b928401925b82841015611c8e578351611c7f81611444565b82529284019290840190611c6c565b979650505050505050565b60006080820160018060a01b03808816845260208760208601528660408601526080606086015282865180855260a08701915060208801945060005b81811015611cf3578551851683529483019491830191600101611cd5565b50909a9950505050505050505050565b600082601f830112611d1457600080fd5b81516020611d24611c4383611bd8565b82815260079290921b84018101918181019086841115611d4357600080fd5b8286015b84811015611da85760808189031215611d605760008081fd5b611d68611b3c565b8151611d73816115f6565b81528185015185820152604080830151611d8c81611444565b9082015260608281015190820152835291830191608001611d47565b509695505050505050565b600082601f830112611dc457600080fd5b81516020611dd4611c4383611bd8565b82815260609283028501820192828201919087851115611df357600080fd5b8387015b85811015611e555781818a031215611e0f5760008081fd5b611e17611b64565b8151611e22816112a5565b815281860151611e31816114de565b81870152604082810151611e44816114de565b908201528452928401928101611df7565b5090979650505050505050565b60006020808385031215611e7557600080fd5b82516001600160401b0380821115611e8c57600080fd5b9084019060608287031215611ea057600080fd5b611ea8611b64565b825182811115611eb757600080fd5b8301601f81018813611ec857600080fd5b8051611ed6611c4382611bd8565b81815260069190911b8201860190868101908a831115611ef557600080fd5b928701925b82841015611f4b576040848c031215611f135760008081fd5b611f1b611b86565b8451611f26816112a5565b815284890151611f35816114de565b818a015282526040939093019290870190611efa565b84525050508284015182811115611f6157600080fd5b611f6d88828601611d03565b85830152506040830151935081841115611f8657600080fd5b611f9287858501611db3565b60408201529695505050505050565b600060208284031215611fb357600080fd5b815161044a8161144456fe9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e009075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e01",
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

// GetRuleDataV2 is a free data retrieval call binding the contract method 0x68ab7dd6.
//
// Solidity: function getRuleDataV2(uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]))
func (_MockEntitlementGated *MockEntitlementGatedCaller) GetRuleDataV2(opts *bind.CallOpts, roleId *big.Int) (IRuleEntitlementBaseRuleDataV2, error) {
	var out []interface{}
	err := _MockEntitlementGated.contract.Call(opts, &out, "getRuleDataV2", roleId)

	if err != nil {
		return *new(IRuleEntitlementBaseRuleDataV2), err
	}

	out0 := *abi.ConvertType(out[0], new(IRuleEntitlementBaseRuleDataV2)).(*IRuleEntitlementBaseRuleDataV2)

	return out0, err

}

// GetRuleDataV2 is a free data retrieval call binding the contract method 0x68ab7dd6.
//
// Solidity: function getRuleDataV2(uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]))
func (_MockEntitlementGated *MockEntitlementGatedSession) GetRuleDataV2(roleId *big.Int) (IRuleEntitlementBaseRuleDataV2, error) {
	return _MockEntitlementGated.Contract.GetRuleDataV2(&_MockEntitlementGated.CallOpts, roleId)
}

// GetRuleDataV2 is a free data retrieval call binding the contract method 0x68ab7dd6.
//
// Solidity: function getRuleDataV2(uint256 roleId) view returns(((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]))
func (_MockEntitlementGated *MockEntitlementGatedCallerSession) GetRuleDataV2(roleId *big.Int) (IRuleEntitlementBaseRuleDataV2, error) {
	return _MockEntitlementGated.Contract.GetRuleDataV2(&_MockEntitlementGated.CallOpts, roleId)
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

// RequestEntitlementCheck is a paid mutator transaction binding the contract method 0x679b75cc.
//
// Solidity: function requestEntitlementCheck(uint256 roleId, ((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]) ruleData) returns(bytes32)
func (_MockEntitlementGated *MockEntitlementGatedTransactor) RequestEntitlementCheck(opts *bind.TransactOpts, roleId *big.Int, ruleData IRuleEntitlementBaseRuleDataV2) (*types.Transaction, error) {
	return _MockEntitlementGated.contract.Transact(opts, "requestEntitlementCheck", roleId, ruleData)
}

// RequestEntitlementCheck is a paid mutator transaction binding the contract method 0x679b75cc.
//
// Solidity: function requestEntitlementCheck(uint256 roleId, ((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]) ruleData) returns(bytes32)
func (_MockEntitlementGated *MockEntitlementGatedSession) RequestEntitlementCheck(roleId *big.Int, ruleData IRuleEntitlementBaseRuleDataV2) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.RequestEntitlementCheck(&_MockEntitlementGated.TransactOpts, roleId, ruleData)
}

// RequestEntitlementCheck is a paid mutator transaction binding the contract method 0x679b75cc.
//
// Solidity: function requestEntitlementCheck(uint256 roleId, ((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]) ruleData) returns(bytes32)
func (_MockEntitlementGated *MockEntitlementGatedTransactorSession) RequestEntitlementCheck(roleId *big.Int, ruleData IRuleEntitlementBaseRuleDataV2) (*types.Transaction, error) {
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
