// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {FixedPointMathLib} from "@solady/utils/FixedPointMathLib.sol";

import {MockLlamaAbsoluteStrategyBase} from "@llama/test/mock/MockLlamaAbsoluteStrategyBase.sol";
import {MockProtocol} from "@llama/test/mock/MockProtocol.sol";
import {Roles} from "@llama/test/utils/LlamaTestSetup.sol";
import {LlamaStrategyTestSetup} from "@llama/test/strategies/LlamaStrategyTestSetup.sol";

import {DeployUtils} from "@llama/script/DeployUtils.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {Action, ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";
import {ActionState} from "@llama/src/lib/Enums.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract LlamaAbsoluteStrategyBaseTest is LlamaStrategyTestSetup {
  uint8 constant DEFAULT_ROLE = uint8(Roles.TestRole1);
  address constant DEFAULT_POLICYHOLDER = address(0xdeadbeef);
  uint64 constant DEFAULT_QUEUING_PERIOD = 1 days;
  uint64 constant DEFAULT_EXPIRATION_PERIOD = 4 days;
  uint64 constant DEFAULT_APPROVAL_PERIOD = 1 days;
  bool constant DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD = true;
  uint16 constant DEFAULT_DISAPPROVALS = 1;
  uint16 constant DEFAULT_APPROVALS = 1;
  PermissionData defaultPermission =
    PermissionData(address(0), bytes4(0), ILlamaStrategy(address(0)));
  uint8[] defaultForceRoles;

  MockLlamaAbsoluteStrategyBase mockLlamaAbsoluteStrategyBaseLogic;

  function setUp() public virtual override {
    LlamaStrategyTestSetup.setUp();

    mockLlamaAbsoluteStrategyBaseLogic = new MockLlamaAbsoluteStrategyBase();

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(
      mockLlamaAbsoluteStrategyBaseLogic,
      true
    );
  }

  function deployTestStrategyAndSetRole(
    uint8 _role,
    PermissionData memory _permissionData,
    address _policyHolder,
    uint64 _queuingDuration,
    uint64 _expirationDelay,
    uint64 _approvalPeriod,
    bool _isFixedLengthApprovalPeriod,
    uint16 _minApprovals,
    uint16 _minDisapprovals,
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

      mineBlock();
    }

    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: _approvalPeriod,
        queuingPeriod: _queuingDuration,
        expirationPeriod: _expirationDelay,
        minApprovals: _minApprovals,
        minDisapprovals: _minDisapprovals,
        isFixedLengthApprovalPeriod: _isFixedLengthApprovalPeriod,
        approvalRole: _role,
        disapprovalRole: _role,
        forceApprovalRoles: _forceApprovalRoles,
        forceDisapprovalRoles: _forceDisapprovalRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));

    mpCore.createStrategies(
      mockLlamaAbsoluteStrategyBaseLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );

    newStrategy = lens.computeLlamaStrategyAddress(
      address(mockLlamaAbsoluteStrategyBaseLogic),
      DeployUtils.encodeStrategy(strategyConfig),
      address(mpCore)
    );
  }
}

contract Constructor is LlamaAbsoluteStrategyBaseTest {
  function test_DisablesInitializationAtConstruction() public {
    vm.expectRevert(Initializable.InvalidInitialization.selector);
    mockLlamaAbsoluteStrategyBaseLogic.initialize(bytes(""));
  }
}

contract Initialize is LlamaAbsoluteStrategyBaseTest {
  function _executeCompleteActionFlow()
    internal
    returns (ActionInfo memory actionInfo)
  {
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );
    actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data
    );
    vm.warp(block.timestamp + 1);

    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");

    vm.prank(approverAlicia);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), true);
    mpCore.queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    mpCore.executeAction(actionInfo);
  }

  function testFuzz_SetsStrategyStorageQueuingDuration(
    uint64 _queuingDuration
  ) public {
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      _queuingDuration,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
    );
    assertEq(
      toAbsoluteStrategyBase(newStrategy).queuingPeriod(),
      _queuingDuration
    );
  }

  function testFuzz_SetsStrategyStorageExpirationDelay(
    uint64 _expirationDelay
  ) public {
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      _expirationDelay,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
    );
    assertEq(
      toAbsoluteStrategyBase(newStrategy).expirationPeriod(),
      _expirationDelay
    );
  }

  function test_SetsStrategyStorageIsFixedLengthApprovalPeriod(
    bool _isFixedLengthApprovalPeriod
  ) public {
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      _isFixedLengthApprovalPeriod,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
    );
    assertEq(
      toAbsoluteStrategyBase(newStrategy).isFixedLengthApprovalPeriod(),
      _isFixedLengthApprovalPeriod
    );
  }

  function testFuzz_SetsStrategyStorageApprovalPeriod(
    uint64 _approvalPeriod
  ) public {
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      _approvalPeriod,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
    );
    assertEq(
      toAbsoluteStrategyBase(newStrategy).approvalPeriod(),
      _approvalPeriod
    );
  }

  function test_SetsStrategyStoragePolicy() public {
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
    );
    assertEq(address(newStrategy.policy()), address(mpPolicy));
  }

  function test_SetsStrategyStorageLlama() public {
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
    );
    assertEq(address(newStrategy.llamaCore()), address(mpCore));
  }

  function testFuzz_SetsStrategyStorageMinApprovals(uint16 _approvals) public {
    _approvals = toUint16(
      bound(
        _approvals,
        0,
        mpPolicy.getRoleSupplyAsNumberOfHolders(uint8(Roles.TestRole1))
      )
    );
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      _approvals,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
    );
    assertEq(toAbsoluteStrategyBase(newStrategy).minApprovals(), _approvals);
  }

  function testFuzz_SetsStrategyStorageMinDisapprovals(
    uint16 _disapprovals
  ) public {
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      _disapprovals,
      defaultForceRoles,
      defaultForceRoles
    );
    assertEq(
      toAbsoluteStrategyBase(newStrategy).minDisapprovals(),
      _disapprovals
    );
  }

  function testFuzz_SetsForceApprovalRoles(
    uint8[] memory forceApprovalRoles
  ) public {
    for (uint256 i = 0; i < forceApprovalRoles.length; i++) {
      // 0 = All Holders Role, which will revert if set as force role
      if (forceApprovalRoles[i] == 0) forceApprovalRoles[i] = 1;
    }
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      forceApprovalRoles,
      defaultForceRoles
    );
    for (uint256 i = 0; i < forceApprovalRoles.length; i++) {
      assertEq(
        toAbsoluteStrategyBase(newStrategy).forceApprovalRole(
          forceApprovalRoles[i]
        ),
        true
      );
    }
  }

  function testFuzz_SetsForceDisapprovalRoles(
    uint8[] memory forceDisapprovalRoles
  ) public {
    for (uint256 i = 0; i < forceDisapprovalRoles.length; i++) {
      // 0 = All Holders Role, which will revert if set as force role
      if (forceDisapprovalRoles[i] == 0) forceDisapprovalRoles[i] = 1;
    }
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      forceDisapprovalRoles
    );
    for (uint256 i = 0; i < forceDisapprovalRoles.length; i++) {
      assertEq(
        toAbsoluteStrategyBase(newStrategy).forceDisapprovalRole(
          forceDisapprovalRoles[i]
        ),
        true
      );
    }
  }

  function testFuzz_HandlesDuplicateApprovalRoles(uint8 _role) public {
    _role = uint8(bound(_role, 1, type(uint8).max));
    uint8[] memory forceApprovalRoles = new uint8[](2);
    forceApprovalRoles[0] = _role;
    forceApprovalRoles[1] = _role;
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      forceApprovalRoles,
      defaultForceRoles
    );
    assertEq(
      toAbsoluteStrategyBase(newStrategy).forceApprovalRole(_role),
      true
    );
  }

  function testFuzz_HandlesDuplicateDisapprovalRoles(uint8 _role) public {
    _role = uint8(bound(_role, 1, type(uint8).max));
    uint8[] memory forceDisapprovalRoles = new uint8[](2);
    forceDisapprovalRoles[0] = _role;
    forceDisapprovalRoles[1] = _role;
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      forceDisapprovalRoles
    );
    assertEq(
      toAbsoluteStrategyBase(newStrategy).forceDisapprovalRole(_role),
      true
    );
  }

  function testFuzz_EmitsStrategyCreatedEvent()
    public
  /*TODO fuzz this test */ {
    deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
    );
  }

  function testFuzz_RevertIf_InvalidMinApprovals(
    uint256 _numberOfPolicies,
    uint256 _minApprovalIncrease
  ) public {
    _minApprovalIncrease = bound(_minApprovalIncrease, 1, 1000);
    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    generateAndSetRoleHolders(_numberOfPolicies);
    uint256 totalQuantity = mpPolicy.getRoleSupplyAsQuantitySum(
      uint8(Roles.TestRole1)
    );
    uint256 minApprovals = totalQuantity + _minApprovalIncrease;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(
      mockLlamaAbsoluteStrategyBaseLogic,
      true
    );

    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: DEFAULT_APPROVAL_PERIOD,
        queuingPeriod: DEFAULT_QUEUING_PERIOD,
        expirationPeriod: DEFAULT_EXPIRATION_PERIOD,
        minApprovals: toUint96(minApprovals),
        minDisapprovals: DEFAULT_DISAPPROVALS,
        isFixedLengthApprovalPeriod: DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
        approvalRole: DEFAULT_ROLE,
        disapprovalRole: DEFAULT_ROLE,
        forceApprovalRoles: defaultForceRoles,
        forceDisapprovalRoles: defaultForceRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));

    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.InvalidMinApprovals.selector,
        minApprovals
      )
    );
    mpCore.createStrategies(
      mockLlamaAbsoluteStrategyBaseLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );
  }

  function test_RevertIf_SetAllHoldersRoleAsForceApprovalRole() public {
    uint8[] memory _forceApprovalRoles = new uint8[](1);
    _forceApprovalRoles[0] = uint8(Roles.AllHolders);
    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: DEFAULT_APPROVAL_PERIOD,
        queuingPeriod: DEFAULT_QUEUING_PERIOD,
        expirationPeriod: DEFAULT_EXPIRATION_PERIOD,
        minApprovals: DEFAULT_APPROVALS,
        minDisapprovals: DEFAULT_DISAPPROVALS,
        isFixedLengthApprovalPeriod: false,
        approvalRole: uint8(Roles.Approver),
        disapprovalRole: uint8(Roles.Disapprover),
        forceApprovalRoles: _forceApprovalRoles,
        forceDisapprovalRoles: defaultForceRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.InvalidRole.selector,
        uint8(Roles.AllHolders)
      )
    );
    mpCore.createStrategies(
      mockLlamaAbsoluteStrategyBaseLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );
  }

  function test_RevertIf_SetAllHoldersRoleAsForceDisapprovalRole() public {
    uint8[] memory _forceDisapprovalRoles = new uint8[](1);
    _forceDisapprovalRoles[0] = uint8(Roles.AllHolders);
    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: DEFAULT_APPROVAL_PERIOD,
        queuingPeriod: DEFAULT_QUEUING_PERIOD,
        expirationPeriod: DEFAULT_EXPIRATION_PERIOD,
        minApprovals: DEFAULT_APPROVALS,
        minDisapprovals: DEFAULT_DISAPPROVALS,
        isFixedLengthApprovalPeriod: false,
        approvalRole: uint8(Roles.Approver),
        disapprovalRole: uint8(Roles.Disapprover),
        forceApprovalRoles: defaultForceRoles,
        forceDisapprovalRoles: _forceDisapprovalRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));

    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.InvalidRole.selector,
        uint8(Roles.AllHolders)
      )
    );
    mpCore.createStrategies(
      mockLlamaAbsoluteStrategyBaseLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );
  }

  function testFuzz_NoRevertIfQuantityIsLoweredInSameBlock(
    uint256 _numberOfPolicies
  ) public {
    // Guarantees that actionCount > 0
    _executeCompleteActionFlow();

    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    generateAndSetRoleHolders(_numberOfPolicies);
    uint256 totalQuantity = mpPolicy.getRoleSupplyAsQuantitySum(
      uint8(Roles.TestRole1)
    );
    uint256 minApprovals = totalQuantity;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(
      mockLlamaAbsoluteStrategyBaseLogic,
      true
    );

    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: DEFAULT_APPROVAL_PERIOD,
        queuingPeriod: DEFAULT_QUEUING_PERIOD,
        expirationPeriod: DEFAULT_EXPIRATION_PERIOD,
        minApprovals: toUint96(minApprovals),
        minDisapprovals: DEFAULT_DISAPPROVALS,
        isFixedLengthApprovalPeriod: DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
        approvalRole: DEFAULT_ROLE,
        disapprovalRole: DEFAULT_ROLE,
        forceApprovalRoles: defaultForceRoles,
        forceDisapprovalRoles: defaultForceRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    // Set quantity to 0 for `Roles.TestRole1` role holders.
    for (uint256 i = 0; i < _numberOfPolicies; i++) {
      address _policyHolder = address(uint160(i + 100));
      vm.prank(address(mpExecutor));
      mpPolicy.setRoleHolder(uint8(Roles.TestRole1), _policyHolder, 0, 0);
    }

    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      mockLlamaAbsoluteStrategyBaseLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );
  }

  function testFuzz_RevertIf_QuantityIsLoweredInPreviousBlock(
    uint256 _numberOfPolicies
  ) public {
    // Guarantees that actionCount > 0
    _executeCompleteActionFlow();

    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    generateAndSetRoleHolders(_numberOfPolicies);
    uint256 totalQuantity = mpPolicy.getRoleSupplyAsQuantitySum(
      uint8(Roles.TestRole1)
    );
    uint256 minApprovals = totalQuantity;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(
      mockLlamaAbsoluteStrategyBaseLogic,
      true
    );

    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: DEFAULT_APPROVAL_PERIOD,
        queuingPeriod: DEFAULT_QUEUING_PERIOD,
        expirationPeriod: DEFAULT_EXPIRATION_PERIOD,
        minApprovals: toUint96(minApprovals),
        minDisapprovals: DEFAULT_DISAPPROVALS,
        isFixedLengthApprovalPeriod: DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
        approvalRole: DEFAULT_ROLE,
        disapprovalRole: DEFAULT_ROLE,
        forceApprovalRoles: defaultForceRoles,
        forceDisapprovalRoles: defaultForceRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    // Set quantity to 0 for `Roles.TestRole1` role holders.
    for (uint256 i = 0; i < _numberOfPolicies; i++) {
      address _policyHolder = address(uint160(i + 100));
      vm.prank(address(mpExecutor));
      mpPolicy.setRoleHolder(uint8(Roles.TestRole1), _policyHolder, 0, 0);
    }

    mineBlock();

    vm.prank(address(mpExecutor));
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.InvalidMinApprovals.selector,
        minApprovals
      )
    );
    mpCore.createStrategies(
      mockLlamaAbsoluteStrategyBaseLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );
  }

  function testFuzz_NoRevertIfQuantityIsIncreasedInSameBlockAndActionCountIsZero(
    uint256 _numberOfPolicies
  ) public {
    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    generateAndSetRoleHolders(_numberOfPolicies);
    uint256 totalQuantity = mpPolicy.getRoleSupplyAsQuantitySum(
      uint8(Roles.TestRole1)
    );
    uint256 minApprovals = totalQuantity + 1;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(
      mockLlamaAbsoluteStrategyBaseLogic,
      true
    );

    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: DEFAULT_APPROVAL_PERIOD,
        queuingPeriod: DEFAULT_QUEUING_PERIOD,
        expirationPeriod: DEFAULT_EXPIRATION_PERIOD,
        minApprovals: toUint96(minApprovals),
        minDisapprovals: DEFAULT_DISAPPROVALS,
        isFixedLengthApprovalPeriod: DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
        approvalRole: DEFAULT_ROLE,
        disapprovalRole: DEFAULT_ROLE,
        forceApprovalRoles: defaultForceRoles,
        forceDisapprovalRoles: defaultForceRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    // Set quantity to 100 for `Roles.TestRole1` role holders.
    for (uint256 i = 0; i < _numberOfPolicies; i++) {
      address _policyHolder = address(uint160(i + 100));
      vm.prank(address(mpExecutor));
      mpPolicy.setRoleHolder(
        uint8(Roles.TestRole1),
        _policyHolder,
        100,
        type(uint64).max
      );
    }

    // Assert that actions count is 0 before creating the strategy
    assertEq(mpCore.actionsCount(), 0);

    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      mockLlamaAbsoluteStrategyBaseLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );
  }

  function testFuzz_RevertIf_QuantityIsLoweredInSameBlockAndActionCountIsZero(
    uint256 _numberOfPolicies
  ) public {
    _numberOfPolicies = bound(_numberOfPolicies, 2, 100);
    generateAndSetRoleHolders(_numberOfPolicies);
    uint256 totalQuantity = mpPolicy.getRoleSupplyAsQuantitySum(
      uint8(Roles.TestRole1)
    );
    uint256 minApprovals = totalQuantity;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(
      mockLlamaAbsoluteStrategyBaseLogic,
      true
    );

    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: DEFAULT_APPROVAL_PERIOD,
        queuingPeriod: DEFAULT_QUEUING_PERIOD,
        expirationPeriod: DEFAULT_EXPIRATION_PERIOD,
        minApprovals: toUint96(minApprovals),
        minDisapprovals: DEFAULT_DISAPPROVALS,
        isFixedLengthApprovalPeriod: DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
        approvalRole: DEFAULT_ROLE,
        disapprovalRole: DEFAULT_ROLE,
        forceApprovalRoles: defaultForceRoles,
        forceDisapprovalRoles: defaultForceRoles
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    // Set quantity to 0 for `Roles.TestRole1` role holders.
    for (uint256 i = 0; i < _numberOfPolicies; i++) {
      address _policyHolder = address(uint160(i + 100));
      vm.prank(address(mpExecutor));
      mpPolicy.setRoleHolder(uint8(Roles.TestRole1), _policyHolder, 0, 0);
    }

    // Assert that actions count is 0 before creating the strategy
    assertEq(mpCore.actionsCount(), 0);

    vm.prank(address(mpExecutor));
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.InvalidMinApprovals.selector,
        minApprovals
      )
    );
    mpCore.createStrategies(
      mockLlamaAbsoluteStrategyBaseLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );
  }
}

contract IsActionApproved is LlamaAbsoluteStrategyBaseTest {
  function testFuzz_RevertForNonExistentActionId(
    ActionInfo calldata actionInfo
  ) public {
    vm.expectRevert(LlamaCore.InfoHashMismatch.selector);
    vm.prank(address(approverAdam));
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
  }

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

    generateAndSetRoleHolders(_numberOfPolicies);

    ILlamaStrategy testStrategy = deployTestStrategyAndSetRole(
      uint8(Roles.TestRole1),
      defaultPermission,
      address(this),
      1 days,
      4 days,
      1 days,
      true,
      toUint16(_actionApprovals),
      1,
      new uint8[](0),
      new uint8[](0)
    );

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
      FixedPointMathLib.mulDivUp(_numberOfPolicies, 3000, 10_000) - 1
    );
    uint256 approvalThreshold = FixedPointMathLib.mulDivUp(
      _numberOfPolicies,
      4000,
      10_000
    );

    generateAndSetRoleHolders(_numberOfPolicies);

    ILlamaStrategy testStrategy = deployTestStrategyAndSetRole(
      uint8(Roles.TestRole1),
      defaultPermission,
      address(this),
      1 days,
      4 days,
      1 days,
      true,
      toUint16(approvalThreshold),
      1,
      new uint8[](0),
      new uint8[](0)
    );

    ActionInfo memory actionInfo = createAction(testStrategy);

    approveAction(_actionApprovals, actionInfo);

    bool _isActionApproved = testStrategy.isActionApproved(actionInfo);

    assertEq(_isActionApproved, false);
  }
}

contract ValidateActionCancelation is LlamaAbsoluteStrategyBaseTest {
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
    uint256 disapprovalThreshold = FixedPointMathLib.mulDivUp(
      _numberOfPolicies,
      2000,
      10_000
    );

    ILlamaStrategy testStrategy = deployTestStrategyAndSetRole(
      uint8(Roles.TestRole1),
      defaultPermission,
      address(this),
      1 days,
      4 days,
      1 days,
      false,
      0,
      toUint16(disapprovalThreshold),
      new uint8[](0),
      new uint8[](0)
    );

    generateAndSetRoleHolders(_numberOfPolicies);

    ActionInfo memory actionInfo = createAction(testStrategy);

    mpCore.queueAction(actionInfo);

    disapproveAction(_actionDisapprovals, actionInfo);
    assertEq(
      uint8(mpCore.getActionState(actionInfo)),
      uint8(ActionState.Queued)
    );

    vm.expectRevert(LlamaAbsoluteStrategyBase.OnlyActionCreator.selector);
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
    uint256 disapprovalThreshold = FixedPointMathLib.mulDivUp(
      _numberOfPolicies,
      2000,
      10_000
    );

    ILlamaStrategy testStrategy = deployTestStrategyAndSetRole(
      uint8(Roles.TestRole1),
      defaultPermission,
      address(this),
      1 days,
      4 days,
      1 days,
      false,
      0,
      toUint16(disapprovalThreshold),
      new uint8[](0),
      new uint8[](0)
    );

    generateAndSetRoleHolders(_numberOfPolicies);

    ActionInfo memory actionInfo = createAction(testStrategy);

    mpCore.queueAction(actionInfo);

    disapproveAction(_actionDisapprovals, actionInfo);
    assertEq(
      uint8(mpCore.getActionState(actionInfo)),
      uint8(ActionState.Queued)
    );

    testStrategy.validateActionCancelation(actionInfo, actionInfo.creator); // This should not revert.
  }

  function testFuzz_RevertForNonExistentActionId(
    ActionInfo calldata actionInfo
  ) public {
    vm.expectRevert(LlamaCore.InfoHashMismatch.selector);
    vm.prank(address(disapproverDave));
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");
  }
}

contract GetApprovalQuantityAt is LlamaAbsoluteStrategyBaseTest {
  function testFuzz_ReturnsZeroQuantityPriorToAccountGainingPermission(
    uint256 _timeUntilPermission,
    uint8 _role,
    address _target,
    bytes4 _selector,
    address _strategy,
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
    uint256 _referenceTime = block.timestamp;
    vm.warp(_timeUntilPermission);
    PermissionData memory _permissionData = PermissionData(
      _target,
      _selector,
      ILlamaStrategy(_strategy)
    );
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      _role,
      _permissionData,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      1,
      1,
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
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      _role,
      _permissionData,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      1,
      1,
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

    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      _role,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
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

    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      _policyHolder,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
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
        type(uint96).max - mpPolicy.getRoleSupplyAsQuantitySum(_role)
      )
    );

    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
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

    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      _role,
      defaultPermission,
      _policyHolder,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
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

contract GetDisapprovalQuantityAt is LlamaAbsoluteStrategyBaseTest {
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
    uint256 _referenceTime = block.timestamp;
    vm.warp(_timeUntilPermission);
    PermissionData memory _permissionData = PermissionData(
      _target,
      _selector,
      ILlamaStrategy(_strategy)
    );
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      _role,
      _permissionData,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      1,
      1,
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
    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      _role,
      _permissionData,
      _policyHolder,
      1 days,
      4 days,
      1 days,
      true,
      1,
      1,
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

    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      _role,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
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

    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      uint8(Roles.TestRole1),
      defaultPermission,
      _policyHolder,
      1 days,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
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
        type(uint96).max - mpPolicy.getRoleSupplyAsQuantitySum(_role)
      )
    );

    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      DEFAULT_ROLE,
      defaultPermission,
      DEFAULT_POLICYHOLDER,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
      defaultForceRoles,
      defaultForceRoles
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

    ILlamaStrategy newStrategy = deployTestStrategyAndSetRole(
      _role,
      defaultPermission,
      _policyHolder,
      DEFAULT_QUEUING_PERIOD,
      DEFAULT_EXPIRATION_PERIOD,
      DEFAULT_APPROVAL_PERIOD,
      DEFAULT_FIXED_LENGTH_APPROVAL_PERIOD,
      DEFAULT_APPROVALS,
      DEFAULT_DISAPPROVALS,
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
