// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {LlamaTestSetup} from "@llama/test/utils/LlamaTestSetup.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract LlamaIntegrationsTest is LlamaTestSetup {
  function setUp() public virtual override {
    LlamaTestSetup.setUp();
  }
}

contract Setup is LlamaIntegrationsTest {
  function test_setUp() public {
    assertEq(mpCore.name(), "Mock Protocol Llama");

    assertEqStrategyStatus(mpCore, mpStrategy1, true, true);
    assertEqStrategyStatus(mpCore, mpStrategy2, true, true);

    vm.expectRevert(Initializable.InvalidInitialization.selector);
    mpAccount1.initialize("LlamaAccount0");

    vm.expectRevert(Initializable.InvalidInitialization.selector);
    mpAccount2.initialize("LlamaAccount1");
  }
}

contract Integration is LlamaIntegrationsTest {
  function test_CompleteActionFlow() public {
    // TODO
    // We can use _executeCompleteActionFlow() from LlamaCore.t.sol
  }

  function testFuzz_NewLlamaInstancesCanBeDeployed() public {
    // TODO
    // Test that the root/llama LlamaIntegrations can deploy new client LlamaIntegrations
    // instances by creating an action to call LlamaFactory.deploy.
  }

  function testFuzz_ETHSendFromAccountViaActionApproval(
    uint256 _ethAmount
  ) public {
    // TODO test that funds can be moved from LlamaAccounts via actions
    // submitted and approved through LlamaIntegrations
  }

  function testFuzz_ERC20SendFromAccountViaActionApproval(
    uint256 _tokenAmount,
    IERC20 _token
  ) public {
    // TODO test that funds can be moved from LlamaAccounts via actions
    // submitted and approved through LlamaIntegrations
  }

  function testFuzz_ERC20ApprovalFromAccountViaActionApproval(
    uint256 _tokenAmount,
    IERC20 _token
  ) public {
    // TODO test that funds can be approved + transferred from LlamaAccounts via actions
    // submitted and approved through LlamaIntegrations
  }
}
