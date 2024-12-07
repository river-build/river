// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

import {DeployUtils} from "@llama/script/DeployUtils.sol";

import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {LlamaAccountWithDelegation} from "@llama/src/accounts/LlamaAccountWithDelegation.sol";
import {Roles, LlamaTestSetup} from "@llama/test/utils/LlamaTestSetup.sol";
import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";

contract LlamaAccountWithDelegationTest is LlamaTestSetup {
  IERC20 public constant UNI =
    IERC20(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984);
  IERC20 public constant ENS =
    IERC20(0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72);
  uint256 public constant UNI_AMOUNT = 1000e18;
  uint256 public constant ENS_AMOUNT = 28_600e18;

  ILlamaAccount accountWithDelegation;

  PermissionData public delegateTokenPermission;
  PermissionData public batchDelegateTokenPermission;

  function setUp() public virtual override {
    vm.createSelectFork(vm.rpcUrl("mainnet"), 18_642_270);
    LlamaTestSetup.setUp();

    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](1);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccountWithDelegation"});

    accountWithDelegation = lens.computeLlamaAccountAddress(
      address(accountWithDelegationLogic),
      abi.encode(newAccounts[0]),
      address(mpCore)
    );

    deal(address(UNI), address(accountWithDelegation), UNI_AMOUNT);
    deal(address(ENS), address(accountWithDelegation), ENS_AMOUNT);

    delegateTokenPermission = PermissionData(
      address(accountWithDelegation),
      LlamaAccountWithDelegation.delegateToken.selector,
      mpStrategy1
    );

    batchDelegateTokenPermission = PermissionData(
      address(accountWithDelegation),
      LlamaAccountWithDelegation.batchDelegateToken.selector,
      mpStrategy1
    );

    vm.startPrank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(accountWithDelegationLogic, true);
    mpCore.createAccounts(
      accountWithDelegationLogic,
      DeployUtils.encodeAccountConfigs(newAccounts)
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      delegateTokenPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      batchDelegateTokenPermission,
      true
    );
    vm.stopPrank();
  }
}

contract DelegateToken is LlamaAccountWithDelegationTest {
  function executeDelegateTokenAction(
    LlamaAccountWithDelegation.TokenDelegateData memory tokenDelegateData
  ) internal {
    bytes memory data = abi.encodeCall(
      LlamaAccountWithDelegation.delegateToken,
      (tokenDelegateData)
    );

    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(accountWithDelegation),
      0,
      data,
      ""
    );

    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(accountWithDelegation),
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

  function test_DelegateToExecutor() external {
    // Assert that the account has 1,000 UNI tokens and hasn't delegated them yet
    assertEq(UNI.balanceOf(address(accountWithDelegation)), 1000e18);
    assertEq(
      IVotes(address(UNI)).delegates(address(accountWithDelegation)),
      address(0)
    );

    LlamaAccountWithDelegation.TokenDelegateData
      memory tokenDelegateData = LlamaAccountWithDelegation.TokenDelegateData(
        IVotes(address(UNI)),
        address(mpExecutor)
      );

    executeDelegateTokenAction(tokenDelegateData);

    // After the action executes the account should still have 1,000 UNI tokens but the delegate is the executor address
    assertEq(UNI.balanceOf(address(accountWithDelegation)), 1000e18);
    assertEq(
      IVotes(address(UNI)).delegates(address(accountWithDelegation)),
      address(mpExecutor)
    );
  }

  function test_DelegateToOtherAddress() external {
    address delegatee = makeAddr("delegatee");
    // Assert that the account has 1,000 UNI tokens and hasn't delegated them yet
    assertEq(UNI.balanceOf(address(accountWithDelegation)), 1000e18);
    assertEq(
      IVotes(address(UNI)).delegates(address(accountWithDelegation)),
      address(0)
    );

    LlamaAccountWithDelegation.TokenDelegateData
      memory tokenDelegateData = LlamaAccountWithDelegation.TokenDelegateData(
        IVotes(address(UNI)),
        delegatee
      );

    executeDelegateTokenAction(tokenDelegateData);

    // After the action executes the account should still have 1,000 UNI tokens but the delegate is the executor address
    assertEq(UNI.balanceOf(address(accountWithDelegation)), 1000e18);
    assertEq(
      IVotes(address(UNI)).delegates(address(accountWithDelegation)),
      delegatee
    );
  }
}

contract BatchDelegateToken is LlamaAccountWithDelegationTest {
  function test_BatchDelegateTokens() external {
    address delegatee1 = address(mpExecutor);
    address delegatee2 = makeAddr("delegatee2");
    // Assert that the account has UNI and ENS tokens and hasn't delegated them yet
    assertEq(UNI.balanceOf(address(accountWithDelegation)), 1000e18);
    assertEq(ENS.balanceOf(address(accountWithDelegation)), 28_600e18);
    assertEq(
      IVotes(address(UNI)).delegates(address(accountWithDelegation)),
      address(0)
    );
    assertEq(
      IVotes(address(ENS)).delegates(address(accountWithDelegation)),
      address(0)
    );

    LlamaAccountWithDelegation.TokenDelegateData[]
      memory tokenDelegateData = new LlamaAccountWithDelegation.TokenDelegateData[](
        2
      );

    tokenDelegateData[0] = LlamaAccountWithDelegation.TokenDelegateData(
      IVotes(address(UNI)),
      delegatee1
    );
    tokenDelegateData[1] = LlamaAccountWithDelegation.TokenDelegateData(
      IVotes(address(ENS)),
      delegatee2
    );

    vm.prank(address(mpExecutor));
    LlamaAccountWithDelegation(payable(address(accountWithDelegation)))
      .batchDelegateToken(tokenDelegateData);

    // After the action executes the accounts should still have all UNI and ENS tokens but the delegate is the
    // delegatee
    assertEq(UNI.balanceOf(address(accountWithDelegation)), 1000e18);
    assertEq(ENS.balanceOf(address(accountWithDelegation)), 28_600e18);
    assertEq(
      IVotes(address(UNI)).delegates(address(accountWithDelegation)),
      delegatee1
    );
    assertEq(
      IVotes(address(ENS)).delegates(address(accountWithDelegation)),
      delegatee2
    );
  }
}
