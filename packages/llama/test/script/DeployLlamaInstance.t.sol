// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {PermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {PolicyholderCheckpoints} from "@llama/src/lib/PolicyholderCheckpoints.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaAbsoluteQuorum} from "@llama/src/strategies/absolute/LlamaAbsoluteQuorum.sol";
import {LlamaRelativeHolderQuorum} from "@llama/src/strategies/relative/LlamaRelativeHolderQuorum.sol";
import {DeployLlamaFactory} from "@llama/script/DeployLlamaFactory.s.sol";
import {DeployLlamaInstance} from "@llama/script/DeployLlamaInstance.s.sol";

contract DeployLlamaInstanceTest is
  Test,
  DeployLlamaFactory,
  DeployLlamaInstance
{
  LlamaCore rootLlama;
  // This is the address that we're using with the CreateAction script to
  // automate action creation to deploy new Llama instances. It could be
  // replaced with any address that we hold the private key for.
  address LLAMA_INSTANCE_DEPLOYER = 0x3d9fEa8AeD0249990133132Bb4BC8d07C6a8259a;
  uint8 ACTION_CREATOR_ROLE_ID = 1;

  event RoleInitialized(uint8 indexed role, RoleDescription description);

  function assertEqStrategyStatus(
    LlamaCore _core,
    ILlamaStrategy strategy,
    bool expectedDeployed,
    bool expectedAuthorized
  ) internal {
    (bool deployed, bool authorized) = _core.strategies(strategy);
    assertEq(deployed, expectedDeployed);
    assertEq(authorized, expectedAuthorized);
  }

  function setUp() public virtual {
    DeployLlamaFactory.run();

    // Deploy the root llama instance
    vm.recordLogs();
    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "deployRootLlamaInstance.json"
    );
    Vm.Log[] memory emittedEvents = vm.getRecordedLogs();

    // Gets emitted when the deploy call completes, exposing the deployed LlamaCore address.
    bytes32 llamaInstanceCreatedSig = keccak256(
      "LlamaInstanceCreated(uint256,string,address,address,address,uint256)"
    );

    Vm.Log memory _event;
    for (uint256 i = 0; i < emittedEvents.length; i++) {
      _event = emittedEvents[i];
      bytes32 eventSig = _event.topics[0];
      if (eventSig == llamaInstanceCreatedSig) {
        // event LlamaInstanceCreated(
        //   address indexed deployer,
        //   string indexed name,
        //   address llamaCore,       <--- What we want.
        //   address llamaExecutor,
        //   address llamaPolicy,
        //   uint256 chainId
        // )
        (rootLlama, , , ) = abi.decode(
          _event.data,
          (LlamaCore, LlamaExecutor, address, uint256)
        );
      }
    }
    mineBlock();
  }

  function mineBlock() internal {
    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 1);
  }
}

contract RelativeStrategyRun is DeployLlamaInstanceTest {
  using stdJson for string;

  function test_newInstanceCanBeDeployed() public {
    vm.recordLogs();
    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "deployLlamaInstance.json"
    );
    Vm.Log[] memory emittedEvents = vm.getRecordedLogs();

    // There are three strategies we expect to have been deployed.
    LlamaRelativeHolderQuorum[]
      memory strategiesAuthorized = new LlamaRelativeHolderQuorum[](3);
    uint8 strategiesCount;
    bytes32 strategiesAuthorizedSig = keccak256(
      "StrategyCreated(address,address,bytes)"
    );

    // There are two accounts we expect to have been deployed.
    LlamaAccount[] memory accountsCreated = new LlamaAccount[](2);
    uint8 accountsCount;
    bytes32 accountCreatedSig = keccak256(
      "AccountCreated(address,address,bytes)"
    );

    LlamaCore llamaInstance = core;
    LlamaExecutor llamaInstanceExecutor = core.executor();

    Vm.Log memory _event;
    for (uint256 i = 0; i < emittedEvents.length; i++) {
      _event = emittedEvents[i];
      bytes32 eventSig = _event.topics[0];
      if (eventSig == strategiesAuthorizedSig) {
        // event StrategyAuthorized(
        //   ILlamaStrategy strategy,  <-- The field we want.
        //   ILlamaStrategy indexed strategyLogic,
        //   bytes initializationData
        // );
        (address strategy, ) = abi.decode(_event.data, (address, bytes));
        strategiesAuthorized[strategiesCount++] = LlamaRelativeHolderQuorum(
          strategy
        );
      }
      if (eventSig == accountCreatedSig) {
        // event AccountCreated(
        //   ILlamaAccount account,  <-- The topic we want.
        //   ILlamaAccount indexed accountLogic,
        //   bytes initializationData
        // );
        (address account, ) = abi.decode(_event.data, (address, bytes));
        accountsCreated[accountsCount++] = LlamaAccount(payable(account));
      }
    }

    // Confirm new llama instance has the desired properties.
    assertFalse(address(llamaInstance) == address(rootLlama));

    LlamaRelativeHolderQuorum firstStrategy = strategiesAuthorized[0];
    assertEqStrategyStatus(llamaInstance, firstStrategy, true, true);
    assertEq(firstStrategy.approvalPeriod(), 172_800);
    assertEq(firstStrategy.approvalRole(), 1);
    assertEq(firstStrategy.disapprovalRole(), 3);
    assertEq(firstStrategy.expirationPeriod(), 691_200);
    assertEq(firstStrategy.isFixedLengthApprovalPeriod(), true);
    assertEq(firstStrategy.minApprovalPct(), 4000);
    assertEq(firstStrategy.minDisapprovalPct(), 5100);
    assertEq(firstStrategy.queuingPeriod(), 345_600);
    assertEq(firstStrategy.forceApprovalRole(1), false);
    assertEq(firstStrategy.forceDisapprovalRole(1), false);

    LlamaRelativeHolderQuorum secondStrategy = strategiesAuthorized[1];
    assertEqStrategyStatus(llamaInstance, secondStrategy, true, true);
    assertEq(secondStrategy.approvalPeriod(), 172_800);
    assertEq(secondStrategy.approvalRole(), 2);
    assertEq(secondStrategy.disapprovalRole(), 3);
    assertEq(secondStrategy.expirationPeriod(), 691_200);
    assertEq(secondStrategy.isFixedLengthApprovalPeriod(), true);
    assertEq(secondStrategy.minApprovalPct(), 4000);
    assertEq(secondStrategy.minDisapprovalPct(), 5100);
    assertEq(secondStrategy.queuingPeriod(), 345_600);
    assertEq(secondStrategy.forceApprovalRole(1), false);
    assertEq(secondStrategy.forceDisapprovalRole(1), false);

    LlamaRelativeHolderQuorum thirdStrategy = strategiesAuthorized[2];
    assertEqStrategyStatus(llamaInstance, thirdStrategy, true, true);
    assertEq(thirdStrategy.approvalPeriod(), 172_800);
    assertEq(thirdStrategy.approvalRole(), 2);
    assertEq(thirdStrategy.disapprovalRole(), 3);
    assertEq(thirdStrategy.expirationPeriod(), 86_400);
    assertEq(thirdStrategy.isFixedLengthApprovalPeriod(), false);
    assertEq(thirdStrategy.minApprovalPct(), 8000);
    assertEq(thirdStrategy.minDisapprovalPct(), 10_001);
    assertEq(thirdStrategy.queuingPeriod(), 0);
    assertEq(thirdStrategy.forceApprovalRole(1), true);
    assertEq(thirdStrategy.forceDisapprovalRole(1), true);

    LlamaAccount firstAccount = accountsCreated[0];
    assertEq(firstAccount.llamaExecutor(), address(llamaInstanceExecutor));
    assertEq(
      keccak256(abi.encodePacked(firstAccount.name())), // Encode to compare.
      keccak256("MP Treasury")
    );

    LlamaAccount secondAccount = accountsCreated[1];
    assertEq(secondAccount.llamaExecutor(), address(llamaInstanceExecutor));
    assertEq(
      keccak256(abi.encodePacked(secondAccount.name())), // Encode to compare.
      keccak256("MP Grants")
    );

    LlamaPolicy policy = llamaInstance.policy();
    assertEq(policy.numRoles(), 8);

    address initRoleHolder = makeAddr("actionCreatorAaron");
    assertEq(policy.hasRole(initRoleHolder, ACTION_CREATOR_ROLE_ID), true);
    PolicyholderCheckpoints.History memory balances = policy
      .roleBalanceCheckpoints(initRoleHolder, ACTION_CREATOR_ROLE_ID);
    PolicyholderCheckpoints.Checkpoint memory checkpoint = balances
      ._checkpoints[0];
    assertEq(checkpoint.expiration, type(uint64).max);
    assertEq(checkpoint.quantity, 1);

    bytes32 permissionId = lens.computePermissionId(
      PermissionData(
        address(secondAccount), // target
        LlamaAccount.transferERC20.selector, // selector
        thirdStrategy // strategy
      )
    );
    assertTrue(policy.canCreateAction(ACTION_CREATOR_ROLE_ID, permissionId));
  }

  function test_NewInstanceHasRolesInitialized() public {
    vm.expectEmit();
    emit RoleInitialized(0, RoleDescription.wrap("All Holders"));
    vm.expectEmit();
    emit RoleInitialized(1, RoleDescription.wrap("ActionCreator"));
    vm.expectEmit();
    emit RoleInitialized(2, RoleDescription.wrap("Approver"));
    vm.expectEmit();
    emit RoleInitialized(3, RoleDescription.wrap("Disapprover"));
    vm.expectEmit();
    emit RoleInitialized(4, RoleDescription.wrap("ForceApprover"));
    vm.expectEmit();
    emit RoleInitialized(5, RoleDescription.wrap("ForceDisapprover"));
    vm.expectEmit();
    emit RoleInitialized(6, RoleDescription.wrap("TestRole1"));
    vm.expectEmit();
    emit RoleInitialized(7, RoleDescription.wrap("TestRole2"));
    vm.expectEmit();
    emit RoleInitialized(8, RoleDescription.wrap("MadeUpRole"));

    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "deployLlamaInstance.json"
    );
  }
}

contract AbsoluteStrategyRun is DeployLlamaInstanceTest {
  using stdJson for string;

  function test_newInstanceCanBeDeployed() public {
    vm.recordLogs();
    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "absoluteLlamaInstance.json"
    );
    Vm.Log[] memory emittedEvents = vm.getRecordedLogs();

    // There are three strategies we expect to have been deployed.
    LlamaAbsoluteQuorum[]
      memory strategiesAuthorized = new LlamaAbsoluteQuorum[](3);
    uint8 strategiesCount;
    bytes32 strategiesAuthorizedSig = keccak256(
      "StrategyCreated(address,address,bytes)"
    );

    // There are two accounts we expect to have been deployed.
    LlamaAccount[] memory accountsCreated = new LlamaAccount[](2);
    uint8 accountsCount;
    bytes32 accountCreatedSig = keccak256(
      "AccountCreated(address,address,bytes)"
    );

    LlamaCore llamaInstance = core;
    LlamaExecutor llamaInstanceExecutor = core.executor();

    Vm.Log memory _event;
    for (uint256 i = 0; i < emittedEvents.length; i++) {
      _event = emittedEvents[i];
      bytes32 eventSig = _event.topics[0];
      if (eventSig == strategiesAuthorizedSig) {
        // event StrategyAuthorized(
        //   ILlamaStrategy strategy,  <-- The field we want.
        //   ILlamaStrategy indexed strategyLogic,
        //   bytes initializationData
        // );
        (address strategy, ) = abi.decode(_event.data, (address, bytes));
        strategiesAuthorized[strategiesCount++] = LlamaAbsoluteQuorum(strategy);
      }
      if (eventSig == accountCreatedSig) {
        // event AccountCreated(
        //   ILlamaAccount account,  <-- The topic we want.
        //   ILlamaAccount indexed accountLogic,
        //   bytes initializationData
        // );
        (address account, ) = abi.decode(_event.data, (address, bytes));
        accountsCreated[accountsCount++] = LlamaAccount(payable(account));
      }
    }

    // Confirm new llama instance has the desired properties.
    assertFalse(address(llamaInstance) == address(rootLlama));

    LlamaAbsoluteQuorum firstStrategy = strategiesAuthorized[0];
    assertEqStrategyStatus(llamaInstance, firstStrategy, true, true);
    assertEq(firstStrategy.approvalPeriod(), 172_800);
    assertEq(firstStrategy.approvalRole(), 1);
    assertEq(firstStrategy.disapprovalRole(), 3);
    assertEq(firstStrategy.expirationPeriod(), 691_200);
    assertEq(firstStrategy.isFixedLengthApprovalPeriod(), true);
    assertEq(firstStrategy.minApprovals(), 1);
    assertEq(firstStrategy.minDisapprovals(), 2);
    assertEq(firstStrategy.queuingPeriod(), 345_600);
    assertEq(firstStrategy.forceApprovalRole(1), false);
    assertEq(firstStrategy.forceDisapprovalRole(1), false);

    LlamaAbsoluteQuorum secondStrategy = strategiesAuthorized[1];
    assertEqStrategyStatus(llamaInstance, secondStrategy, true, true);
    assertEq(secondStrategy.approvalPeriod(), 172_800);
    assertEq(secondStrategy.approvalRole(), 2);
    assertEq(secondStrategy.disapprovalRole(), 3);
    assertEq(secondStrategy.expirationPeriod(), 691_200);
    assertEq(secondStrategy.isFixedLengthApprovalPeriod(), true);
    assertEq(secondStrategy.minApprovals(), 2);
    assertEq(secondStrategy.minDisapprovals(), 1);
    assertEq(secondStrategy.queuingPeriod(), 345_600);
    assertEq(secondStrategy.forceApprovalRole(1), false);
    assertEq(secondStrategy.forceDisapprovalRole(1), false);

    LlamaAbsoluteQuorum thirdStrategy = strategiesAuthorized[2];
    assertEqStrategyStatus(llamaInstance, thirdStrategy, true, true);
    assertEq(thirdStrategy.approvalPeriod(), 172_800);
    assertEq(thirdStrategy.approvalRole(), 2);
    assertEq(thirdStrategy.disapprovalRole(), 3);
    assertEq(thirdStrategy.expirationPeriod(), 86_400);
    assertEq(thirdStrategy.isFixedLengthApprovalPeriod(), false);
    assertEq(thirdStrategy.minApprovals(), 1);
    assertEq(thirdStrategy.minDisapprovals(), 5);
    assertEq(thirdStrategy.queuingPeriod(), 0);
    assertEq(thirdStrategy.forceApprovalRole(1), true);
    assertEq(thirdStrategy.forceDisapprovalRole(1), true);

    LlamaAccount firstAccount = accountsCreated[0];
    assertEq(firstAccount.llamaExecutor(), address(llamaInstanceExecutor));
    assertEq(
      keccak256(abi.encodePacked(firstAccount.name())), // Encode to compare.
      keccak256("MP Treasury")
    );

    LlamaAccount secondAccount = accountsCreated[1];
    assertEq(secondAccount.llamaExecutor(), address(llamaInstanceExecutor));
    assertEq(
      keccak256(abi.encodePacked(secondAccount.name())), // Encode to compare.
      keccak256("MP Grants")
    );

    LlamaPolicy policy = llamaInstance.policy();
    assertEq(policy.numRoles(), 8);

    address initRoleHolder = makeAddr("actionCreatorAaron");
    assertEq(policy.hasRole(initRoleHolder, ACTION_CREATOR_ROLE_ID), true);
    PolicyholderCheckpoints.History memory balances = policy
      .roleBalanceCheckpoints(initRoleHolder, ACTION_CREATOR_ROLE_ID);
    PolicyholderCheckpoints.Checkpoint memory checkpoint = balances
      ._checkpoints[0];
    assertEq(checkpoint.expiration, type(uint64).max);
    assertEq(checkpoint.quantity, 1);

    bytes32 permissionId = lens.computePermissionId(
      PermissionData(
        address(secondAccount), // target
        LlamaAccount.transferERC20.selector, // selector
        thirdStrategy // strategy
      )
    );
    assertTrue(policy.canCreateAction(ACTION_CREATOR_ROLE_ID, permissionId));
  }

  function test_NewInstanceHasRolesInitialized() public {
    vm.expectEmit();
    emit RoleInitialized(0, RoleDescription.wrap("All Holders"));
    vm.expectEmit();
    emit RoleInitialized(1, RoleDescription.wrap("ActionCreator"));
    vm.expectEmit();
    emit RoleInitialized(2, RoleDescription.wrap("Approver"));
    vm.expectEmit();
    emit RoleInitialized(3, RoleDescription.wrap("Disapprover"));
    vm.expectEmit();
    emit RoleInitialized(4, RoleDescription.wrap("ForceApprover"));
    vm.expectEmit();
    emit RoleInitialized(5, RoleDescription.wrap("ForceDisapprover"));
    vm.expectEmit();
    emit RoleInitialized(6, RoleDescription.wrap("TestRole1"));
    vm.expectEmit();
    emit RoleInitialized(7, RoleDescription.wrap("TestRole2"));
    vm.expectEmit();
    emit RoleInitialized(8, RoleDescription.wrap("MadeUpRole"));

    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "absoluteLlamaInstance.json"
    );
  }
}
