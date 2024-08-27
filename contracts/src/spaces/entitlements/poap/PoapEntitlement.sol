// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ICustomEntitlement} from "contracts/src/spaces/entitlements/ICustomEntitlement.sol";

interface IPOAP {
  function balanceOf(address owner) external view returns (uint256);
  function tokenDetailsOfOwnerByIndex(
    address owner,
    uint256 index
  ) external view returns (uint256 eventId, uint256 tokenId);
}

IPOAP constant poapContract = IPOAP(0x22C1f6050E56d2876009903609a2cC3fEf83B415);

contract PoapEntitlement is ICustomEntitlement {
  uint256 public immutable eventId;

  constructor(uint256 _eventId) {
    require(_eventId > 0, "Invalid event ID");
    eventId = _eventId;
  }

  function isEntitled(
    address[] calldata wallets
  ) external view override returns (bool) {
    for (uint256 i = 0; i < wallets.length; i++) {
      if (_hasEventPoap(wallets[i])) {
        return true;
      }
    }
    return false;
  }

  function _hasEventPoap(address user) internal view returns (bool) {
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
