// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";

/// @title Llama Account With Delegation
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice This contract is the standard LlamaAccount with an additional delegate and batch delegate function for
/// voting tokens.
contract LlamaAccountWithDelegation is LlamaAccount {
  // ==========================
  // ========= Structs ========
  // ==========================

  /// @dev Data for delegating voting tokens to delegatees.
  struct TokenDelegateData {
    IVotes token; // The voting token to delegate.
    address delegatee; // The address being delegated to.
  }

  // ===========================================
  // ======== External and Public Logic ========
  // ===========================================

  // -------- Voting Tokens --------

  /// @notice Delegate voting tokens to a delegatee.
  /// @param tokenDelegateData The `token` and `delegatee` for the delegation.
  function delegateToken(
    TokenDelegateData calldata tokenDelegateData
  ) public onlyLlama {
    tokenDelegateData.token.delegate(tokenDelegateData.delegatee);
  }

  /// @notice Batch delegate multiple voting tokens to delegatees.
  /// @param tokenDelegateData The `token` and `delegatee` for the delegations.
  function batchDelegateToken(
    TokenDelegateData[] calldata tokenDelegateData
  ) external onlyLlama {
    uint256 length = tokenDelegateData.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      delegateToken(tokenDelegateData[i]);
    }
  }
}
