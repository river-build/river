// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

contract PoapEntitlement {
  IPOAP immutable poapContract;

  constructor(address poapContractAddress) {
    poapContract = IPOAP(poapContractAddress);
  }

  function isEntitled(
    address[] calldata users,
    bytes calldata data
  ) external view returns (bool) {
    uint256 eventId = abi.decode(data, (uint256));

    for (uint256 i = 0; i < users.length; i++) {
      if (_hasEventPoap(users[i], eventId)) {
        return true;
      }
    }
    return false;
  }

  function schema() public pure returns (string memory) {
    return "uint256 eventId";
  }

  // =============================================================
  //                           Internals
  // =============================================================
  function _hasEventPoap(
    address user,
    uint256 eventId
  ) internal view returns (bool) {
    uint256 balance = poapContract.balanceOf(user);
    for (uint256 j = 0; j < balance; j++) {
      (uint256 ownedEventId, ) = poapContract.tokenDetailsOfOwnerByIndex(
        user,
        j
      );
      if (eventId == ownedEventId) {
        return true;
      }
    }
    return false;
  }
}

interface IPOAP {
  function balanceOf(address owner) external view returns (uint256);
  function tokenDetailsOfOwnerByIndex(
    address owner,
    uint256 index
  ) external view returns (uint256 eventId, uint256 tokenId);
}
