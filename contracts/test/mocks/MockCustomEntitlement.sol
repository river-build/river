// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICustomEntitlement} from "contracts/src/spaces/entitlements/ICustomEntitlement.sol";

contract MockCustomEntitlement is ICustomEntitlement {
  mapping(bytes32 => bool) entitled;

  constructor() {}

  function setEntitled(address[] memory user, bool userIsEntitled) external {
    for (uint256 i = 0; i < user.length; i++) {
      entitled[keccak256(abi.encode(user[i]))] = userIsEntitled;
    }
  }

  function isEntitled(
    address[] memory user
  ) external view override returns (bool) {
    for (uint256 i = 0; i < user.length; i++) {
      if (entitled[keccak256(abi.encode(user[i]))] == true) {
        return true;
      }
    }
    return false;
  }
}
