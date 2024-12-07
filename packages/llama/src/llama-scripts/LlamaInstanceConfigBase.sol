// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LlamaBaseScript} from "@llama/src/llama-scripts/LlamaBaseScript.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {PermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";

abstract contract LlamaInstanceConfigBase is LlamaBaseScript {
  uint8 constant CONFIG_ROLE = 1;

  function _postConfigurationCleanup(
    address configPolicyHolder,
    LlamaCore core,
    ILlamaStrategy bootstrapStrategy,
    RoleDescription description,
    PermissionData memory executePermission
  ) internal {
    LlamaPolicy policy = core.policy();
    PermissionData memory authorizePermission = PermissionData(
      address(core),
      LlamaCore.setScriptAuthorization.selector,
      bootstrapStrategy
    );

    // Rename role #1 description
    policy.updateRoleDescription(CONFIG_ROLE, description);

    // Unauthorize configuration script
    core.setScriptAuthorization(SELF, false);

    // Remove configuration policyholder
    policy.revokePolicy(configPolicyHolder);

    // Unauthorize instant execution strategy
    core.setStrategyAuthorization(bootstrapStrategy, false);

    // Remove role #1 permissions to authorize and execute scripts
    policy.setRolePermission(CONFIG_ROLE, authorizePermission, false);
    policy.setRolePermission(CONFIG_ROLE, executePermission, false);
  }
}
