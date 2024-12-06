// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LlamaBaseScript} from "@llama/src/llama-scripts/LlamaBaseScript.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {PermissionData} from "@llama/src/lib/Structs.sol";

/// @dev This is a mock script because it hasn't been audited yet.
contract MockInstanceUpdateScript is LlamaBaseScript {
  // ========================
  // ======== Errors ========
  // ========================

  error InvalidStrategy();

  function authorizeScriptAndSetPermission(
    PermissionData memory permissionData
  ) external onlyDelegateCall {
    uint8 GOVERNANCE_MAINTAINER_ROLE = 2;
    ILlamaStrategy VOTING_STRATEGY = ILlamaStrategy(
      0x225D6692B4DD673C6ad57B4800846341d027BC66
    );
    ILlamaStrategy OPTIMISTIC_STRATEGY = ILlamaStrategy(
      0xF7E4BB5159c3fdc50e1Ef6b80BD69988DD6f438d
    );
    if (
      permissionData.strategy != OPTIMISTIC_STRATEGY &&
      permissionData.strategy != VOTING_STRATEGY
    ) {
      revert InvalidStrategy();
    }

    (LlamaCore core, LlamaPolicy policy) = _context();
    core.setScriptAuthorization(permissionData.target, true);
    policy.setRolePermission(GOVERNANCE_MAINTAINER_ROLE, permissionData, true);
  }

  // ================================
  // ======== Internal Logic ========
  // ================================

  /// @dev Get the core and policy contracts.
  function _context()
    internal
    view
    returns (LlamaCore core, LlamaPolicy policy)
  {
    core = LlamaCore(LlamaExecutor(address(this)).LLAMA_CORE());
    policy = LlamaPolicy(core.policy());
  }
}
