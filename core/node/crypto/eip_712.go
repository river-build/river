package crypto

import (
	"crypto/ecdsa"
	"math/big"

	"github.com/ethereum/go-ethereum/crypto"
)

// Define the EIP-712 domain separator
type EIP712Domain struct {
	Name              string
	Version           string
	ChainId           *big.Int
	VerifyingContract string
}

// Define the LinkedWallet struct
type LinkedWallet struct {
	Message string
	UserID  string
	Nonce   *big.Int
}

func CreateEip712LinkedWalletTypedData(
	domain EIP712Domain,
	linkedWallet LinkedWallet,
) [32]byte {
	domainHash := hashDomain(domain)
	walletHash := hashLinkedWallet(linkedWallet)
	typedDataHash := hashTypedData(domainHash, walletHash)
	return typedDataHash
}

// Sign the hash using a private key
func SignHash(hash [32]byte, privateKey *ecdsa.PrivateKey) ([]byte, error) {
	signature, err := crypto.Sign(hash[:], privateKey)
	if err != nil {
		return nil, err
	}
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
	verifyingContractHash := crypto.Keccak256([]byte(domain.VerifyingContract))

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
	userIDHash := crypto.Keccak256([]byte(wallet.UserID))
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

// Combine the domain separator and the struct hash into a single hash to be signed
func hashTypedData(domainHash [32]byte, structHash [32]byte) [32]byte {
	return crypto.Keccak256Hash(
		[]byte("\x19\x01"),
		domainHash[:],
		structHash[:],
	)
}
