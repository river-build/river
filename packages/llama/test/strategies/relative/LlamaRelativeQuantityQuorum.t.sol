// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {FixedPointMathLib} from "@solady/utils/FixedPointMathLib.sol";

import {LlamaRelativeStrategyBaseTest} from "@llama/test/strategies/relative/LlamaRelativeStrategyBase.t.sol";
import {MockProtocol} from "@llama/test/mock/MockProtocol.sol";
import {Roles} from "@llama/test/utils/LlamaTestSetup.sol";

import {DeployUtils} from "@llama/script/DeployUtils.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionState} from "@llama/src/lib/Enums.sol";
import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";
import {LlamaRelativeQuantityQuorum} from "@llama/src/strategies/relative/LlamaRelativeQuantityQuorum.sol";
import {LlamaRelativeStrategyBase} from "@llama/src/strategies/relative/LlamaRelativeStrategyBase.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";

contract LlamaRelativeQuantityQuorumTest is LlamaRelativeStrategyBaseTest {
  function deployRelativeQuantityQuorumAndSetRole(
    uint8 _role,
    PermissionData memory _permissionData,
    address _policyHolder,
    uint64 _queuingDuration,
    uint64 _expirationDelay,
    uint64 _approvalPeriod,
    bool _isFixedLengthApprovalPeriod,
    uint16 _minApprovalPct,
    uint16 _minDisapprovalPct,
    uint8[] memory _forceApprovalRoles,
    uint8[] memory _forceDisapprovalRoles
  ) internal returns (ILlamaStrategy newStrategy) {
    {
      // Initialize roles if required.
      initializeRolesUpTo(
        maxRole(_role, _forceApprovalRoles, _forceDisapprovalRoles)
      );

      vm.prank(address(mpExecutor));
      mpPolicy.setRoleHolder(_role, _policyHolder, 1, type(uint64).max);
      vm.prank(address(mpExecutor));
      mpPolicy.setRolePermission(_role, _permissionData, true);
    }

    LlamaRelativeStrategyBase.Config
      memory strategyConfig = LlamaRelativeStrategyBase.Config({
        approvalPeriod: _approvalPeriod,
        queuingPeriod: _queuingDuration,
        expirationPeriod: _expirationDelay,
        isFixedLengthApprovalPeriod: _isFixedLengthApprovalPeriod,
        minApprovalPct: _minApprovalPct,
        minDisapprovalPct: _minDisapprovalPct,
        approvalRole: _role,
        disapprovalRole: _role,
        forceApprovalRoles: _forceApprovalRoles,
        forceDisapprovalRoles: _forceDisapprovalRoles
      });

    LlamaRelativeStrategyBase.Config[]
      memory strategyConfigs = new LlamaRelativeStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

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

  function deployTestRelativeQuantityQuorumStrategy()
    internal
    returns (ILlamaStrategy testStrategy)
  {
    LlamaRelativeStrategyBase.Config
      memory testStrategyData = LlamaRelativeStrategyBase.Config({
        approvalPeriod: 1 days,
        queuingPeriod: 2 days,
        expirationPeriod: 8 days,
        isFixedLengthApprovalPeriod: true,
        minApprovalPct: 4000,
        minDisapprovalPct: 2000,
        approvalRole: uint8(Roles.TestRole1),
        disapprovalRole: uint8(Roles.TestRole1),
        forceApprovalRoles: new uint8[](0),
        forceDisapprovalRoles: new uint8[](0)
      });
    testStrategy = lens.computeLlamaStrategyAddress(
      address(relativeQuantityQuorumLogic),
      DeployUtils.encodeStrategy(testStrategyData),
      address(mpCore)
    );
    LlamaRelativeStrategyBase.Config[]
      memory testStrategies = new LlamaRelativeStrategyBase.Config[](1);
    testStrategies[0] = testStrategyData;
    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      relativeQuantityQuorumLogic,
      DeployUtils.encodeStrategyConfigs(testStrategies)
    );
  }

  function deployRelativeQuantityQuorumWithForceApproval()
    internal
    returns (ILlamaStrategy testStrategy)
  {
    // Define strategy parameters.
    uint8[] memory forceApproveRoles = new uint8[](1);
    forceApproveRoles[0] = uint8(Roles.ForceApprover);
    uint8[] memory forceDisapproveRoles = new uint8[](1);
    forceDisapproveRoles[0] = uint8(Roles.ForceDisapprover);

    LlamaRelativeStrategyBase.Config
      memory testStrategyData = LlamaRelativeStrategyBase.Config({
        approvalPeriod: 1 days,
        queuingPeriod: 2 days,
        expirationPeriod: 8 days,
        isFixedLengthApprovalPeriod: false,
        minApprovalPct: 4000,
        minDisapprovalPct: 2000,
        approvalRole: uint8(Roles.TestRole1),
        disapprovalRole: uint8(Roles.TestRole1),
        forceApprovalRoles: forceApproveRoles,
        forceDisapprovalRoles: forceDisapproveRoles
      });

    // Get the address of the strategy we'll deploy.
    testStrategy = lens.computeLlamaStrategyAddress(
      address(relativeQuantityQuorumLogic),
      DeployUtils.encodeStrategy(testStrategyData),
      address(mpCore)
    );

    // Create and authorize the strategy.
    LlamaRelativeStrategyBase.Config[]
      memory testStrategies = new LlamaRelativeStrategyBase.Config[](1);
    testStrategies[0] = testStrategyData;
    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      relativeQuantityQuorumLogic,
      DeployUtils.encodeStrategyConfigs(testStrategies)
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.ForceApprover),
      address(approverAdam),
      1,
      type(uint64).max
    );
  }
}

contract IsActionApproved is LlamaRelativeQuantityQuorumTest {
  function testFuzz_ReturnsTrueForPassedActions(
    uint256 _actionApprovals,
    uint256 _numberOfPolicies
  ) public {
    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    _actionApprovals = bound(
      _actionApprovals,
      FixedPointMathLib.mulDivUp(_numberOfPolicies, 4000, 10_000),
      _numberOfPolicies
    );

    ILlamaStrategy testStrategy = deployTestRelativeQuantityQuorumStrategy();

    generateAndSetRoleHolders(_numberOfPolicies);

    ActionInfo memory actionInfo = createAction(testStrategy);

    approveAction(_actionApprovals, actionInfo);

    bool _isActionApproved = testStrategy.isActionApproved(actionInfo);

    assertEq(_isActionApproved, true);
  }

  function testFuzz_ReturnsFalseForFailedActions(
    uint256 _actionApprovals,
    uint256 _numberOfPolicies
  ) public {
    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    _actionApprovals = bound(
      _actionApprovals,
      0,
      FixedPointMathLib.mulDivUp(_numberOfPolicies, 4000, 10_000) - 1
    );

    ILlamaStrategy testStrategy = deployTestRelativeQuantityQuorumStrategy();

    generateAndSetRoleHolders(_numberOfPolicies);

    ActionInfo memory actionInfo = createAction(testStrategy);

    approveAction(_actionApprovals, actionInfo);

    bool _isActionApproved = testStrategy.isActionApproved(actionInfo);

    assertEq(_isActionApproved, false);
  }

  function testFuzz_RevertForNonExistentActionId(
    ActionInfo calldata actionInfo
  ) public {
    vm.expectRevert(LlamaCore.InfoHashMismatch.selector);
    vm.prank(address(approverAdam));
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
  }
}

contract GetApprovalQuantityAt is LlamaRelativeQuantityQuorumTest {
  function testFuzz_ReturnsZeroQuantityPriorToAccountGainingPermission(
    uint256 _timeUntilPermission,
    address _target,
    bytes4 _selector,
    address _strategy,
    uint8 _role,
    address _policyHolder
  ) public {
    vm.assume(
      _timeUntilPermission > block.timestamp &&
        _timeUntilPermission < type(uint64).max
    );
    vm.assume(_role > 0);
    vm.assume(_target != address(0));
    vm.assume(_selector > bytes4(0));
    vm.assume(_strategy != address(0));
    vm.assume(_policyHolder != address(0));
    PermissionData memory _permissionData = PermissionData(
      _target,
      _selector,
      ILlamaStrategy(_strategy)
    );
    uint256 _referenceTime = block.timestamp;
    vm.warp(_timeUntilPermission);

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      _role,
      _permissionData,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );

    assertEq(
      newStrategy.getApprovalQuantityAt(_policyHolder, _role, _referenceTime),
      0 // there should be zero quantity before permission was granted
    );
  }

  function testFuzz_ReturnsQuantityAfterBlockThatAccountGainedPermission(
    uint256 _timeSincePermission, // no assume for this param, we want 0 tested
    address _target,
    bytes4 _selector,
    address _strategy,
    uint8 _role,
    address _policyHolder
  ) public {
    vm.assume(
      _timeSincePermission > block.timestamp &&
        _timeSincePermission < type(uint64).max
    );
    vm.assume(_role > 0);
    vm.assume(_target != address(0));
    vm.assume(_selector > bytes4(0));
    vm.assume(_strategy != address(0));
    vm.assume(_policyHolder != address(0));
    PermissionData memory _permissionData = PermissionData(
      _target,
      _selector,
      ILlamaStrategy(_strategy)
    );

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      _role,
      _permissionData,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );
    vm.warp(_timeSincePermission);
    assertEq(
      newStrategy.getApprovalQuantityAt(
        _policyHolder,
        _role,
        _timeSincePermission > 0
          ? _timeSincePermission - 1
          : _timeSincePermission
      ),
      1 // the account should still have the quantity
    );
  }

  function testFuzz_ReturnsZeroQuantityForNonPolicyHolders(
    uint64 _timestamp,
    uint8 _role,
    address _nonPolicyHolder
  ) public {
    _timestamp = uint64(
      bound(_timestamp, block.timestamp + 1, type(uint64).max)
    );
    vm.assume(_nonPolicyHolder != address(0));
    vm.assume(_nonPolicyHolder != address(0xdeadbeef)); // Given a policy below.
    vm.assume(mpPolicy.balanceOf(_nonPolicyHolder) == 0);
    vm.assume(_role != 0);

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      _role,
      defaultPermission,
      address(0xdeadbeef),
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );

    vm.warp(_timestamp);

    assertEq(
      newStrategy.getApprovalQuantityAt(
        _nonPolicyHolder,
        _role,
        _timestamp - 1
      ),
      0 // the account should not have a quantity
    );
  }

  function testFuzz_ReturnsDefaultQuantityForPolicyHolderWithoutExplicitQuantity(
    uint256 _timestamp,
    uint8 _role,
    address _policyHolder
  ) public {
    _timestamp = bound(_timestamp, block.timestamp - 1, type(uint64).max);
    _role = uint8(bound(_role, 8, 255)); // ignoring all roles in the test setup to avoid conflicts with pre-assigned
    // roles
    vm.assume(_policyHolder != address(0));

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      uint8(Roles.TestRole1),
      defaultPermission,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );

    vm.warp(_timestamp);

    assertEq(
      newStrategy.getApprovalQuantityAt(_policyHolder, _role, _timestamp - 1),
      0 // the account should not have a quantity
    );
  }

  function testFuzz_ReturnsZeroForNonApprovalRoles(
    uint8 _role,
    address _policyHolder,
    uint96 _quantity
  ) public {
    _role = uint8(bound(_role, 1, 8)); // only using roles in the test setup to avoid having to create new roles
    vm.assume(_role != uint8(Roles.TestRole1));
    vm.assume(_policyHolder != address(0));
    vm.assume(mpPolicy.balanceOf(_policyHolder) == 0);
    _quantity = uint96(
      bound(
        _quantity,
        1,
        type(uint96).max -
          mpPolicy.getPastRoleSupplyAsQuantitySum(_role, block.timestamp - 1)
      )
    );

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      uint8(Roles.TestRole1),
      defaultPermission,
      address(0xdeadbeef),
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(_role, _policyHolder, _quantity, type(uint64).max);

    assertEq(
      newStrategy.getApprovalQuantityAt(
        address(0xdeadbeef),
        uint8(Roles.TestRole2),
        block.timestamp
      ),
      0
    );
  }

  function testFuzz_ReturnsMaxValueForForceApprovalRoles(
    uint256 _timestamp,
    uint8 _role,
    address _policyHolder
  ) public {
    vm.assume(_timestamp > block.timestamp && _timestamp < type(uint64).max);
    _role = uint8(bound(_role, 1, 8)); // only using roles in the test setup to avoid having to create new roles
    vm.assume(_policyHolder != address(0));
    vm.assume(mpPolicy.balanceOf(_policyHolder) == 0);

    uint8[] memory forceApproveRoles = new uint8[](1);
    forceApproveRoles[0] = _role;

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      _role,
      defaultPermission,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      forceApproveRoles,
      new uint8[](0)
    );

    vm.warp(_timestamp);

    assertEq(
      newStrategy.getApprovalQuantityAt(_policyHolder, _role, _timestamp - 1),
      type(uint96).max
    );
  }
}

contract GetDisapprovalQuantityAt is LlamaRelativeQuantityQuorumTest {
  function testFuzz_ReturnsZeroQuantityPriorToAccountGainingPermission(
    uint256 _timeUntilPermission,
    address _target,
    bytes4 _selector,
    address _strategy,
    uint8 _role,
    address _policyHolder
  ) public {
    vm.assume(
      _timeUntilPermission > block.timestamp &&
        _timeUntilPermission < type(uint64).max
    );
    vm.assume(_role > 0);
    vm.assume(_target != address(0));
    vm.assume(_selector > bytes4(0));
    vm.assume(_strategy != address(0));
    vm.assume(_policyHolder != address(0));
    PermissionData memory _permissionData = PermissionData(
      _target,
      _selector,
      ILlamaStrategy(_strategy)
    );
    uint256 _referenceTime = block.timestamp;
    vm.warp(_timeUntilPermission);

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      _role,
      _permissionData,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );

    assertEq(
      newStrategy.getDisapprovalQuantityAt(
        _policyHolder,
        _role,
        _referenceTime
      ),
      0 // there should be zero quantity before permission was granted
    );
  }

  function testFuzz_ReturnsQuantityAfterBlockThatAccountGainedPermission(
    uint256 _timeSincePermission, // no assume for this param, we want 0 tested
    address _target,
    bytes4 _selector,
    address _strategy,
    uint8 _role,
    address _policyHolder
  ) public {
    vm.assume(
      _timeSincePermission > block.timestamp &&
        _timeSincePermission < type(uint64).max
    );
    vm.assume(_role > 0);
    vm.assume(_target != address(0));
    vm.assume(_selector > bytes4(0));
    vm.assume(_strategy != address(0));
    vm.assume(_policyHolder != address(0));
    PermissionData memory _permissionData = PermissionData(
      _target,
      _selector,
      ILlamaStrategy(_strategy)
    );

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      _role,
      _permissionData,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );
    vm.warp(_timeSincePermission);
    assertEq(
      newStrategy.getDisapprovalQuantityAt(
        _policyHolder,
        _role,
        _timeSincePermission > 0
          ? _timeSincePermission - 1
          : _timeSincePermission
      ),
      1 // the account should still have the quantity
    );
  }

  function testFuzz_ReturnsZeroQuantityForNonPolicyHolders(
    uint256 _timestamp,
    uint8 _role,
    address _nonPolicyHolder
  ) public {
    vm.assume(_timestamp > block.timestamp && _timestamp < type(uint64).max);
    vm.assume(_nonPolicyHolder != address(0));
    vm.assume(_nonPolicyHolder != address(0xdeadbeef)); // Given a policy below.
    vm.assume(mpPolicy.balanceOf(_nonPolicyHolder) == 0);
    vm.assume(_role != 0);

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      _role,
      defaultPermission,
      address(0xdeadbeef),
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );

    vm.warp(_timestamp);

    assertEq(
      newStrategy.getDisapprovalQuantityAt(
        _nonPolicyHolder,
        _role,
        _timestamp - 1
      ),
      0 // the account should not have a quantity
    );
  }

  function testFuzz_ReturnsDefaultQuantityForPolicyHolderWithoutExplicitQuantity(
    uint256 _timestamp,
    uint8 _role,
    address _policyHolder
  ) public {
    _timestamp = bound(_timestamp, block.timestamp - 1, type(uint64).max);
    _role = uint8(bound(_role, 8, 255)); // ignoring all roles in the test setup to avoid conflicts with pre-assigned
    // roles
    vm.assume(_policyHolder != address(0));

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      uint8(Roles.TestRole1),
      defaultPermission,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );

    vm.warp(_timestamp);

    assertEq(
      newStrategy.getDisapprovalQuantityAt(
        _policyHolder,
        _role,
        _timestamp - 1
      ),
      0 // the account should not have a quantity
    );
  }

  function testFuzz_ReturnsZeroForNonApprovalRoles(
    uint8 _role,
    address _policyHolder,
    uint96 _quantity
  ) public {
    _role = uint8(bound(_role, 1, 8)); // ignoring all roles in the test setup to avoid conflicts with pre-assigned
    // roles
    vm.assume(_role != uint8(Roles.TestRole1));
    vm.assume(_policyHolder != address(0));
    vm.assume(mpPolicy.balanceOf(_policyHolder) == 0);
    _quantity = uint96(
      bound(
        _quantity,
        1,
        type(uint96).max -
          mpPolicy.getPastRoleSupplyAsQuantitySum(_role, block.timestamp - 1)
      )
    );

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      uint8(Roles.TestRole1),
      defaultPermission,
      address(0xdeadbeef),
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      new uint8[](0)
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(_role, _policyHolder, _quantity, type(uint64).max);

    assertEq(
      newStrategy.getDisapprovalQuantityAt(
        address(0xdeadbeef),
        uint8(Roles.TestRole2),
        block.timestamp
      ),
      0
    );
  }

  function testFuzz_ReturnsMaxValueForForceDisapprovalRoles(
    uint256 _timestamp,
    uint8 _role,
    address _policyHolder
  ) public {
    vm.assume(_timestamp > block.timestamp && _timestamp < type(uint64).max);
    _role = uint8(bound(_role, 1, 8)); // only using roles in the test setup to avoid having to create new roles
    vm.assume(_policyHolder != address(0));
    vm.assume(mpPolicy.balanceOf(_policyHolder) == 0);

    uint8[] memory forceDisapproveRoles = new uint8[](1);
    forceDisapproveRoles[0] = _role;

    ILlamaStrategy newStrategy = deployRelativeQuantityQuorumAndSetRole(
      _role,
      defaultPermission,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      4000,
      2000,
      new uint8[](0),
      forceDisapproveRoles
    );

    vm.warp(_timestamp);

    assertEq(
      newStrategy.getDisapprovalQuantityAt(
        _policyHolder,
        _role,
        _timestamp - 1
      ),
      type(uint96).max
    );
  }
}

contract ValidateActionCreation is LlamaRelativeQuantityQuorumTest {
  function createStrategyWithNoSupplyRole(
    bool approval
  ) internal returns (uint8 noSupplyRole, ILlamaStrategy testStrategy) {
    // Getting a role with no supply currently and initializing it.
    noSupplyRole = mpPolicy.numRoles() + 1;
    initializeRolesUpTo(noSupplyRole);

    // Create the strategy with 0 (dis)approval threshold to not trigger `InvalidMinApprovals` error.
    if (approval) {
      testStrategy = deployRelativeQuantityQuorum(
        noSupplyRole,
        uint8(Roles.Disapprover),
        1 days,
        4 days,
        1 days,
        true,
        0,
        0,
        new uint8[](0),
        new uint8[](0)
      );
    } else {
      testStrategy = deployRelativeQuantityQuorum(
        uint8(Roles.Approver),
        noSupplyRole,
        1 days,
        4 days,
        1 days,
        true,
        0,
        0,
        new uint8[](0),
        new uint8[](0)
      );
    }
  }

  function mineBlockAndAssertRoleSupply(uint8 noSupplyRole) internal {
    // Moving timestamp ahead by 1 second
    mineBlock();

    // Verify that `noSupplyRole` has no supply at `action creation time - 1`.
    assertEq(
      mpPolicy.getPastRoleSupplyAsQuantitySum(
        noSupplyRole,
        block.timestamp - 1
      ),
      0
    );

    // Generate a new user so they have no checkpoint history (to ensure checkpoints are monotonically increasing).
    address newApprover = makeAddr("newApprover");
    // Assign 'noSupplyRole` at `action creation time` to the new user to make the role supply 1.
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(noSupplyRole, newApprover, 1, type(uint64).max);

    // Verify that `noSupplyRole` has supply of 1 at `action creation time`.
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(noSupplyRole), 1);
  }

  function expectRevertRoleHasZeroSupplyOnActionCreationValidation(
    uint8 noSupplyRole,
    ILlamaStrategy testStrategy
  ) internal {
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
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaRelativeStrategyBase.RoleHasZeroSupply.selector,
        noSupplyRole
      )
    );
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      testStrategy,
      address(mockProtocol),
      0,
      data,
      ""
    );
  }

  function test_CalculateSupplyWhenActionCreatorDoesNotHaveRole(
    uint256 _numberOfPolicies,
    uint96 quantity
  ) external {
    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    quantity = uint96(bound(quantity, 1, 100));

    ILlamaStrategy testStrategy = deployTestRelativeQuantityQuorumStrategy();

    generateAndSetRoleHolders(_numberOfPolicies, quantity);

    mineBlock();

    uint256 supply = mpPolicy.getPastRoleSupplyAsQuantitySum(
      uint8(Roles.TestRole1),
      block.timestamp - 1
    );

    ActionInfo memory actionInfo = createAction(testStrategy);

    assertEq(
      LlamaRelativeQuantityQuorum(address(testStrategy)).getApprovalSupply(
        actionInfo
      ),
      supply
    );
    assertEq(
      LlamaRelativeQuantityQuorum(address(testStrategy)).getDisapprovalSupply(
        actionInfo
      ),
      supply
    );
  }

  function test_CalculateSupplyWhenActionCreatorHasRole(
    uint256 _numberOfPolicies,
    uint256 _creatorQuantity,
    uint96 quantity
  ) external {
    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    _creatorQuantity = bound(_creatorQuantity, 1, 1000);
    quantity = uint96(bound(quantity, 1, 100));

    ILlamaStrategy testStrategy = deployTestRelativeQuantityQuorumStrategy();

    generateAndSetRoleHolders(_numberOfPolicies, quantity);

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      actionCreatorAaron,
      uint96(_creatorQuantity),
      type(uint64).max
    );

    mineBlock();

    uint256 supply = mpPolicy.getPastRoleSupplyAsQuantitySum(
      uint8(Roles.TestRole1),
      block.timestamp - 1
    );

    ActionInfo memory actionInfo = createAction(testStrategy);

    assertEq(
      LlamaRelativeQuantityQuorum(address(testStrategy)).getApprovalSupply(
        actionInfo
      ),
      supply
    );
    assertEq(
      LlamaRelativeQuantityQuorum(address(testStrategy)).getDisapprovalSupply(
        actionInfo
      ),
      supply
    );
  }

  function test_RevertIf_ApprovalRoleHasZeroSupply() public {
    (
      uint8 noSupplyRole,
      ILlamaStrategy testStrategy
    ) = createStrategyWithNoSupplyRole(true);
    expectRevertRoleHasZeroSupplyOnActionCreationValidation(
      noSupplyRole,
      testStrategy
    );
  }

  function test_RevertIf_DisapprovalRoleHasZeroSupply() public {
    (
      uint8 noSupplyRole,
      ILlamaStrategy testStrategy
    ) = createStrategyWithNoSupplyRole(false);
    expectRevertRoleHasZeroSupplyOnActionCreationValidation(
      noSupplyRole,
      testStrategy
    );
  }

  function test_UsesApprovalRoleSupplyFromPreviousTimestamp() public {
    (
      uint8 noSupplyRole,
      ILlamaStrategy testStrategy
    ) = createStrategyWithNoSupplyRole(true);
    mineBlockAndAssertRoleSupply(noSupplyRole);
    // This reverts since supply of `noSupplyRole` at `action creation time - 1` is 0. This verifies that the strategy
    // uses the supply of `noSupplyRole` at `action creation time - 1` since `noSupplyRole` has a supply of 1 at `action
    // creation time`.
    expectRevertRoleHasZeroSupplyOnActionCreationValidation(
      noSupplyRole,
      testStrategy
    );
  }

  function test_UsesDisapprovalRoleSupplyFromPreviousTimestamp() public {
    (
      uint8 noSupplyRole,
      ILlamaStrategy testStrategy
    ) = createStrategyWithNoSupplyRole(false);
    mineBlockAndAssertRoleSupply(noSupplyRole);
    // This reverts since supply of `noSupplyRole` at `action creation time - 1` is 0. This verifies that the strategy
    // uses the supply of `noSupplyRole` at `action creation time - 1` since `noSupplyRole` has a supply of 1 at `action
    // creation time`.
    expectRevertRoleHasZeroSupplyOnActionCreationValidation(
      noSupplyRole,
      testStrategy
    );
  }
}

contract ValidateActionCancelation is LlamaRelativeQuantityQuorumTest {
  function testFuzz_RevertIf_ActionNotFullyDisapprovedAndCallerIsNotCreator(
    uint256 _actionDisapprovals,
    uint256 _numberOfPolicies
  ) public {
    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    _actionDisapprovals = bound(
      _actionDisapprovals,
      0,
      FixedPointMathLib.mulDivUp(_numberOfPolicies, 2000, 10_000) - 1
    );

    ILlamaStrategy testStrategy = deployRelativeQuantityQuorumWithForceApproval();

    generateAndSetRoleHolders(_numberOfPolicies);

    ActionInfo memory actionInfo = createAction(testStrategy);

    vm.prank(address(approverAdam));
    mpCore.castApproval(uint8(Roles.ForceApprover), actionInfo, ""); // Approves and queues the action.

    disapproveAction(_actionDisapprovals, actionInfo);
    assertEq(
      uint8(mpCore.getActionState(actionInfo)),
      uint8(ActionState.Queued)
    );

    vm.expectRevert(LlamaRelativeStrategyBase.OnlyActionCreator.selector);
    testStrategy.validateActionCancelation(actionInfo, address(this));
  }

  function testFuzz_NoRevertIf_ActionNotFullyDisapprovedAndCallerIsNotCreator(
    uint256 _actionDisapprovals,
    uint256 _numberOfPolicies
  ) public {
    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    _actionDisapprovals = bound(
      _actionDisapprovals,
      0,
      FixedPointMathLib.mulDivUp(_numberOfPolicies, 2000, 10_000) - 1
    );

    ILlamaStrategy testStrategy = deployRelativeQuantityQuorumWithForceApproval();

    generateAndSetRoleHolders(_numberOfPolicies);

    ActionInfo memory actionInfo = createAction(testStrategy);

    vm.prank(address(approverAdam));
    mpCore.castApproval(uint8(Roles.ForceApprover), actionInfo, ""); // Approves and queues the action.

    disapproveAction(_actionDisapprovals, actionInfo);
    assertEq(
      uint8(mpCore.getActionState(actionInfo)),
      uint8(ActionState.Queued)
    );

    testStrategy.validateActionCancelation(actionInfo, actionInfo.creator); // This should not revert.
  }
}
