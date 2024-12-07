// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract MockMaliciousExtension {
  // Zeros out the data at slot 0, where the initialization status and owner are stored.
  function attack1() external {
    assembly {
      sstore(0, 0)
    }
  }

  // Sets the same slot to some nonzero data.
  function attack2() external {
    uint256 x = type(uint256).max;
    assembly {
      sstore(0, x)
    }
  }
}
