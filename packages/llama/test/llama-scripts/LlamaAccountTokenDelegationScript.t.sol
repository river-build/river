// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";
import {Roles, LlamaTestSetup} from "@llama/test/utils/LlamaTestSetup.sol";
import {LlamaAccountTokenDelegationScript} from "@llama/src/llama-scripts/LlamaAccountTokenDelegationScript.sol";
import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";

contract LlamaAccountTokenDelegationScriptTest is LlamaTestSetup {
  event DelegateChanged(
    address indexed delegator,
    address indexed fromDelegate,
    address indexed toDelegate
  );

  IERC20 public constant UNI =
    IERC20(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984);
  uint256 public constant UNI_AMOUNT = 1000e18;

  address delegationScriptAddress;

  PermissionData public delegateTokenPermission;
  PermissionData public delegateTokensPermission;

  function setUp() public virtual override {
    vm.createSelectFork(vm.rpcUrl("mainnet"), 18_642_270);
    LlamaTestSetup.setUp();

    deal(address(UNI), address(mpAccount1), UNI_AMOUNT);
    deal(address(UNI), address(mpAccount2), UNI_AMOUNT);

    delegationScriptAddress = address(new LlamaAccountTokenDelegationScript());

    delegateTokenPermission = PermissionData(
      address(delegationScriptAddress),
      LlamaAccountTokenDelegationScript.delegateTokenFromAccount.selector,
      mpStrategy1
    );

    delegateTokensPermission = PermissionData(
      address(delegationScriptAddress),
      LlamaAccountTokenDelegationScript.delegateTokensFromAccount.selector,
      mpStrategy1
    );

    vm.startPrank(address(mpExecutor));
    mpCore.setScriptAuthorization(address(delegationScriptAddress), true);
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      delegateTokenPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      delegateTokensPermission,
      true
    );
    vm.stopPrank();
  }
}

contract DelegateTokenFromAccount is LlamaAccountTokenDelegationScriptTest {
  function executeDelegateTokenAction(
    LlamaAccountTokenDelegationScript.AccountTokenDelegateData
      memory tokenDelegateData
  ) internal {
    bytes memory data = abi.encodeCall(
      LlamaAccountTokenDelegationScript.delegateTokenFromAccount,
      (tokenDelegateData)
    );

    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      delegationScriptAddress,
      0,
      data,
      ""
    );

    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      delegationScriptAddress,
      0,
      data
    );
    vm.warp(block.timestamp + 1);

    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    vm.prank(approverAlicia);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    mpCore.executeAction(actionInfo);
  }

  function test_TokensDelegatedToExecutor() external {
    // Assert that the account has 1,000 UNI tokens and hasn't delegated them yet
    assertEq(UNI.balanceOf(address(mpAccount1)), 1000e18);
    assertEq(IVotes(address(UNI)).delegates(address(mpAccount1)), address(0));

    LlamaAccountTokenDelegationScript.AccountTokenDelegateData
      memory tokenDelegateData = LlamaAccountTokenDelegationScript
        .AccountTokenDelegateData(
          LlamaAccount(payable(address(mpAccount1))),
          IVotes(address(UNI)),
          address(mpExecutor)
        );

    executeDelegateTokenAction(tokenDelegateData);

    // After the action executes the account should still have 1,000 UNI tokens
    assertEq(UNI.balanceOf(address(mpAccount1)), 1000e18);
    assertEq(
      IVotes(address(UNI)).delegates(address(mpAccount1)),
      address(mpExecutor)
    );
  }

  function test_TokensDelegatedToOtherAddress() external {
    address delegatee = makeAddr("scriptDelegatee");
    // Assert that the account has 1,000 UNI tokens and hasn't delegated them yet
    assertEq(UNI.balanceOf(address(mpAccount1)), 1000e18);
    assertEq(IVotes(address(UNI)).delegates(address(mpAccount1)), address(0));

    LlamaAccountTokenDelegationScript.AccountTokenDelegateData
      memory tokenDelegateData = LlamaAccountTokenDelegationScript
        .AccountTokenDelegateData(
          LlamaAccount(payable(address(mpAccount1))),
          IVotes(address(UNI)),
          delegatee
        );

    executeDelegateTokenAction(tokenDelegateData);

    // After the action executes the account should still have 1,000 UNI tokens but the delegate is the delegatee
    // address
    assertEq(UNI.balanceOf(address(mpAccount1)), 1000e18);
    assertEq(IVotes(address(UNI)).delegates(address(mpAccount1)), delegatee);
  }
}

contract DelegateTokensFromAccount is LlamaAccountTokenDelegationScriptTest {
  function executeDelegateTokensAction(
    LlamaAccountTokenDelegationScript.AccountTokenDelegateData[]
      memory tokenDelegateData
  ) internal {
    bytes memory data = abi.encodeCall(
      LlamaAccountTokenDelegationScript.delegateTokensFromAccount,
      (tokenDelegateData)
    );

    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      delegationScriptAddress,
      0,
      data,
      ""
    );

    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      delegationScriptAddress,
      0,
      data
    );
    vm.warp(block.timestamp + 1);

    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    vm.prank(approverAlicia);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    mpCore.executeAction(actionInfo);
  }

  function test_DelegateTokensFromAccounts() external {
    address delegatee1 = makeAddr("scriptDelegate1");
    address delegatee2 = makeAddr("scriptDelegate2");
    // Assert that the accounts have 1,000 UNI tokens and hasn't delegated them yet
    assertEq(UNI.balanceOf(address(mpAccount1)), 1000e18);
    assertEq(UNI.balanceOf(address(mpAccount2)), 1000e18);
    assertEq(IVotes(address(UNI)).delegates(address(mpAccount1)), address(0));
    assertEq(IVotes(address(UNI)).delegates(address(mpAccount2)), address(0));

    LlamaAccountTokenDelegationScript.AccountTokenDelegateData[]
      memory tokenDelegateData = new LlamaAccountTokenDelegationScript.AccountTokenDelegateData[](
        2
      );

    tokenDelegateData[0] = LlamaAccountTokenDelegationScript
      .AccountTokenDelegateData(
        LlamaAccount(payable(address(mpAccount1))),
        IVotes(address(UNI)),
        delegatee1
      );
    tokenDelegateData[1] = LlamaAccountTokenDelegationScript
      .AccountTokenDelegateData(
        LlamaAccount(payable(address(mpAccount2))),
        IVotes(address(UNI)),
        delegatee2
      );

    executeDelegateTokensAction(tokenDelegateData);

    // After the action executes the accounts should still have 1,000 UNI tokens but the delegate is the delegatee
    assertEq(UNI.balanceOf(address(mpAccount1)), 1000e18);
    assertEq(UNI.balanceOf(address(mpAccount2)), 1000e18);
    assertEq(IVotes(address(UNI)).delegates(address(mpAccount1)), delegatee1);
    assertEq(IVotes(address(UNI)).delegates(address(mpAccount2)), delegatee2);
  }
}
