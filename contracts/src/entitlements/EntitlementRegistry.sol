// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

contract EntitlementRegistry {
  error EntitlementRegistry__InvalidImplementation();
  error EntitlementRegistry__ModuleAlreadyRegistered();
  mapping(bytes4 => address) public entitlementModules;

  function registerEntitlementModule(
    bytes4 moduleId,
    address implementation
  ) external {
    if (implementation == address(0))
      revert EntitlementRegistry__InvalidImplementation();
    if (entitlementModules[moduleId] != address(0))
      revert EntitlementRegistry__ModuleAlreadyRegistered();

    entitlementModules[moduleId] = implementation;
  }

  function getEntitlementModule(
    bytes4 moduleId
  ) external view virtual returns (address) {
    return entitlementModules[moduleId];
  }
}
