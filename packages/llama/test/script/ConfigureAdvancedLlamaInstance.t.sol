// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {PermissionData} from "@llama/src/lib/Structs.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";
import {DeployLlamaFactory} from "@llama/script/DeployLlamaFactory.s.sol";
import {DeployLlamaInstance} from "@llama/script/DeployLlamaInstance.s.sol";
import {ConfigureAdvancedLlamaInstance} from "@llama/script/ConfigureAdvancedLlamaInstance.s.sol";
import {LlamaInstanceConfigScriptTemplate} from "@llama/src/llama-scripts/LlamaInstanceConfigScriptTemplate.sol";

contract ConfigureAdvancedLlamaInstanceTest is
  Test,
  DeployLlamaFactory,
  DeployLlamaInstance,
  ConfigureAdvancedLlamaInstance
{
  // This is the address that we're using with the CreateAction script to
  // automate action creation to deploy new Llama instances. It could be
  // replaced with any address that we hold the private key for.
  address LLAMA_INSTANCE_DEPLOYER = 0x3d9fEa8AeD0249990133132Bb4BC8d07C6a8259a;
  address configScriptAddress;

  function setUp() public virtual {
    DeployLlamaFactory.run();
    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "advancedInstanceConfig.json"
    );
    configScriptAddress = address(new LlamaInstanceConfigScriptTemplate());

    mineBlock();
    ConfigureAdvancedLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "advancedInstanceConfig.json",
      core,
      configScriptAddress,
      "Core Team"
    );
    mineBlock();
  }

  function mineBlock() internal {
    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 1);
  }
}

contract Run is ConfigureAdvancedLlamaInstanceTest {
  using stdJson for string;

  function test_Role1RemovedFromDeployer() public {
    LlamaPolicy policy = core.policy();
    bool deployerHasRole = policy.hasRole(LLAMA_INSTANCE_DEPLOYER, CONFIG_ROLE);

    assertFalse(deployerHasRole);
  }

  function test_PermissionsRemovedFromRole1() public {
    LlamaPolicy policy = core.policy();
    PermissionData memory authorizePermission = PermissionData(
      address(core),
      LlamaCore.setScriptAuthorization.selector,
      bootstrapStrategy
    );
    PermissionData memory executePermission = PermissionData(
      address(configScriptAddress),
      LlamaInstanceConfigScriptTemplate.execute.selector,
      bootstrapStrategy
    );

    bool hasAuthorizePermission = policy.canCreateAction(
      CONFIG_ROLE,
      LlamaUtils.computePermissionId(authorizePermission)
    );
    bool hasExecutePermission = policy.canCreateAction(
      CONFIG_ROLE,
      LlamaUtils.computePermissionId(executePermission)
    );

    assertFalse(hasAuthorizePermission);
    assertFalse(hasExecutePermission);
  }

  function test_ConfigScriptUnauthorized() public {
    assertFalse(core.authorizedScripts(address(configScriptAddress)));
  }

  function test_InstantExecutionStrategyUnauthorized() public {
    (bool deployed, bool authorized) = core.strategies(bootstrapStrategy);
    assertTrue(deployed);
    assertFalse(authorized);
  }
}
