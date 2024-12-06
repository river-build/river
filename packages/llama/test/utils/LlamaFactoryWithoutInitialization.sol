// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {LlamaInstanceConfig, RoleHolderData, RolePermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaFactory} from "@llama/src/LlamaFactory.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {LlamaPolicyMetadata} from "@llama/src/LlamaPolicyMetadata.sol";

/// @title Llama Factory
/// @author Llama (devsdosomething@llama.xyz)
/// @notice Factory for deploying new Llama systems.
contract LlamaFactoryWithoutInitialization is LlamaFactory {
  LlamaCore public lastDeployedLlamaCore;

  constructor(
    LlamaCore _llamaCoreLogic,
    ILlamaStrategy initialLlamaStrategyLogic,
    ILlamaAccount initialLlamaAccountLogic,
    LlamaPolicy _llamaPolicyLogic,
    LlamaPolicyMetadata _llamaPolicyMetadata,
    string memory name,
    bytes[] memory initialStrategies,
    bytes[] memory initialAccounts,
    RoleDescription[] memory initialRoleDescriptions,
    RoleHolderData[] memory initialRoleHolders,
    RolePermissionData[] memory initialRolePermissions
  ) LlamaFactory(_llamaCoreLogic, _llamaPolicyLogic, _llamaPolicyMetadata) {}

  /// @notice Deploys a new Llama system. This function can only be called by the initial Llama system.
  /// @param name The name of this Llama system.
  /// @return llama the address of the LlamaCore contract of the newly created system.
  function deployWithoutInitialization(
    string memory name
  ) external returns (LlamaCore llama) {
    llama = LlamaCore(
      Clones.cloneDeterministic(
        address(LLAMA_CORE_LOGIC),
        keccak256(abi.encode(name, msg.sender))
      )
    );
    lastDeployedLlamaCore = llama;
  }

  function initialize(LlamaInstanceConfig memory instanceConfig) external {
    lastDeployedLlamaCore.initialize(
      instanceConfig,
      LLAMA_POLICY_LOGIC,
      LLAMA_POLICY_METADATA_LOGIC
    );
  }
}
