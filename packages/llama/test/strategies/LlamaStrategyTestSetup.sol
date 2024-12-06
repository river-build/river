// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {Vm} from "forge-std/Vm.sol";

import {MockProtocol} from "@llama/test/mock/MockProtocol.sol";
import {Roles, LlamaTestSetup} from "@llama/test/utils/LlamaTestSetup.sol";

import {DeployUtils} from "@llama/script/DeployUtils.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";
import {LlamaAbsolutePeerReview} from "@llama/src/strategies/absolute/LlamaAbsolutePeerReview.sol";
import {LlamaAbsoluteQuorum} from "@llama/src/strategies/absolute/LlamaAbsoluteQuorum.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";
import {LlamaRelativeHolderQuorum} from "@llama/src/strategies/relative/LlamaRelativeHolderQuorum.sol";
import {LlamaRelativeStrategyBase} from "@llama/src/strategies/relative/LlamaRelativeStrategyBase.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";

contract LlamaStrategyTestSetup is LlamaTestSetup {
  function setUp() public virtual override {
    LlamaTestSetup.setUp();
  }

  function toRelativeQuorum(
    ILlamaStrategy strategy
  ) internal pure returns (LlamaRelativeHolderQuorum converted) {
    assembly {
      converted := strategy
    }
  }

  function toRelativeStrategyBase(
    ILlamaStrategy strategy
  ) internal pure returns (LlamaRelativeStrategyBase converted) {
    assembly {
      converted := strategy
    }
  }

  function toAbsolutePeerReview(
    ILlamaStrategy strategy
  ) internal pure returns (LlamaAbsolutePeerReview converted) {
    assembly {
      converted := strategy
    }
  }

  function toAbsoluteQuorum(
    ILlamaStrategy strategy
  ) internal pure returns (LlamaAbsoluteQuorum converted) {
    assembly {
      converted := strategy
    }
  }

  function toAbsoluteStrategyBase(
    ILlamaStrategy strategy
  ) internal pure returns (LlamaAbsoluteStrategyBase converted) {
    assembly {
      converted := strategy
    }
  }

  function deployAbsolutePeerReview(
    uint8 _approvalRole,
    uint8 _disapprovalRole,
    uint64 _queuingDuration,
    uint64 _expirationDelay,
    uint64 _approvalPeriod,
    bool _isFixedLengthApprovalPeriod,
    uint96 _minApprovals,
    uint96 _minDisapprovals,
    uint8[] memory _forceApprovalRoles,
    uint8[] memory _forceDisapprovalRoles
  ) internal returns (ILlamaStrategy newStrategy) {
    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: _approvalPeriod,
        queuingPeriod: _queuingDuration,
        expirationPeriod: _expirationDelay,
        isFixedLengthApprovalPeriod: _isFixedLengthApprovalPeriod,
        minApprovals: _minApprovals,
        minDisapprovals: _minDisapprovals,
        approvalRole: _approvalRole,
        disapprovalRole: _disapprovalRole,
        forceApprovalRoles: _forceApprovalRoles,
        forceDisapprovalRoles: _forceDisapprovalRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(absolutePeerReviewLogic, true);

    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      absolutePeerReviewLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );

    newStrategy = lens.computeLlamaStrategyAddress(
      address(absolutePeerReviewLogic),
      DeployUtils.encodeStrategy(strategyConfig),
      address(mpCore)
    );
  }

  function deployAbsoluteQuorum(
    uint8 _approvalRole,
    uint8 _disapprovalRole,
    uint64 _queuingDuration,
    uint64 _expirationDelay,
    uint64 _approvalPeriod,
    bool _isFixedLengthApprovalPeriod,
    uint96 _minApprovals,
    uint96 _minDisapprovals,
    uint8[] memory _forceApprovalRoles,
    uint8[] memory _forceDisapprovalRoles
  ) internal returns (ILlamaStrategy newStrategy) {
    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: _approvalPeriod,
        queuingPeriod: _queuingDuration,
        expirationPeriod: _expirationDelay,
        isFixedLengthApprovalPeriod: _isFixedLengthApprovalPeriod,
        minApprovals: _minApprovals,
        minDisapprovals: _minDisapprovals,
        approvalRole: _approvalRole,
        disapprovalRole: _disapprovalRole,
        forceApprovalRoles: _forceApprovalRoles,
        forceDisapprovalRoles: _forceDisapprovalRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(absoluteQuorumLogic, true);

    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      absoluteQuorumLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );

    newStrategy = lens.computeLlamaStrategyAddress(
      address(absoluteQuorumLogic),
      DeployUtils.encodeStrategy(strategyConfig),
      address(mpCore)
    );
  }

  function deployRelativeHolderQuorum(
    uint8 _approvalRole,
    uint8 _disapprovalRole,
    uint64 _queuingDuration,
    uint64 _expirationDelay,
    uint64 _approvalPeriod,
    bool _isFixedLengthApprovalPeriod,
    uint16 _minApprovalPct,
    uint16 _minDisapprovalPct,
    uint8[] memory _forceApprovalRoles,
    uint8[] memory _forceDisapprovalRoles
  ) internal returns (ILlamaStrategy newStrategy) {
    LlamaRelativeStrategyBase.Config
      memory strategyConfig = LlamaRelativeStrategyBase.Config({
        approvalPeriod: _approvalPeriod,
        queuingPeriod: _queuingDuration,
        expirationPeriod: _expirationDelay,
        isFixedLengthApprovalPeriod: _isFixedLengthApprovalPeriod,
        minApprovalPct: _minApprovalPct,
        minDisapprovalPct: _minDisapprovalPct,
        approvalRole: _approvalRole,
        disapprovalRole: _disapprovalRole,
        forceApprovalRoles: _forceApprovalRoles,
        forceDisapprovalRoles: _forceDisapprovalRoles
      });

    LlamaRelativeStrategyBase.Config[]
      memory strategyConfigs = new LlamaRelativeStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(relativeHolderQuorumLogic, true);

    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );

    newStrategy = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      DeployUtils.encodeStrategy(strategyConfig),
      address(mpCore)
    );
  }

  function deployRelativeQuantityQuorum(
    uint8 _approvalRole,
    uint8 _disapprovalRole,
    uint64 _queuingDuration,
    uint64 _expirationDelay,
    uint64 _approvalPeriod,
    bool _isFixedLengthApprovalPeriod,
    uint16 _minApprovalPct,
    uint16 _minDisapprovalPct,
    uint8[] memory _forceApprovalRoles,
    uint8[] memory _forceDisapprovalRoles
  ) internal returns (ILlamaStrategy newStrategy) {
    LlamaRelativeStrategyBase.Config
      memory strategyConfig = LlamaRelativeStrategyBase.Config({
        approvalPeriod: _approvalPeriod,
        queuingPeriod: _queuingDuration,
        expirationPeriod: _expirationDelay,
        isFixedLengthApprovalPeriod: _isFixedLengthApprovalPeriod,
        minApprovalPct: _minApprovalPct,
        minDisapprovalPct: _minDisapprovalPct,
        approvalRole: _approvalRole,
        disapprovalRole: _disapprovalRole,
        forceApprovalRoles: _forceApprovalRoles,
        forceDisapprovalRoles: _forceDisapprovalRoles
      });

    LlamaRelativeStrategyBase.Config[]
      memory strategyConfigs = new LlamaRelativeStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(relativeQuantityQuorumLogic, true);

    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      relativeQuantityQuorumLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );

    newStrategy = lens.computeLlamaStrategyAddress(
      address(relativeQuantityQuorumLogic),
      DeployUtils.encodeStrategy(strategyConfig),
      address(mpCore)
    );
  }

  function deployRelativeUniqueHolderQuorum(
    uint8 _approvalRole,
    uint8 _disapprovalRole,
    uint64 _queuingDuration,
    uint64 _expirationDelay,
    uint64 _approvalPeriod,
    bool _isFixedLengthApprovalPeriod,
    uint16 _minApprovalPct,
    uint16 _minDisapprovalPct,
    uint8[] memory _forceApprovalRoles,
    uint8[] memory _forceDisapprovalRoles
  ) internal returns (ILlamaStrategy newStrategy) {
    LlamaRelativeStrategyBase.Config
      memory strategyConfig = LlamaRelativeStrategyBase.Config({
        approvalPeriod: _approvalPeriod,
        queuingPeriod: _queuingDuration,
        expirationPeriod: _expirationDelay,
        isFixedLengthApprovalPeriod: _isFixedLengthApprovalPeriod,
        minApprovalPct: _minApprovalPct,
        minDisapprovalPct: _minDisapprovalPct,
        approvalRole: _approvalRole,
        disapprovalRole: _disapprovalRole,
        forceApprovalRoles: _forceApprovalRoles,
        forceDisapprovalRoles: _forceDisapprovalRoles
      });

    LlamaRelativeStrategyBase.Config[]
      memory strategyConfigs = new LlamaRelativeStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(relativeUniqueHolderQuorumLogic, true);

    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      relativeUniqueHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );

    newStrategy = lens.computeLlamaStrategyAddress(
      address(relativeUniqueHolderQuorumLogic),
      DeployUtils.encodeStrategy(strategyConfig),
      address(mpCore)
    );
  }

  function maxRole(
    uint8 role,
    uint8[] memory forceApprovalRoles,
    uint8[] memory forceDisapprovalRoles
  ) internal pure returns (uint8 largest) {
    largest = role;
    for (uint256 i = 0; i < forceApprovalRoles.length; i++) {
      if (forceApprovalRoles[i] > largest) largest = forceApprovalRoles[i];
    }
    for (uint256 i = 0; i < forceDisapprovalRoles.length; i++) {
      if (forceDisapprovalRoles[i] > largest)
        largest = forceDisapprovalRoles[i];
    }
  }

  function initializeRolesUpTo(uint8 role) internal {
    while (mpPolicy.numRoles() < role) {
      vm.prank(address(mpExecutor));
      mpPolicy.initializeRole(RoleDescription.wrap("Test Role"));
    }
  }

  function generateAndSetRoleHolders(uint256 numberOfHolders) internal {
    for (uint256 i = 0; i < numberOfHolders; i++) {
      address _policyHolder = address(uint160(i + 100));
      if (mpPolicy.balanceOf(_policyHolder) == 0) {
        vm.prank(address(mpExecutor));
        mpPolicy.setRoleHolder(
          uint8(Roles.TestRole1),
          _policyHolder,
          1,
          type(uint64).max
        );
      }
    }

    // We often call this `generateAndSetRoleHolders` before creating an action, so we must mine a
    // block here to ensure the role balance and supply checkpoints are set at `block.timestamp - 1`.
    mineBlock();
  }

  function generateAndSetRoleHolders(
    uint256 numberOfHolders,
    uint96 quantity
  ) internal {
    for (uint256 i = 0; i < numberOfHolders; i++) {
      address _policyHolder = address(uint160(i + 100));
      if (mpPolicy.balanceOf(_policyHolder) == 0) {
        vm.prank(address(mpExecutor));
        mpPolicy.setRoleHolder(
          uint8(Roles.TestRole1),
          _policyHolder,
          quantity,
          type(uint64).max
        );
      }
    }
  }

  function createAction(
    ILlamaStrategy testStrategy
  ) internal returns (ActionInfo memory actionInfo) {
    // Give the action creator the ability to use this strategy.
    PermissionData memory permissionData = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      testStrategy
    );
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      permissionData,
      true
    );

    // Create the action.
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      testStrategy,
      address(mockProtocol),
      0,
      data,
      ""
    );

    actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      testStrategy,
      address(mockProtocol),
      0,
      data
    );

    mineBlock();
  }

  function approveAction(
    uint256 numberOfApprovals,
    ActionInfo memory actionInfo
  ) internal {
    for (uint256 i = 0; i < numberOfApprovals; i++) {
      address _policyholder = address(uint160(i + 100));
      vm.prank(_policyholder);
      mpCore.castApproval(uint8(Roles.TestRole1), actionInfo, "");
    }
  }

  function disapproveAction(
    uint256 numberOfDisapprovals,
    ActionInfo memory actionInfo
  ) internal {
    for (uint256 i = 0; i < numberOfDisapprovals; i++) {
      address _policyholder = address(uint160(i + 100));
      vm.prank(_policyholder);
      mpCore.castDisapproval(uint8(Roles.TestRole1), actionInfo, "");
    }
  }
}
