package crypto

import (
	"crypto/ecdsa"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// Define the EIP-712 domain separator
type EIP712Domain struct {
	Name              string
	Version           string
	ChainId           *big.Int
	VerifyingContract common.Address
}

// Define the LinkedWallet struct
type LinkedWallet struct {
	Message string
	UserID  common.Address
	Nonce   *big.Int
}

func CreateEip712LinkedWalletTypedData(
	domain EIP712Domain,
	linkedWallet LinkedWallet,
) [32]byte {
	/*
		1. Create the domain separator hash
		2. Create the data hash
		3. Combine the domain separator hash and the data hash with the
		EIP-712 prefix
	*/
	domainHash := hashDomain(domain)
	walletHash := hashLinkedWallet(linkedWallet)
	typedDataHash := hashTypedData(domainHash, walletHash)
	return typedDataHash
}

// Sign the hash using a private key
func SignHash(hash [32]byte, privateKey *ecdsa.PrivateKey) ([]byte, error) {
	/*
		When signing an EIP-712 message, we do not need to prepend
		"\x19Ethereum Signed Message:\n" to the hash before signing it.
		The EIP-712 standard already defines a specific method for creating the hash
		that includes the "\x19\x01" prefix, the domain separator, and the data hash.
	*/
	signature, err := crypto.Sign(hash[:], privateKey)
	if err != nil {
		return nil, err
	}

	// Modify the V value for compatibility with Ethereum
	signature[64] += 27

	return signature, nil
}

// Hash the EIP-712 domain separator
func hashDomain(domain EIP712Domain) [32]byte {
	domainType := "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
	domainHash := crypto.Keccak256([]byte(domainType))

	nameHash := crypto.Keccak256([]byte(domain.Name))
	versionHash := crypto.Keccak256([]byte(domain.Version))
	chainIdBytes := make([]byte, 32)
	domain.ChainId.FillBytes(chainIdBytes)
	chainIdHash := crypto.Keccak256(chainIdBytes)
	verifyingContractHash := crypto.Keccak256(domain.VerifyingContract.Bytes())

	return crypto.Keccak256Hash(
		domainHash,
		nameHash,
		versionHash,
		chainIdHash,
		verifyingContractHash,
	)
}

// Hash the LinkedWallet struct
func hashLinkedWallet(wallet LinkedWallet) [32]byte {
	walletType := "LinkedWallet(string message,address userID,uint256 nonce)"
	walletHash := crypto.Keccak256([]byte(walletType))

	messageHash := crypto.Keccak256([]byte(wallet.Message))
	userIDHash := crypto.Keccak256(wallet.UserID.Bytes())
	nonceBytes := make([]byte, 32)
	wallet.Nonce.FillBytes(nonceBytes)
	nonceHash := crypto.Keccak256(nonceBytes)

	return crypto.Keccak256Hash(
		walletHash,
		messageHash,
		userIDHash,
		nonceHash,
	)
}

// Combine the domain separator and the data hash into a single hash to be signed
func hashTypedData(domainHash [32]byte, dataHash [32]byte) [32]byte {
	/*
		EIP-712 defines a specific method for creating the hash that includes the
		"\x19\x01" prefix, the domain separator, and the data hash.
	*/
	return crypto.Keccak256Hash(
		[]byte("\x19\x01"),
		domainHash[:],
		dataHash[:],
	)
}
