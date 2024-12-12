// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {VmSafe} from "forge-std/Vm.sol";
import {console2, stdJson} from "forge-std/Script.sol";

import {FixedPointMathLib} from "@solady/utils/FixedPointMathLib.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {PermissionData, RoleHolderData, RolePermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";
import {LlamaRelativeStrategyBase} from "@llama/src/strategies/relative/LlamaRelativeStrategyBase.sol";

library DeployUtils {
  using stdJson for string;

  address internal constant VM_ADDRESS =
    address(uint160(uint256(keccak256("hevm cheat code"))));
  VmSafe internal constant VM = VmSafe(VM_ADDRESS);

  uint8 public constant BOOTSTRAP_ROLE = 1;
  uint256 internal constant ONE_HUNDRED_IN_BPS = 10_000;

  enum StrategyType {
    Absolute,
    Relative
  }

  struct AbsoluteQuorumJsonInputs {
    // Attributes need to be in alphabetical order so JSON decodes properly.
    uint64 approvalPeriod;
    uint8 approvalRole;
    string comment;
    uint8 disapprovalRole;
    uint64 expirationPeriod;
    uint8[] forceApprovalRoles;
    uint8[] forceDisapprovalRoles;
    bool isFixedLengthApprovalPeriod;
    uint96 minApprovals;
    uint96 minDisapprovals;
    uint64 queuingPeriod;
  }

  struct RelativeQuorumJsonInputs {
    // Attributes need to be in alphabetical order so JSON decodes properly.
    uint64 approvalPeriod;
    uint8 approvalRole;
    string comment;
    uint8 disapprovalRole;
    uint64 expirationPeriod;
    uint8[] forceApprovalRoles;
    uint8[] forceDisapprovalRoles;
    bool isFixedLengthApprovalPeriod;
    uint16 minApprovalPct;
    uint16 minDisapprovalPct;
    uint64 queuingPeriod;
  }

  struct RoleHolderJsonInputs {
    // Attributes need to be in alphabetical order so JSON decodes properly.
    string comment;
    uint64 expiration;
    address policyholder;
    uint96 quantity;
    uint8 role;
  }

  struct RolePermissionJsonInputs {
    // Attributes need to be in alphabetical order so JSON decodes properly.
    string comment;
    PermissionDataInput permissionDataInput;
    uint8 role;
  }

  struct AccountJsonInputs {
    // Attributes need to be in alphabetical order so JSON decodes properly.
    string name;
  }

  struct PermissionDataInput {
    // Attributes need to be in alphabetical order so JSON decodes properly.
    bytes selector;
    ILlamaStrategy strategy;
    address target;
  }

  function print(string memory message) internal view {
    // Avoid getting flooded with logs during tests. Note that fork tests will show logs with this
    // approach, because there's currently no way to tell which environment we're in, e.g. script
    // or test. This is being tracked in https://github.com/foundry-rs/foundry/issues/2900.
    if (block.chainid != 31_337) console2.log(message);
  }

  function readScriptInput(
    string memory filename
  ) internal view returns (string memory) {
    string memory inputDir = string.concat(
      VM.projectRoot(),
      "/packages/llama/script/input/"
    );
    string memory chainDir = string.concat(VM.toString(block.chainid), "/");
    return VM.readFile(string.concat(inputDir, chainDir, filename));
  }

  function readStrategies(
    string memory jsonInput
  ) internal pure returns (bytes[] memory) {
    bytes memory strategyData = jsonInput.parseRaw(".initialStrategies");
    uint256 strategyType = abi.decode(
      jsonInput.parseRaw(".strategyType"),
      (uint256)
    );

    return
      StrategyType(strategyType) == StrategyType.Absolute
        ? _readAbsoluteStrategies(strategyData)
        : _readRelativeStrategies(strategyData);
  }

  function readAccounts(
    string memory jsonInput
  ) internal pure returns (bytes[] memory) {
    bytes memory accountData = jsonInput.parseRaw(".initialAccounts");
    AccountJsonInputs[] memory rawAccountsConfigs = abi.decode(
      accountData,
      (AccountJsonInputs[])
    );

    LlamaAccount.Config[] memory accountConfigs = new LlamaAccount.Config[](
      rawAccountsConfigs.length
    );
    for (uint256 i = 0; i < rawAccountsConfigs.length; i++) {
      AccountJsonInputs memory rawAccount = rawAccountsConfigs[i];
      accountConfigs[i].name = rawAccount.name;
    }

    return encodeAccountConfigs(accountConfigs);
  }

  function readRoleDescriptions(
    string memory jsonInput
  ) internal pure returns (RoleDescription[] memory roleDescriptions) {
    string[] memory descriptions = jsonInput.readStringArray(
      ".initialRoleDescriptions"
    );
    roleDescriptions = new RoleDescription[](descriptions.length);
    for (uint256 i = 0; i < descriptions.length; i++) {
      require(
        bytes(descriptions[i]).length <= 32,
        "Role description is too long"
      );
      roleDescriptions[i] = RoleDescription.wrap(
        bytes32(bytes(descriptions[i]))
      );
    }
  }

  function readRoleHolders(
    string memory jsonInput
  ) internal pure returns (RoleHolderData[] memory roleHolders) {
    bytes memory roleHolderData = jsonInput.parseRaw(".initialRoleHolders");
    RoleHolderJsonInputs[] memory rawRoleHolders = abi.decode(
      roleHolderData,
      (RoleHolderJsonInputs[])
    );

    roleHolders = new RoleHolderData[](rawRoleHolders.length);
    for (uint256 i = 0; i < rawRoleHolders.length; i++) {
      RoleHolderJsonInputs memory rawRoleHolder = rawRoleHolders[i];
      roleHolders[i].role = rawRoleHolder.role;
      roleHolders[i].policyholder = rawRoleHolder.policyholder;
      roleHolders[i].quantity = rawRoleHolder.quantity;
      roleHolders[i].expiration = rawRoleHolder.expiration;
    }
  }

  function readRolePermissions(
    string memory jsonInput
  ) internal pure returns (RolePermissionData[] memory rolePermissions) {
    bytes memory rolePermissionData = jsonInput.parseRaw(
      ".initialRolePermissions"
    );
    RolePermissionJsonInputs[] memory rawRolePermissions = abi.decode(
      rolePermissionData,
      (RolePermissionJsonInputs[])
    );
    rolePermissions = new RolePermissionData[](rawRolePermissions.length);
    for (uint256 i = 0; i < rawRolePermissions.length; i++) {
      RolePermissionJsonInputs memory rawRolePermission = rawRolePermissions[i];
      PermissionData memory permissionData = PermissionData(
        rawRolePermission.permissionDataInput.target,
        bytes4(rawRolePermission.permissionDataInput.selector),
        rawRolePermission.permissionDataInput.strategy
      );
      rolePermissions[i].role = rawRolePermission.role;
      rolePermissions[i].permissionData = permissionData;
      rolePermissions[i].hasPermission = true;
    }
  }

  function encodeStrategy(
    LlamaRelativeStrategyBase.Config memory strategy
  ) internal pure returns (bytes memory encoded) {
    encoded = abi.encode(strategy);
  }

  function encodeStrategy(
    LlamaAbsoluteStrategyBase.Config memory strategy
  ) internal pure returns (bytes memory encoded) {
    encoded = abi.encode(strategy);
  }

  function encodeAccount(
    LlamaAccount.Config memory account
  ) internal pure returns (bytes memory encoded) {
    encoded = abi.encode(account);
  }

  function encodeStrategyConfigs(
    LlamaRelativeStrategyBase.Config[] memory strategies
  ) internal pure returns (bytes[] memory encoded) {
    encoded = new bytes[](strategies.length);
    for (uint256 i = 0; i < strategies.length; i++) {
      encoded[i] = encodeStrategy(strategies[i]);
    }
  }

  function encodeStrategyConfigs(
    LlamaAbsoluteStrategyBase.Config[] memory strategies
  ) internal pure returns (bytes[] memory encoded) {
    encoded = new bytes[](strategies.length);
    for (uint256 i = 0; i < strategies.length; i++) {
      encoded[i] = encodeStrategy(strategies[i]);
    }
  }

  function encodeAccountConfigs(
    LlamaAccount.Config[] memory accounts
  ) internal pure returns (bytes[] memory encoded) {
    encoded = new bytes[](accounts.length);
    for (uint256 i = 0; i < accounts.length; i++) {
      encoded[i] = encodeAccount(accounts[i]);
    }
  }

  function bootstrapSafetyCheck(string memory filename) internal view {
    // -------- Read data --------
    // Read the raw, encoded input file
    string memory jsonInput = readScriptInput(filename);
    uint256 strategyType = abi.decode(
      jsonInput.parseRaw(".strategyType"),
      (uint256)
    );

    // Get the list of role holders.
    RoleHolderData[] memory roleHolderData = readRoleHolders(jsonInput);

    // -------- Validate data --------
    // For a bootstrap strategy to passable, we need at least one of the following to be true:
    //   1. The approval role is be the bootstrap role AND there are enough bootstrap role holders
    //      to pass an action.
    //   2. A force approval role is the bootstrap role AND there is at least one bootstrap role
    //      holder.

    // Get the number of role holders with Role ID 1, which is the bootstrap role.
    uint256 bootstrapRoleSupply = 0;
    for (uint256 i = 0; i < roleHolderData.length; i++) {
      if (roleHolderData[i].role == BOOTSTRAP_ROLE) bootstrapRoleSupply++;
    }

    // If no one holds that role, then the bootstrap strategy is not passable.
    require(bootstrapRoleSupply > 0, "No one holds the bootstrap role");

    // Get the bootstrap strategy, which is the first strategy in the list.
    bytes memory encodedStrategyConfigs = jsonInput.parseRaw(
      ".initialStrategies"
    );
    StrategyType(strategyType) == StrategyType.Absolute
      ? _absoluteBootstrapSafetyCheck(
        bootstrapRoleSupply,
        encodedStrategyConfigs
      )
      : _relativeBootstrapSafetyCheck(
        bootstrapRoleSupply,
        encodedStrategyConfigs
      );
  }

  // ================================
  // ======== Internal Logic ========
  // ================================

  function _readAbsoluteStrategies(
    bytes memory strategyData
  ) internal pure returns (bytes[] memory) {
    AbsoluteQuorumJsonInputs[] memory rawStrategyConfigs = abi.decode(
      strategyData,
      (AbsoluteQuorumJsonInputs[])
    );

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](
        rawStrategyConfigs.length
      );
    for (uint256 i = 0; i < rawStrategyConfigs.length; i++) {
      AbsoluteQuorumJsonInputs memory rawStrategy = rawStrategyConfigs[i];
      strategyConfigs[i].approvalPeriod = rawStrategy.approvalPeriod;
      strategyConfigs[i].queuingPeriod = rawStrategy.queuingPeriod;
      strategyConfigs[i].expirationPeriod = rawStrategy.expirationPeriod;
      strategyConfigs[i].minApprovals = rawStrategy.minApprovals;
      strategyConfigs[i].minDisapprovals = rawStrategy.minDisapprovals;
      strategyConfigs[i].isFixedLengthApprovalPeriod = rawStrategy
        .isFixedLengthApprovalPeriod;
      strategyConfigs[i].approvalRole = rawStrategy.approvalRole;
      strategyConfigs[i].disapprovalRole = rawStrategy.disapprovalRole;
      strategyConfigs[i].forceApprovalRoles = rawStrategy.forceApprovalRoles;
      strategyConfigs[i].forceDisapprovalRoles = rawStrategy
        .forceDisapprovalRoles;
    }

    return encodeStrategyConfigs(strategyConfigs);
  }

  function _absoluteBootstrapSafetyCheck(
    uint256 bootstrapRoleSupply,
    bytes memory encodedStrategyConfigs
  ) internal pure {
    AbsoluteQuorumJsonInputs[] memory absoluteStrategyConfigs = abi.decode(
      encodedStrategyConfigs,
      (AbsoluteQuorumJsonInputs[])
    );

    AbsoluteQuorumJsonInputs memory bootstrapStrategy = absoluteStrategyConfigs[
      0
    ];

    // Check 1.
    bool isCheck1Satisfied = false;
    if (bootstrapStrategy.approvalRole == BOOTSTRAP_ROLE) {
      // Based on the bootstrap strategy config and number of bootstrap role holders, compute the
      // minimum number of role holders to pass a vote.
      uint256 numApprovalsRequired = bootstrapStrategy.minApprovals;

      if (bootstrapRoleSupply >= numApprovalsRequired) isCheck1Satisfied = true;
    }

    // Check 2.
    bool isCheck2Satisfied = false;
    for (uint256 i = 0; i < bootstrapStrategy.forceApprovalRoles.length; i++) {
      if (bootstrapStrategy.forceApprovalRoles[i] == BOOTSTRAP_ROLE) {
        isCheck2Satisfied = true;
        break;
      }
    }

    // If neither check is satisfied, the bootstrap strategy is invalid.
    string memory check1Result = string.concat(
      "\n  check1: ",
      isCheck1Satisfied ? "true" : "false"
    );
    string memory check2Result = string.concat(
      "\n  check2: ",
      isCheck2Satisfied ? "true" : "false"
    );
    require(
      isCheck1Satisfied || isCheck2Satisfied,
      string.concat(
        "Bootstrap strategy is invalid",
        check1Result,
        check2Result,
        "\n"
      )
    );
  }

  function _readRelativeStrategies(
    bytes memory strategyData
  ) internal pure returns (bytes[] memory) {
    RelativeQuorumJsonInputs[] memory rawStrategyConfigs = abi.decode(
      strategyData,
      (RelativeQuorumJsonInputs[])
    );
    LlamaRelativeStrategyBase.Config[]
      memory strategyConfigs = new LlamaRelativeStrategyBase.Config[](
        rawStrategyConfigs.length
      );

    for (uint256 i = 0; i < rawStrategyConfigs.length; i++) {
      RelativeQuorumJsonInputs memory rawStrategy = rawStrategyConfigs[i];
      strategyConfigs[i].approvalPeriod = rawStrategy.approvalPeriod;
      strategyConfigs[i].queuingPeriod = rawStrategy.queuingPeriod;
      strategyConfigs[i].expirationPeriod = rawStrategy.expirationPeriod;
      strategyConfigs[i].minApprovalPct = rawStrategy.minApprovalPct;
      strategyConfigs[i].minDisapprovalPct = rawStrategy.minDisapprovalPct;
      strategyConfigs[i].isFixedLengthApprovalPeriod = rawStrategy
        .isFixedLengthApprovalPeriod;
      strategyConfigs[i].approvalRole = rawStrategy.approvalRole;
      strategyConfigs[i].disapprovalRole = rawStrategy.disapprovalRole;
      strategyConfigs[i].forceApprovalRoles = rawStrategy.forceApprovalRoles;
      strategyConfigs[i].forceDisapprovalRoles = rawStrategy
        .forceDisapprovalRoles;
    }

    return encodeStrategyConfigs(strategyConfigs);
  }

  function _relativeBootstrapSafetyCheck(
    uint256 bootstrapRoleSupply,
    bytes memory encodedStrategyConfigs
  ) internal pure {
    RelativeQuorumJsonInputs[] memory relativeStrategyConfigs = abi.decode(
      encodedStrategyConfigs,
      (RelativeQuorumJsonInputs[])
    );

    RelativeQuorumJsonInputs memory bootstrapStrategy = relativeStrategyConfigs[
      0
    ];

    // Check 1.
    bool isCheck1Satisfied = false;
    if (bootstrapStrategy.approvalRole == BOOTSTRAP_ROLE) {
      // Based on the bootstrap strategy config and number of bootstrap role holders, compute the
      // minimum number of role holders to pass a vote. The calculation here MUST match the one
      // in the LlamaRelativeHolderQuorum's `_getMinimumAmountNeeded` method. This check should never fail
      // for relative strategies, but it's left in as a reminder that it needs to be checked for
      // absolute strategies.
      uint256 minPct = bootstrapStrategy.minApprovalPct;
      uint256 numApprovalsRequired = FixedPointMathLib.mulDivUp(
        bootstrapRoleSupply,
        minPct,
        ONE_HUNDRED_IN_BPS
      );

      if (bootstrapRoleSupply >= numApprovalsRequired) isCheck1Satisfied = true;
    }

    // Check 2.
    bool isCheck2Satisfied = false;
    for (uint256 i = 0; i < bootstrapStrategy.forceApprovalRoles.length; i++) {
      if (bootstrapStrategy.forceApprovalRoles[i] == BOOTSTRAP_ROLE) {
        isCheck2Satisfied = true;
        break;
      }
    }

    // If neither check is satisfied, the bootstrap strategy is invalid.
    string memory check1Result = string.concat(
      "\n  check1: ",
      isCheck1Satisfied ? "true" : "false"
    );
    string memory check2Result = string.concat(
      "\n  check2: ",
      isCheck2Satisfied ? "true" : "false"
    );
    require(
      isCheck1Satisfied || isCheck2Satisfied,
      string.concat(
        "Bootstrap strategy is invalid",
        check1Result,
        check2Result,
        "\n"
      )
    );
  }
}
