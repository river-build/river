// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";

//interfaces
import {IOwnableBase} from "@river-build/diamond/src/facets/ownable/IERC173.sol";
import {IExecutorBase} from "contracts/src/spaces/facets/executor/IExecutor.sol";

//libraries
import {Time} from "@openzeppelin/contracts/utils/types/Time.sol";

//contracts
import {Executor} from "contracts/src/spaces/facets/executor/Executor.sol";
import {MockERC721} from "contracts/test/mocks/MockERC721.sol";

contract ExecutorTest is BaseSetup, IExecutorBase, IOwnableBase {
  Executor internal executor;
  MockERC721 internal mockERC721;

  function setUp() public override {
    super.setUp();
    executor = Executor(everyoneSpace);
    mockERC721 = new MockERC721();
  }

  modifier givenHasAccess(uint64 groupId, address account, uint32 delay) {
    (bool isMember, ) = executor.hasAccess(groupId, account);
    vm.assume(!isMember);

    uint48 since = Time.timestamp() + executor.getGroupDelay(groupId);

    vm.prank(founder);
    vm.expectEmit(address(executor));
    emit GroupAccessGranted(groupId, account, delay, since, true);
    bool newMember = executor.grantAccess(groupId, account, delay);
    assertEq(newMember, true);
    _;
  }

  function test_single_grantAccess() external {
    uint64 groupId = 1;
    address account = _randomAddress();
    // execution delay is the delay at which an execution will take effect
    uint32 executionDelay = 100;
    // group delay is the delay at which the group will take effect
    uint48 lastAccess = Time.timestamp() + executor.getGroupDelay(groupId);

    vm.prank(founder);
    vm.expectEmit(address(executor));
    emit GroupAccessGranted(groupId, account, executionDelay, lastAccess, true);
    executor.grantAccess(groupId, account, executionDelay);
  }

  function test_grantAccess_newMember(
    uint64 groupId,
    address account,
    uint32 delay
  ) external givenHasAccess(groupId, account, delay) {
    (bool isMember, uint32 executionDelay) = executor.hasAccess(
      groupId,
      account
    );
    assertEq(isMember, true);
    assertEq(executionDelay, delay);
  }

  function test_grantAccess_existingMember(
    uint64 groupId,
    address account,
    uint32 delay
  ) external givenHasAccess(groupId, account, delay) {
    vm.prank(founder);
    bool newMember = executor.grantAccess(groupId, account, delay);
    assertEq(newMember, false);
  }

  function test_revertWhen_grantAccess_callerIsNotFounder(
    address caller,
    uint64 groupId,
    address account,
    uint32 delay
  ) external {
    vm.assume(caller != founder);
    vm.prank(caller);
    vm.expectRevert(abi.encodeWithSelector(Ownable__NotOwner.selector, caller));
    executor.grantAccess(groupId, account, delay);
  }

  // execute
  function test_execute() external {
    uint64 groupId = 1;
    address bot = _randomAddress();
    address receiver = _randomAddress();
    uint32 delay = 100;

    vm.startPrank(founder);
    executor.grantAccess(groupId, bot, delay);
    executor.setTargetFunctionGroup(
      address(mockERC721),
      mockERC721.mintWithPayment.selector,
      groupId
    );
    vm.stopPrank();

    vm.prank(bot);
    vm.expectRevert(
      abi.encodeWithSelector(
        IExecutorBase.UnauthorizedCall.selector,
        bot,
        address(mockERC721),
        mockERC721.mint.selector
      )
    );
    executor.execute(
      address(mockERC721),
      abi.encodeCall(mockERC721.mint, (receiver, 1))
    );

    bytes memory mintWithPayment = abi.encodeCall(
      mockERC721.mintWithPayment,
      receiver
    );

    bytes32 operationId = executor.hashOperation(
      bot,
      address(mockERC721),
      mintWithPayment
    );

    vm.prank(bot);
    vm.expectRevert(
      abi.encodeWithSelector(IExecutorBase.NotScheduled.selector, operationId)
    );
    executor.execute(address(mockERC721), mintWithPayment);

    vm.prank(bot);
    executor.scheduleOperation(
      address(mockERC721),
      mintWithPayment,
      Time.timestamp() + delay
    );

    vm.deal(address(bot), 1 ether);

    vm.warp(Time.timestamp() + delay + 1);

    vm.prank(bot);
    executor.execute{value: 1 ether}(address(mockERC721), mintWithPayment);

    assertEq(mockERC721.balanceOf(receiver), 1);
  }
}
