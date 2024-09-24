// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// interfaces
import {IMerkleAirdrop} from "./IMerkleAirdrop.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// libraries
import {ECDSA} from "solady/utils/ECDSA.sol";
import {MerkleProofLib} from "solady/utils/MerkleProofLib.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {MerkleAirdropStorage} from "./MerkleAirdropStorage.sol";

// contracts
import {EIP712Base} from "contracts/src/diamond/utils/cryptography/signature/EIP712Base.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract MerkleAirdrop is IMerkleAirdrop, EIP712Base, Facet {
  // keccak256("AirdropClaim(address account,uint256 amount)");
  bytes32 private constant MESSAGE_TYPEHASH =
    0xaa726e564e52b64144617a6a46c42e8b763d4d224ca1a3e13c1491f8a4763a23;

  function __MerkleAirdrop_init(
    bytes32 merkleRoot,
    IERC20 token
  ) external initializer {
    _addInterface(type(IMerkleAirdrop).interfaceId);
    __MerkleAirdrop_init_unchained(merkleRoot, token);
  }

  /// @inheritdoc IMerkleAirdrop
  function getMerkleRoot() public view returns (bytes32) {
    return MerkleAirdropStorage.layout().merkleRoot;
  }

  /// @inheritdoc IMerkleAirdrop
  function getToken() public view returns (IERC20) {
    return MerkleAirdropStorage.layout().token;
  }

  /// @inheritdoc IMerkleAirdrop
  function getMessageHash(
    address account,
    uint256 amount
  ) public view returns (bytes32) {
    return
      _hashTypedDataV4(
        keccak256(abi.encode(MESSAGE_TYPEHASH, AirdropClaim(account, amount)))
      );
  }

  /// @inheritdoc IMerkleAirdrop
  function claim(
    address account,
    uint256 amount,
    bytes32[] calldata merkleProof,
    bytes calldata signature,
    address receiver
  ) external {
    MerkleAirdropStorage.Layout storage ds = MerkleAirdropStorage.layout();

    if (ds.claimed[account]) {
      CustomRevert.revertWith(MerkleAirdrop__AlreadyClaimed.selector);
    }

    _validateSignature(account, getMessageHash(account, amount), signature);

    // verify merkle proof
    bytes32 leaf = _createLeaf(account, amount);
    if (!MerkleProofLib.verifyCalldata(merkleProof, ds.merkleRoot, leaf)) {
      CustomRevert.revertWith(MerkleAirdrop__InvalidProof.selector);
    }

    ds.claimed[account] = true;
    emit Claimed(account, amount, receiver);

    address recipient = receiver == address(0) ? account : receiver;

    SafeTransferLib.safeTransfer(address(ds.token), recipient, amount);
  }

  // =============================================================
  //                           Internal
  // =============================================================
  function __MerkleAirdrop_init_unchained(
    bytes32 merkleRoot,
    IERC20 token
  ) internal {
    MerkleAirdropStorage.Layout storage ds = MerkleAirdropStorage.layout();
    ds.merkleRoot = merkleRoot;
    ds.token = token;
  }

  function _validateSignature(
    address signer,
    bytes32 digest,
    bytes calldata signature
  ) internal view {
    address actualSigner = ECDSA.recoverCalldata(digest, signature);
    if (actualSigner != signer) {
      CustomRevert.revertWith(MerkleAirdrop__InvalidSignature.selector);
    }
  }

  function _createLeaf(
    address account,
    uint256 amount
  ) internal pure returns (bytes32 leaf) {
    assembly ("memory-safe") {
      // Store the account address at memory location 0
      mstore(0, account)
      // Store the amount at memory location 0x20 (32 bytes after the account address)
      mstore(0x20, amount)
      // Compute the keccak256 hash of the account and amount, and store it at memory location 0
      mstore(0, keccak256(0, 0x40))
      // Compute the keccak256 hash of the previous hash (stored at memory location 0) and store it in the leaf variable
      leaf := keccak256(0, 0x20)
    }
  }
}
