// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @title Llama Account Logic Interface
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice This is the interface for Llama accounts which can be used to hold assets for a Llama instance.
interface ILlamaAccount {
  // -------- For Inspection --------

  /// @notice Returns the address of the Llama instance's executor.
  function llamaExecutor() external view returns (address);

  // -------- At Account Creation --------

  /// @notice Initializes a new clone of the account.
  /// @dev This function is called by the `_deployAccounts` function in the `LlamaCore` contract. The `initializer`
  /// modifier ensures that this function can be invoked at most once.
  /// @param config The account configuration, encoded as bytes to support differing constructor arguments in
  /// different account logic contracts.
  /// @return This return statement must be hardcoded to `true` to ensure that initializing an EOA
  /// (like the zero address) will revert.
  function initialize(bytes memory config) external returns (bool);
}
