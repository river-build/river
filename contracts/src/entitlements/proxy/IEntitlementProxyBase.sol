// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface IEntitlementProxyBase {
  error EntitlementProxy__FetchImplementationFailed();
  error EntitlementProxy__InvalidManager();
  error EntitlementProxy__InvalidManagerSelector();
}

interface IEntitlementProxy is IEntitlementProxyBase {
  function getManager() external view returns (address);
  function setManager(address manager) external;
}
