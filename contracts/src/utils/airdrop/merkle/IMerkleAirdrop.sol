// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// interfaces

// libraries

// contracts
interface IMerkleAirdropBase {
  error MerkleAirdrop__InvalidProof();
  error MerkleAirdrop__AlreadyClaimed();
  error MerkleAirdrop__InvalidSignature();

  event Claimed(address account, uint256 amount);
  event MerkleRootUpdated(bytes32 merkleRoot);

  struct AirdropClaim {
    address account;
    uint256 amount;
  }
}

interface IMerkleAirdrop is IMerkleAirdropBase {
  function getMessageHash(
    address account,
    uint256 amount
  ) external view returns (bytes32);
}
