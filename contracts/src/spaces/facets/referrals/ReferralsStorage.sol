// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

library ReferralsStorage {
  // keccak256(abi.encode(uint256(keccak256("spaces.facets.client.referrals.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xf006aed34d9339adeee7282d882823b9d2939e4f42a938b6e286169d68741900;

  struct Referral {
    uint256 basisPoints;
    address referrer;
  }

  struct Layout {
    mapping(bytes32 referralCode => Referral) referrals;
  }

  function layout() internal pure returns (Layout storage ds) {
    assembly {
      ds.slot := STORAGE_SLOT
    }
  }
}
