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
	ABI: "[{\"type\":\"constructor\",\"inputs\":[{\"name\":\"checker\",\"type\":\"address\",\"internalType\":\"contractIEntitlementChecker\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"__EntitlementGated_init\",\"inputs\":[{\"name\":\"entitlementChecker\",\"type\":\"address\",\"internalType\":\"contractIEntitlementChecker\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getRuleData\",\"inputs\":[{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRuleData\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRuleDataV2\",\"inputs\":[{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleDataV2\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperationV2[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"params\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"postEntitlementCheckResult\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"result\",\"type\":\"uint8\",\"internalType\":\"enumIEntitlementGatedBase.NodeVoteStatus\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"requestEntitlementCheck\",\"inputs\":[{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ruleData\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleData\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"threshold\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"outputs\":[{\"name\":\"\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"requestEntitlementCheckV2\",\"inputs\":[{\"name\":\"roleId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ruleData\",\"type\":\"tuple\",\"internalType\":\"structIRuleEntitlementBase.RuleDataV2\",\"components\":[{\"name\":\"operations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.Operation[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CombinedOperationType\"},{\"name\":\"index\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]},{\"name\":\"checkOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.CheckOperationV2[]\",\"components\":[{\"name\":\"opType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.CheckOperationType\"},{\"name\":\"chainId\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"contractAddress\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"params\",\"type\":\"bytes\",\"internalType\":\"bytes\"}]},{\"name\":\"logicalOperations\",\"type\":\"tuple[]\",\"internalType\":\"structIRuleEntitlementBase.LogicalOperation[]\",\"components\":[{\"name\":\"logOpType\",\"type\":\"uint8\",\"internalType\":\"enumIRuleEntitlementBase.LogicalOperationType\"},{\"name\":\"leftOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"},{\"name\":\"rightOperationIndex\",\"type\":\"uint8\",\"internalType\":\"uint8\"}]}]}],\"outputs\":[{\"name\":\"\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"EntitlementCheckResultPosted\",\"inputs\":[{\"name\":\"transactionId\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"result\",\"type\":\"uint8\",\"indexed\":false,\"internalType\":\"enumIEntitlementGatedBase.NodeVoteStatus\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Initialized\",\"inputs\":[{\"name\":\"version\",\"type\":\"uint32\",\"indexed\":false,\"internalType\":\"uint32\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceAdded\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceRemoved\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"EntitlementGated_InvalidAddress\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeAlreadyVoted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_NodeNotFound\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyCompleted\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionCheckAlreadyRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"EntitlementGated_TransactionNotRegistered\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_InInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_NotInInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_AlreadySupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_NotSupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"ReentrancyGuard__ReentrantCall\",\"inputs\":[]}]",
	Bin: "0x60806040523480156200001157600080fd5b50604051620023a8380380620023a8833981016040819052620000349162000127565b6200003e6200007f565b7f9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e0080546001600160a01b0319166001600160a01b0383161790555062000159565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff1615620000cc576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156200012457805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b6000602082840312156200013a57600080fd5b81516001600160a01b03811681146200015257600080fd5b9392505050565b61223f80620001696000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c806368ab7dd61161005b57806368ab7dd6146100e15780637adc9cbe1461010157806392c399ff14610114578063ea7aafb71461012757600080fd5b8063069a3ee9146100825780634739e805146100ab57806357e70027146100c0575b600080fd5b610095610090366004611133565b61013a565b6040516100a2919061122f565b60405180910390f35b6100be6100b93660046112f9565b61036d565b005b6100d36100ce36600461134a565b610411565b6040519081526020016100a2565b6100f46100ef366004611133565b61047e565b6040516100a29190611390565b6100be61010f3660046114b1565b61072b565b6100956101223660046114ce565b610781565b6100d361013536600461134a565b6107af565b61015e60405180606001604052806060815260200160608152602001606081525090565b6000828152602081815260408083208151815460809481028201850190935260608101838152909491938593919285929185015b828210156101fb57600084815260209020604080518082019091529083018054829060ff1660028111156101c8576101c861114c565b60028111156101d9576101d961114c565b81529054610100900460ff166020918201529082526001929092019101610192565b50505050815260200160018201805480602002602001604051908101604052809291908181526020016000905b828210156102b3576000848152602090206040805160808101909152600484029091018054829060ff1660058111156102635761026361114c565b60058111156102745761027461114c565b815260018281015460208084019190915260028401546001600160a01b0316604084015260039093015460609092019190915291835292019101610228565b50505050815260200160028201805480602002602001604051908101604052809291908181526020016000905b8282101561035f5760008481526020902060408051606081019091529083018054829060ff1660028111156103175761031761114c565b60028111156103285761032861114c565b8152905460ff61010082048116602080850191909152620100009092041660409092019190915290825260019290920191016102e0565b505050915250909392505050565b60027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0054036103af57604051635db5c7cd60e11b815260040160405180910390fd5b6103d860027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b6103e38383836107c9565b61040c60017f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b505050565b6000828152602081905260408120829061042b828261189b565b50506040516bffffffffffffffffffffffff193260601b166020820152436034820152600090605401604051602081830303815290604052805190602001209050610477813086610a4b565b9392505050565b6104a260405180606001604052806060815260200160608152602001606081525090565b60008281526001602090815260408083208151815460809481028201850190935260608101838152909491938593919285929185015b8282101561054157600084815260209020604080518082019091529083018054829060ff16600281111561050e5761050e61114c565b600281111561051f5761051f61114c565b81529054610100900460ff1660209182015290825260019290920191016104d8565b50505050815260200160018201805480602002602001604051908101604052809291908181526020016000905b8282101561067f576000848152602090206040805160808101909152600484029091018054829060ff1660058111156105a9576105a961114c565b60058111156105ba576105ba61114c565b81526001820154602082015260028201546001600160a01b031660408201526003820180546060909201916105ee90611964565b80601f016020809104026020016040519081016040528092919081815260200182805461061a90611964565b80156106675780601f1061063c57610100808354040283529160200191610667565b820191906000526020600020905b81548152906001019060200180831161064a57829003601f168201915b5050505050815250508152602001906001019061056e565b50505050815260200160028201805480602002602001604051908101604052809291908181526020016000905b8282101561035f5760008481526020902060408051606081019091529083018054829060ff1660028111156106e3576106e361114c565b60028111156106f4576106f461114c565b8152905460ff61010082048116602080850191909152620100009092041660409092019190915290825260019290920191016106ac565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff1661077557604051630ef4733760e31b815260040160405180910390fd5b61077e81610d0a565b50565b6107a560405180606001604052806060815260200160608152602001606081525090565b6104778383610d45565b6000828152600160205260408120829061042b8282611c8b565b600083815260008051602061221f8339815191526020526040902080546000805160206121ff833981519152919061010090046001600160a01b031615806108135750805460ff16155b1561083157604051637ad5a43960e11b815260040160405180910390fd5b600084815260028201602052604090205460ff161561086357604051637912b73960e01b815260040160405180910390fd5b600084815260018201602052604081205481908190815b8181101561098a57600089815260018701602052604081208054839081106108a4576108a4611d31565b60009182526020909120018054909150336001600160a01b03909116036109305760008154600160a01b900460ff1660028111156108e4576108e461114c565b14610902576040516347592a4d60e01b815260040160405180910390fd5b80548990829060ff60a01b1916600160a01b8360028111156109265761092661114c565b0217905550600195505b8054600160a01b900460ff1660018160028111156109505761095061114c565b0361096057856001019550610980565b60028160028111156109745761097461114c565b03610980578460010194505b505060010161087a565b50836109a957604051638223a7e960e01b815260040160405180910390fd5b6109b4600282611d47565b8311806109ca57506109c7600282611d47565b82115b15610a405760008881526002860160205260408120805460ff191660011790558284116109f85760026109fb565b60015b9050897fb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c63382604051610a2d9190611d69565b60405180910390a2610a3e8a610e3f565b505b505050505050505050565b600083815260008051602061221f8339815191526020526040902080546000805160206121ff833981519152919060ff1615610adb57600481015460005b81811015610ad85784836004018281548110610aa757610aa7611d31565b906000526020600020015403610ad0576040516301ab53df60e31b815260040160405180910390fd5b600101610a89565b50505b81546001600160a01b0316610af257610af2610f15565b8154604051634f84544560e01b8152600560048201526000916001600160a01b031690634f84544590602401600060405180830381865afa158015610b3b573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610b639190810190611e3b565b825490915060ff16610ba45781546003830180546001600160a01b0319166001600160a01b0388161790556001600160a81b03191661010033021760011782555b600482018054600181018255600091825260208220018590558151905b81811015610c99578360010160008781526020019081526020016000206040518060400160405280858481518110610bfb57610bfb611d31565b60200260200101516001600160a01b0316815260200160006002811115610c2457610c2461114c565b9052815460018101835560009283526020928390208251910180546001600160a01b031981166001600160a01b03909316928317825593830151929390929183916001600160a81b03191617600160a01b836002811115610c8757610c8761114c565b02179055505050806001019050610bc1565b50835460405163541da4e560e01b81526001600160a01b039091169063541da4e590610ccf9033908b908a908890600401611ed9565b600060405180830381600087803b158015610ce957600080fd5b505af1158015610cfd573d6000803e3d6000fd5b5050505050505050505050565b610d1a636afd38fd60e11b610fe6565b6000805160206121ff83398151915280546001600160a01b0319166001600160a01b03831617905550565b610d6960405180606001604052806060815260200160608152602001606081525090565b600083815260008051602061221f8339815191526020526040812080546000805160206121ff8339815191529260ff90911615159003610dbc57604051637ad5a43960e11b815260040160405180910390fd5b600381015460405163069a3ee960e01b8152600481018690526001600160a01b0390911690819063069a3ee990602401600060405180830381865afa158015610e09573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610e3191908101906120a2565b9695505050505050565b5050565b600081815260008051602061221f8339815191526020526040812060048101546000805160206121ff833981519152925b81811015610ec057826001016000846004018381548110610e9357610e93611d31565b906000526020600020015481526020019081526020016000206000610eb891906110bf565b600101610e70565b50610ecf6004830160006110dd565b6000848152600184016020526040812080546001600160a81b03191681556003810180546001600160a01b031916905590610f0d60048301826110dd565b505050505050565b60006000805160206121ff833981519152905060007fc21004fcc619240a31f006438274d15cd813308303284436eef6055f0fdcb60060060154604051628956cd60e71b81526c29b830b1b2a7b832b930ba37b960991b60048201526001600160a01b03909116906344ab668090602401602060405180830381865afa158015610fa3573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610fc791906121e1565b82546001600160a01b0319166001600160a01b03919091161790915550565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff1661106e576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff19166001179055611087565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b508054600082559060005260206000209081019061077e91906110fb565b508054600082559060005260206000209081019061077e919061111e565b5b8082111561111a5780546001600160a81b03191681556001016110fc565b5090565b5b8082111561111a576000815560010161111f565b60006020828403121561114557600080fd5b5035919050565b634e487b7160e01b600052602160045260246000fd5b6003811061077e5761077e61114c565b60008151808452602080850194506020840160005b838110156111ba578151805161119c81611162565b885283015160ff168388015260409096019590820190600101611187565b509495945050505050565b600681106111d5576111d561114c565b9052565b60008151808452602080850194506020840160005b838110156111ba578151805161120381611162565b88528084015160ff908116858a01526040918201511690880152606090960195908201906001016111ee565b60006020808352608084516060808487015261124e6080870183611172565b915083870151601f196040818986030160408a015284835180875288870191508885019650600094505b808510156112c157865161128d8382516111c5565b808a0151838b0152838101516001600160a01b03168484015286015186830152958801956001949094019390870190611278565b5060408b01519750828a82030160608b01526112dd81896111d9565b9b9a5050505050505050505050565b6003811061077e57600080fd5b60008060006060848603121561130e57600080fd5b83359250602084013591506040840135611327816112ec565b809150509250925092565b60006060828403121561134457600080fd5b50919050565b6000806040838503121561135d57600080fd5b8235915060208301356001600160401b0381111561137a57600080fd5b61138685828601611332565b9150509250929050565b6000602080835260808451606080848701526113af6080870183611172565b915083870151601f196040818986030160408a01528483518087528887019150888160051b88010189860195506000805b8381101561146e57868a840301855287516113fc8482516111c5565b808d0151848e0152868101516001600160a01b0316878501528901518984018c905280518c8501819052835b81811015611444578281018f015186820160a001528e01611428565b5060a08186018101859052998e0199968e0196601f909101891690940190930192506001016113e0565b505060408d01519950848c82030160608d015261148b818b6111d9565b9d9c50505050505050505050505050565b6001600160a01b038116811461077e57600080fd5b6000602082840312156114c357600080fd5b81356104778161149c565b600080604083850312156114e157600080fd5b50508035926020909101359150565b6000808335601e1984360301811261150757600080fd5b8301803591506001600160401b0382111561152157600080fd5b6020019150600681901b360382131561153957600080fd5b9250929050565b634e487b7160e01b600052604160045260246000fd5b600281901b6001600160fe1b038216821461158157634e487b7160e01b600052601160045260246000fd5b919050565b60ff8116811461077e57600080fd5b81356115a0816112ec565b6115a981611162565b60ff1982541660ff821681178355505060208201356115c781611586565b815461ff001916600882901b61ff0016178255505050565b6000808335601e198436030181126115f657600080fd5b8301803591506001600160401b0382111561161057600080fd5b6020019150600781901b360382131561153957600080fd5b6006811061077e57600080fd5b600682106116455761164561114c565b60ff1981541660ff831681178255505050565b80546001600160a01b0319166001600160a01b0392909216919091179055565b813561168381611628565b61168d8183611635565b506020820135600182015560408201356116a68161149c565b6116b38160028401611658565b50606082013560038201555050565b600160401b8311156116d6576116d6611540565b805483825580841015611734576116ec81611556565b6116f585611556565b6000848152602081209283019291909101905b8282101561173057808255806001830155806002830155806003830155600482019150611708565b5050505b5060008181526020812083915b85811015610f0d576117538383611678565b6080929092019160049190910190600101611741565b6000808335601e1984360301811261178057600080fd5b8301803591506001600160401b0382111561179a57600080fd5b602001915060608102360382131561153957600080fd5b81356117bc816112ec565b6117c581611162565b60ff1982541660ff821681178355505060208201356117e381611586565b815461ff001916600882901b61ff001617825550604082013561180581611586565b815462ff0000191660109190911b62ff00001617905550565b600160401b83111561183257611832611540565b805483825580841015611869576000828152602081208581019083015b808210156118655782825560018201915061184f565b5050505b5060008181526020812083915b85811015610f0d5761188883836117b1565b6060929092019160019182019101611876565b6118a582836114f0565b600160401b8111156118b9576118b9611540565b8254818455808210156118f0576000848152602081208381019083015b808210156118ec578282556001820191506118d6565b5050505b5060008381526020902060005b828110156119225761190f8483611595565b60409390930192600191820191016118fd565b5050505061193360208301836115df565b6119418183600186016116c2565b50506119506040830183611769565b61195e81836002860161181e565b50505050565b600181811c9082168061197857607f821691505b60208210810361134457634e487b7160e01b600052602260045260246000fd5b6000808335601e198436030181126119af57600080fd5b8301803591506001600160401b038211156119c957600080fd5b6020019150600581901b360382131561153957600080fd5b60008235607e198336030181126119f757600080fd5b9190910192915050565b5b81811015610e3b5760008155600101611a02565b601f82111561040c57806000526020600020601f840160051c81016020851015611a3d5750805b611a4f601f850160051c830182611a01565b5050505050565b8135611a6181611628565b611a6b8183611635565b50600160208084013560018401556040840135611a878161149c565b611a948160028601611658565b50600383016060850135601e19863603018112611ab057600080fd5b850180356001600160401b03811115611ac857600080fd5b8036038483011315611ad957600080fd5b611aed81611ae78554611964565b85611a16565b6000601f821160018114611b235760008315611b0b57508382018601355b600019600385901b1c1916600184901b178555610a40565b600085815260209020601f19841690835b82811015611b5357868501890135825593880193908901908801611b34565b5084821015611b725760001960f88660031b161c198885880101351681555b50505050600190811b019091555050505050565b600160401b831115611b9a57611b9a611540565b805483825580841015611c4d57611bb081611556565b611bb985611556565b6000848152602081209283019291909101905b82821015611c49578082556001818184015581600284015560038301611bf28154611964565b8015611c3b57601f80821160018114611c0d57858455611c38565b600084815260209020611c2983850160051c8201878301611a01565b50600084815260208120818655555b50505b505050600482019150611bcc565b5050505b5060008181526020812083915b85811015610f0d57611c75611c6f84876119e1565b83611a56565b6020929092019160049190910190600101611c5a565b611c9582836114f0565b600160401b811115611ca957611ca9611540565b825481845580821015611ce0576000848152602081208381019083015b80821015611cdc57828255600182019150611cc6565b5050505b5060008381526020902060005b82811015611d1257611cff8483611595565b6040939093019260019182019101611ced565b50505050611d236020830183611998565b611941818360018601611b86565b634e487b7160e01b600052603260045260246000fd5b600082611d6457634e487b7160e01b600052601260045260246000fd5b500490565b60208101611d7683611162565b91905290565b604051608081016001600160401b0381118282101715611d9e57611d9e611540565b60405290565b604051606081016001600160401b0381118282101715611d9e57611d9e611540565b604080519081016001600160401b0381118282101715611d9e57611d9e611540565b604051601f8201601f191681016001600160401b0381118282101715611e1057611e10611540565b604052919050565b60006001600160401b03821115611e3157611e31611540565b5060051b60200190565b60006020808385031215611e4e57600080fd5b82516001600160401b03811115611e6457600080fd5b8301601f81018513611e7557600080fd5b8051611e88611e8382611e18565b611de8565b81815260059190911b82018301908381019087831115611ea757600080fd5b928401925b82841015611ece578351611ebf8161149c565b82529284019290840190611eac565b979650505050505050565b60006080820160018060a01b03808816845260208760208601528660408601526080606086015282865180855260a08701915060208801945060005b81811015611f33578551851683529483019491830191600101611f15565b50909a9950505050505050505050565b600082601f830112611f5457600080fd5b81516020611f64611e8383611e18565b82815260079290921b84018101918181019086841115611f8357600080fd5b8286015b84811015611fe85760808189031215611fa05760008081fd5b611fa8611d7c565b8151611fb381611628565b81528185015185820152604080830151611fcc8161149c565b9082015260608281015190820152835291830191608001611f87565b509695505050505050565b600082601f83011261200457600080fd5b81516020612014611e8383611e18565b8281526060928302850182019282820191908785111561203357600080fd5b8387015b858110156120955781818a03121561204f5760008081fd5b612057611da4565b8151612062816112ec565b81528186015161207181611586565b8187015260408281015161208481611586565b908201528452928401928101612037565b5090979650505050505050565b600060208083850312156120b557600080fd5b82516001600160401b03808211156120cc57600080fd5b90840190606082870312156120e057600080fd5b6120e8611da4565b8251828111156120f757600080fd5b8301601f8101881361210857600080fd5b8051612116611e8382611e18565b81815260069190911b8201860190868101908a83111561213557600080fd5b928701925b8284101561218b576040848c0312156121535760008081fd5b61215b611dc6565b8451612166816112ec565b81528489015161217581611586565b818a01528252604093909301929087019061213a565b845250505082840151828111156121a157600080fd5b6121ad88828601611f43565b858301525060408301519350818411156121c657600080fd5b6121d287858501611ff3565b60408201529695505050505050565b6000602082840312156121f357600080fd5b81516104778161149c56fe9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e009075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e01",
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

// RequestEntitlementCheckV2 is a paid mutator transaction binding the contract method 0xea7aafb7.
//
// Solidity: function requestEntitlementCheckV2(uint256 roleId, ((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]) ruleData) returns(bytes32)
func (_MockEntitlementGated *MockEntitlementGatedTransactor) RequestEntitlementCheckV2(opts *bind.TransactOpts, roleId *big.Int, ruleData IRuleEntitlementBaseRuleDataV2) (*types.Transaction, error) {
	return _MockEntitlementGated.contract.Transact(opts, "requestEntitlementCheckV2", roleId, ruleData)
}

// RequestEntitlementCheckV2 is a paid mutator transaction binding the contract method 0xea7aafb7.
//
// Solidity: function requestEntitlementCheckV2(uint256 roleId, ((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]) ruleData) returns(bytes32)
func (_MockEntitlementGated *MockEntitlementGatedSession) RequestEntitlementCheckV2(roleId *big.Int, ruleData IRuleEntitlementBaseRuleDataV2) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.RequestEntitlementCheckV2(&_MockEntitlementGated.TransactOpts, roleId, ruleData)
}

// RequestEntitlementCheckV2 is a paid mutator transaction binding the contract method 0xea7aafb7.
//
// Solidity: function requestEntitlementCheckV2(uint256 roleId, ((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]) ruleData) returns(bytes32)
func (_MockEntitlementGated *MockEntitlementGatedTransactorSession) RequestEntitlementCheckV2(roleId *big.Int, ruleData IRuleEntitlementBaseRuleDataV2) (*types.Transaction, error) {
	return _MockEntitlementGated.Contract.RequestEntitlementCheckV2(&_MockEntitlementGated.TransactOpts, roleId, ruleData)
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
