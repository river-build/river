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

// IWalletLinkBaseLinkedWallet is an auto generated low-level Go binding around an user-defined struct.
type IWalletLinkBaseLinkedWallet struct {
	Addr      common.Address
	Signature []byte
	Message   string
}

// WalletLinkMetaData contains all meta data concerning the WalletLink contract.
var WalletLinkMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"function\",\"name\":\"__WalletLink_init\",\"inputs\":[],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"checkIfLinked\",\"inputs\":[{\"name\":\"rootKey\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"wallet\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getLatestNonceForRootKey\",\"inputs\":[{\"name\":\"rootKey\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRootKeyForWallet\",\"inputs\":[{\"name\":\"wallet\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"rootKey\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getWalletsByRootKey\",\"inputs\":[{\"name\":\"rootKey\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"wallets\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"linkCallerToRootKey\",\"inputs\":[{\"name\":\"rootWallet\",\"type\":\"tuple\",\"internalType\":\"structIWalletLinkBase.LinkedWallet\",\"components\":[{\"name\":\"addr\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"signature\",\"type\":\"bytes\",\"internalType\":\"bytes\"},{\"name\":\"message\",\"type\":\"string\",\"internalType\":\"string\"}]},{\"name\":\"nonce\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"linkWalletToRootKey\",\"inputs\":[{\"name\":\"wallet\",\"type\":\"tuple\",\"internalType\":\"structIWalletLinkBase.LinkedWallet\",\"components\":[{\"name\":\"addr\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"signature\",\"type\":\"bytes\",\"internalType\":\"bytes\"},{\"name\":\"message\",\"type\":\"string\",\"internalType\":\"string\"}]},{\"name\":\"rootWallet\",\"type\":\"tuple\",\"internalType\":\"structIWalletLinkBase.LinkedWallet\",\"components\":[{\"name\":\"addr\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"signature\",\"type\":\"bytes\",\"internalType\":\"bytes\"},{\"name\":\"message\",\"type\":\"string\",\"internalType\":\"string\"}]},{\"name\":\"nonce\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"removeLink\",\"inputs\":[{\"name\":\"wallet\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"rootWallet\",\"type\":\"tuple\",\"internalType\":\"structIWalletLinkBase.LinkedWallet\",\"components\":[{\"name\":\"addr\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"signature\",\"type\":\"bytes\",\"internalType\":\"bytes\"},{\"name\":\"message\",\"type\":\"string\",\"internalType\":\"string\"}]},{\"name\":\"nonce\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"sanityCheck\",\"inputs\":[],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"Initialized\",\"inputs\":[{\"name\":\"version\",\"type\":\"uint32\",\"indexed\":false,\"internalType\":\"uint32\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceAdded\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"InterfaceRemoved\",\"inputs\":[{\"name\":\"interfaceId\",\"type\":\"bytes4\",\"indexed\":true,\"internalType\":\"bytes4\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"LinkWalletToRootKey\",\"inputs\":[{\"name\":\"wallet\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"rootKey\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"RemoveLink\",\"inputs\":[{\"name\":\"wallet\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"secondWallet\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"ECDSAInvalidSignature\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"ECDSAInvalidSignatureLength\",\"inputs\":[{\"name\":\"length\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"ECDSAInvalidSignatureS\",\"inputs\":[{\"name\":\"s\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}]},{\"type\":\"error\",\"name\":\"Initializable_InInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Initializable_NotInInitializingState\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_AlreadySupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"Introspection_NotSupported\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"InvalidAccountNonce\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"currentNonce\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"WalletLink__CannotLinkToRootWallet\",\"inputs\":[{\"name\":\"wallet\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"rootKey\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"type\":\"error\",\"name\":\"WalletLink__CannotLinkToSelf\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WalletLink__CannotRemoveRootWallet\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WalletLink__InvalidAddress\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WalletLink__InvalidSignature\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WalletLink__LinkAlreadyExists\",\"inputs\":[{\"name\":\"wallet\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"rootKey\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"type\":\"error\",\"name\":\"WalletLink__LinkedToAnotherRootKey\",\"inputs\":[{\"name\":\"wallet\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"rootKey\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"type\":\"error\",\"name\":\"WalletLink__NotLinked\",\"inputs\":[{\"name\":\"wallet\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"rootKey\",\"type\":\"address\",\"internalType\":\"address\"}]}]",
	Bin: "0x608060405234801561001057600080fd5b5061001961001e565b6100c4565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff161561006a576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156100c157805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b6119f4806100d36000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c80632f461453116100665780632f461453146100ff57806335d2fb64146101125780637246de3d14610125578063912b97581461012d578063f82103981461015057600080fd5b806302345b981461009857806320a00ac8146100c1578063243a7134146100e2578063260a409d146100f7575b600080fd5b6100ab6100a636600461150f565b61017b565b6040516100b8919061152a565b60405180910390f35b6100d46100cf36600461150f565b61018c565b6040519081526020016100b8565b6100f56100f03660046116d7565b610209565b005b6100f5610219565b6100f561010d366004611744565b610275565b6100f5610120366004611789565b610283565b6100f561028e565b61014061013b3660046117cf565b6102ba565b60405190151581526020016100b8565b61016361015e36600461150f565b610303565b6040516001600160a01b0390911681526020016100b8565b606061018682610344565b92915050565b60006101cc6040518060400160405280601881526020017f6765744c61746573744e6f6e6365466f72526f6f744b65790000000000000000815250610375565b6001600160a01b03821660009081527fda5d6d87446d81938877f0ee239dac391146dd7466ea30567f72becf06773c006020526040902054610186565b6102148383836103bb565b505050565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff1661026357604051630ef4733760e31b815260040160405180910390fd5b6102736303bb42d760e11b6107bb565b565b61027f8282610899565b5050565b6102148383836109f5565b6102736040518060400160405280600b81526020016a73616e697479436865636b60a81b815250610375565b6001600160a01b0381811660009081527f19511ce7944c192b1007be99b82019218d1decfc513f05239612743360a0dc01602052604081205490918481169116145b9392505050565b6001600160a01b0380821660009081527f19511ce7944c192b1007be99b82019218d1decfc513f05239612743360a0dc016020526040812054909116610186565b6001600160a01b03811660009081526000805160206119238339815191526020526040902060609061018690610bc0565b6103b8816040516024016103899190611848565b60408051601f198184030181529190526020810180516001600160e01b031663104c13eb60e21b179052610bcd565b50565b6103f96040518060400160405280601781526020017f5f6c696e6b57616c6c6574546f526f6f7457616c6c6574000000000000000000815250610375565b825182516000805160206119238339815191529161041991839190610bee565b600061042e8560400151866000015185610d5f565b9050610463604051806040016040528060128152602001710d8d2dcd6cac840eec2d8d8cae840d0c2e6d60731b815250610375565b61046c81610dc9565b600061047782610e0e565b90506104ac604051806040016040528060128152602001710e4dedee896caf29acae6e6c2ceca90c2e6d60731b815250610375565b6104b581610dc9565b6104e46040518060600160405280602181526020016119d3602191396104df838860200151610e3b565b610e65565b6105196040518060400160405280600f81526020016e3937b7ba2bb0b63632ba1730b2323960891b8152508660000151610e65565b84600001516001600160a01b0316610535828760200151610e3b565b6001600160a01b03161461057d576105646040518060600160405280602481526020016119af60249139610375565b604051632af0041d60e11b815260040160405180910390fd5b61059e60405180606001604052806025815260200161196760259139610375565b6105b18560400151866000015186610d5f565b91506105e46040518060400160405280601081526020016f0e4dedee840eec2d8d8cae840d0c2e6d60831b815250610375565b6105ed82610dc9565b60006105f883610e0e565b905061062c604051806040016040528060118152602001700eec2d8d8cae89acae6e6c2ceca90c2e6d607b1b815250610375565b61063581610dc9565b61067c6040518060400160405280602081526020017f45434453412e7265636f7665722877616c6c65744d65737361676548617368298152506104df838a60200151610e3b565b6106ad6040518060400160405280600b81526020016a3bb0b63632ba1730b2323960a91b8152508860000151610e65565b86600001516001600160a01b03166106c9828960200151610e3b565b6001600160a01b0316146106f85761056460405180606001604052806023815260200161198c60239139610375565b61071960405180606001604052806024815260200161194360249139610375565b85516107259086610eaa565b865186516001600160a01b0316600090815260208690526040902061074991610f1c565b50855187516001600160a01b03908116600090815260018701602052604080822080546001600160a01b0319169484169490941790935588518a51935190831693909216917f64126824352170c4025060d1f6e215159635e4b08e649830695f26ef6d2b57219190a350505050505050565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff161515600114610848576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff19166001179055610861565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b6108d76040518060400160405280601781526020017f5f6c696e6b43616c6c6572546f526f6f7457616c6c6574000000000000000000815250610375565b81516000805160206119238339815191529033906108f89083908390610bee565b600061090985604001518386610d5f565b9050600061091682610e0e565b905085600001516001600160a01b0316610934828860200151610e3b565b6001600160a01b03161461095b57604051632af0041d60e11b815260040160405180910390fd5b85516109679086610eaa565b85516001600160a01b0316600090815260208590526040902061098a9084610f1c565b5085516001600160a01b03848116600081815260018801602052604080822080546001600160a01b0319169585169590951790945589519351939092169290917f64126824352170c4025060d1f6e215159635e4b08e649830695f26ef6d2b572191a3505050505050565b6000805160206119238339815191526001600160a01b0384161580610a22575082516001600160a01b0316155b15610a4057604051636df3f5c360e01b815260040160405180910390fd5b82600001516001600160a01b0316846001600160a01b031603610a76576040516333976e3b60e11b815260040160405180910390fd5b82516001600160a01b0385811660009081526001840160205260409020548116911614610ad1578251604051635e300c8360e01b81526001600160a01b03808716600483015290911660248201526044015b60405180910390fd5b6000610ae284604001518685610d5f565b90506000610aef82610e0e565b905084600001516001600160a01b0316610b0d828760200151610e3b565b6001600160a01b031614610b3457604051632af0041d60e11b815260040160405180910390fd5b8451610b409085610eaa565b6001600160a01b038087166000908152600185016020908152604080832080546001600160a01b03191690558851909316825285905220610b819087610f31565b5060405133906001600160a01b038816907f9a9d98629b39adf596077fc95a0712ba55c38f40a354e99d366a10f9c3e27da290600090a3505050505050565b606060006102fc83610f46565b80516a636f6e736f6c652e6c6f67602083016000808483855afa5050505050565b6001600160a01b0382161580610c0b57506001600160a01b038116155b15610c2957604051636df3f5c360e01b815260040160405180910390fd5b806001600160a01b0316826001600160a01b031603610c5b5760405163848ba26d60e01b815260040160405180910390fd5b6001600160a01b0382811660009081526001850160205260409020541615610ca9576040516314790b7f60e01b81526001600160a01b03808416600483015282166024820152604401610ac8565b6001600160a01b0381811660009081526001850160205260409020541615610d0c576001600160a01b038181166000908152600185016020526040908190205490516347227b5d60e01b8152848316600482015291166024820152604401610ac8565b6001600160a01b0382166000908152602084905260408120610d2d90610fa2565b111561021457604051637b815eed60e11b81526001600160a01b03808416600483015282166024820152604401610ac8565b8251602093840120604080517f6bb89d031fcd292ecd4c0e6855878b7165cebc3a2f35bc6bbac48c088dd8325c81870152808201929092526001600160a01b039390931660608201526080808201929092528251808203909201825260a001909152805191012090565b6103b881604051602401610ddf91815260200190565b60408051601f198184030181529190526020810180516001600160e01b03166327b7cf8560e01b179052610bcd565b6000610186610e1b610fac565b8360405161190160f01b8152600281019290925260228201526042902090565b600080600080610e4b8686610fbb565b925092509250610e5b8282611008565b5090949350505050565b61027f8282604051602401610e7b92919061185b565b60408051601f198184030181529190526020810180516001600160e01b031663319af33360e01b179052610bcd565b6001600160a01b03821660009081527fda5d6d87446d81938877f0ee239dac391146dd7466ea30567f72becf06773c0060205260409020805460018101909155818114610214576040516301d4b62360e61b81526001600160a01b038416600482015260248101829052604401610ac8565b60006102fc836001600160a01b0384166110c1565b60006102fc836001600160a01b038416611110565b606081600001805480602002602001604051908101604052809291908181526020018280548015610f9657602002820191906000526020600020905b815481526020019060010190808311610f82575b50505050509050919050565b6000610186825490565b6000610fb6611203565b905090565b60008060008351604103610ff55760208401516040850151606086015160001a610fe788828585611277565b955095509550505050611001565b50508151600091506002905b9250925092565b600082600381111561101c5761101c611885565b03611025575050565b600182600381111561103957611039611885565b036110575760405163f645eedf60e01b815260040160405180910390fd5b600282600381111561106b5761106b611885565b0361108c5760405163fce698f760e01b815260048101829052602401610ac8565b60038260038111156110a0576110a0611885565b0361027f576040516335e2f38360e21b815260048101829052602401610ac8565b600081815260018301602052604081205461110857508154600181810184556000848152602080822090930184905584548482528286019093526040902091909155610186565b506000610186565b600081815260018301602052604081205480156111f957600061113460018361189b565b85549091506000906111489060019061189b565b90508082146111ad576000866000018281548110611168576111686118bc565b906000526020600020015490508087600001848154811061118b5761118b6118bc565b6000918252602080832090910192909255918252600188019052604090208390555b85548690806111be576111be6118d2565b600190038181906000526020600020016000905590558560010160008681526020019081526020016000206000905560019350505050610186565b6000915050610186565b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f61122e611346565b6112366113be565b60408051602081019490945283019190915260608201524660808201523060a082015260c00160405160208183030381529060405280519060200120905090565b600080807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08411156112b2575060009150600390508261133c565b604080516000808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa158015611306573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b0381166113325750600092506001915082905061133c565b9250600091508190505b9450945094915050565b60008061135161140e565b805190915015611368578051602090910120919050565b7f219639d1c7dec7d049ffb8dc11e39f070f052764b142bd61682a7811a502a6005480156113965792915050565b7fc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4709250505090565b6000806113c96114c2565b8051909150156113e0578051602090910120919050565b7f219639d1c7dec7d049ffb8dc11e39f070f052764b142bd61682a7811a502a6015480156113965792915050565b60607f219639d1c7dec7d049ffb8dc11e39f070f052764b142bd61682a7811a502a600600201805461143f906118e8565b80601f016020809104026020016040519081016040528092919081815260200182805461146b906118e8565b80156114b85780601f1061148d576101008083540402835291602001916114b8565b820191906000526020600020905b81548152906001019060200180831161149b57829003601f168201915b5050505050905090565b60607f219639d1c7dec7d049ffb8dc11e39f070f052764b142bd61682a7811a502a600600301805461143f906118e8565b80356001600160a01b038116811461150a57600080fd5b919050565b60006020828403121561152157600080fd5b6102fc826114f3565b6020808252825182820181905260009190848201906040850190845b8181101561156b5783516001600160a01b031683529284019291840191600101611546565b50909695505050505050565b634e487b7160e01b600052604160045260246000fd5b6040516060810167ffffffffffffffff811182821017156115b0576115b0611577565b60405290565b600067ffffffffffffffff808411156115d1576115d1611577565b604051601f8501601f19908116603f011681019082821181831017156115f9576115f9611577565b8160405280935085815286868601111561161257600080fd5b858560208301376000602087830101525050509392505050565b60006060828403121561163e57600080fd5b61164661158d565b9050611651826114f3565b8152602082013567ffffffffffffffff8082111561166e57600080fd5b818401915084601f83011261168257600080fd5b611691858335602085016115b6565b602084015260408401359150808211156116aa57600080fd5b508201601f810184136116bc57600080fd5b6116cb848235602084016115b6565b60408301525092915050565b6000806000606084860312156116ec57600080fd5b833567ffffffffffffffff8082111561170457600080fd5b6117108783880161162c565b9450602086013591508082111561172657600080fd5b506117338682870161162c565b925050604084013590509250925092565b6000806040838503121561175757600080fd5b823567ffffffffffffffff81111561176e57600080fd5b61177a8582860161162c565b95602094909401359450505050565b60008060006060848603121561179e57600080fd5b6117a7846114f3565b9250602084013567ffffffffffffffff8111156117c357600080fd5b6117338682870161162c565b600080604083850312156117e257600080fd5b6117eb836114f3565b91506117f9602084016114f3565b90509250929050565b6000815180845260005b818110156118285760208185018101518683018201520161180c565b506000602082860101526020601f19601f83011685010191505092915050565b6020815260006102fc6020830184611802565b60408152600061186e6040830185611802565b905060018060a01b03831660208301529392505050565b634e487b7160e01b600052602160045260246000fd5b8181038181111561018657634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052603160045260246000fd5b600181811c908216806118fc57607f821691505b60208210810361191c57634e487b7160e01b600052602260045260246000fd5b5091905056fe19511ce7944c192b1007be99b82019218d1decfc513f05239612743360a0dc0077616c6c65744d65737361676548617368207369676e6174757265207665726966696564726f6f744b65794d65737361676548617368207369676e617475726520766572696669656477616c6c65744d6573736167654861736820696e76616c6964207369676e6174757265726f6f744b65794d6573736167654861736820696e76616c6964207369676e617475726545434453412e7265636f76657228726f6f744b65794d6573736167654861736829",
}

// WalletLinkABI is the input ABI used to generate the binding from.
// Deprecated: Use WalletLinkMetaData.ABI instead.
var WalletLinkABI = WalletLinkMetaData.ABI

// WalletLinkBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use WalletLinkMetaData.Bin instead.
var WalletLinkBin = WalletLinkMetaData.Bin

// DeployWalletLink deploys a new Ethereum contract, binding an instance of WalletLink to it.
func DeployWalletLink(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *WalletLink, error) {
	parsed, err := WalletLinkMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(WalletLinkBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &WalletLink{WalletLinkCaller: WalletLinkCaller{contract: contract}, WalletLinkTransactor: WalletLinkTransactor{contract: contract}, WalletLinkFilterer: WalletLinkFilterer{contract: contract}}, nil
}

// WalletLink is an auto generated Go binding around an Ethereum contract.
type WalletLink struct {
	WalletLinkCaller     // Read-only binding to the contract
	WalletLinkTransactor // Write-only binding to the contract
	WalletLinkFilterer   // Log filterer for contract events
}

// WalletLinkCaller is an auto generated read-only Go binding around an Ethereum contract.
type WalletLinkCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// WalletLinkTransactor is an auto generated write-only Go binding around an Ethereum contract.
type WalletLinkTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// WalletLinkFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type WalletLinkFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// WalletLinkSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type WalletLinkSession struct {
	Contract     *WalletLink       // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// WalletLinkCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type WalletLinkCallerSession struct {
	Contract *WalletLinkCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts     // Call options to use throughout this session
}

// WalletLinkTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type WalletLinkTransactorSession struct {
	Contract     *WalletLinkTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts     // Transaction auth options to use throughout this session
}

// WalletLinkRaw is an auto generated low-level Go binding around an Ethereum contract.
type WalletLinkRaw struct {
	Contract *WalletLink // Generic contract binding to access the raw methods on
}

// WalletLinkCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type WalletLinkCallerRaw struct {
	Contract *WalletLinkCaller // Generic read-only contract binding to access the raw methods on
}

// WalletLinkTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type WalletLinkTransactorRaw struct {
	Contract *WalletLinkTransactor // Generic write-only contract binding to access the raw methods on
}

// NewWalletLink creates a new instance of WalletLink, bound to a specific deployed contract.
func NewWalletLink(address common.Address, backend bind.ContractBackend) (*WalletLink, error) {
	contract, err := bindWalletLink(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &WalletLink{WalletLinkCaller: WalletLinkCaller{contract: contract}, WalletLinkTransactor: WalletLinkTransactor{contract: contract}, WalletLinkFilterer: WalletLinkFilterer{contract: contract}}, nil
}

// NewWalletLinkCaller creates a new read-only instance of WalletLink, bound to a specific deployed contract.
func NewWalletLinkCaller(address common.Address, caller bind.ContractCaller) (*WalletLinkCaller, error) {
	contract, err := bindWalletLink(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &WalletLinkCaller{contract: contract}, nil
}

// NewWalletLinkTransactor creates a new write-only instance of WalletLink, bound to a specific deployed contract.
func NewWalletLinkTransactor(address common.Address, transactor bind.ContractTransactor) (*WalletLinkTransactor, error) {
	contract, err := bindWalletLink(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &WalletLinkTransactor{contract: contract}, nil
}

// NewWalletLinkFilterer creates a new log filterer instance of WalletLink, bound to a specific deployed contract.
func NewWalletLinkFilterer(address common.Address, filterer bind.ContractFilterer) (*WalletLinkFilterer, error) {
	contract, err := bindWalletLink(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &WalletLinkFilterer{contract: contract}, nil
}

// bindWalletLink binds a generic wrapper to an already deployed contract.
func bindWalletLink(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := WalletLinkMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_WalletLink *WalletLinkRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _WalletLink.Contract.WalletLinkCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_WalletLink *WalletLinkRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _WalletLink.Contract.WalletLinkTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_WalletLink *WalletLinkRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _WalletLink.Contract.WalletLinkTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_WalletLink *WalletLinkCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _WalletLink.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_WalletLink *WalletLinkTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _WalletLink.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_WalletLink *WalletLinkTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _WalletLink.Contract.contract.Transact(opts, method, params...)
}

// CheckIfLinked is a free data retrieval call binding the contract method 0x912b9758.
//
// Solidity: function checkIfLinked(address rootKey, address wallet) view returns(bool)
func (_WalletLink *WalletLinkCaller) CheckIfLinked(opts *bind.CallOpts, rootKey common.Address, wallet common.Address) (bool, error) {
	var out []interface{}
	err := _WalletLink.contract.Call(opts, &out, "checkIfLinked", rootKey, wallet)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// CheckIfLinked is a free data retrieval call binding the contract method 0x912b9758.
//
// Solidity: function checkIfLinked(address rootKey, address wallet) view returns(bool)
func (_WalletLink *WalletLinkSession) CheckIfLinked(rootKey common.Address, wallet common.Address) (bool, error) {
	return _WalletLink.Contract.CheckIfLinked(&_WalletLink.CallOpts, rootKey, wallet)
}

// CheckIfLinked is a free data retrieval call binding the contract method 0x912b9758.
//
// Solidity: function checkIfLinked(address rootKey, address wallet) view returns(bool)
func (_WalletLink *WalletLinkCallerSession) CheckIfLinked(rootKey common.Address, wallet common.Address) (bool, error) {
	return _WalletLink.Contract.CheckIfLinked(&_WalletLink.CallOpts, rootKey, wallet)
}

// GetLatestNonceForRootKey is a free data retrieval call binding the contract method 0x20a00ac8.
//
// Solidity: function getLatestNonceForRootKey(address rootKey) view returns(uint256)
func (_WalletLink *WalletLinkCaller) GetLatestNonceForRootKey(opts *bind.CallOpts, rootKey common.Address) (*big.Int, error) {
	var out []interface{}
	err := _WalletLink.contract.Call(opts, &out, "getLatestNonceForRootKey", rootKey)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetLatestNonceForRootKey is a free data retrieval call binding the contract method 0x20a00ac8.
//
// Solidity: function getLatestNonceForRootKey(address rootKey) view returns(uint256)
func (_WalletLink *WalletLinkSession) GetLatestNonceForRootKey(rootKey common.Address) (*big.Int, error) {
	return _WalletLink.Contract.GetLatestNonceForRootKey(&_WalletLink.CallOpts, rootKey)
}

// GetLatestNonceForRootKey is a free data retrieval call binding the contract method 0x20a00ac8.
//
// Solidity: function getLatestNonceForRootKey(address rootKey) view returns(uint256)
func (_WalletLink *WalletLinkCallerSession) GetLatestNonceForRootKey(rootKey common.Address) (*big.Int, error) {
	return _WalletLink.Contract.GetLatestNonceForRootKey(&_WalletLink.CallOpts, rootKey)
}

// GetRootKeyForWallet is a free data retrieval call binding the contract method 0xf8210398.
//
// Solidity: function getRootKeyForWallet(address wallet) view returns(address rootKey)
func (_WalletLink *WalletLinkCaller) GetRootKeyForWallet(opts *bind.CallOpts, wallet common.Address) (common.Address, error) {
	var out []interface{}
	err := _WalletLink.contract.Call(opts, &out, "getRootKeyForWallet", wallet)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetRootKeyForWallet is a free data retrieval call binding the contract method 0xf8210398.
//
// Solidity: function getRootKeyForWallet(address wallet) view returns(address rootKey)
func (_WalletLink *WalletLinkSession) GetRootKeyForWallet(wallet common.Address) (common.Address, error) {
	return _WalletLink.Contract.GetRootKeyForWallet(&_WalletLink.CallOpts, wallet)
}

// GetRootKeyForWallet is a free data retrieval call binding the contract method 0xf8210398.
//
// Solidity: function getRootKeyForWallet(address wallet) view returns(address rootKey)
func (_WalletLink *WalletLinkCallerSession) GetRootKeyForWallet(wallet common.Address) (common.Address, error) {
	return _WalletLink.Contract.GetRootKeyForWallet(&_WalletLink.CallOpts, wallet)
}

// GetWalletsByRootKey is a free data retrieval call binding the contract method 0x02345b98.
//
// Solidity: function getWalletsByRootKey(address rootKey) view returns(address[] wallets)
func (_WalletLink *WalletLinkCaller) GetWalletsByRootKey(opts *bind.CallOpts, rootKey common.Address) ([]common.Address, error) {
	var out []interface{}
	err := _WalletLink.contract.Call(opts, &out, "getWalletsByRootKey", rootKey)

	if err != nil {
		return *new([]common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)

	return out0, err

}

// GetWalletsByRootKey is a free data retrieval call binding the contract method 0x02345b98.
//
// Solidity: function getWalletsByRootKey(address rootKey) view returns(address[] wallets)
func (_WalletLink *WalletLinkSession) GetWalletsByRootKey(rootKey common.Address) ([]common.Address, error) {
	return _WalletLink.Contract.GetWalletsByRootKey(&_WalletLink.CallOpts, rootKey)
}

// GetWalletsByRootKey is a free data retrieval call binding the contract method 0x02345b98.
//
// Solidity: function getWalletsByRootKey(address rootKey) view returns(address[] wallets)
func (_WalletLink *WalletLinkCallerSession) GetWalletsByRootKey(rootKey common.Address) ([]common.Address, error) {
	return _WalletLink.Contract.GetWalletsByRootKey(&_WalletLink.CallOpts, rootKey)
}

// WalletLinkInit is a paid mutator transaction binding the contract method 0x260a409d.
//
// Solidity: function __WalletLink_init() returns()
func (_WalletLink *WalletLinkTransactor) WalletLinkInit(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _WalletLink.contract.Transact(opts, "__WalletLink_init")
}

// WalletLinkInit is a paid mutator transaction binding the contract method 0x260a409d.
//
// Solidity: function __WalletLink_init() returns()
func (_WalletLink *WalletLinkSession) WalletLinkInit() (*types.Transaction, error) {
	return _WalletLink.Contract.WalletLinkInit(&_WalletLink.TransactOpts)
}

// WalletLinkInit is a paid mutator transaction binding the contract method 0x260a409d.
//
// Solidity: function __WalletLink_init() returns()
func (_WalletLink *WalletLinkTransactorSession) WalletLinkInit() (*types.Transaction, error) {
	return _WalletLink.Contract.WalletLinkInit(&_WalletLink.TransactOpts)
}

// LinkCallerToRootKey is a paid mutator transaction binding the contract method 0x2f461453.
//
// Solidity: function linkCallerToRootKey((address,bytes,string) rootWallet, uint256 nonce) returns()
func (_WalletLink *WalletLinkTransactor) LinkCallerToRootKey(opts *bind.TransactOpts, rootWallet IWalletLinkBaseLinkedWallet, nonce *big.Int) (*types.Transaction, error) {
	return _WalletLink.contract.Transact(opts, "linkCallerToRootKey", rootWallet, nonce)
}

// LinkCallerToRootKey is a paid mutator transaction binding the contract method 0x2f461453.
//
// Solidity: function linkCallerToRootKey((address,bytes,string) rootWallet, uint256 nonce) returns()
func (_WalletLink *WalletLinkSession) LinkCallerToRootKey(rootWallet IWalletLinkBaseLinkedWallet, nonce *big.Int) (*types.Transaction, error) {
	return _WalletLink.Contract.LinkCallerToRootKey(&_WalletLink.TransactOpts, rootWallet, nonce)
}

// LinkCallerToRootKey is a paid mutator transaction binding the contract method 0x2f461453.
//
// Solidity: function linkCallerToRootKey((address,bytes,string) rootWallet, uint256 nonce) returns()
func (_WalletLink *WalletLinkTransactorSession) LinkCallerToRootKey(rootWallet IWalletLinkBaseLinkedWallet, nonce *big.Int) (*types.Transaction, error) {
	return _WalletLink.Contract.LinkCallerToRootKey(&_WalletLink.TransactOpts, rootWallet, nonce)
}

// LinkWalletToRootKey is a paid mutator transaction binding the contract method 0x243a7134.
//
// Solidity: function linkWalletToRootKey((address,bytes,string) wallet, (address,bytes,string) rootWallet, uint256 nonce) returns()
func (_WalletLink *WalletLinkTransactor) LinkWalletToRootKey(opts *bind.TransactOpts, wallet IWalletLinkBaseLinkedWallet, rootWallet IWalletLinkBaseLinkedWallet, nonce *big.Int) (*types.Transaction, error) {
	return _WalletLink.contract.Transact(opts, "linkWalletToRootKey", wallet, rootWallet, nonce)
}

// LinkWalletToRootKey is a paid mutator transaction binding the contract method 0x243a7134.
//
// Solidity: function linkWalletToRootKey((address,bytes,string) wallet, (address,bytes,string) rootWallet, uint256 nonce) returns()
func (_WalletLink *WalletLinkSession) LinkWalletToRootKey(wallet IWalletLinkBaseLinkedWallet, rootWallet IWalletLinkBaseLinkedWallet, nonce *big.Int) (*types.Transaction, error) {
	return _WalletLink.Contract.LinkWalletToRootKey(&_WalletLink.TransactOpts, wallet, rootWallet, nonce)
}

// LinkWalletToRootKey is a paid mutator transaction binding the contract method 0x243a7134.
//
// Solidity: function linkWalletToRootKey((address,bytes,string) wallet, (address,bytes,string) rootWallet, uint256 nonce) returns()
func (_WalletLink *WalletLinkTransactorSession) LinkWalletToRootKey(wallet IWalletLinkBaseLinkedWallet, rootWallet IWalletLinkBaseLinkedWallet, nonce *big.Int) (*types.Transaction, error) {
	return _WalletLink.Contract.LinkWalletToRootKey(&_WalletLink.TransactOpts, wallet, rootWallet, nonce)
}

// RemoveLink is a paid mutator transaction binding the contract method 0x35d2fb64.
//
// Solidity: function removeLink(address wallet, (address,bytes,string) rootWallet, uint256 nonce) returns()
func (_WalletLink *WalletLinkTransactor) RemoveLink(opts *bind.TransactOpts, wallet common.Address, rootWallet IWalletLinkBaseLinkedWallet, nonce *big.Int) (*types.Transaction, error) {
	return _WalletLink.contract.Transact(opts, "removeLink", wallet, rootWallet, nonce)
}

// RemoveLink is a paid mutator transaction binding the contract method 0x35d2fb64.
//
// Solidity: function removeLink(address wallet, (address,bytes,string) rootWallet, uint256 nonce) returns()
func (_WalletLink *WalletLinkSession) RemoveLink(wallet common.Address, rootWallet IWalletLinkBaseLinkedWallet, nonce *big.Int) (*types.Transaction, error) {
	return _WalletLink.Contract.RemoveLink(&_WalletLink.TransactOpts, wallet, rootWallet, nonce)
}

// RemoveLink is a paid mutator transaction binding the contract method 0x35d2fb64.
//
// Solidity: function removeLink(address wallet, (address,bytes,string) rootWallet, uint256 nonce) returns()
func (_WalletLink *WalletLinkTransactorSession) RemoveLink(wallet common.Address, rootWallet IWalletLinkBaseLinkedWallet, nonce *big.Int) (*types.Transaction, error) {
	return _WalletLink.Contract.RemoveLink(&_WalletLink.TransactOpts, wallet, rootWallet, nonce)
}

// SanityCheck is a paid mutator transaction binding the contract method 0x7246de3d.
//
// Solidity: function sanityCheck() returns()
func (_WalletLink *WalletLinkTransactor) SanityCheck(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _WalletLink.contract.Transact(opts, "sanityCheck")
}

// SanityCheck is a paid mutator transaction binding the contract method 0x7246de3d.
//
// Solidity: function sanityCheck() returns()
func (_WalletLink *WalletLinkSession) SanityCheck() (*types.Transaction, error) {
	return _WalletLink.Contract.SanityCheck(&_WalletLink.TransactOpts)
}

// SanityCheck is a paid mutator transaction binding the contract method 0x7246de3d.
//
// Solidity: function sanityCheck() returns()
func (_WalletLink *WalletLinkTransactorSession) SanityCheck() (*types.Transaction, error) {
	return _WalletLink.Contract.SanityCheck(&_WalletLink.TransactOpts)
}

// WalletLinkInitializedIterator is returned from FilterInitialized and is used to iterate over the raw logs and unpacked data for Initialized events raised by the WalletLink contract.
type WalletLinkInitializedIterator struct {
	Event *WalletLinkInitialized // Event containing the contract specifics and raw log

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
func (it *WalletLinkInitializedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WalletLinkInitialized)
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
		it.Event = new(WalletLinkInitialized)
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
func (it *WalletLinkInitializedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WalletLinkInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WalletLinkInitialized represents a Initialized event raised by the WalletLink contract.
type WalletLinkInitialized struct {
	Version uint32
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterInitialized is a free log retrieval operation binding the contract event 0xe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c.
//
// Solidity: event Initialized(uint32 version)
func (_WalletLink *WalletLinkFilterer) FilterInitialized(opts *bind.FilterOpts) (*WalletLinkInitializedIterator, error) {

	logs, sub, err := _WalletLink.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &WalletLinkInitializedIterator{contract: _WalletLink.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

// WatchInitialized is a free log subscription operation binding the contract event 0xe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c.
//
// Solidity: event Initialized(uint32 version)
func (_WalletLink *WalletLinkFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *WalletLinkInitialized) (event.Subscription, error) {

	logs, sub, err := _WalletLink.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WalletLinkInitialized)
				if err := _WalletLink.contract.UnpackLog(event, "Initialized", log); err != nil {
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
func (_WalletLink *WalletLinkFilterer) ParseInitialized(log types.Log) (*WalletLinkInitialized, error) {
	event := new(WalletLinkInitialized)
	if err := _WalletLink.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// WalletLinkInterfaceAddedIterator is returned from FilterInterfaceAdded and is used to iterate over the raw logs and unpacked data for InterfaceAdded events raised by the WalletLink contract.
type WalletLinkInterfaceAddedIterator struct {
	Event *WalletLinkInterfaceAdded // Event containing the contract specifics and raw log

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
func (it *WalletLinkInterfaceAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WalletLinkInterfaceAdded)
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
		it.Event = new(WalletLinkInterfaceAdded)
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
func (it *WalletLinkInterfaceAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WalletLinkInterfaceAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WalletLinkInterfaceAdded represents a InterfaceAdded event raised by the WalletLink contract.
type WalletLinkInterfaceAdded struct {
	InterfaceId [4]byte
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterInterfaceAdded is a free log retrieval operation binding the contract event 0x78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f22.
//
// Solidity: event InterfaceAdded(bytes4 indexed interfaceId)
func (_WalletLink *WalletLinkFilterer) FilterInterfaceAdded(opts *bind.FilterOpts, interfaceId [][4]byte) (*WalletLinkInterfaceAddedIterator, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _WalletLink.contract.FilterLogs(opts, "InterfaceAdded", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return &WalletLinkInterfaceAddedIterator{contract: _WalletLink.contract, event: "InterfaceAdded", logs: logs, sub: sub}, nil
}

// WatchInterfaceAdded is a free log subscription operation binding the contract event 0x78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f22.
//
// Solidity: event InterfaceAdded(bytes4 indexed interfaceId)
func (_WalletLink *WalletLinkFilterer) WatchInterfaceAdded(opts *bind.WatchOpts, sink chan<- *WalletLinkInterfaceAdded, interfaceId [][4]byte) (event.Subscription, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _WalletLink.contract.WatchLogs(opts, "InterfaceAdded", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WalletLinkInterfaceAdded)
				if err := _WalletLink.contract.UnpackLog(event, "InterfaceAdded", log); err != nil {
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
func (_WalletLink *WalletLinkFilterer) ParseInterfaceAdded(log types.Log) (*WalletLinkInterfaceAdded, error) {
	event := new(WalletLinkInterfaceAdded)
	if err := _WalletLink.contract.UnpackLog(event, "InterfaceAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// WalletLinkInterfaceRemovedIterator is returned from FilterInterfaceRemoved and is used to iterate over the raw logs and unpacked data for InterfaceRemoved events raised by the WalletLink contract.
type WalletLinkInterfaceRemovedIterator struct {
	Event *WalletLinkInterfaceRemoved // Event containing the contract specifics and raw log

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
func (it *WalletLinkInterfaceRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WalletLinkInterfaceRemoved)
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
		it.Event = new(WalletLinkInterfaceRemoved)
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
func (it *WalletLinkInterfaceRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WalletLinkInterfaceRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WalletLinkInterfaceRemoved represents a InterfaceRemoved event raised by the WalletLink contract.
type WalletLinkInterfaceRemoved struct {
	InterfaceId [4]byte
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterInterfaceRemoved is a free log retrieval operation binding the contract event 0x8bd383568d0bc57b64b8e424138fc19ae827e694e05757faa8fea8f63fb87315.
//
// Solidity: event InterfaceRemoved(bytes4 indexed interfaceId)
func (_WalletLink *WalletLinkFilterer) FilterInterfaceRemoved(opts *bind.FilterOpts, interfaceId [][4]byte) (*WalletLinkInterfaceRemovedIterator, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _WalletLink.contract.FilterLogs(opts, "InterfaceRemoved", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return &WalletLinkInterfaceRemovedIterator{contract: _WalletLink.contract, event: "InterfaceRemoved", logs: logs, sub: sub}, nil
}

// WatchInterfaceRemoved is a free log subscription operation binding the contract event 0x8bd383568d0bc57b64b8e424138fc19ae827e694e05757faa8fea8f63fb87315.
//
// Solidity: event InterfaceRemoved(bytes4 indexed interfaceId)
func (_WalletLink *WalletLinkFilterer) WatchInterfaceRemoved(opts *bind.WatchOpts, sink chan<- *WalletLinkInterfaceRemoved, interfaceId [][4]byte) (event.Subscription, error) {

	var interfaceIdRule []interface{}
	for _, interfaceIdItem := range interfaceId {
		interfaceIdRule = append(interfaceIdRule, interfaceIdItem)
	}

	logs, sub, err := _WalletLink.contract.WatchLogs(opts, "InterfaceRemoved", interfaceIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WalletLinkInterfaceRemoved)
				if err := _WalletLink.contract.UnpackLog(event, "InterfaceRemoved", log); err != nil {
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
func (_WalletLink *WalletLinkFilterer) ParseInterfaceRemoved(log types.Log) (*WalletLinkInterfaceRemoved, error) {
	event := new(WalletLinkInterfaceRemoved)
	if err := _WalletLink.contract.UnpackLog(event, "InterfaceRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// WalletLinkLinkWalletToRootKeyIterator is returned from FilterLinkWalletToRootKey and is used to iterate over the raw logs and unpacked data for LinkWalletToRootKey events raised by the WalletLink contract.
type WalletLinkLinkWalletToRootKeyIterator struct {
	Event *WalletLinkLinkWalletToRootKey // Event containing the contract specifics and raw log

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
func (it *WalletLinkLinkWalletToRootKeyIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WalletLinkLinkWalletToRootKey)
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
		it.Event = new(WalletLinkLinkWalletToRootKey)
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
func (it *WalletLinkLinkWalletToRootKeyIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WalletLinkLinkWalletToRootKeyIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WalletLinkLinkWalletToRootKey represents a LinkWalletToRootKey event raised by the WalletLink contract.
type WalletLinkLinkWalletToRootKey struct {
	Wallet  common.Address
	RootKey common.Address
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterLinkWalletToRootKey is a free log retrieval operation binding the contract event 0x64126824352170c4025060d1f6e215159635e4b08e649830695f26ef6d2b5721.
//
// Solidity: event LinkWalletToRootKey(address indexed wallet, address indexed rootKey)
func (_WalletLink *WalletLinkFilterer) FilterLinkWalletToRootKey(opts *bind.FilterOpts, wallet []common.Address, rootKey []common.Address) (*WalletLinkLinkWalletToRootKeyIterator, error) {

	var walletRule []interface{}
	for _, walletItem := range wallet {
		walletRule = append(walletRule, walletItem)
	}
	var rootKeyRule []interface{}
	for _, rootKeyItem := range rootKey {
		rootKeyRule = append(rootKeyRule, rootKeyItem)
	}

	logs, sub, err := _WalletLink.contract.FilterLogs(opts, "LinkWalletToRootKey", walletRule, rootKeyRule)
	if err != nil {
		return nil, err
	}
	return &WalletLinkLinkWalletToRootKeyIterator{contract: _WalletLink.contract, event: "LinkWalletToRootKey", logs: logs, sub: sub}, nil
}

// WatchLinkWalletToRootKey is a free log subscription operation binding the contract event 0x64126824352170c4025060d1f6e215159635e4b08e649830695f26ef6d2b5721.
//
// Solidity: event LinkWalletToRootKey(address indexed wallet, address indexed rootKey)
func (_WalletLink *WalletLinkFilterer) WatchLinkWalletToRootKey(opts *bind.WatchOpts, sink chan<- *WalletLinkLinkWalletToRootKey, wallet []common.Address, rootKey []common.Address) (event.Subscription, error) {

	var walletRule []interface{}
	for _, walletItem := range wallet {
		walletRule = append(walletRule, walletItem)
	}
	var rootKeyRule []interface{}
	for _, rootKeyItem := range rootKey {
		rootKeyRule = append(rootKeyRule, rootKeyItem)
	}

	logs, sub, err := _WalletLink.contract.WatchLogs(opts, "LinkWalletToRootKey", walletRule, rootKeyRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WalletLinkLinkWalletToRootKey)
				if err := _WalletLink.contract.UnpackLog(event, "LinkWalletToRootKey", log); err != nil {
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

// ParseLinkWalletToRootKey is a log parse operation binding the contract event 0x64126824352170c4025060d1f6e215159635e4b08e649830695f26ef6d2b5721.
//
// Solidity: event LinkWalletToRootKey(address indexed wallet, address indexed rootKey)
func (_WalletLink *WalletLinkFilterer) ParseLinkWalletToRootKey(log types.Log) (*WalletLinkLinkWalletToRootKey, error) {
	event := new(WalletLinkLinkWalletToRootKey)
	if err := _WalletLink.contract.UnpackLog(event, "LinkWalletToRootKey", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// WalletLinkRemoveLinkIterator is returned from FilterRemoveLink and is used to iterate over the raw logs and unpacked data for RemoveLink events raised by the WalletLink contract.
type WalletLinkRemoveLinkIterator struct {
	Event *WalletLinkRemoveLink // Event containing the contract specifics and raw log

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
func (it *WalletLinkRemoveLinkIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WalletLinkRemoveLink)
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
		it.Event = new(WalletLinkRemoveLink)
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
func (it *WalletLinkRemoveLinkIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WalletLinkRemoveLinkIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WalletLinkRemoveLink represents a RemoveLink event raised by the WalletLink contract.
type WalletLinkRemoveLink struct {
	Wallet       common.Address
	SecondWallet common.Address
	Raw          types.Log // Blockchain specific contextual infos
}

// FilterRemoveLink is a free log retrieval operation binding the contract event 0x9a9d98629b39adf596077fc95a0712ba55c38f40a354e99d366a10f9c3e27da2.
//
// Solidity: event RemoveLink(address indexed wallet, address indexed secondWallet)
func (_WalletLink *WalletLinkFilterer) FilterRemoveLink(opts *bind.FilterOpts, wallet []common.Address, secondWallet []common.Address) (*WalletLinkRemoveLinkIterator, error) {

	var walletRule []interface{}
	for _, walletItem := range wallet {
		walletRule = append(walletRule, walletItem)
	}
	var secondWalletRule []interface{}
	for _, secondWalletItem := range secondWallet {
		secondWalletRule = append(secondWalletRule, secondWalletItem)
	}

	logs, sub, err := _WalletLink.contract.FilterLogs(opts, "RemoveLink", walletRule, secondWalletRule)
	if err != nil {
		return nil, err
	}
	return &WalletLinkRemoveLinkIterator{contract: _WalletLink.contract, event: "RemoveLink", logs: logs, sub: sub}, nil
}

// WatchRemoveLink is a free log subscription operation binding the contract event 0x9a9d98629b39adf596077fc95a0712ba55c38f40a354e99d366a10f9c3e27da2.
//
// Solidity: event RemoveLink(address indexed wallet, address indexed secondWallet)
func (_WalletLink *WalletLinkFilterer) WatchRemoveLink(opts *bind.WatchOpts, sink chan<- *WalletLinkRemoveLink, wallet []common.Address, secondWallet []common.Address) (event.Subscription, error) {

	var walletRule []interface{}
	for _, walletItem := range wallet {
		walletRule = append(walletRule, walletItem)
	}
	var secondWalletRule []interface{}
	for _, secondWalletItem := range secondWallet {
		secondWalletRule = append(secondWalletRule, secondWalletItem)
	}

	logs, sub, err := _WalletLink.contract.WatchLogs(opts, "RemoveLink", walletRule, secondWalletRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WalletLinkRemoveLink)
				if err := _WalletLink.contract.UnpackLog(event, "RemoveLink", log); err != nil {
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

// ParseRemoveLink is a log parse operation binding the contract event 0x9a9d98629b39adf596077fc95a0712ba55c38f40a354e99d366a10f9c3e27da2.
//
// Solidity: event RemoveLink(address indexed wallet, address indexed secondWallet)
func (_WalletLink *WalletLinkFilterer) ParseRemoveLink(log types.Log) (*WalletLinkRemoveLink, error) {
	event := new(WalletLinkRemoveLink)
	if err := _WalletLink.contract.UnpackLog(event, "RemoveLink", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
