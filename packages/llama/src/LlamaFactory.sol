// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {ILlamaPolicyMetadata} from "./interfaces/ILlamaPolicyMetadata.sol";
import {LlamaInstanceConfig} from "./lib/Structs.sol";
import {LlamaCore} from "./LlamaCore.sol";
import {LlamaPolicy} from "./LlamaPolicy.sol";

/// @title Llama Factory
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice Factory for deploying new Llama instances.
contract LlamaFactory {
  /// @dev The initial set of role holders has to have at least one role holder with role ID 1.
  error InvalidDeployConfiguration();

  /// @dev Emitted when a new Llama instance is created.
  event LlamaInstanceCreated(
    address indexed deployer,
    string indexed name,
    address llamaCore,
    address llamaExecutor,
    address llamaPolicy,
    uint256 chainId
  );

  /// @dev At deployment, this role is given permission to call the `setRolePermission` function.
  /// However, this may change depending on how the Llama instance is configured. This is done to mitigate the chances
  /// of deploying a misconfigured Llama instance that is unusable. See the documentation for more info.
  uint8 internal constant BOOTSTRAP_ROLE = 1;

  /// @notice The Llama core implementation (logic) contract.
  LlamaCore public immutable LLAMA_CORE_LOGIC;

  /// @notice The Llama policy implementation (logic) contract.
  LlamaPolicy public immutable LLAMA_POLICY_LOGIC;

  /// @notice The Llama policy metadata implementation (logic) contract.
  ILlamaPolicyMetadata public immutable LLAMA_POLICY_METADATA_LOGIC;

  /// @dev Set the logic contracts used to deploy Llama instances.
  constructor(
    LlamaCore llamaCoreLogic,
    LlamaPolicy llamaPolicyLogic,
    ILlamaPolicyMetadata llamaPolicyMetadataLogic
  ) {
    LLAMA_CORE_LOGIC = llamaCoreLogic;
    LLAMA_POLICY_LOGIC = llamaPolicyLogic;
    LLAMA_POLICY_METADATA_LOGIC = llamaPolicyMetadataLogic;
  }

  /// @notice Deploys a new Llama instance.
  /// @param instanceConfig The configuration of the new Llama instance.
  /// @return core The address of the `LlamaCore` of the deployed instance.
  function deploy(
    LlamaInstanceConfig memory instanceConfig
  ) external returns (LlamaCore core) {
    // There must be at least one role holder with role ID of 1, since that role ID is initially
    // given permission to call `setRolePermission`. This is required to reduce the chance that an
    // instance is deployed with an invalid configuration that results in the instance being unusable.
    // Role ID 1 is referred to as the bootstrap role. We require that the bootstrap role is the
    // first role in the `roleHolders` array, and that it never expires.
    if (instanceConfig.policyConfig.roleHolders.length == 0)
      revert InvalidDeployConfiguration();
    if (instanceConfig.policyConfig.roleHolders[0].role != BOOTSTRAP_ROLE)
      revert InvalidDeployConfiguration();
    if (
      instanceConfig.policyConfig.roleHolders[0].expiration != type(uint64).max
    ) revert InvalidDeployConfiguration();

    // Deploy and initialize `LlamaCore`.
    core = LlamaCore(
      Clones.cloneDeterministic(
        address(LLAMA_CORE_LOGIC),
        keccak256(abi.encodePacked(instanceConfig.name, msg.sender))
      )
    );
    core.initialize(
      instanceConfig,
      LLAMA_POLICY_LOGIC,
      LLAMA_POLICY_METADATA_LOGIC
    );

    address executor = address(core.executor());
    address policy = address(core.policy());
    emit LlamaInstanceCreated(
      msg.sender,
      instanceConfig.name,
      address(core),
      executor,
      policy,
      block.chainid
    );
  }
}
