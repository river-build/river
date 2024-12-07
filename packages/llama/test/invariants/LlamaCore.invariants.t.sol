// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {console2} from "forge-std/Test.sol";
// debugging

import {BaseHandler} from "./BaseHandler.sol";
import {Roles, LlamaTestSetup} from "../utils/LlamaTestSetup.sol";

import {ILlamaStrategy} from "../../src/interfaces/ILlamaStrategy.sol";
import {ActionState} from "../../src/lib/Enums.sol";
import {Action, ActionInfo} from "../../src/lib/Structs.sol";
import {LlamaCore} from "../../src/LlamaCore.sol";
import {LlamaFactory} from "../../src/LlamaFactory.sol";

contract LlamaCoreHandler is BaseHandler {
  // =========================
  // ======== Storage ========
  // =========================

  // Parameters we'll need to create valid actions.
  address mockProtocol;
  ILlamaStrategy[2] strategies;
  bytes32[3] permissionIds;

  // Duplicated parameters from `LlamaTestSetup` that we use here.
  address actionCreatorAaron;
  uint256 actionCreatorAaronPrivateKey;

  // Used to track the last seen `actionsCount` value.
  uint256[] public actionsCounts;

  // Mapping from action ID to the action info struct
  mapping(uint256 actionId => ActionInfo) public actionInfos;

  // =============================
  // ======== Constructor ========
  // =============================

  constructor(
    LlamaFactory _llamaFactory,
    LlamaCore _llamaCore,
    ILlamaStrategy[2] memory _strategies,
    bytes32[3] memory _permissionIds,
    address _mockProtocol
  ) BaseHandler(_llamaFactory, _llamaCore) {
    strategies = _strategies;
    permissionIds = _permissionIds;
    mockProtocol = _mockProtocol;

    // Save off each existing action
    for (uint256 i = 0; i < LLAMA_CORE.actionsCount(); i++) {
      actionsCounts.push(i);
      actionInfos[i] = LlamaFactoryInvariants(msg.sender).getActionInfo(i);
    }

    (actionCreatorAaron, actionCreatorAaronPrivateKey) = makeAddrAndKey(
      "actionCreatorAaron"
    );
  }

  // =========================
  // ======== Helpers ========
  // =========================

  function getAction(uint256 index) internal view returns (uint256) {
    return
      _bound(index, actionsCounts[0], actionsCounts[actionsCounts.length - 1]);
  }

  // Note this function is sensitive to the order of the `permissionIds` array and the configuration
  // in `LlamaTestSetup`. If you change either of those, you'll need to update this function.
  function permissionIdIndexToData(
    uint256 index
  )
    internal
    view
    returns (address target, bytes4 selector, ILlamaStrategy strategy)
  {
    index = _bound(index, 0, permissionIds.length - 1);

    // pausePermissionId
    if (index == 0)
      return (mockProtocol, bytes4(keccak256("pause(bool)")), strategies[0]);
    // failPermissionId
    else if (index == 1)
      return (mockProtocol, bytes4(keccak256("fail()")), strategies[0]);
    // receiveEthPermissionId
    else if (index == 2)
      return (mockProtocol, bytes4(keccak256("receiveEth()")), strategies[0]);

    revert("unhandled index");
  }

  // Given an index and target action state, find the first action in that state. If one does not
  // exist, a value of `type(uint256).max` is returned.
  function findActionByState(
    uint256 index,
    ActionState targetState
  ) internal view returns (uint256) {
    uint256 actionCount = LLAMA_CORE.actionsCount();
    if (actionCount == 0) return type(uint256).max;

    uint256 actionId = _bound(index, 0, actionCount - 1);
    for (uint256 i = 0; i < actionCount; i++) {
      actionId = actionId % actionCount;
      if (LLAMA_CORE.getActionState(actionInfos[actionId]) == targetState)
        return actionId;
      actionId++;
    }
    return type(uint256).max;
  }

  function getActionsCounts() public view returns (uint256[] memory) {
    return actionsCounts;
  }

  function callSummary() public view override {
    BaseHandler.callSummary();
    console2.log(
      "llamaCore_createAction                 ",
      calls["llamaCore_createAction"]
    );
    console2.log(
      "llamaCore_queueAction                  ",
      calls["llamaCore_queueAction"]
    );
    console2.log(
      "llamaCore_executeAction                ",
      calls["llamaCore_executeAction"]
    );
    console2.log(
      "llamaCore_cancelAction                 ",
      calls["llamaCore_cancelAction"]
    );
    console2.log(
      "llamaCore_castApproval                 ",
      calls["llamaCore_castApproval"]
    );
    console2.log(
      "llamaCore_castApprovalWithReason       ",
      calls["llamaCore_castApprovalWithReason"]
    );
    console2.log(
      "llamaCore_castApprovalBySig            ",
      calls["llamaCore_castApprovalBySig"]
    );
    console2.log(
      "llamaCore_castDisapproval              ",
      calls["llamaCore_castDisapproval"]
    );
    console2.log(
      "llamaCore_castDisapprovalWithReason    ",
      calls["llamaCore_castDisapprovalWithReason"]
    );
    console2.log(
      "llamaCore_castDisapprovalBySig         ",
      calls["llamaCore_castDisapprovalBySig"]
    );
    console2.log(
      "llamaCore_createStrategies             ",
      calls["llamaCore_createStrategies"]
    );
    console2.log(
      "llamaCore_createAndAuthorizeAccounts   ",
      calls["llamaCore_createAndAuthorizeAccounts"]
    );
    console2.log("-----------------------------------------------");
    console2.log(
      "llamaCore_queueAction_queued           ",
      calls["llamaCore_queueAction_queued"]
    );
    console2.log(
      "llamaCore_queueAction_noop             ",
      calls["llamaCore_queueAction_noop"]
    );
    console2.log(
      "llamaCore_executeAction_executed       ",
      calls["llamaCore_executeAction_executed"]
    );
    console2.log(
      "llamaCore_executeAction_executionRevert",
      calls["llamaCore_executeAction_executionRevert"]
    );
    console2.log(
      "llamaCore_executeAction_noop           ",
      calls["llamaCore_executeAction_noop"]
    );
    console2.log(
      "llamaCore_cancelAction_canceled        ",
      calls["llamaCore_cancelAction_canceled"]
    );
    console2.log(
      "llamaCore_cancelAction_noop            ",
      calls["llamaCore_cancelAction_noop"]
    );
    console2.log(
      "llamaCore_castApproval_approved        ",
      calls["llamaCore_castApproval_approved"]
    );
    console2.log(
      "llamaCore_castApproval_noop_1          ",
      calls["llamaCore_castApproval_noop_1"]
    );
    console2.log(
      "llamaCore_castApproval_noop_2          ",
      calls["llamaCore_castApproval_noop_2"]
    );
    console2.log(
      "llamaCore_castDisapproval_approved     ",
      calls["llamaCore_castDisapproval_approved"]
    );
    console2.log(
      "llamaCore_castDisapproval_noop_1       ",
      calls["llamaCore_castDisapproval_noop_1"]
    );
    console2.log(
      "llamaCore_castDisapproval_noop_2       ",
      calls["llamaCore_castDisapproval_noop_2"]
    );
  }

  // ====================================
  // ======== Methods for Fuzzer ========
  // ====================================

  function llamaCore_createAction(
    uint256 permissionIdIndex,
    uint256 value,
    uint256 dataSeed
  ) public recordCall("llamaCore_createAction") useCurrentTimestamp {
    // We don't want action creation to revert, so we pull from arrays of known good values instead
    // of lettings the fuzzer have full control over input values.
    (
      address target,
      bytes4 selector,
      ILlamaStrategy strategy
    ) = permissionIdIndexToData(permissionIdIndex);

    // We only have one function that can receive ETH, if we're calling that function, we randomize
    // how much ETH to send, otherwise we send 0.
    value = selector == bytes4(keccak256("receiveEth()"))
      ? _bound(value, 0, 1000 ether)
      : 0;

    // We only have one function that takes calldata, if we're calling that function, we randomize
    // the calldata;
    bytes memory data = selector == bytes4(keccak256("pause(bool)"))
      ? abi.encode(_bound(dataSeed, 0, 1))
      : bytes("");
    data = abi.encodeWithSelector(selector, data);

    // We can now execute the action.
    vm.prank(actionCreatorAaron);
    uint256 actionId = LLAMA_CORE.createAction(
      uint8(Roles.ActionCreator),
      strategy,
      target,
      value,
      data,
      ""
    );
    actionsCounts.push(actionId);
    actionInfos[actionId] = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      strategy,
      target,
      value,
      data
    );
  }

  function llamaCore_queueAction(
    uint256 index
  ) public recordCall("llamaCore_queueAction") useCurrentTimestamp {
    // We only want to queue actions that are in the `Approved` state. If no actions are ready to be
    // queued, we exit and this is a no-op.
    uint256 actionId = findActionByState(index, ActionState.Approved);
    if (actionId == type(uint256).max) {
      recordMetric("llamaCore_queueAction_noop");
      return;
    }

    LLAMA_CORE.queueAction(actionInfos[actionId]);
    recordMetric("llamaCore_queueAction_queued");
  }

  function llamaCore_executeAction(
    uint256 index
  ) public recordCall("llamaCore_executeAction") useCurrentTimestamp {
    // We only want to execute actions that are in the `Queued` state. If no actions are ready to be
    // executed, we exit and this is a no-op.
    uint256 actionId = findActionByState(index, ActionState.Queued);
    if (actionId == type(uint256).max) {
      recordMetric("llamaCore_executeAction_noop");
      return;
    }

    vm.warp(LLAMA_CORE.getAction(actionId).minExecutionTime); // Ensure the action is ready to be executed.
    try LLAMA_CORE.executeAction(actionInfos[actionId]) {
      recordMetric("llamaCore_executeAction_executed");
    } catch {
      // We don't care about reverts, we just want to know if the action was executed or not.
      recordMetric("llamaCore_executeAction_executionRevert");
    }
  }

  function llamaCore_cancelAction(
    uint256 index
  ) public recordCall("llamaCore_cancelAction") useCurrentTimestamp {
    // We can only cancel actions that are not in any of the following state: executed, canceled,
    // expired, or failed. If all actions are in one of those states, we exit and this is a no-op.
    uint256 actionId = _bound(index, 0, actionsCounts.length - 1);
    for (uint256 i = 0; i < actionsCounts.length; i++) {
      actionId = actionsCounts[(actionId + i) % actionsCounts.length];
      ActionInfo memory actionInfo = actionInfos[actionId];
      ActionState state = LLAMA_CORE.getActionState(actionInfo);
      if (
        state != ActionState.Executed &&
        state != ActionState.Canceled &&
        state != ActionState.Expired &&
        state != ActionState.Failed
      ) {
        // Prank as the action creator so we don't need to worry about disapprovals to cancel the action.
        vm.prank(actionInfo.creator);
        LLAMA_CORE.cancelAction(actionInfo);
        recordMetric("llamaCore_cancelAction_canceled");
        return;
      }
    }
    recordMetric("llamaCore_cancelAction_noop");
  }

  function llamaCore_castApproval(
    uint256 index
  ) public recordCall("llamaCore_castApproval") useCurrentTimestamp {
    uint256 actionId = findActionByState(index, ActionState.Active);
    if (actionId == type(uint256).max) {
      recordMetric("llamaCore_castApproval_noop_1");
      return;
    }

    address[3] memory approvers = [
      makeAddr("approverAdam"),
      makeAddr("approverAlicia"),
      makeAddr("approverAndy")
    ];
    uint256 newIndex = uint256(keccak256(abi.encode(index)));
    address approver = approvers[_bound(newIndex, 0, approvers.length - 1)];

    if (LLAMA_CORE.approvals(actionId, approver)) {
      recordMetric("llamaCore_castApproval_noop_2");
      return;
    }

    vm.prank(approver);
    LLAMA_CORE.castApproval(uint8(Roles.Approver), actionInfos[actionId], "");
    recordMetric("llamaCore_castApproval_approved");
  }

  function llamaCore_castDisapproval(
    uint256 index
  ) public recordCall("llamaCore_castDisapproval") useCurrentTimestamp {
    uint256 actionId = findActionByState(index, ActionState.Queued);
    if (actionId == type(uint256).max) {
      recordMetric("llamaCore_castDisapproval_noop_1");
      return;
    }

    address[3] memory disapprovers = [
      makeAddr("disapproverDave"),
      makeAddr("disapproverDiane"),
      makeAddr("disapproverDrake")
    ];
    uint256 newIndex = uint256(keccak256(abi.encode(index)));
    address disapprover = disapprovers[
      _bound(newIndex, 0, disapprovers.length - 1)
    ];

    if (LLAMA_CORE.disapprovals(actionId, disapprover)) {
      recordMetric("llamaCore_castDisapproval_noop_2");
      return;
    }

    vm.prank(disapprover);
    LLAMA_CORE.castDisapproval(
      uint8(Roles.Disapprover),
      actionInfos[actionId],
      ""
    );
    recordMetric("llamaCore_castDisapproval_disapproved");
  }

  // These methods are the same underlying functionality as the above methods, so they're omitted
  // from the handler for simplicity/brevity.
  //   llamaCore_castApprovalWithReason
  //   llamaCore_castApprovalBySig
  //   llamaCore_castDisapprovalWithReason
  //   llamaCore_castDisapprovalBySig

  // These methods do not affect any of the invariants we're testing, so they're omitted from the
  // handler for simplicity/brevity.
  //   llamaCore_createStrategies
  //   llamaCore_createAndAuthorizeAccounts
}

contract LlamaFactoryInvariants is LlamaTestSetup {
  LlamaCoreHandler public handler;

  ActionInfo executedAction;
  ActionInfo canceledAction;
  ActionInfo expiredAction;

  // Mapping from action ID to action info, used for the handler to initialize this mapping in it's own storage.
  mapping(uint256 actionId => ActionInfo) public actionInfos;

  function setUp() public override {
    LlamaTestSetup.setUp();

    // We push through 3 actions: one that's executed, one that's canceled, and one that's expired.
    // First, we execute an action.
    executedAction = createAction();
    approveAction(approverAdam, executedAction);
    approveAction(approverAlicia, executedAction);
    vm.warp(block.timestamp + 6 days);
    mpCore.queueAction(executedAction);
    vm.warp(block.timestamp + 5 days);
    mpCore.executeAction(executedAction);
    vm.warp(block.timestamp + 1 days);

    // Now we cancel an action.
    canceledAction = createAction();
    vm.prank(actionCreatorAaron);
    mpCore.cancelAction(canceledAction);
    vm.warp(block.timestamp + 1 days);

    // Lastly, we let an action expire.
    expiredAction = createAction();
    approveAction(approverAdam, expiredAction);
    approveAction(approverAlicia, expiredAction);
    vm.warp(block.timestamp + 6 days);
    mpCore.queueAction(expiredAction);
    vm.warp(block.timestamp + 15 days);

    // Save off the actions.
    actionInfos[executedAction.id] = executedAction;
    actionInfos[canceledAction.id] = canceledAction;
    actionInfos[expiredAction.id] = expiredAction;

    // Verify our setup. Note that we rely on the fact that the action IDs are assigned sequentially in the handler.
    require(executedAction.id == 0, "executedActionId");
    require(canceledAction.id == 1, "canceledActionId");
    require(expiredAction.id == 2, "expiredActionId");
    require(
      mpCore.getActionState(executedAction) == ActionState.Executed,
      "executedActionId"
    );
    require(
      mpCore.getActionState(canceledAction) == ActionState.Canceled,
      "canceledActionId"
    );
    require(
      mpCore.getActionState(expiredAction) == ActionState.Expired,
      "expiredActionId"
    );

    // Now we deploy our handler and inform it of these actions.
    ILlamaStrategy[2] memory strategies = [mpStrategy1, mpStrategy2];
    bytes32[3] memory permissionIds = [
      pausePermissionId,
      failPermissionId,
      receiveEthPermissionId
    ];
    handler = new LlamaCoreHandler(
      factory,
      mpCore,
      strategies,
      permissionIds,
      address(mockProtocol)
    );

    targetContract(address(handler));
    targetSender(msg.sender);
  }

  // =========================
  // ======== Helpers ========
  // =========================

  function getActionInfo(
    uint256 actionId
  ) external view returns (ActionInfo memory actionInfo) {
    actionInfo = actionInfos[actionId];
  }

  function createAction() internal returns (ActionInfo memory actionInfo) {
    bytes memory data = abi.encodeWithSelector(PAUSE_SELECTOR, true);
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
  }

  function approveAction(
    address policyholder,
    ActionInfo memory actionInfo
  ) public {
    vm.prank(policyholder);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
  }

  // ======================================
  // ======== Invariant Assertions ========
  // ======================================

  // The `actionsCount` state variable should only increase, and be incremented by 1 with each
  // successful `createAction` call.
  function assertInvariant_ActionsCountMonotonicallyIncreases() internal view {
    uint256[] memory llamaCounts = handler.getActionsCounts();
    for (uint256 i = 1; i < llamaCounts.length; i++) {
      require(
        llamaCounts[i] == llamaCounts[i - 1] + 1,
        "llamaCount did not monotonically increase"
      );
    }
  }

  // Once an action is executed, it's state is final and should never change, i.e. it cannot be
  // queued or executed again.
  function assertInvariant_ExecutedActionsAreFinalized() internal view {
    require(
      mpCore.getActionState(executedAction) == ActionState.Executed,
      "executedAction state changed"
    );
  }

  // Once an action is canceled, it's state is final and should never change, i.e. it cannot
  // cannot be later be queued, executed, or canceled again.
  function assertInvariant_CanceledActionsAreFinalized() internal view {
    require(
      mpCore.getActionState(canceledAction) == ActionState.Canceled,
      "canceledAction state changed"
    );
  }

  // Once an action is expired, it's state is final and should never change, i.e. it cannot be
  // later be queued and executed.
  function assertInvariant_ExpiredActionsAreFinalized() internal view {
    require(
      mpCore.getActionState(expiredAction) == ActionState.Expired,
      "expiredAction state changed"
    );
  }

  // =================================
  // ======== Invariant Tests ========
  // =================================

  function invariant_AllCoreInvariants() public view {
    assertInvariant_ActionsCountMonotonicallyIncreases();
    assertInvariant_ExecutedActionsAreFinalized();
    assertInvariant_CanceledActionsAreFinalized();
    assertInvariant_ExpiredActionsAreFinalized();
  }

  function invariant_CallSummary() public view {
    handler.callSummary();
  }
}
