// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {LlamaTestSetup, Roles} from "@llama/test/utils/LlamaTestSetup.sol";
import {MockSingleUseScript} from "@llama/test/mock/MockSingleUseScript.sol";

import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";
import {LlamaBaseScript} from "@llama/src/llama-scripts/LlamaBaseScript.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaSingleUseScript} from "@llama/src/llama-scripts/LlamaSingleUseScript.sol";

contract LlamaSingleUseScriptTest is LlamaTestSetup {
  event SuccessfulCall();

  LlamaSingleUseScript singleUseScript;

  function setUp() public virtual override {
    LlamaTestSetup.setUp();
    singleUseScript = new MockSingleUseScript(mpExecutor);
  }

  function createPermissionAndActionAndApproveAndQueue()
    internal
    returns (ActionInfo memory actionInfo)
  {
    PermissionData memory permissionData = PermissionData(
      address(singleUseScript),
      MockSingleUseScript.run.selector,
      mpStrategy1
    );
    bytes memory data = abi.encodeCall(MockSingleUseScript.run, ());

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
      address(singleUseScript),
      0,
      data,
      ""
    );
    actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(singleUseScript),
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

contract UnauthorizeAfterRun is LlamaSingleUseScriptTest {
  function test_CanOnlyBeCalledOnce() public {
    // First call should succeed, and any subsequent calls should fail (unless the script is reauthorized)
    vm.prank(address(mpExecutor));
    mpCore.setScriptAuthorization(address(singleUseScript), true);
    ActionInfo
      memory actionInfo = createPermissionAndActionAndApproveAndQueue();
    vm.expectEmit();
    emit SuccessfulCall();
    mpCore.executeAction(actionInfo);

    ActionInfo
      memory newActionInfo = createPermissionAndActionAndApproveAndQueue();
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaCore.FailedActionExecution.selector,
        abi.encodeWithSelector(LlamaBaseScript.OnlyDelegateCall.selector)
      )
    );
    mpCore.executeAction(newActionInfo);
  }
}
