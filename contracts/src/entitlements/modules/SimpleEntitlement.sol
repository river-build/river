// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

contract SimpleEntitlement {
  function isEntitled(address[] memory users) external view returns (bool) {
    SimpleEntitlementStorage.Layout storage l = SimpleEntitlementStorage
      .layout();
    for (uint256 i = 0; i < users.length; i++) {
      if (!l.entitled[users[i]]) {
        return false;
      }
    }
    return true;
  }

  function setEntitled(address user, bool entitled) external {
    SimpleEntitlementStorage.layout().entitled[user] = entitled;
  }
}

library SimpleEntitlementStorage {
  // keccak256(abi.encode(uint256(keccak256("entitlement.modules.SimpleEntitlement")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xf33e8ae617d5ced4a595c3b3d5ba50b9742af68f402a047fd18239071c310b00;

  struct Layout {
    mapping(address => bool) entitled;
  }

  function layout() internal pure returns (Layout storage l) {
    assembly {
      l.slot := STORAGE_SLOT
    }
  }
}
