// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, stdJson} from "forge-std/Script.sol";

import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaFactory} from "@llama/src/LlamaFactory.sol";
import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaInstanceConfig, LlamaPolicyConfig} from "@llama/src/lib/Structs.sol";
import {DeployUtils} from "@llama/script/DeployUtils.sol";

contract DeployLlamaInstance is Script {
  using stdJson for string;

  error InvalidStrategyType();

  uint256 constant MAX_STRATEGY_TYPE_INDEX = 1;

  // The core of the deployed Llama instance.
  LlamaCore core;

  function run(address deployer, string memory configFile) public virtual {
    string memory jsonInput = DeployUtils.readScriptInput(configFile);
    uint256 strategyType = abi.decode(
      jsonInput.parseRaw(".strategyType"),
      (uint256)
    );
    if (strategyType > MAX_STRATEGY_TYPE_INDEX) revert InvalidStrategyType();

    // ======== START SAFETY CHECK ========
    // Before deploying the factory, we ensure the bootstrap strategy is configured properly to
    // ensure it can be used to pass actions.
    // NOTE: This check currently only supports relative strategies.
    DeployUtils.bootstrapSafetyCheck(configFile);
    // ======== END SAFETY CHECK ========

    string memory llamaInstanceName = jsonInput.readString(".instanceName");
    LlamaFactory factory = LlamaFactory(jsonInput.readAddress(".factory"));

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      DeployUtils.readRoleDescriptions(jsonInput),
      DeployUtils.readRoleHolders(jsonInput),
      DeployUtils.readRolePermissions(jsonInput),
      jsonInput.readString(".instanceColor"),
      jsonInput.readString(".instanceLogo")
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      llamaInstanceName,
      ILlamaStrategy(jsonInput.readAddress(".strategyLogic")),
      ILlamaAccount(jsonInput.readAddress(".accountLogic")),
      DeployUtils.readStrategies(jsonInput),
      DeployUtils.readAccounts(jsonInput),
      policyConfig
    );

    vm.broadcast(deployer);
    core = factory.deploy(instanceConfig);

    DeployUtils.print("Successfully deployed a new Llama instance");
    DeployUtils.print(
      string.concat("  LlamaCore:     ", vm.toString(address(core)))
    );
    DeployUtils.print(
      string.concat("  LlamaPolicy:   ", vm.toString(address(core.policy())))
    );
    DeployUtils.print(
      string.concat("  LlamaExecutor: ", vm.toString(address(core.executor())))
    );
  }
}
