// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface ITownsDeployer {
  function deploy(
    address l1Token,
    address owner,
    bytes32 implementationSalt,
    bytes32 proxySalt
  ) external returns (address);
}
