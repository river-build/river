// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {Roles, LlamaTestSetup} from "@llama/test/utils/LlamaTestSetup.sol";

import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {ILlamaActionGuard} from "@llama/src/interfaces/ILlamaActionGuard.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";
import {ActionInfo, PermissionData, RoleHolderData, RolePermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {LlamaGovernanceScript} from "@llama/src/llama-scripts/LlamaGovernanceScript.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {LlamaRelativeStrategyBase} from "@llama/src/strategies/relative/LlamaRelativeStrategyBase.sol";
import {DeployUtils} from "@llama/script/DeployUtils.sol";
import {MockActionGuard} from "@llama/test/mock/MockActionGuard.sol";

contract LlamaGovernanceScriptTest is LlamaTestSetup {
  event AccountCreated(
    ILlamaAccount account,
    ILlamaAccount indexed accountLogic,
    bytes initializationData
  );
  event AccountLogicAuthorizationSet(
    ILlamaAccount indexed accountLogic,
    bool authorized
  );
  event RoleAssigned(
    address indexed policyholder,
    uint8 indexed role,
    uint64 expiration,
    uint96 quantity
  );
  event RoleInitialized(uint8 indexed role, RoleDescription description);
  event RolePermissionAssigned(
    uint8 indexed role,
    bytes32 indexed permissionId,
    PermissionData permissionData,
    bool hasPermission
  );
  event ScriptAuthorizationSet(address indexed script, bool authorized);
  event StrategyAuthorizationSet(
    ILlamaStrategy indexed strategy,
    bool authorized
  );
  event StrategyLogicAuthorizationSet(
    ILlamaStrategy indexed strategyLogic,
    bool authorized
  );
  event StrategyCreated(
    ILlamaStrategy strategy,
    ILlamaStrategy indexed strategyLogic,
    bytes initializationData
  );
  event ActionGuardSet(
    address indexed target,
    bytes4 indexed selector,
    ILlamaActionGuard actionGuard
  );

  mapping(uint8 => uint96) public rolesHoldersSeen;
  mapping(uint8 => uint96) public rolesQuantitySeen;

  uint8[] public roles;
  address[] public revokePolicies;

  LlamaGovernanceScript govScript;

  bytes4 public constant AGGREGATE_SELECTOR =
    LlamaGovernanceScript.aggregate.selector;
  bytes4 public constant INIT_ROLE_AND_HOLDERS_AND_PERMISSIONS_SELECTOR =
    LlamaGovernanceScript.initRoleAndHoldersAndPermissions.selector;
  bytes4 public constant CREATE_STRATEGY_AND_SET_ROLE_PERMISSIONS_SELECTOR =
    LlamaGovernanceScript.createStrategyAndSetRolePermissions.selector;
  bytes4 public constant UPDATE_ROLE_DESCRIPTION_AND_ROLE_HOLDERS_SELECTOR =
    LlamaGovernanceScript.updateRoleDescriptionAndRoleHolders.selector;
  bytes4 public constant CREATE_ACCOUNT_AND_SET_ROLE_PERMISSIONS_SELECTOR =
    LlamaGovernanceScript.createAccountAndSetRolePermissions.selector;
  bytes4 public constant SET_SCRIPT_AUTH_AND_SET_PERMISSIONS_SELECTOR =
    LlamaGovernanceScript.setScriptAuthAndSetPermissions.selector;
  bytes4 public constant SET_STRATEGY_LOGIC_AUTHORIZATIONS_SELECTOR =
    LlamaGovernanceScript.setStrategyLogicAuthorizations.selector;
  bytes4 public constant SET_ACCOUNT_LOGIC_AUTHORIZATIONS_SELECTOR =
    LlamaGovernanceScript.setAccountLogicAuthorizations.selector;
  bytes4 public constant SET_STRATEGY_AUTHORIZATIONS_SELECTOR =
    LlamaGovernanceScript.setStrategyAuthorizations.selector;
  bytes4 public constant SET_STRATEGY_LOGIC_AUTH_AND_NEW_STRATEGIES_SELECTOR =
    LlamaGovernanceScript.setStrategyLogicAuthAndNewStrategies.selector;
  bytes4 public constant SET_GUARDS_SELECTOR =
    LlamaGovernanceScript.setGuards.selector;
  bytes4 public constant INIT_ROLES_SELECTOR =
    LlamaGovernanceScript.initRoles.selector;
  bytes4 public constant SET_ROLE_HOLDERS_SELECTOR =
    LlamaGovernanceScript.setRoleHolders.selector;
  bytes4 public constant SET_ROLE_PERMISSIONS_SELECTOR =
    LlamaGovernanceScript.setRolePermissions.selector;
  bytes4 public constant REVOKE_POLICIES_SELECTOR =
    LlamaGovernanceScript.revokePolicies.selector;
  bytes4 public constant UPDATE_ROLE_DESCRIPTIONS_SELECTOR =
    LlamaGovernanceScript.updateRoleDescriptions.selector;

  PermissionData public aggregatePermission;
  PermissionData public initRoleAndHoldersAndPermissionsPermission;
  PermissionData public createStrategyAndSetRolePermissionsPermission;
  PermissionData public updateRoleDescriptionAndRoleHoldersPermission;
  PermissionData public createAccountAndSetRolePermissionsPermission;
  PermissionData public setScriptAuthAndSetPermissionsPermission;
  PermissionData public setStrategyLogicAuthorizationsPermission;
  PermissionData public setAccountLogicAuthorizationsPermission;
  PermissionData public setStrategyAuthorizationsPermission;
  PermissionData public setStrategyLogicAuthAndNewStrategiesPermission;
  PermissionData public setGuardsPermission;
  PermissionData public initRolesPermission;
  PermissionData public setRoleHoldersPermission;
  PermissionData public setRolePermissionsPermission;
  PermissionData public revokePoliciesPermission;
  PermissionData public updateRoleDescriptionsPermission;

  function setUp() public virtual override {
    LlamaTestSetup.setUp();

    govScript = new LlamaGovernanceScript();

    vm.startPrank(address(mpExecutor));

    mpCore.setScriptAuthorization(address(govScript), true);

    aggregatePermission = PermissionData(
      address(govScript),
      AGGREGATE_SELECTOR,
      mpStrategy2
    );
    initRoleAndHoldersAndPermissionsPermission = PermissionData(
      address(govScript),
      INIT_ROLE_AND_HOLDERS_AND_PERMISSIONS_SELECTOR,
      mpStrategy2
    );
    createStrategyAndSetRolePermissionsPermission = PermissionData(
      address(govScript),
      CREATE_STRATEGY_AND_SET_ROLE_PERMISSIONS_SELECTOR,
      mpStrategy2
    );
    updateRoleDescriptionAndRoleHoldersPermission = PermissionData(
      address(govScript),
      UPDATE_ROLE_DESCRIPTION_AND_ROLE_HOLDERS_SELECTOR,
      mpStrategy2
    );
    createAccountAndSetRolePermissionsPermission = PermissionData(
      address(govScript),
      CREATE_ACCOUNT_AND_SET_ROLE_PERMISSIONS_SELECTOR,
      mpStrategy2
    );
    setScriptAuthAndSetPermissionsPermission = PermissionData(
      address(govScript),
      SET_SCRIPT_AUTH_AND_SET_PERMISSIONS_SELECTOR,
      mpStrategy2
    );
    setStrategyLogicAuthorizationsPermission = PermissionData(
      address(govScript),
      SET_STRATEGY_LOGIC_AUTHORIZATIONS_SELECTOR,
      mpStrategy2
    );
    setAccountLogicAuthorizationsPermission = PermissionData(
      address(govScript),
      SET_ACCOUNT_LOGIC_AUTHORIZATIONS_SELECTOR,
      mpStrategy2
    );
    setStrategyAuthorizationsPermission = PermissionData(
      address(govScript),
      SET_STRATEGY_AUTHORIZATIONS_SELECTOR,
      mpStrategy2
    );
    setStrategyLogicAuthAndNewStrategiesPermission = PermissionData(
      address(govScript),
      SET_STRATEGY_LOGIC_AUTH_AND_NEW_STRATEGIES_SELECTOR,
      mpStrategy2
    );
    setGuardsPermission = PermissionData(
      address(govScript),
      SET_GUARDS_SELECTOR,
      mpStrategy2
    );
    initRolesPermission = PermissionData(
      address(govScript),
      INIT_ROLES_SELECTOR,
      mpStrategy2
    );
    setRoleHoldersPermission = PermissionData(
      address(govScript),
      SET_ROLE_HOLDERS_SELECTOR,
      mpStrategy2
    );
    setRolePermissionsPermission = PermissionData(
      address(govScript),
      SET_ROLE_PERMISSIONS_SELECTOR,
      mpStrategy2
    );
    revokePoliciesPermission = PermissionData(
      address(govScript),
      REVOKE_POLICIES_SELECTOR,
      mpStrategy2
    );
    updateRoleDescriptionsPermission = PermissionData(
      address(govScript),
      UPDATE_ROLE_DESCRIPTIONS_SELECTOR,
      mpStrategy2
    );

    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      aggregatePermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      initRoleAndHoldersAndPermissionsPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      createStrategyAndSetRolePermissionsPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      updateRoleDescriptionAndRoleHoldersPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      createAccountAndSetRolePermissionsPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      setScriptAuthAndSetPermissionsPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      setStrategyLogicAuthorizationsPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      setAccountLogicAuthorizationsPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      setStrategyAuthorizationsPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      setStrategyLogicAuthAndNewStrategiesPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      setGuardsPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      initRolesPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      setRoleHoldersPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      setRolePermissionsPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      revokePoliciesPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      updateRoleDescriptionsPermission,
      true
    );

    vm.stopPrank();
  }

  function _approveAction(ActionInfo memory actionInfo) internal {
    vm.warp(block.timestamp + 1);
    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    vm.prank(approverAlicia);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    vm.prank(approverAndy);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, ""); // Approves and queues the action.
  }

  function _assumeInitializeRoles(
    RoleDescription[] memory descriptions
  ) public pure {
    vm.assume(descriptions.length < 247); // max unit8 (255) - total number of exisitng roles (8)
  }

  function _assumeUpdateRoleDescriptions(
    LlamaGovernanceScript.UpdateRoleDescription[] memory descriptions
  ) public pure {
    vm.assume(descriptions.length <= 9); //number of roles in the Roles enum
    for (uint256 i = 0; i < descriptions.length; i++) {
      descriptions[i].role = uint8(i);
    }
  }

  function _boundRolePermissions(
    RolePermissionData[] memory rolePermissions
  ) public view {
    for (uint256 i = 0; i < rolePermissions.length; i++) {
      // Cannot be 0 (all holders role) and cannot be greater than numRoles
      rolePermissions[i].role = uint8(
        bound(rolePermissions[i].role, 1, mpPolicy.numRoles())
      );
    }
  }

  function _boundRolePermissions(
    LlamaGovernanceScript.NewStrategyRolesAndPermissionsData[]
      memory rolePermissions
  ) public view {
    for (uint256 i = 0; i < rolePermissions.length; i++) {
      // Cannot be 0 (all holders role) and cannot be greater than numRoles
      rolePermissions[i].role = uint8(
        bound(rolePermissions[i].role, 1, mpPolicy.numRoles())
      );
    }
  }

  function _createAndApproveAndQueueAction(
    bytes memory data
  ) internal returns (ActionInfo memory actionInfo) {
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy2,
      address(govScript),
      0,
      data,
      ""
    );
    actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy2,
      address(govScript),
      0,
      data
    );
    vm.warp(block.timestamp + 1);
    _approveAction(actionInfo);
  }

  function _createStrategy(
    uint256 salt,
    bool isFixedLengthApprovalPeriod
  )
    internal
    view
    returns (
      LlamaRelativeStrategyBase.Config memory newStrategy,
      LlamaGovernanceScript.CreateStrategy memory strategy
    )
  {
    newStrategy = LlamaRelativeStrategyBase.Config({
      approvalPeriod: toUint64(salt % 1000 days),
      queuingPeriod: toUint64(salt % 1001 days),
      expirationPeriod: toUint64(salt % 1002 days),
      isFixedLengthApprovalPeriod: isFixedLengthApprovalPeriod,
      minApprovalPct: toUint16(salt % 10_000),
      minDisapprovalPct: toUint16(salt % 10_100),
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });
    strategy.llamaStrategyLogic = relativeHolderQuorumLogic;
    strategy.config = DeployUtils.encodeStrategy(newStrategy);
  }

  function _expectInitializeRolesEvents(
    RoleDescription[] memory descriptions
  ) internal {
    for (uint256 i = 0; i < descriptions.length; i++) {
      vm.expectEmit();
      emit RoleInitialized(uint8(i + 9), descriptions[i]);
    }
  }

  function _expectRoleHolderEvents(
    RoleHolderData[] memory roleHolders
  ) internal {
    for (uint256 i = 0; i < roleHolders.length; i++) {
      vm.expectEmit();
      emit RoleAssigned(
        roleHolders[i].policyholder,
        roleHolders[i].role,
        roleHolders[i].expiration,
        roleHolders[i].quantity
      );
      rolesHoldersSeen[roleHolders[i].role]++;
      rolesQuantitySeen[roleHolders[i].role] += roleHolders[i].quantity;
    }
  }

  function _expectRolePermissionEvents(
    RolePermissionData[] memory rolePermissions
  ) internal {
    for (uint256 i = 0; i < rolePermissions.length; i++) {
      bytes32 permissionId = lens.computePermissionId(
        rolePermissions[i].permissionData
      );
      vm.expectEmit();
      emit RolePermissionAssigned(
        rolePermissions[i].role,
        permissionId,
        rolePermissions[i].permissionData,
        rolePermissions[i].hasPermission
      );
    }
  }

  function _expectCreateStrategyEvents(
    LlamaRelativeStrategyBase.Config memory newStrategy,
    ILlamaStrategy strategyAddress
  ) internal {
    vm.expectEmit();
    emit StrategyAuthorizationSet(strategyAddress, true);
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddress,
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategy(newStrategy)
    );
  }

  function _expectUpdateRoleDescriptionsEvents(
    LlamaGovernanceScript.UpdateRoleDescription[] memory descriptions
  ) internal {
    for (uint256 i = 0; i < descriptions.length; i++) {
      vm.expectEmit();
      emit RoleInitialized(uint8(i), descriptions[i].description);
    }
  }

  function _expectSetGuardsEvents(
    address target,
    bytes4[] memory selectors,
    ILlamaActionGuard guard
  ) internal {
    for (uint256 i = 0; i < selectors.length; i++) {
      vm.expectEmit();
      emit ActionGuardSet(target, selectors[i], guard);
    }
  }
}

contract Aggregate is LlamaGovernanceScriptTest {
  address[] public targets;
  bytes[] public calls;

  function test_aggregate(RoleDescription[] memory descriptions) public {
    _assumeInitializeRoles(descriptions);
    for (uint256 i = 0; i < descriptions.length; i++) {
      targets.push(address(mpPolicy));
      calls.push(
        abi.encodeWithSelector(
          LlamaPolicy.initializeRole.selector,
          descriptions[i]
        )
      );

      targets.push(address(mpPolicy));
      calls.push(
        abi.encodeWithSelector(
          LlamaPolicy.setRoleHolder.selector,
          uint8(i + 9),
          address(uint160(i + 101)),
          1,
          type(uint64).max
        )
      );
    }

    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](1);
    newAccounts[0] = LlamaAccount.Config({name: "new treasury"});

    ILlamaAccount[] memory accountAddresses = new ILlamaAccount[](1);
    for (uint256 i; i < newAccounts.length; i++) {
      accountAddresses[i] = lens.computeLlamaAccountAddress(
        address(accountLogic),
        DeployUtils.encodeAccount(newAccounts[i]),
        address(mpCore)
      );
    }

    targets.push(address(mpCore));
    calls.push(
      abi.encodeWithSelector(
        0x90010bb0,
        accountLogic,
        DeployUtils.encodeAccountConfigs(newAccounts)
      )
    );

    bytes memory data = abi.encodeWithSelector(
      AGGREGATE_SELECTOR,
      targets,
      calls
    );

    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    _expectInitializeRolesEvents(descriptions);
    vm.expectEmit();
    emit AccountCreated(
      accountAddresses[0],
      accountLogic,
      DeployUtils.encodeAccount(newAccounts[0])
    );
    mpCore.executeAction(actionInfo);
  }

  function test_RevertsIf_CallReverted(RoleDescription description) public {
    targets.push(address(0));
    calls.push(
      abi.encodeWithSelector(LlamaPolicy.initializeRole.selector, description)
    );

    bytes memory data = abi.encodeWithSelector(
      AGGREGATE_SELECTOR,
      targets,
      calls
    );

    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    vm.expectRevert();
    // CallReverted error cannot be reached because we get a "FailedActionExecution" error first.
    mpCore.executeAction(actionInfo);
  }

  function test_RevertsIf_UnauthorizedTarget(address target) public {
    vm.assume(target != address(mpPolicy) && target != address(mpCore));
    targets.push(address(target));
    calls.push(
      abi.encodeWithSelector(LlamaPolicy.initializeRole.selector, "test")
    );

    bytes memory data = abi.encodeWithSelector(
      AGGREGATE_SELECTOR,
      targets,
      calls
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    vm.expectRevert();
    // UnauthorizedTarget error cannot be reached because we get a "FailedActionExecution" error first.
    mpCore.executeAction(actionInfo);
  }

  function test_RevertsIf_MismatchedArrayLength(
    address[] calldata _targets,
    uint8 length
  ) public {
    vm.assume(targets.length != length);
    bytes[] memory _calls = new bytes[](length);
    for (uint256 i = 0; i < length; i++) {
      _calls[i] = abi.encodeWithSelector(
        LlamaPolicy.initializeRole.selector,
        "test"
      );
    }
    bytes memory data = abi.encodeWithSelector(
      AGGREGATE_SELECTOR,
      _targets,
      _calls
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    vm.expectRevert();
    // MismatchedArrayLength error cannot be reached because we get a "FailedActionExecution" error first.
    mpCore.executeAction(actionInfo);
  }
}

contract InitRoleAndHoldersAndPermissions is LlamaGovernanceScriptTest {
  function test_RevertIf_RoleQuantityIsZero() public {
    LlamaGovernanceScript.NewRoleHolderData[]
      memory roleHolders = new LlamaGovernanceScript.NewRoleHolderData[](1);
    roleHolders[0] = LlamaGovernanceScript.NewRoleHolderData(
      address(this),
      uint96(0),
      DEFAULT_ROLE_EXPIRATION
    );
    PermissionData[] memory newRolePermissionData = new PermissionData[](0);
    RoleDescription description = RoleDescription.wrap(bytes32(bytes("Test")));

    bytes memory data = abi.encodeWithSelector(
      INIT_ROLE_AND_HOLDERS_AND_PERMISSIONS_SELECTOR,
      description,
      roleHolders,
      newRolePermissionData
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    bytes memory expectedErr = abi.encodeWithSelector(
      LlamaCore.FailedActionExecution.selector,
      abi.encodeWithSelector(
        LlamaGovernanceScript.RoleQuantityMustBeGreaterThanZero.selector
      )
    );
    vm.expectRevert(expectedErr);
    mpCore.executeAction(actionInfo);
  }

  function test_initRolesSetRoleHolders() public {
    RoleDescription description = RoleDescription.wrap(bytes32(bytes("Test")));
    RoleDescription[] memory descriptions = new RoleDescription[](1);
    descriptions[0] = description;
    PermissionData[] memory newRolePermissionData = new PermissionData[](0);

    uint8 newRole = mpPolicy.numRoles() + 1;
    LlamaGovernanceScript.NewRoleHolderData[]
      memory newRoleHolders = new LlamaGovernanceScript.NewRoleHolderData[](3);
    newRoleHolders[0] = LlamaGovernanceScript.NewRoleHolderData(
      address(this),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    newRoleHolders[1] = LlamaGovernanceScript.NewRoleHolderData(
      address(0x1337),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    newRoleHolders[2] = LlamaGovernanceScript.NewRoleHolderData(
      address(0x1338),
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    RoleHolderData[] memory roleHolders = new RoleHolderData[](3);
    for (
      uint256 i = 0;
      i < newRoleHolders.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      roleHolders[i] = RoleHolderData(
        newRole,
        newRoleHolders[i].policyholder,
        newRoleHolders[i].quantity,
        newRoleHolders[i].expiration
      );
    }

    bytes memory data = abi.encodeWithSelector(
      INIT_ROLE_AND_HOLDERS_AND_PERMISSIONS_SELECTOR,
      description,
      newRoleHolders,
      newRolePermissionData
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);
    _expectInitializeRolesEvents(descriptions);
    _expectRoleHolderEvents(roleHolders);
    mpCore.executeAction(actionInfo);
  }

  function test_initRolesAndSetPermissions() public {
    RoleDescription description = RoleDescription.wrap(bytes32(bytes("Test")));
    RoleDescription[] memory descriptions = new RoleDescription[](1);
    descriptions[0] = description;
    LlamaGovernanceScript.NewRoleHolderData[]
      memory newRoleHolders = new LlamaGovernanceScript.NewRoleHolderData[](0);

    uint8 newRole = mpPolicy.numRoles() + 1;
    PermissionData[] memory permissionData = new PermissionData[](3);
    permissionData[0] = PermissionData(
      address(this),
      LlamaCore.executeAction.selector,
      mpStrategy2
    );
    permissionData[1] = PermissionData(
      address(0x1337),
      LlamaCore.executeAction.selector,
      mpStrategy2
    );
    permissionData[2] = PermissionData(
      address(0x1338),
      LlamaCore.executeAction.selector,
      mpStrategy2
    );

    RolePermissionData[] memory permissions = new RolePermissionData[](3);
    for (
      uint256 i = 0;
      i < permissions.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      permissions[i] = RolePermissionData(
        newRole,
        PermissionData(
          permissionData[i].target,
          permissionData[i].selector,
          permissionData[i].strategy
        ),
        true
      );
    }

    bytes memory data = abi.encodeWithSelector(
      INIT_ROLE_AND_HOLDERS_AND_PERMISSIONS_SELECTOR,
      description,
      newRoleHolders,
      permissionData
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);
    _expectInitializeRolesEvents(descriptions);
    _expectRolePermissionEvents(permissions);
    mpCore.executeAction(actionInfo);
  }

  function testFuzz_initRolesSetRoleHoldersAndSetPermissions(
    RoleDescription description,
    LlamaGovernanceScript.NewRoleHolderData memory newRoleHolder,
    PermissionData memory permission,
    LlamaGovernanceScript.NewRoleHolderData memory newRoleHolder2,
    PermissionData memory permission2
  ) public {
    vm.assume(newRoleHolder.expiration > block.timestamp + 1 days);
    vm.assume(newRoleHolder.policyholder != address(0));
    newRoleHolder.quantity = uint96(bound(newRoleHolder.quantity, 1, 100));
    vm.assume(address(permission.target) != address(0));
    vm.assume(address(permission.strategy) != address(0));
    vm.assume(newRoleHolder2.expiration > block.timestamp + 1 days);
    vm.assume(newRoleHolder2.policyholder != address(0));
    newRoleHolder2.quantity = uint96(bound(newRoleHolder2.quantity, 1, 100));
    vm.assume(address(permission2.target) != address(0));
    vm.assume(address(permission2.strategy) != address(0));

    RoleDescription[] memory descriptions = new RoleDescription[](1);
    LlamaGovernanceScript.NewRoleHolderData[]
      memory newRoleHolders = new LlamaGovernanceScript.NewRoleHolderData[](2);
    PermissionData[] memory permissionData = new PermissionData[](2);
    descriptions[0] = description;
    newRoleHolders[0] = newRoleHolder;
    permissionData[0] = permission;
    newRoleHolders[1] = newRoleHolder2;
    permissionData[1] = permission2;
    uint8 newRole = mpPolicy.numRoles() + 1;

    RoleHolderData[] memory roleHolders = new RoleHolderData[](
      newRoleHolders.length
    );
    for (
      uint256 i = 0;
      i < newRoleHolders.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      roleHolders[i] = RoleHolderData(
        newRole,
        newRoleHolders[i].policyholder,
        newRoleHolders[i].quantity,
        newRoleHolders[i].expiration
      );
    }

    RolePermissionData[] memory permissions = new RolePermissionData[](
      permissionData.length
    );
    for (
      uint256 i = 0;
      i < permissionData.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      permissions[i] = RolePermissionData(
        newRole,
        PermissionData(
          permissionData[i].target,
          permissionData[i].selector,
          permissionData[i].strategy
        ),
        true
      );
    }

    bytes memory data = abi.encodeWithSelector(
      INIT_ROLE_AND_HOLDERS_AND_PERMISSIONS_SELECTOR,
      description,
      newRoleHolders,
      permissionData
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);
    _expectInitializeRolesEvents(descriptions);
    _expectRoleHolderEvents(roleHolders);
    _expectRolePermissionEvents(permissions);
    mpCore.executeAction(actionInfo);
  }
}

contract CreateStrategyAndSetRolePermissions is LlamaGovernanceScriptTest {
  function testFuzz_CreateStrategyAndSetRolePermissions(
    LlamaGovernanceScript.NewStrategyRolesAndPermissionsData[]
      memory newStrategyRolesAndPermissionsData,
    uint256 salt,
    bool isFixedLengthApprovalPeriod
  ) public {
    _boundRolePermissions(newStrategyRolesAndPermissionsData);

    (
      LlamaRelativeStrategyBase.Config memory newStrategy,
      LlamaGovernanceScript.CreateStrategy memory strategy
    ) = _createStrategy(salt, isFixedLengthApprovalPeriod);

    bytes memory data = abi.encodeWithSelector(
      CREATE_STRATEGY_AND_SET_ROLE_PERMISSIONS_SELECTOR,
      strategy,
      newStrategyRolesAndPermissionsData
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    address strategyAddress = Clones.predictDeterministicAddress(
      address(strategy.llamaStrategyLogic),
      keccak256(strategy.config),
      address(core)
    );

    RolePermissionData[] memory rolePermissions = new RolePermissionData[](
      newStrategyRolesAndPermissionsData.length
    );
    for (
      uint256 i = 0;
      i < newStrategyRolesAndPermissionsData.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      rolePermissions[i] = RolePermissionData(
        newStrategyRolesAndPermissionsData[i].role,
        PermissionData(
          newStrategyRolesAndPermissionsData[i].permissionData.target,
          newStrategyRolesAndPermissionsData[i].permissionData.selector,
          ILlamaStrategy(strategyAddress)
        ),
        true
      );
    }

    _expectCreateStrategyEvents(newStrategy, ILlamaStrategy(strategyAddress));
    _expectRolePermissionEvents(rolePermissions);

    vm.startPrank(address(mpExecutor));
    mpCore.executeAction(actionInfo);
  }
}

contract UpdateRoleDescriptionAndRoleHolders is LlamaGovernanceScriptTest {
  function test_RevertIf_RoleIsNotUpdatedRole() external {
    RoleDescription description = RoleDescription.wrap(bytes32(bytes("Test")));
    LlamaGovernanceScript.UpdateRoleDescription
      memory roleDescription = LlamaGovernanceScript.UpdateRoleDescription(
        uint8(1),
        description
      );
    RoleHolderData[] memory roleHolders = new RoleHolderData[](3);

    for (
      uint256 i = 0;
      i < roleHolders.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      roleHolders[i] = RoleHolderData(
        uint8(i),
        address(this),
        DEFAULT_ROLE_QTY,
        DEFAULT_ROLE_EXPIRATION
      );
    }

    bytes memory data = abi.encodeWithSelector(
      UPDATE_ROLE_DESCRIPTION_AND_ROLE_HOLDERS_SELECTOR,
      roleDescription,
      roleHolders
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    bytes memory expectedErr = abi.encodeWithSelector(
      LlamaCore.FailedActionExecution.selector,
      abi.encodeWithSelector(
        LlamaGovernanceScript.RoleIsNotUpdatedRole.selector,
        (0)
      )
    );
    vm.expectRevert(expectedErr);
    mpCore.executeAction(actionInfo);
  }

  function test_UpdateDescriptionAndRoleHolders() external {
    RoleDescription description = RoleDescription.wrap(bytes32(bytes("Test")));
    LlamaGovernanceScript.UpdateRoleDescription
      memory roleDescription = LlamaGovernanceScript.UpdateRoleDescription(
        uint8(1),
        description
      );
    RoleHolderData[] memory roleHolders = new RoleHolderData[](3);

    for (
      uint256 i = 0;
      i < roleHolders.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      roleHolders[i] = RoleHolderData(
        uint8(1),
        address(this),
        DEFAULT_ROLE_QTY,
        DEFAULT_ROLE_EXPIRATION
      );
    }

    bytes memory data = abi.encodeWithSelector(
      UPDATE_ROLE_DESCRIPTION_AND_ROLE_HOLDERS_SELECTOR,
      roleDescription,
      roleHolders
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    vm.expectEmit();
    emit RoleInitialized(uint8(1), description);
    _expectRoleHolderEvents(roleHolders);
    mpCore.executeAction(actionInfo);
  }
}

contract CreateAccountAndSetRolePermissions is LlamaGovernanceScriptTest {
  function test_CreateAccountAndSetRolePermissions() public {
    bytes memory config = abi.encode(
      LlamaAccount.Config({name: "mockAccountERC20"})
    );
    LlamaGovernanceScript.CreateAccount memory account = LlamaGovernanceScript
      .CreateAccount(accountLogic, config);

    ILlamaAccount accountAddress = lens.computeLlamaAccountAddress(
      address(accountLogic),
      config,
      address(mpCore)
    );

    PermissionData memory permissionData1 = PermissionData(
      address(accountAddress),
      LlamaAccount.batchTransferNativeToken.selector,
      mpStrategy2
    );
    PermissionData memory permissionData2 = PermissionData(
      address(accountAddress),
      LlamaAccount.batchTransferERC20.selector,
      mpStrategy2
    );
    PermissionData memory permissionData3 = PermissionData(
      address(accountAddress),
      LlamaAccount.batchApproveERC20.selector,
      mpStrategy2
    );
    PermissionData memory permissionData4 = PermissionData(
      address(accountAddress),
      LlamaAccount.batchTransferERC721.selector,
      mpStrategy2
    );
    PermissionData memory permissionData5 = PermissionData(
      address(accountAddress),
      LlamaAccount.batchApproveERC721.selector,
      mpStrategy2
    );
    PermissionData memory permissionData6 = PermissionData(
      address(accountAddress),
      LlamaAccount.batchApproveOperatorERC721.selector,
      mpStrategy2
    );

    RolePermissionData[] memory _permissions = new RolePermissionData[](6);
    _permissions[0] = RolePermissionData(
      uint8(Roles.ActionCreator),
      permissionData1,
      true
    );
    _permissions[1] = RolePermissionData(
      uint8(Roles.ActionCreator),
      permissionData2,
      true
    );
    _permissions[2] = RolePermissionData(
      uint8(Roles.ActionCreator),
      permissionData3,
      true
    );
    _permissions[3] = RolePermissionData(
      uint8(Roles.ActionCreator),
      permissionData4,
      true
    );
    _permissions[4] = RolePermissionData(
      uint8(Roles.ActionCreator),
      permissionData5,
      true
    );
    _permissions[5] = RolePermissionData(
      uint8(Roles.ActionCreator),
      permissionData6,
      true
    );

    LlamaGovernanceScript.NewRolePermissionsData[]
      memory newRolePermissionsData = new LlamaGovernanceScript.NewRolePermissionsData[](
        6
      );

    for (
      uint256 i = 0;
      i < newRolePermissionsData.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      newRolePermissionsData[i] = LlamaGovernanceScript.NewRolePermissionsData(
        _permissions[i].role,
        LlamaGovernanceScript.SelectorStrategy(
          _permissions[i].permissionData.selector,
          _permissions[i].permissionData.strategy
        )
      );
    }

    bytes memory data = abi.encodeWithSelector(
      LlamaGovernanceScript.createAccountAndSetRolePermissions.selector,
      account,
      newRolePermissionsData
    );

    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    vm.expectEmit();
    emit AccountCreated(accountAddress, accountLogic, config);

    vm.expectEmit();
    emit RolePermissionAssigned(
      uint8(Roles.ActionCreator),
      LlamaUtils.computePermissionId(permissionData1),
      permissionData1,
      true
    );

    vm.expectEmit();
    emit RolePermissionAssigned(
      uint8(Roles.ActionCreator),
      LlamaUtils.computePermissionId(permissionData2),
      permissionData2,
      true
    );

    vm.expectEmit();
    emit RolePermissionAssigned(
      uint8(Roles.ActionCreator),
      LlamaUtils.computePermissionId(permissionData3),
      permissionData3,
      true
    );

    vm.expectEmit();
    emit RolePermissionAssigned(
      uint8(Roles.ActionCreator),
      LlamaUtils.computePermissionId(permissionData4),
      permissionData4,
      true
    );

    vm.expectEmit();
    emit RolePermissionAssigned(
      uint8(Roles.ActionCreator),
      LlamaUtils.computePermissionId(permissionData5),
      permissionData5,
      true
    );

    vm.expectEmit();
    emit RolePermissionAssigned(
      uint8(Roles.ActionCreator),
      LlamaUtils.computePermissionId(permissionData6),
      permissionData6,
      true
    );

    mpCore.executeAction(actionInfo);
  }
}

contract SetScriptAuthAndSetPermissions is LlamaGovernanceScriptTest {
  function test_SetScriptAuthAndSetPermissions(
    address script,
    bool authorized
  ) public {
    vm.assume(script != address(mpCore));
    vm.assume(script != address(mpPolicy));
    LlamaGovernanceScript.NewRolePermissionsData[]
      memory newRolePermissionsData = new LlamaGovernanceScript.NewRolePermissionsData[](
        2
      );

    newRolePermissionsData[0] = LlamaGovernanceScript.NewRolePermissionsData(
      uint8(Roles.ActionCreator),
      LlamaGovernanceScript.SelectorStrategy(
        LlamaGovernanceScript.setStrategyLogicAuthAndNewStrategies.selector,
        mpStrategy1
      )
    );

    newRolePermissionsData[1] = LlamaGovernanceScript.NewRolePermissionsData(
      uint8(Roles.ActionCreator),
      LlamaGovernanceScript.SelectorStrategy(
        LlamaGovernanceScript.initRoles.selector,
        mpStrategy2
      )
    );

    bytes memory data = abi.encodeWithSelector(
      LlamaGovernanceScript.setScriptAuthAndSetPermissions.selector,
      script,
      authorized,
      newRolePermissionsData
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    vm.expectEmit();
    emit ScriptAuthorizationSet(script, authorized);
    for (uint256 i = 0; i < newRolePermissionsData.length; i++) {
      PermissionData memory permissionData = PermissionData(
        script,
        newRolePermissionsData[i].permissionData.selector,
        newRolePermissionsData[i].permissionData.strategy
      );
      bytes32 permissionId = lens.computePermissionId(permissionData);
      vm.expectEmit();
      emit RolePermissionAssigned(
        uint8(Roles.ActionCreator),
        permissionId,
        permissionData,
        authorized
      );
    }
    mpCore.executeAction(actionInfo);
  }
}

contract SetStrategyLogicAuthorizations is LlamaGovernanceScriptTest {
  function test_setStrategyLogicAuthorizations(bool authorized) public {
    ILlamaStrategy[] memory strategies = new ILlamaStrategy[](3);
    strategies[0] = relativeHolderQuorumLogic;
    strategies[1] = absolutePeerReviewLogic;
    strategies[2] = absoluteQuorumLogic;

    bytes memory data = abi.encodeWithSelector(
      LlamaGovernanceScript.setStrategyLogicAuthorizations.selector,
      strategies,
      authorized
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    vm.expectEmit();
    emit StrategyLogicAuthorizationSet(relativeHolderQuorumLogic, authorized);
    vm.expectEmit();
    emit StrategyLogicAuthorizationSet(absolutePeerReviewLogic, authorized);
    vm.expectEmit();
    emit StrategyLogicAuthorizationSet(absoluteQuorumLogic, authorized);

    mpCore.executeAction(actionInfo);
  }
}

contract SetAccountLogicAuthorizations is LlamaGovernanceScriptTest {
  function test_SetAccountLogicAuthorizations(
    ILlamaAccount[] calldata accountLogics,
    bool authorized
  ) public {
    vm.assume(accountLogics.length < 5);

    bytes memory data = abi.encodeWithSelector(
      LlamaGovernanceScript.setAccountLogicAuthorizations.selector,
      accountLogics,
      authorized
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    for (uint256 i = 0; i < accountLogics.length; i++) {
      vm.expectEmit();
      emit AccountLogicAuthorizationSet(accountLogics[i], authorized);
    }

    mpCore.executeAction(actionInfo);
  }
}

contract SetStrategyAuthorizations is LlamaGovernanceScriptTest {
  function test_setStrategyAuthorizations(bool authorized) public {
    ILlamaStrategy[] memory strategies = new ILlamaStrategy[](1);
    strategies[0] = mpStrategy1;

    bytes memory data = abi.encodeWithSelector(
      LlamaGovernanceScript.setStrategyAuthorizations.selector,
      strategies,
      authorized
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    vm.expectEmit();
    emit StrategyAuthorizationSet(mpStrategy1, authorized);

    mpCore.executeAction(actionInfo);
  }
}

contract SetStrategyLogicAuthAndNewStrategies is LlamaGovernanceScriptTest {
  function test_SetStrategyLogicAuthorizationAndCreateStrategies() public {
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](1);
    newStrategies[0] = LlamaRelativeStrategyBase.Config({
      approvalPeriod: 0,
      queuingPeriod: 0,
      expirationPeriod: 2 days,
      isFixedLengthApprovalPeriod: false,
      minApprovalPct: 0,
      minDisapprovalPct: 10_001,
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });
    ILlamaStrategy instantExecutionStrategy = lens.computeLlamaStrategyAddress(
      address(relativeQuantityQuorumLogic),
      DeployUtils.encodeStrategy(newStrategies[0]),
      address(mpCore)
    );
    bytes memory data = abi.encodeWithSelector(
      LlamaGovernanceScript.setStrategyLogicAuthAndNewStrategies.selector,
      relativeQuantityQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    vm.expectEmit();
    emit StrategyLogicAuthorizationSet(relativeQuantityQuorumLogic, true);
    vm.expectEmit();
    emit StrategyCreated(
      instantExecutionStrategy,
      relativeQuantityQuorumLogic,
      DeployUtils.encodeStrategy(newStrategies[0])
    );
    mpCore.executeAction(actionInfo);
  }
}

contract InitRoles is LlamaGovernanceScriptTest {
  function testFuzz_initializeRoles(
    RoleDescription[] memory descriptions
  ) public {
    _assumeInitializeRoles(descriptions);
    bytes memory data = abi.encodeWithSelector(
      INIT_ROLES_SELECTOR,
      descriptions
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);
    _expectInitializeRolesEvents(descriptions);
    mpCore.executeAction(actionInfo);
  }
}

contract SetRoleHolders is LlamaGovernanceScriptTest {
  function testFuzz_setRoleHolders(uint256 salt) public {
    RoleHolderData[] memory roleHolders = new RoleHolderData[](
      salt == 0 ? 0 : 9 % salt
    );
    for (uint256 i = 0; i < roleHolders.length; i++) {
      roleHolders[i].role = uint8(i == 0 ? 1 : i);
      roleHolders[i].expiration = uint64(block.timestamp + 1 days);
      roleHolders[i].policyholder = address(this);
      roleHolders[i].quantity = DEFAULT_ROLE_QTY;
    }
    bytes memory data = abi.encodeWithSelector(
      SET_ROLE_HOLDERS_SELECTOR,
      roleHolders
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);
    _expectRoleHolderEvents(roleHolders);
    mpCore.executeAction(actionInfo);
  }
}

contract SetRolePermissions is LlamaGovernanceScriptTest {
  function testFuzz_setRolePermissions(
    RolePermissionData[] memory rolePermissions
  ) public {
    _boundRolePermissions(rolePermissions);
    bytes memory data = abi.encodeWithSelector(
      SET_ROLE_PERMISSIONS_SELECTOR,
      rolePermissions
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);
    _expectRolePermissionEvents(rolePermissions);
    mpCore.executeAction(actionInfo);
  }
}

contract RevokePolicies is LlamaGovernanceScriptTest {
  function test_revokePolicies() public {
    revokePolicies.push(disapproverDave);
    bytes memory data = abi.encodeWithSelector(
      REVOKE_POLICIES_SELECTOR,
      revokePolicies
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);
    vm.expectEmit();
    emit RoleAssigned(address(disapproverDave), uint8(Roles.Disapprover), 0, 0);
    mpCore.executeAction(actionInfo);
  }
}

contract UpdateRoleDescriptions is LlamaGovernanceScriptTest {
  function testFuzz_updateRoleDescriptions(
    LlamaGovernanceScript.UpdateRoleDescription[] memory roleDescriptions
  ) public {
    _assumeUpdateRoleDescriptions(roleDescriptions);
    bytes memory data = abi.encodeWithSelector(
      UPDATE_ROLE_DESCRIPTIONS_SELECTOR,
      roleDescriptions
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    _expectUpdateRoleDescriptionsEvents(roleDescriptions);
    mpCore.executeAction(actionInfo);
  }
}

contract SetGuards is LlamaGovernanceScriptTest {
  function testFuzz_setGuards(
    address target,
    bytes4[] memory selectors
  ) public {
    vm.assume(target != address(mpCore));
    vm.assume(target != address(mpPolicy));
    ILlamaActionGuard guard = ILlamaActionGuard(
      new MockActionGuard(false, true, true, "no action creation")
    );

    bytes memory data = abi.encodeWithSelector(
      SET_GUARDS_SELECTOR,
      target,
      selectors,
      guard
    );
    ActionInfo memory actionInfo = _createAndApproveAndQueueAction(data);

    _expectSetGuardsEvents(target, selectors, guard);
    mpCore.executeAction(actionInfo);
  }
}
