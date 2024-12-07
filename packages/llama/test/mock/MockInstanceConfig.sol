// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LlamaInstanceConfigBase} from "@llama/src/llama-scripts/LlamaInstanceConfigBase.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {LlamaLens} from "@llama/src/LlamaLens.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";
import {PermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {DeployUtils} from "@llama/script/DeployUtils.sol";

contract Counter {
  uint256 count;

  function increment() external {
    count++;
  }
}

contract MockInstanceConfig is LlamaInstanceConfigBase {
  function execute(
    address configPolicyHolder,
    ILlamaStrategy bootstrapStrategy,
    RoleDescription description
  ) external onlyDelegateCall {
    // This is a mock config script that is only meant to run in the test environment
    // These are the addresses of these contracts when DeployLlamaFactory is run in the test environment
    ILlamaStrategy relativeStrategyLogic = ILlamaStrategy(
      0xA8452Ec99ce0C64f20701dB7dD3abDb607c00496
    );
    LlamaLens lens = LlamaLens(0xD718d5A27a29FF1cD22403426084bA0d479869a0);
    LlamaCore core = LlamaCore(msg.sender);
    PermissionData memory executePermission = PermissionData(
      SELF,
      MockInstanceConfig.execute.selector,
      bootstrapStrategy
    );

    LlamaPolicy policy = core.policy();
    address counter = address(new Counter());

    LlamaAbsoluteStrategyBase.Config[]
      memory strategies = new LlamaAbsoluteStrategyBase.Config[](1);

    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: 1 days,
        queuingPeriod: 1 days,
        expirationPeriod: 1 days,
        isFixedLengthApprovalPeriod: false,
        minApprovals: 2,
        minDisapprovals: 2,
        approvalRole: uint8(1),
        disapprovalRole: uint8(1),
        forceApprovalRoles: new uint8[](0),
        forceDisapprovalRoles: new uint8[](0)
      });

    strategies[0] = strategyConfig;

    core.createStrategies(
      relativeStrategyLogic,
      DeployUtils.encodeStrategyConfigs(strategies)
    );

    ILlamaStrategy strategy = lens.computeLlamaStrategyAddress(
      address(relativeStrategyLogic),
      DeployUtils.encodeStrategy(strategies[0]),
      address(core)
    );

    PermissionData memory permissionData = PermissionData(
      counter,
      bytes4(Counter.increment.selector),
      strategy
    );

    policy.setRolePermission(uint8(1), permissionData, true);
    policy.setRoleHolder(uint8(1), address(0x1337), 1, type(uint64).max);

    _postConfigurationCleanup(
      configPolicyHolder,
      core,
      bootstrapStrategy,
      description,
      executePermission
    );
  }
}
