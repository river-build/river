// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LlamaInstanceConfigBase} from "@llama/src/llama-scripts/LlamaInstanceConfigBase.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {PermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";

contract LlamaInstanceConfigScriptTemplate is LlamaInstanceConfigBase {
  function execute(
    address configPolicyHolder,
    ILlamaStrategy bootstrapStrategy,
    RoleDescription description
  ) external onlyDelegateCall {
    LlamaCore core = LlamaCore(msg.sender);

    // The selector needs to be this contract's execute function
    PermissionData memory executePermission = PermissionData(
      SELF,
      LlamaInstanceConfigScriptTemplate.execute.selector,
      bootstrapStrategy
    );

    // Insert configuration code here

    _postConfigurationCleanup(
      configPolicyHolder,
      core,
      bootstrapStrategy,
      description,
      executePermission
    );
  }
}
