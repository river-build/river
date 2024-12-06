// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {Vm} from "forge-std/Vm.sol";

import {MockInstanceUpdateScript} from "@llama/test/mock/MockInstanceUpdateScript.sol";
import {MockInstanceUpdateVersion1} from "@llama/test/mock/MockInstanceUpdateVersion1.sol";

import {DeployLlamaFactory} from "@llama/script/DeployLlamaFactory.s.sol";
import {DeployLlamaInstance} from "@llama/script/DeployLlamaInstance.s.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";

contract MultipleInstanceTestSetup is
  DeployLlamaFactory,
  DeployLlamaInstance,
  Test
{
  event ApprovalCast(
    uint256 id,
    address indexed policyholder,
    uint8 indexed role,
    uint256 quantity,
    string reason
  );
  event ActionCreated(
    uint256 id,
    address indexed creator,
    uint8 role,
    ILlamaStrategy indexed strategy,
    address indexed target,
    uint256 value,
    bytes data,
    string description
  );

  address LLAMA_INSTANCE_DEPLOYER = 0x3d9fEa8AeD0249990133132Bb4BC8d07C6a8259a;

  uint8 CORE_TEAM_ROLE = uint8(1);
  uint8 GOVERNANCE_MAINTAINER_ROLE = uint8(2);

  address llamaAlice;
  uint256 llamaAlicePrivateKey;
  address llamaBob;
  uint256 llamaBobPrivateKey;
  address llamaCharlie;
  uint256 llamaCharliePrivateKey;
  address llamaDale;
  uint256 llamaDalePrivateKey;
  address llamaErica;
  uint256 llamaEricaPrivateKey;

  address mockAlice;
  uint256 mockAlicePrivateKey;
  address mockBob;
  uint256 mockBobPrivateKey;
  address mockCharlie;
  uint256 mockCharliePrivateKey;
  address mockDale;
  uint256 mockDalePrivateKey;
  address mockErica;
  uint256 mockEricaPrivateKey;

  LlamaCore llamaInstanceCore;
  LlamaPolicy llamaInstancePolicy;
  LlamaExecutor llamaInstanceExecutor;

  LlamaCore mockCore;
  LlamaPolicy mockPolicy;
  LlamaExecutor mockExecutor;

  ILlamaStrategy MOCK_VOTING_STRATEGY =
    ILlamaStrategy(0x225D6692B4DD673C6ad57B4800846341d027BC66);
  ILlamaStrategy MOCK_OPTIMISTIC_STRATEGY =
    ILlamaStrategy(0xF7E4BB5159c3fdc50e1Ef6b80BD69988DD6f438d);
  ILlamaStrategy LLAMA_VOTING_STRATEGY =
    ILlamaStrategy(0x881E25C4470136B1B2D64a4942b5346e41477fB6);

  MockInstanceUpdateScript mockInstanceUpdateScript;
  MockInstanceUpdateVersion1 mockInstanceUpdateVersion1;

  function mineBlock() internal {
    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 1);
  }

  function setUp() public virtual {
    // Setting up user addresses and private keys for Llama.
    (llamaAlice, llamaAlicePrivateKey) = makeAddrAndKey("llamaAlice");
    (llamaBob, llamaBobPrivateKey) = makeAddrAndKey("llamaBob");
    (llamaCharlie, llamaCharliePrivateKey) = makeAddrAndKey("llamaCharlie");
    (llamaDale, llamaDalePrivateKey) = makeAddrAndKey("llamaDale");
    (llamaErica, llamaEricaPrivateKey) = makeAddrAndKey("llamaErica");

    // Setting up user addresses and private keys for Mock.
    (mockAlice, mockAlicePrivateKey) = makeAddrAndKey("mockAlice");
    (mockBob, mockBobPrivateKey) = makeAddrAndKey("mockBob");
    (mockCharlie, mockCharliePrivateKey) = makeAddrAndKey("mockCharlie");
    (mockDale, mockDalePrivateKey) = makeAddrAndKey("mockDale");
    (mockErica, mockEricaPrivateKey) = makeAddrAndKey("mockErica");

    // Deploy the factory
    DeployLlamaFactory.run();

    // Deploy llama's Llama instance
    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "llamaInstanceConfig.json"
    );
    llamaInstanceCore = core;
    llamaInstancePolicy = llamaInstanceCore.policy();
    llamaInstanceExecutor = llamaInstanceCore.executor();

    // Deploy mock protocol's Llama instance
    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "mockProtocolInstanceConfig.json"
    );
    mockCore = core;
    mockPolicy = mockCore.policy();
    mockExecutor = mockCore.executor();

    mineBlock();

    mockInstanceUpdateScript = new MockInstanceUpdateScript();

    // In practice this can either happen as an initial action post deployment or we can normalize a post deployment
    // configuration flow.
    // This would work by deploying with an instant execution strategy and role holder which is an address under our
    // control. This address would use its root authority to setup the instance and then remove itself from the system.
    // The user could confirm that none of these root permissions are still active before transferring ownership.
    vm.startPrank(address(mockExecutor));
    mockCore.setScriptAuthorization(address(mockInstanceUpdateScript), true);
    mockPolicy.setRolePermission(
      GOVERNANCE_MAINTAINER_ROLE,
      PermissionData(
        address(mockInstanceUpdateScript),
        MockInstanceUpdateScript.authorizeScriptAndSetPermission.selector,
        MOCK_VOTING_STRATEGY
      ),
      true
    );
    mockPolicy.setRolePermission(
      GOVERNANCE_MAINTAINER_ROLE,
      PermissionData(
        address(mockInstanceUpdateScript),
        MockInstanceUpdateScript.authorizeScriptAndSetPermission.selector,
        MOCK_OPTIMISTIC_STRATEGY
      ),
      true
    );
    vm.stopPrank();

    // Deploy the version 1 update script
    mockInstanceUpdateVersion1 = new MockInstanceUpdateVersion1();

    // Now that llama has permission to create actions for `mockInstanceUpdateScript`, it needs a permission in its own
    // instance for calling createAction.
    vm.prank(address(llamaInstanceExecutor));
    llamaInstancePolicy.setRolePermission(
      uint8(1),
      PermissionData(
        address(mockCore),
        LlamaCore.createAction.selector,
        LLAMA_VOTING_STRATEGY
      ),
      true
    );
  }

  function _approveAction(
    LlamaCore _core,
    address _policyholder,
    ActionInfo memory actionInfo
  ) public {
    vm.expectEmit();
    emit ApprovalCast(actionInfo.id, _policyholder, uint8(1), 1, "");
    vm.prank(_policyholder);
    _core.castApproval(uint8(1), actionInfo, "");
  }

  function createActionToAuthorizeScriptAndSetPermission(
    ILlamaStrategy strategyForMockInstance
  ) public returns (ActionInfo memory) {
    PermissionData memory permissionData = PermissionData(
      address(mockInstanceUpdateVersion1),
      MockInstanceUpdateVersion1.updateInstance.selector,
      strategyForMockInstance
    );
    bytes memory actionData = abi.encodeCall(
      MockInstanceUpdateScript.authorizeScriptAndSetPermission,
      (permissionData)
    );
    bytes memory data = abi.encodeCall(
      LlamaCore.createAction,
      (
        GOVERNANCE_MAINTAINER_ROLE,
        strategyForMockInstance,
        address(mockInstanceUpdateScript),
        0,
        actionData,
        ""
      )
    );
    vm.prank(llamaAlice);
    uint256 actionId = llamaInstanceCore.createAction(
      uint8(1),
      LLAMA_VOTING_STRATEGY,
      address(mockCore),
      0,
      data,
      ""
    );
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      llamaAlice,
      uint8(1),
      LLAMA_VOTING_STRATEGY,
      address(mockCore),
      0,
      data
    );

    mineBlock();

    _approveAction(llamaInstanceCore, llamaBob, actionInfo);
    _approveAction(llamaInstanceCore, llamaCharlie, actionInfo);
    _approveAction(llamaInstanceCore, llamaDale, actionInfo);

    // Executing llama's action creates an action for the mock instance
    vm.expectEmit();
    emit ActionCreated(
      0,
      address(llamaInstanceExecutor),
      GOVERNANCE_MAINTAINER_ROLE,
      strategyForMockInstance,
      address(mockInstanceUpdateScript),
      0,
      actionData,
      ""
    );
    llamaInstanceCore.executeAction(actionInfo);

    return
      ActionInfo(
        0,
        address(llamaInstanceExecutor),
        GOVERNANCE_MAINTAINER_ROLE,
        strategyForMockInstance,
        address(mockInstanceUpdateScript),
        0,
        actionData
      );
  }
}

contract MultipleInstanceTest is MultipleInstanceTestSetup {
  function test_instanceCanDelegateUpdateRoleToOtherInstance() external {
    // Action is created for mock instance to call `MockInstanceUpdateScript`
    ActionInfo
      memory actionInfo = createActionToAuthorizeScriptAndSetPermission(
        MOCK_VOTING_STRATEGY
      );

    mineBlock();

    _approveAction(mockCore, mockBob, actionInfo);
    _approveAction(mockCore, mockCharlie, actionInfo);
    _approveAction(mockCore, mockDale, actionInfo);
    _approveAction(mockCore, mockErica, actionInfo);

    // Script is authorized and llama has permission to create an action for it.
    mockCore.executeAction(actionInfo);

    PermissionData memory permissionData = PermissionData(
      address(mockInstanceUpdateVersion1),
      MockInstanceUpdateVersion1.updateInstance.selector,
      MOCK_VOTING_STRATEGY
    );
    bytes memory actionData = abi.encodeCall(
      MockInstanceUpdateVersion1.updateInstance,
      (permissionData)
    );
    bytes memory data = abi.encodeCall(
      LlamaCore.createAction,
      (
        GOVERNANCE_MAINTAINER_ROLE,
        MOCK_VOTING_STRATEGY,
        address(mockInstanceUpdateVersion1),
        0,
        actionData,
        ""
      )
    );
    vm.prank(llamaAlice);
    uint256 actionId = llamaInstanceCore.createAction(
      uint8(1),
      LLAMA_VOTING_STRATEGY,
      address(mockCore),
      0,
      data,
      ""
    );
    actionInfo = ActionInfo(
      actionId,
      llamaAlice,
      uint8(1),
      LLAMA_VOTING_STRATEGY,
      address(mockCore),
      0,
      data
    );

    mineBlock();

    _approveAction(llamaInstanceCore, llamaBob, actionInfo);
    _approveAction(llamaInstanceCore, llamaCharlie, actionInfo);
    _approveAction(llamaInstanceCore, llamaDale, actionInfo);

    // Executing llama's action creates an action for the mock instance to call the update script.
    vm.expectEmit();
    emit ActionCreated(
      actionId,
      address(llamaInstanceExecutor),
      GOVERNANCE_MAINTAINER_ROLE,
      MOCK_VOTING_STRATEGY,
      address(mockInstanceUpdateVersion1),
      0,
      actionData,
      ""
    );
    llamaInstanceCore.executeAction(actionInfo);

    actionInfo = ActionInfo(
      actionId,
      address(llamaInstanceExecutor),
      GOVERNANCE_MAINTAINER_ROLE,
      MOCK_VOTING_STRATEGY,
      address(mockInstanceUpdateVersion1),
      0,
      actionData
    );

    mineBlock();

    _approveAction(mockCore, mockBob, actionInfo);
    _approveAction(mockCore, mockCharlie, actionInfo);
    _approveAction(mockCore, mockDale, actionInfo);
    _approveAction(mockCore, mockErica, actionInfo);

    // Script is executed, unauthorized, and the permission is removed.
    mockCore.executeAction(actionInfo);
    bytes32 votingPermission = keccak256(
      abi.encode(
        PermissionData(
          address(mockInstanceUpdateScript),
          MockInstanceUpdateScript.authorizeScriptAndSetPermission.selector,
          MOCK_VOTING_STRATEGY
        )
      )
    );

    bytes32 optimisticPermission = keccak256(
      abi.encode(
        PermissionData(
          address(mockInstanceUpdateScript),
          MockInstanceUpdateScript.authorizeScriptAndSetPermission.selector,
          MOCK_OPTIMISTIC_STRATEGY
        )
      )
    );

    bytes32 upgradeScriptPermission = keccak256(
      abi.encode(
        PermissionData(
          address(mockInstanceUpdateVersion1),
          MockInstanceUpdateVersion1.updateInstance.selector,
          MOCK_VOTING_STRATEGY
        )
      )
    );

    assertTrue(
      mockPolicy.hasPermissionId(
        address(llamaInstanceExecutor),
        GOVERNANCE_MAINTAINER_ROLE,
        votingPermission
      )
    );
    assertTrue(
      mockPolicy.hasPermissionId(
        address(llamaInstanceExecutor),
        GOVERNANCE_MAINTAINER_ROLE,
        optimisticPermission
      )
    );
    assertTrue(mockCore.authorizedScripts(address(mockInstanceUpdateScript)));

    // Assert that upgrade script was executed
    assertTrue(
      mockCore.authorizedStrategyLogics(
        ILlamaStrategy(0xBb2180ebd78ce97360503434eD37fcf4a1Df61c3)
      )
    );
    assertTrue(
      mockCore.authorizedStrategyLogics(
        ILlamaStrategy(0xd21060559c9beb54fC07aFd6151aDf6cFCDDCAeB)
      )
    );

    // Assert that upgrade script unauthorized itself and removed the permission
    assertFalse(
      mockCore.authorizedScripts(address(mockInstanceUpdateVersion1))
    );
    assertFalse(
      mockPolicy.hasPermissionId(
        address(llamaInstanceExecutor),
        GOVERNANCE_MAINTAINER_ROLE,
        upgradeScriptPermission
      )
    );
  }
}
