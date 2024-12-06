// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LlamaTestSetup, Roles} from "@llama/test/utils/LlamaTestSetup.sol";
import {MockBaseScript} from "@llama/test/mock/MockBaseScript.sol";
import {Test, console2} from "forge-std/Test.sol";

import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";
import {LlamaBaseScript} from "@llama/src/llama-scripts/LlamaBaseScript.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";

contract LlamaBaseScriptTest is LlamaTestSetup {
  event SuccessfulCall();

  MockBaseScript baseScript;

  function setUp() public virtual override {
    LlamaTestSetup.setUp();
    baseScript = new MockBaseScript();
  }

  function createPermissionAndActionAndApproveAndQueue()
    internal
    returns (ActionInfo memory actionInfo)
  {
    PermissionData memory permissionData = PermissionData(
      address(baseScript),
      MockBaseScript.run.selector,
      mpStrategy1
    );
    bytes memory data = abi.encodeCall(MockBaseScript.run, ());

    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      permissionData,
      true
    );
    vm.warp(block.timestamp + 1);

    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(baseScript),
      0,
      data,
      ""
    );
    actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(baseScript),
      0,
      data
    );
    vm.warp(block.timestamp + 1);

    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    vm.warp(block.timestamp + 1);
    vm.prank(approverAlicia);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    vm.warp(block.timestamp + 1);
    vm.prank(approverAndy);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    vm.warp(block.timestamp + 2 days);
    mpCore.queueAction(actionInfo);
    vm.warp(block.timestamp + 1 weeks);
  }
}

contract OnlyDelegateCall is LlamaBaseScriptTest {
  function test_CanDelegateCallBaseScript() public {
    vm.prank(address(mpExecutor));
    mpCore.setScriptAuthorization(address(baseScript), true);
    ActionInfo
      memory actionInfo = createPermissionAndActionAndApproveAndQueue();
    vm.expectEmit();
    emit SuccessfulCall();
    mpCore.executeAction(actionInfo);
  }

  function test_RevertIf_NotDelegateCalled() public {
    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaBaseScript.OnlyDelegateCall.selector);
    baseScript.run();

    ActionInfo
      memory actionInfo = createPermissionAndActionAndApproveAndQueue();
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaCore.FailedActionExecution.selector,
        abi.encodeWithSelector(LlamaBaseScript.OnlyDelegateCall.selector)
      )
    );
    mpCore.executeAction(actionInfo);
  }
}
