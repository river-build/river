// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// interfaces
import {IMerkleAirdrop} from "./IMerkleAirdrop.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// libraries
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// contracts
import {EIP712Base} from "contracts/src/diamond/utils/cryptography/signature/EIP712Base.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
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

  function getMerkleRoot() public view returns (bytes32) {
    return MerkleAirdropStorage.layout().merkleRoot;
  }

  function getToken() public view returns (IERC20) {
    return MerkleAirdropStorage.layout().token;
  }

  function getMessageHash(
    address account,
    uint256 amount
  ) public view returns (bytes32) {
    return
      _hashTypedDataV4(
        keccak256(abi.encode(MESSAGE_TYPEHASH, AirdropClaim(account, amount)))
      );
  }

  function claim(
    address account,
    uint256 amount,
    bytes32[] calldata merkleProof,
    bytes memory signature
  ) public {
    MerkleAirdropStorage.Layout storage ds = MerkleAirdropStorage.layout();

    if (ds.claimed[account]) {
      revert MerkleAirdrop__AlreadyClaimed();
    }

    _validateSignature(account, getMessageHash(account, amount), signature);

    // verify merkle proof
    //should we use bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
    bytes32 leaf = keccak256(abi.encodePacked(account, amount));

    if (!MerkleProof.verify(merkleProof, ds.merkleRoot, leaf)) {
      revert MerkleAirdrop__InvalidProof();
    }

    ds.claimed[account] = true;
    emit Claimed(account, amount);
    SafeERC20.safeTransfer(ds.token, account, amount);
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
    bytes memory signature
  ) internal pure {
    address actualSigner = ECDSA.recover(digest, signature);
    if (actualSigner != signer) {
      revert MerkleAirdrop__InvalidSignature();
    }
  }
}

library MerkleAirdropStorage {
  // keccak256(abi.encode(uint256(keccak256("merkle.airdrop.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 constant STORAGE_SLOT =
    0x5499e8f18bf9226c15306964dca998d3d8d3ddae851b652336bc6dea221b5200;

  struct Layout {
    IERC20 token;
    bytes32 merkleRoot;
    mapping(address => bool) claimed;
  }

  function layout() internal pure returns (Layout storage ds) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      ds.slot := slot
    }
  }
}
