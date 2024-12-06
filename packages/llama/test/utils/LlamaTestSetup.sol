// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/Script.sol";

import {MockProtocol} from "@llama/test/mock/MockProtocol.sol";
import {MockScript} from "@llama/test/mock/MockScript.sol";

import {DeployLlamaFactory} from "@llama/script/DeployLlamaFactory.s.sol";
import {DeployLlamaInstance} from "@llama/script/DeployLlamaInstance.s.sol";
import {DeployUtils} from "@llama/script/DeployUtils.sol";

import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {ILlamaPolicyMetadata} from "@llama/src/interfaces/ILlamaPolicyMetadata.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionInfo, PermissionData, RoleHolderData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

// Used for readability of tests, so they can be accessed with e.g. `uint8(Roles.ActionCreator)`.
enum Roles {
  AllHolders,
  ActionCreator,
  Approver,
  Disapprover,
  ForceApprover,
  ForceDisapprover,
  TestRole1,
  TestRole2,
  MadeUpRole
}

contract LlamaTestSetup is DeployLlamaFactory, DeployLlamaInstance, Test {
  using stdJson for string;

  // The actual length of the Roles enum is type(Roles).max *plus* 1 because
  // enums are zero-indexed. However, because we don't actually initialize the
  // "AllHolders" role listed in the enum, this ends up being the correct number
  // of roles.
  uint8 public constant NUM_INIT_ROLES = uint8(type(Roles).max);

  uint8 public constant BOOTSTRAP_ROLE = 1;

  // This is the address that we're using with the CreateAction script to
  // automate action creation to deploy new llamaCore instances. It could be
  // replaced with any address that we hold the private key for.
  address LLAMA_INSTANCE_DEPLOYER = 0x3d9fEa8AeD0249990133132Bb4BC8d07C6a8259a;

  // As part of our test setup we deploy two mock llama instances.
  // This first instance we deploy is prefixed with "root", but it is an independent,
  // standalone instance like all others. It could have been named "first instance" as well.
  LlamaCore rootCore;
  LlamaExecutor rootExecutor;
  LlamaPolicy rootPolicy;
  ILlamaPolicyMetadata rootPolicyMetadata;
  ILlamaStrategy rootStrategy1;
  ILlamaStrategy rootStrategy2;
  ILlamaAccount rootAccount1;
  ILlamaAccount rootAccount2;

  // Mock protocol's (mp) llama instance.
  LlamaCore mpCore;
  LlamaExecutor mpExecutor;
  LlamaPolicy mpPolicy;
  ILlamaPolicyMetadata mpPolicyMetadata;
  ILlamaStrategy mpBootstrapStrategy;
  ILlamaStrategy mpStrategy1;
  ILlamaStrategy mpStrategy2;
  ILlamaAccount mpAccount1;
  ILlamaAccount mpAccount2;

  // Mock protocol for action targets.
  MockProtocol public mockProtocol;

  // Mock script for action targets.
  MockScript public mockScript;

  // Root llama action creator.
  address rootLlamaActionCreator;
  uint256 rootLlamaActionCreatorPrivateKey;

  // Mock protocol users.
  address actionCreatorAaron;
  uint256 actionCreatorAaronPrivateKey;

  address approverAdam;
  uint256 approverAdamPrivateKey;
  address approverAlicia;
  uint256 approverAliciaPrivateKey;
  address approverAndy;
  uint256 approverAndyPrivateKey;

  address disapproverDave;
  uint256 disapproverDavePrivateKey;
  address disapproverDiane;
  uint256 disapproverDianePrivateKey;
  address disapproverDrake;
  uint256 disapproverDrakePrivateKey;

  // Constants.
  uint256 SELF_TOKEN_ID = uint256(uint160(address(this)));

  // Function selectors used in tests.
  bytes4 public constant PAUSE_SELECTOR = 0x02329a29; // pause(bool)
  bytes4 public constant FAIL_SELECTOR = 0xa9cc4718; // fail()
  bytes4 public constant RECEIVE_ETH_SELECTOR = 0x4185f8eb; // receiveEth()
  bytes4 public constant EXECUTE_ACTION_SELECTOR =
    LlamaCore.executeAction.selector;
  bytes4 public constant AUTHORIZE_SCRIPT_SELECTOR =
    LlamaCore.setScriptAuthorization.selector;
  bytes4 public constant CREATE_STRATEGY_SELECTOR = 0x0f47de5a; // createStrategies(address,bytes[])
  bytes4 public constant CREATE_ACCOUNT_SELECTOR = 0x90010bb0; // createAccounts(address,bytes[])
  bytes4 public constant EXECUTE_SCRIPT_SELECTOR = 0x2eec6087; // executeScript()
  bytes4 public constant EXECUTE_SCRIPT_WITH_VALUE_SELECTOR = 0xcf62157f; // executeScriptWithValue()
  bytes4 public constant SET_ROLE_PERMISSION_SELECTOR =
    LlamaPolicy.setRolePermission.selector;

  // Permission data for those selectors.
  PermissionData pausePermission;
  PermissionData failPermission;
  PermissionData receiveEthPermission;
  PermissionData executeAction;
  PermissionData setScriptAuthorization;
  PermissionData createStrategy;
  PermissionData createAccount;
  PermissionData pausePermission2;
  PermissionData executeScriptPermission;
  PermissionData executeScriptWithValuePermission;

  // Permission IDs for the permission data.
  bytes32 pausePermissionId;
  bytes32 failPermissionId;
  bytes32 receiveEthPermissionId;
  bytes32 executeActionId;
  bytes32 setScriptAuthorizationId;
  bytes32 createStrategyId;
  bytes32 createAccountId;
  bytes32 pausePermissionId2;
  bytes32 executeScriptPermissionId;
  bytes32 executeScriptWithValuePermissionId;

  // Other addresses and constants.
  address payable randomLogicAddress = payable(makeAddr("randomLogicAddress"));
  uint96 DEFAULT_ROLE_QTY = 1;
  uint96 EMPTY_ROLE_QTY = 0;
  uint64 DEFAULT_ROLE_EXPIRATION = type(uint64).max;

  string deployScriptInput;
  string createActionScriptInput;

  function setUp() public virtual {
    // Setting up user addresses and private keys.
    (rootLlamaActionCreator, rootLlamaActionCreatorPrivateKey) = makeAddrAndKey(
      "rootLlamaActionCreator"
    );
    (actionCreatorAaron, actionCreatorAaronPrivateKey) = makeAddrAndKey(
      "actionCreatorAaron"
    );
    (approverAdam, approverAdamPrivateKey) = makeAddrAndKey("approverAdam");
    (approverAlicia, approverAliciaPrivateKey) = makeAddrAndKey(
      "approverAlicia"
    );
    (approverAndy, approverAndyPrivateKey) = makeAddrAndKey("approverAndy");
    (disapproverDave, disapproverDavePrivateKey) = makeAddrAndKey(
      "disapproverDave"
    );
    (disapproverDiane, disapproverDianePrivateKey) = makeAddrAndKey(
      "disapproverDiane"
    );
    (disapproverDrake, disapproverDrakePrivateKey) = makeAddrAndKey(
      "disapproverDrake"
    );

    // We use input from the deploy scripts to bootstrap our test suite.
    deployScriptInput = DeployUtils.readScriptInput(
      "deployRootLlamaInstance.json"
    );
    createActionScriptInput = DeployUtils.readScriptInput(
      "deployLlamaInstance.json"
    );

    // Deploy the factory
    DeployLlamaFactory.run();

    // Deploy the root Llama instance and set the instance variables
    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "deployRootLlamaInstance.json"
    );
    rootCore = core;
    rootExecutor = rootCore.executor();
    rootPolicy = rootCore.policy();
    rootPolicyMetadata = rootPolicy.llamaPolicyMetadata();

    // Now we deploy a mock protocol's llama, again with a single action creator role.
    bytes[] memory mpAccounts = accountConfigsLlamaInstance();
    bytes[] memory rootStrategyConfigs = strategyConfigsRootLlama();
    bytes[] memory instanceStrategyConfigs = strategyConfigsLlamaInstance();
    bytes[] memory rootAccounts = accountConfigsRootLlama();

    // Deploy the root Llama instance and set the instance variables
    DeployLlamaInstance.run(
      LLAMA_INSTANCE_DEPLOYER,
      "deployLlamaInstance.json"
    );
    mpCore = core;
    mpPolicy = mpCore.policy();
    mpExecutor = mpCore.executor();
    mpPolicyMetadata = mpPolicy.llamaPolicyMetadata();

    // Set llama account addresses.
    rootAccount1 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      rootAccounts[0],
      address(rootCore)
    );
    rootAccount2 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      rootAccounts[1],
      address(rootCore)
    );
    mpAccount1 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      mpAccounts[0],
      address(mpCore)
    );
    mpAccount2 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      mpAccounts[1],
      address(mpCore)
    );

    // Add approvers and disapprovers to the mock protocol's llama.
    vm.startPrank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.ActionCreator),
      actionCreatorAaron,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.Approver),
      approverAdam,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.Approver),
      approverAlicia,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.Approver),
      approverAndy,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.Disapprover),
      disapproverDave,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.Disapprover),
      disapproverDiane,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    mpPolicy.setRoleHolder(
      uint8(Roles.Disapprover),
      disapproverDrake,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    vm.stopPrank();

    // With the mock protocol's llama instance deployed, we deploy the mock protocol.
    mockProtocol = new MockProtocol(address(mpExecutor));

    // Deploy the mock script
    mockScript = new MockScript();

    // Set strategy and account addresses.
    // NOTE: We ignore index 0, which was added later in development as part of the bootstrap safety
    // check, but it's not part of the main test suite.
    rootStrategy1 = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      rootStrategyConfigs[1],
      address(rootCore)
    );
    rootStrategy2 = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      rootStrategyConfigs[2],
      address(rootCore)
    );
    mpBootstrapStrategy = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      instanceStrategyConfigs[0],
      address(mpCore)
    );
    mpStrategy1 = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      instanceStrategyConfigs[1],
      address(mpCore)
    );
    mpStrategy2 = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      instanceStrategyConfigs[2],
      address(mpCore)
    );

    // Set llama account addresses.
    rootAccount1 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      rootAccounts[0],
      address(rootCore)
    );
    rootAccount2 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      rootAccounts[1],
      address(rootCore)
    );
    mpAccount1 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      mpAccounts[0],
      address(mpCore)
    );
    mpAccount2 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      mpAccounts[1],
      address(mpCore)
    );

    // With the protocol deployed, we can set permission data .
    pausePermission = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      mpStrategy1
    );
    failPermission = PermissionData(
      address(mockProtocol),
      FAIL_SELECTOR,
      mpStrategy1
    );
    receiveEthPermission = PermissionData(
      address(mockProtocol),
      RECEIVE_ETH_SELECTOR,
      mpStrategy1
    );
    executeAction = PermissionData(
      address(mpCore),
      EXECUTE_ACTION_SELECTOR,
      mpStrategy1
    );
    setScriptAuthorization = PermissionData(
      address(mpCore),
      AUTHORIZE_SCRIPT_SELECTOR,
      mpStrategy1
    );
    createStrategy = PermissionData(
      address(mpCore),
      CREATE_STRATEGY_SELECTOR,
      mpStrategy1
    );
    createAccount = PermissionData(
      address(mpCore),
      CREATE_ACCOUNT_SELECTOR,
      mpStrategy1
    );
    pausePermission2 = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      mpStrategy2
    );
    executeScriptPermission = PermissionData(
      address(mockScript),
      EXECUTE_SCRIPT_SELECTOR,
      mpStrategy1
    );
    executeScriptWithValuePermission = PermissionData(
      address(mockScript),
      EXECUTE_SCRIPT_WITH_VALUE_SELECTOR,
      mpStrategy1
    );

    // With the protocol deployed, we can set special permissions.
    pausePermissionId = keccak256(abi.encode(pausePermission));
    failPermissionId = keccak256(abi.encode(failPermission));
    receiveEthPermissionId = keccak256(abi.encode(receiveEthPermission));
    executeActionId = keccak256(abi.encode(executeAction));
    setScriptAuthorizationId = keccak256(abi.encode(setScriptAuthorization));
    createStrategyId = keccak256(abi.encode(createStrategy));
    createAccountId = keccak256(abi.encode(createAccount));
    pausePermissionId2 = keccak256(abi.encode(pausePermission2));
    executeScriptPermissionId = keccak256(abi.encode(executeScriptPermission));
    executeScriptWithValuePermissionId = keccak256(
      abi.encode(executeScriptWithValuePermission)
    );

    vm.startPrank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      pausePermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      failPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      receiveEthPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      setScriptAuthorization,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      executeScriptPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      executeScriptWithValuePermission,
      true
    );
    mpPolicy.setRolePermission(uint8(Roles.TestRole2), executeAction, true);
    mpPolicy.setRolePermission(uint8(Roles.TestRole2), createStrategy, true);
    mpPolicy.setRolePermission(uint8(Roles.TestRole2), createAccount, true);
    mpPolicy.setRolePermission(uint8(Roles.TestRole2), pausePermission2, true);
    mpPolicy.setRolePermission(
      uint8(Roles.TestRole2),
      executeScriptPermission,
      true
    );
    mpPolicy.setRolePermission(
      uint8(Roles.TestRole2),
      executeScriptWithValuePermission,
      true
    );
    vm.stopPrank();

    // Skip forward one block so the most recent checkpoints are in the past.
    mineBlock();

    // Verify that all storage variables were initialized. Standard assertions are in `setUp` are
    // not well supported by the Forge test runner, so we use require statements instead.
    require(address(0) != address(coreLogic), "coreLogic not set");
    require(
      address(0) != address(relativeHolderQuorumLogic),
      "relativeHolderQuorumLogic not set"
    );
    require(
      address(0) != address(relativeQuantityQuorumLogic),
      "relativeQuantityQuorumLogic not set"
    );
    require(address(0) != address(accountLogic), "accountLogic not set");
    require(address(0) != address(policyLogic), "policyLogic not set");

    require(address(0) != address(factory), "factory not set");
    require(address(0) != address(lens), "lens not set");

    require(address(0) != address(rootCore), "rootCore not set");
    require(address(0) != address(rootPolicy), "rootPolicy not set");
    require(address(0) != address(rootStrategy1), "rootStrategy1 not set");
    require(address(0) != address(rootStrategy2), "rootStrategy2 not set");
    require(address(0) != address(rootAccount1), "rootAccount1 not set");
    require(address(0) != address(rootAccount2), "rootAccount2 not set");

    require(address(0) != address(mockProtocol), "mockProtocol not set");
    require(address(0) != address(mpCore), "mpCore not set");
    require(address(0) != address(mpExecutor), "mpExecutor not set");
    require(address(0) != address(mpPolicy), "mpPolicy not set");
    require(address(0) != address(mpStrategy1), "mpStrategy1 not set");
    require(address(0) != address(mpStrategy2), "mpStrategy2 not set");
    require(address(0) != address(mpAccount1), "mpAccount1 not set");
    require(address(0) != address(mpAccount2), "mpAccount2 not set");

    require(bytes32(0) != pausePermissionId, "pausePermissionId not set");
    require(bytes32(0) != failPermissionId, "failPermissionId not set");
    require(
      bytes32(0) != receiveEthPermissionId,
      "receiveEthPermissionId not set"
    );
    require(bytes32(0) != executeActionId, "executeActionId not set");
    require(
      bytes32(0) != setScriptAuthorizationId,
      "setScriptAuthorizationId not set"
    );
    require(bytes32(0) != createStrategyId, "createStrategyId not set");
    require(bytes32(0) != createAccountId, "createAccountId not set");
    require(
      bytes32(0) != executeScriptPermissionId,
      "executeScriptPermissionId not set"
    );
    require(
      bytes32(0) != executeScriptWithValuePermissionId,
      "executeScriptWithValuePermissionId not set"
    );

    require(
      BOOTSTRAP_ROLE == uint8(Roles.ActionCreator),
      "test suite bootstrap config mismatch"
    );
  }

  function defaultActionCreatorRoleHolder(
    address who
  ) internal view returns (RoleHolderData[] memory roleHolders) {
    roleHolders = new RoleHolderData[](1);
    roleHolders[0] = RoleHolderData(
      uint8(Roles.ActionCreator),
      who,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
  }

  function strategyConfigsRootLlama() internal view returns (bytes[] memory) {
    return DeployUtils.readStrategies(deployScriptInput);
  }

  function strategyConfigsLlamaInstance()
    internal
    view
    returns (bytes[] memory)
  {
    return DeployUtils.readStrategies(createActionScriptInput);
  }

  function accountConfigsRootLlama() internal view returns (bytes[] memory) {
    return DeployUtils.readAccounts(deployScriptInput);
  }

  function accountConfigsLlamaInstance()
    internal
    view
    returns (bytes[] memory)
  {
    return DeployUtils.readAccounts(createActionScriptInput);
  }

  function rootLlamaRoleDescriptions()
    internal
    view
    returns (RoleDescription[] memory)
  {
    return DeployUtils.readRoleDescriptions(deployScriptInput);
  }

  function infoHash(
    ActionInfo memory actionInfo
  ) internal pure returns (bytes32) {
    return
      infoHash(
        actionInfo.id,
        actionInfo.creator,
        actionInfo.strategy,
        actionInfo.target,
        actionInfo.value,
        actionInfo.data
      );
  }

  function infoHash(
    uint256 id,
    address creator,
    ILlamaStrategy strategy,
    address target,
    uint256 value,
    bytes memory data
  ) internal pure returns (bytes32) {
    return
      keccak256(abi.encodePacked(id, creator, strategy, target, value, data));
  }

  function toUint96(uint256 n) internal pure returns (uint96) {
    require(
      n <= type(uint96).max,
      string.concat("Value cannot fit in a uint96: ", vm.toString(n))
    );
    return uint96(n);
  }

  function toUint64(uint256 n) internal pure returns (uint64) {
    require(
      n <= type(uint64).max,
      string.concat("Value cannot fit in a uint64: ", vm.toString(n))
    );
    return uint64(n);
  }

  function toUint16(uint256 n) internal pure returns (uint16) {
    require(
      n <= type(uint16).max,
      string.concat("Value cannot fit in a uint16: ", vm.toString(n))
    );
    return uint16(n);
  }

  function mineBlock() internal {
    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 1);
  }

  function assertEqStrategyStatus(
    LlamaCore core,
    ILlamaStrategy strategy,
    bool expectedDeployed,
    bool expectedAuthorized
  ) internal view {
    (bool deployed, bool authorized) = core.strategies(strategy);
    assertEq(deployed, expectedDeployed);
    assertEq(authorized, expectedAuthorized);
  }
}
