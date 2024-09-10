// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
interface ICrossChainEntitlement {
  struct Property {
    string name;
    string primitive;
    string description;
  }

  function isEntitled(
    address[] calldata users,
    bytes calldata data
  ) external view returns (bool);

  function properties() external view returns (Property[] memory);
}
