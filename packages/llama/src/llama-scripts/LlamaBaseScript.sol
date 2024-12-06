// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @dev This script is a template for creating new scripts, and should not be used directly.
abstract contract LlamaBaseScript {
  /// @dev Thrown if you try to CALL a function that has the `onlyDelegatecall` modifier.
  error OnlyDelegateCall();

  /// @dev Add this to your script's methods to ensure the script can only be used via delegatecall, and not a regular
  /// call.
  modifier onlyDelegateCall() {
    if (address(this) == SELF) revert OnlyDelegateCall();
    _;
  }

  /// @dev Address of the script contract. We save it off because during a delegatecall `address(this)` refers to the
  /// caller's address, not this script's address.
  address internal immutable SELF;

  constructor() {
    SELF = address(this);
  }
}
