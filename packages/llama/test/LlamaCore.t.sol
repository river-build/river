// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2, StdStorage, stdStorage} from "forge-std/Test.sol";

import {MockAccountLogicContract} from "@llama/test/mock/MockAccountLogicContract.sol";
import {MockActionGuard} from "@llama/test/mock/MockActionGuard.sol";
import {MockAtomicActionExecutor} from "@llama/test/mock/MockAtomicActionExecutor.sol";
import {MockPoorlyImplementedAbsolutePeerReview} from "@llama/test/mock/MockPoorlyImplementedStrategy.sol";
import {MockProtocol} from "@llama/test/mock/MockProtocol.sol";
import {LlamaCoreSigUtils} from "@llama/test/utils/LlamaCoreSigUtils.sol";
import {LlamaFactoryWithoutInitialization} from "@llama/test/utils/LlamaFactoryWithoutInitialization.sol";
import {LlamaStrategyTestSetup} from "@llama/test/strategies/LlamaStrategyTestSetup.sol";
import {Roles} from "@llama/test/utils/LlamaTestSetup.sol";

import {DeployUtils} from "@llama/script/DeployUtils.sol";

import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {ILlamaActionGuard} from "@llama/src/interfaces/ILlamaActionGuard.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionState} from "@llama/src/lib/Enums.sol";
import {Action, ActionInfo, LlamaInstanceConfig, LlamaPolicyConfig, PermissionData, RoleHolderData, RolePermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";
import {LlamaRelativeHolderQuorum} from "@llama/src/strategies/relative/LlamaRelativeHolderQuorum.sol";
import {LlamaRelativeStrategyBase} from "@llama/src/strategies/relative/LlamaRelativeStrategyBase.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Errors} from "@openzeppelin/contracts/utils/Errors.sol";

contract LlamaCoreTest is LlamaStrategyTestSetup, LlamaCoreSigUtils {
  string constant COLOR = "#FF0420";
  string constant LOGO =
    '<g fill="#FF0420"><path d="M44.876 462c-3.783 0-6.883-.881-9.3-2.645-2.384-1.794-3.576-4.344-3.576-7.65 0-.692.08-1.542.238-2.55.414-2.266 1.002-4.989 1.765-8.169C36.165 432.329 41.744 428 50.742 428c2.448 0 4.641.409 6.58 1.228 1.94.787 3.466 1.983 4.579 3.589 1.112 1.574 1.669 3.463 1.669 5.666 0 .661-.08 1.496-.239 2.503a106.077 106.077 0 0 1-1.716 8.169c-1.113 4.314-3.037 7.54-5.77 9.681-2.735 2.109-6.39 3.164-10.97 3.164Zm.668-6.8c1.78 0 3.29-.52 4.53-1.558 1.272-1.039 2.178-2.629 2.718-4.77.731-2.959 1.288-5.541 1.67-7.744.127-.661.19-1.338.19-2.031 0-2.865-1.51-4.297-4.53-4.297-1.78 0-3.307.519-4.578 1.558-1.24 1.039-2.13 2.629-2.671 4.77-.572 2.109-1.145 4.691-1.717 7.744-.127.63-.19 1.291-.19 1.983 0 2.897 1.526 4.345 4.578 4.345ZM68.409 461.528c-.35 0-.62-.11-.81-.331a1.12 1.12 0 0 1-.144-.85l6.581-30.694c.064-.347.239-.63.525-.85.286-.221.588-.331.906-.331h12.685c3.529 0 6.358.724 8.489 2.172 2.161 1.449 3.242 3.542 3.242 6.281 0 .787-.095 1.605-.286 2.455-.795 3.621-2.4 6.297-4.816 8.028-2.385 1.732-5.66 2.597-9.824 2.597h-6.438l-2.194 10.342a1.35 1.35 0 0 1-.524.85c-.287.221-.588.331-.907.331H68.41Zm16.882-18.039c1.335 0 2.495-.362 3.48-1.086 1.018-.724 1.686-1.763 2.004-3.117a8.185 8.185 0 0 0 .143-1.417c0-.913-.27-1.605-.81-2.077-.541-.504-1.463-.756-2.767-.756H81.62l-1.813 8.453h5.485ZM110.628 461.528c-.349 0-.62-.11-.81-.331-.191-.252-.255-.535-.191-.85l5.293-24.461h-8.488c-.35 0-.62-.11-.811-.33a1.12 1.12 0 0 1-.143-.851l1.097-5.052c.063-.347.238-.63.524-.85.286-.221.588-.331.906-.331h25.657c.35 0 .62.11.811.331.127.189.19.378.19.566a.909.909 0 0 1-.047.284l-1.097 5.052c-.064.347-.239.63-.525.851-.254.22-.556.33-.906.33h-8.441l-5.293 24.461c-.064.346-.239.63-.525.85-.286.221-.588.331-.906.331h-6.295ZM135.88 461.528c-.35 0-.62-.11-.811-.331a1.016 1.016 0 0 1-.191-.85l6.629-30.694a1.35 1.35 0 0 1 .525-.85c.286-.221.588-.331.906-.331h6.438c.349 0 .62.11.81.331.128.189.191.378.191.566a.882.882 0 0 1-.048.284l-6.581 30.694c-.063.346-.238.63-.524.85-.286.221-.588.331-.906.331h-6.438ZM154.038 461.528c-.349 0-.62-.11-.81-.331-.191-.22-.255-.504-.191-.85l6.581-30.694c.064-.347.238-.63.524-.85.287-.221.605-.331.954-.331h5.151c.763 0 1.255.346 1.478 1.039l5.198 14.875 11.588-14.875c.159-.252.382-.488.668-.708.318-.221.7-.331 1.145-.331h5.198c.349 0 .62.11.81.331.127.189.191.378.191.566a.882.882 0 0 1-.048.284l-6.581 30.694c-.063.346-.238.63-.524.85-.286.221-.588.331-.906.331h-5.771c-.349 0-.62-.11-.81-.331a1.118 1.118 0 0 1-.143-.85l3.719-17.425-7.296 9.586c-.318.347-.62.614-.906.803-.286.189-.62.283-1.002.283h-2.479c-.668 0-1.129-.362-1.383-1.086l-3.386-10.011-3.815 17.85c-.064.346-.239.63-.525.85-.286.221-.588.331-.906.331h-5.723ZM196.132 461.528c-.35 0-.62-.11-.81-.331-.191-.252-.255-.535-.191-.85l6.628-30.694a1.35 1.35 0 0 1 .525-.85c.285-.221.588-.331.906-.331h6.438c.35 0 .62.11.811.331.127.189.19.378.19.566a.88.88 0 0 1-.047.284l-6.581 30.694c-.063.346-.238.63-.525.85a1.46 1.46 0 0 1-.907.331h-6.437ZM226.07 462c-2.798 0-5.198-.378-7.201-1.133-1.972-.756-3.466-1.763-4.483-3.022-.986-1.26-1.479-2.661-1.479-4.203 0-.252.033-.63.095-1.134.065-.283.193-.519.383-.708.223-.189.476-.283.763-.283h6.103c.383 0 .668.063.859.188.222.126.445.347.668.662.223.818.731 1.495 1.526 2.03.827.535 1.955.803 3.385.803 1.812 0 3.276-.283 4.388-.85 1.113-.567 1.781-1.338 2.002-2.314a2.42 2.42 0 0 0 .048-.566c0-.788-.491-1.401-1.477-1.842-.986-.473-2.798-1.023-5.437-1.653-3.084-.661-5.421-1.653-7.011-2.975-1.589-1.354-2.383-3.117-2.383-5.289 0-.755.095-1.527.286-2.314.635-2.928 2.21-5.226 4.72-6.894 2.544-1.669 5.818-2.503 9.825-2.503 2.415 0 4.563.425 6.438 1.275 1.875.85 3.321 1.936 4.34 3.258 1.049 1.291 1.572 2.582 1.572 3.873 0 .377-.015.645-.047.802-.063.284-.206.52-.429.709a.975.975 0 0 1-.715.283h-6.391c-.698 0-1.176-.268-1.429-.803-.033-.724-.415-1.338-1.146-1.841-.731-.504-1.685-.756-2.861-.756-1.399 0-2.559.252-3.482.756-.889.503-1.447 1.243-1.668 2.219a3.172 3.172 0 0 0-.049.614c0 .755.445 1.385 1.336 1.889.922.472 2.528.96 4.816 1.464 3.562.692 6.153 1.684 7.774 2.975 1.653 1.29 2.479 3.006 2.479 5.147 0 .724-.095 1.511-.286 2.361-.698 3.211-2.4 5.651-5.103 7.32-2.669 1.636-6.246 2.455-10.729 2.455ZM248.515 461.528c-.35 0-.62-.11-.81-.331-.191-.22-.255-.504-.191-.85l6.581-30.694c.063-.347.238-.63.525-.85.286-.221.604-.331.954-.331h5.149c.763 0 1.256.346 1.479 1.039l5.199 14.875 11.587-14.875c.16-.252.382-.488.668-.708.318-.221.699-.331 1.144-.331h5.199c.35 0 .62.11.811.331.127.189.19.378.19.566a.856.856 0 0 1-.048.284l-6.58 30.694c-.065.346-.24.63-.526.85a1.456 1.456 0 0 1-.906.331h-5.769c-.351 0-.621-.11-.811-.331a1.109 1.109 0 0 1-.143-.85l3.719-17.425-7.296 9.586c-.318.347-.62.614-.906.803a1.776 1.776 0 0 1-1.001.283h-2.481c-.668 0-1.128-.362-1.382-1.086l-3.386-10.011-3.815 17.85a1.36 1.36 0 0 1-.525.85c-.286.221-.588.331-.906.331h-5.723Z"/></g>';

  event AccountCreated(
    ILlamaAccount account,
    ILlamaAccount indexed accountLogic,
    bytes initializationData
  );
  event AccountLogicAuthorizationSet(
    ILlamaAccount indexed accountLogic,
    bool authorized
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
  event ActionCanceled(uint256 id, address indexed caller);
  event ActionQueued(
    uint256 id,
    address indexed caller,
    ILlamaStrategy indexed strategy,
    address indexed creator,
    uint256 executionTime
  );
  event ActionExecuted(
    uint256 id,
    address indexed caller,
    ILlamaStrategy indexed strategy,
    address indexed creator,
    bytes result
  );
  event ApprovalCast(
    uint256 id,
    address indexed policyholder,
    uint8 indexed role,
    uint256 quantity,
    string reason
  );
  event DisapprovalCast(
    uint256 id,
    address indexed policyholder,
    uint8 indexed role,
    uint256 quantity,
    string reason
  );
  event ScriptAuthorizationSet(address indexed script, bool authorized);
  event ScriptExecutedWithValue(uint256 value);
  event StrategyAuthorizationSet(
    ILlamaStrategy indexed strategy,
    bool authorized
  );
  event StrategyCreated(
    ILlamaStrategy strategy,
    ILlamaStrategy indexed strategyLogic,
    bytes initializationData
  );
  event StrategyLogicAuthorizationSet(
    ILlamaStrategy indexed strategyLogic,
    bool authorized
  );

  // We use this to easily generate, save off, and pass around `ActionInfo` structs.
  // mapping (uint256 actionId => ActionInfo) actionInfo;

  function setUp() public virtual override {
    LlamaStrategyTestSetup.setUp();

    // Setting Mock Protocol Core's EIP-712 Domain Hash
    setDomainHash(
      LlamaCoreSigUtils.EIP712Domain({
        name: mpCore.name(),
        version: "1",
        chainId: block.chainid,
        verifyingContract: address(mpCore)
      })
    );
  }

  // =========================
  // ======== Helpers ========
  // =========================

  function _createAction() public returns (ActionInfo memory actionInfo) {
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));
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

  function _approveAction(
    address _policyholder,
    ActionInfo memory actionInfo
  ) public {
    vm.expectEmit();
    emit ApprovalCast(
      actionInfo.id,
      _policyholder,
      uint8(Roles.Approver),
      1,
      ""
    );
    vm.prank(_policyholder);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
  }

  function _disapproveAction(
    address _policyholder,
    ActionInfo memory actionInfo
  ) public {
    vm.expectEmit();
    emit DisapprovalCast(
      actionInfo.id,
      _policyholder,
      uint8(Roles.Disapprover),
      1,
      ""
    );
    vm.prank(_policyholder);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");
  }

  function _queueAction(ActionInfo memory actionInfo) public {
    uint256 executionTime = block.timestamp +
      toRelativeQuorum(mpStrategy1).queuingPeriod();
    vm.expectEmit();
    emit ActionQueued(
      actionInfo.id,
      address(this),
      mpStrategy1,
      actionCreatorAaron,
      executionTime
    );
    mpCore.queueAction(actionInfo);
  }

  function _executeAction(ActionInfo memory actionInfo) public {
    vm.expectEmit();
    emit ActionExecuted(
      actionInfo.id,
      address(this),
      actionInfo.strategy,
      actionInfo.creator,
      bytes("")
    );
    mpCore.executeAction(actionInfo);

    Action memory action = mpCore.getAction(actionInfo.id);
    assertEq(action.executed, true);
  }

  function _executeCompleteActionFlow()
    internal
    returns (ActionInfo memory actionInfo)
  {
    actionInfo = _createAction();

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), true);
    _queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    _executeAction(actionInfo);
  }

  function _deployAndAuthorizeAdditionalStrategyLogic()
    internal
    returns (ILlamaStrategy)
  {
    LlamaRelativeHolderQuorum additionalStrategyLogic = new LlamaRelativeHolderQuorum();
    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(additionalStrategyLogic, true);
    return additionalStrategyLogic;
  }

  function _deployAndAuthorizeAdditionalAccountLogic()
    internal
    returns (ILlamaAccount)
  {
    LlamaAccount additionalAccountLogic = new LlamaAccount();
    vm.prank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(additionalAccountLogic, true);
    return additionalAccountLogic;
  }

  function _deployAndAuthorizeMockAccountLogic()
    internal
    returns (ILlamaAccount)
  {
    MockAccountLogicContract mockAccountLogic = new MockAccountLogicContract();
    vm.prank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(mockAccountLogic, true);
    return mockAccountLogic;
  }

  function _createStrategy(
    uint256 salt,
    bool isFixedLengthApprovalPeriod
  ) internal pure returns (LlamaRelativeStrategyBase.Config memory) {
    return
      LlamaRelativeStrategyBase.Config({
        approvalPeriod: toUint64(salt % 1000 days),
        queuingPeriod: toUint64(salt % 1001 days),
        expirationPeriod: toUint64(salt % 1002 days),
        isFixedLengthApprovalPeriod: isFixedLengthApprovalPeriod,
        minApprovalPct: toUint16(salt % 10_000),
        minDisapprovalPct: toUint16(salt % 10_100),
        approvalRole: uint8(Roles.Approver),
        disapprovalRole: uint8(Roles.Disapprover),
        forceApprovalRoles: new uint8[](0),
        forceDisapprovalRoles: new uint8[](0)
      });
  }

  function deployMockPoorStrategyAndCreatePermission()
    internal
    returns (ILlamaStrategy newStrategy)
  {
    ILlamaStrategy mockStrategyLogic = new MockPoorlyImplementedAbsolutePeerReview();

    LlamaAbsoluteStrategyBase.Config
      memory strategyConfig = LlamaAbsoluteStrategyBase.Config({
        approvalPeriod: 1 days,
        queuingPeriod: 1 days,
        expirationPeriod: 1 days,
        isFixedLengthApprovalPeriod: false,
        minApprovals: 2,
        minDisapprovals: 2,
        approvalRole: uint8(Roles.Approver),
        disapprovalRole: uint8(Roles.Approver),
        forceApprovalRoles: new uint8[](0),
        forceDisapprovalRoles: new uint8[](0)
      });

    LlamaAbsoluteStrategyBase.Config[]
      memory strategyConfigs = new LlamaAbsoluteStrategyBase.Config[](1);
    strategyConfigs[0] = strategyConfig;

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(mockStrategyLogic, true);

    vm.prank(address(mpExecutor));

    mpCore.createStrategies(
      mockStrategyLogic,
      DeployUtils.encodeStrategyConfigs(strategyConfigs)
    );

    newStrategy = lens.computeLlamaStrategyAddress(
      address(mockStrategyLogic),
      DeployUtils.encodeStrategy(strategyConfig),
      address(mpCore)
    );

    PermissionData memory newPermissionData = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      newStrategy
    );
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      newPermissionData,
      true
    );
  }

  function createActionUsingAbsolutePeerReview(
    ILlamaStrategy testStrategy
  ) internal returns (ActionInfo memory actionInfo) {
    // Give the action creator the ability to use this strategy.
    PermissionData memory newPermissionData = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      testStrategy
    );
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      newPermissionData,
      true
    );

    // Create the action.
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      testStrategy,
      address(mockProtocol),
      0,
      data,
      ""
    );

    actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      testStrategy,
      address(mockProtocol),
      0,
      data
    );

    vm.warp(block.timestamp + 1);
  }

  function _createApproveAndQueueAction()
    internal
    returns (ActionInfo memory actionInfo)
  {
    actionInfo = _createAction();
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), true);
    _queueAction(actionInfo);
  }
}

contract Setup is LlamaCoreTest {
  function test_setUp() public {
    assertEq(mpCore.name(), "Mock Protocol Llama");
    assertEq(address(mpCore.policy()), address(mpPolicy));

    assertEqStrategyStatus(mpCore, mpStrategy1, true, true);
    assertEqStrategyStatus(mpCore, mpStrategy2, true, true);

    vm.expectRevert(Initializable.InvalidInitialization.selector);
    mpAccount1.initialize("LlamaAccount0");

    vm.expectRevert(Initializable.InvalidInitialization.selector);
    mpAccount2.initialize("LlamaAccount1");
  }
}

contract Constructor is LlamaCoreTest {
  function test_RevertIf_InitializeImplementationContract() public {
    vm.expectRevert(Initializable.InvalidInitialization.selector);
    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      new RoleDescription[](0),
      new RoleHolderData[](0),
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory config = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      new bytes[](0),
      new bytes[](0),
      policyConfig
    );
    coreLogic.initialize(config, mpPolicy, policyMetadataLogic);
  }
}

contract Initialize is LlamaCoreTest {
  function deployWithoutInitialization()
    internal
    returns (LlamaFactoryWithoutInitialization modifiedFactory, LlamaCore llama)
  {
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    modifiedFactory = new LlamaFactoryWithoutInitialization(
      coreLogic,
      relativeHolderQuorumLogic,
      accountLogic,
      policyLogic,
      policyMetadataLogic,
      "Root Llama",
      strategyConfigs,
      accounts,
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0)
    );

    (llama) = modifiedFactory.deployWithoutInitialization("NewProject");
  }

  function test_ExecutorIsSetInCore() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaStrategy[] memory strategyAddresses = new ILlamaStrategy[](3);
    for (uint256 i = 0; i < strategyConfigs.length; i++) {
      strategyAddresses[i] = lens.computeLlamaStrategyAddress(
        address(relativeHolderQuorumLogic),
        strategyConfigs[i],
        address(uninitializedLlama)
      );
    }

    LlamaExecutor computedExecutor = lens.computeLlamaExecutorAddress(
      address(uninitializedLlama)
    );
    assertEq(address(uninitializedLlama.executor()), address(0));
    assertEq(address(computedExecutor).code.length, 0);

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    assertEq(address(uninitializedLlama.executor()), address(computedExecutor));
    assertGt(address(computedExecutor).code.length, 0);
  }

  function test_StrategiesAreDeployedAtExpectedAddress() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaStrategy[] memory strategyAddresses = new ILlamaStrategy[](3);
    for (uint256 i = 0; i < strategyConfigs.length; i++) {
      strategyAddresses[i] = lens.computeLlamaStrategyAddress(
        address(relativeHolderQuorumLogic),
        strategyConfigs[i],
        address(uninitializedLlama)
      );
    }

    assertEq(address(strategyAddresses[0]).code.length, 0);
    assertEq(address(strategyAddresses[1]).code.length, 0);

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    assertGt(address(strategyAddresses[0]).code.length, 0);
    assertGt(address(strategyAddresses[1]).code.length, 0);
  }

  function test_EmitsStrategyAuthorizedEventForEachStrategy() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaStrategy[] memory strategyAddresses = new ILlamaStrategy[](3);
    for (uint256 i = 0; i < strategyConfigs.length; i++) {
      strategyAddresses[i] = lens.computeLlamaStrategyAddress(
        address(relativeHolderQuorumLogic),
        strategyConfigs[i],
        address(uninitializedLlama)
      );
    }

    vm.expectEmit();
    emit StrategyAuthorizationSet(strategyAddresses[0], true);
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddresses[0],
      relativeHolderQuorumLogic,
      strategyConfigs[0]
    );

    vm.expectEmit();
    emit StrategyAuthorizationSet(strategyAddresses[1], true);
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddresses[1],
      relativeHolderQuorumLogic,
      strategyConfigs[1]
    );

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);
  }

  function test_StrategiesHaveLlamaCoreAddressInStorage() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaStrategy[] memory strategyAddresses = new ILlamaStrategy[](3);
    for (uint256 i = 0; i < strategyConfigs.length; i++) {
      strategyAddresses[i] = lens.computeLlamaStrategyAddress(
        address(relativeHolderQuorumLogic),
        strategyConfigs[i],
        address(uninitializedLlama)
      );
    }

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    assertEq(
      address(strategyAddresses[0].llamaCore()),
      address(uninitializedLlama)
    );
    assertEq(
      address(strategyAddresses[1].llamaCore()),
      address(uninitializedLlama)
    );
  }

  function test_StrategiesHavePolicyAddressInStorage() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaStrategy[] memory strategyAddresses = new ILlamaStrategy[](3);
    for (uint256 i = 0; i < strategyConfigs.length; i++) {
      strategyAddresses[i] = lens.computeLlamaStrategyAddress(
        address(relativeHolderQuorumLogic),
        strategyConfigs[i],
        address(uninitializedLlama)
      );
    }

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    LlamaPolicy policy = uninitializedLlama.policy();

    assertEq(address(strategyAddresses[0].policy()), address(policy));
    assertEq(address(strategyAddresses[1].policy()), address(policy));
  }

  function test_StrategiesAreAuthorizedByLlamaCore() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaStrategy[] memory strategyAddresses = new ILlamaStrategy[](3);
    for (uint256 i = 0; i < strategyConfigs.length; i++) {
      strategyAddresses[i] = lens.computeLlamaStrategyAddress(
        address(relativeHolderQuorumLogic),
        strategyConfigs[i],
        address(uninitializedLlama)
      );
    }

    assertEqStrategyStatus(
      uninitializedLlama,
      strategyAddresses[0],
      false,
      false
    );
    assertEqStrategyStatus(
      uninitializedLlama,
      strategyAddresses[1],
      false,
      false
    );

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    assertEqStrategyStatus(
      uninitializedLlama,
      strategyAddresses[0],
      true,
      true
    );
    assertEqStrategyStatus(
      uninitializedLlama,
      strategyAddresses[1],
      true,
      true
    );
  }

  function test_SetsLlamaStrategyLogicAddress() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    assertFalse(
      uninitializedLlama.authorizedStrategyLogics(relativeHolderQuorumLogic)
    );

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      ILlamaStrategy(relativeHolderQuorumLogic),
      ILlamaAccount(accountLogic),
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    assertTrue(
      uninitializedLlama.authorizedStrategyLogics(relativeHolderQuorumLogic)
    );
  }

  function test_EmitsStrategyLogicAuthorizedEvent() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,

    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    vm.expectEmit();

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      ILlamaAccount(accountLogic),
      strategyConfigs,
      accounts,
      policyConfig
    );

    emit StrategyLogicAuthorizationSet(relativeHolderQuorumLogic, true);
    modifiedFactory.initialize(instanceConfig);
  }

  function test_SetsLlamaAccountLogicAddress() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    assertFalse(uninitializedLlama.authorizedAccountLogics(accountLogic));

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      ILlamaAccount(accountLogic),
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    assertTrue(uninitializedLlama.authorizedAccountLogics(accountLogic));
  }

  function test_EmitsAccountLogicAuthorizationSetEvent() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,

    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );

    vm.expectEmit();

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      ILlamaAccount(accountLogic),
      strategyConfigs,
      accounts,
      policyConfig
    );

    emit AccountLogicAuthorizationSet(accountLogic, true);
    modifiedFactory.initialize(instanceConfig);
  }

  function test_AccountsAreDeployedAtExpectedAddress() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaAccount[] memory accountAddresses = new ILlamaAccount[](2);
    for (uint256 i; i < accounts.length; i++) {
      accountAddresses[i] = lens.computeLlamaAccountAddress(
        address(accountLogic),
        accounts[i],
        address(uninitializedLlama)
      );
    }

    assertEq(address(accountAddresses[0]).code.length, 0);
    assertEq(address(accountAddresses[1]).code.length, 0);

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    assertGt(address(accountAddresses[0]).code.length, 0);
    assertGt(address(accountAddresses[1]).code.length, 0);
  }

  function test_EmitsAccountCreatedEventForEachAccount() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaAccount[] memory accountAddresses = new ILlamaAccount[](2);
    for (uint256 i; i < accounts.length; i++) {
      accountAddresses[i] = lens.computeLlamaAccountAddress(
        address(accountLogic),
        accounts[i],
        address(uninitializedLlama)
      );
    }

    vm.expectEmit();
    emit AccountCreated(accountAddresses[0], accountLogic, accounts[0]);
    vm.expectEmit();

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    emit AccountCreated(accountAddresses[1], accountLogic, accounts[1]);
    modifiedFactory.initialize(instanceConfig);
  }

  function test_AccountsHaveLlamaExecutorAddressInStorage() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaAccount[] memory accountAddresses = new ILlamaAccount[](2);
    for (uint256 i; i < accounts.length; i++) {
      accountAddresses[i] = lens.computeLlamaAccountAddress(
        address(accountLogic),
        accounts[i],
        address(uninitializedLlama)
      );
    }

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    LlamaExecutor executor = uninitializedLlama.executor();

    assertEq(address(accountAddresses[0].llamaExecutor()), address(executor));
    assertEq(address(accountAddresses[1].llamaExecutor()), address(executor));
  }

  function test_AccountsHaveNameInStorage() public {
    (
      LlamaFactoryWithoutInitialization modifiedFactory,
      LlamaCore uninitializedLlama
    ) = deployWithoutInitialization();
    bytes[] memory strategyConfigs = strategyConfigsRootLlama();
    bytes[] memory accounts = accountConfigsRootLlama();
    RoleHolderData[] memory roleHolders = defaultActionCreatorRoleHolder(
      actionCreatorAaron
    );
    ILlamaAccount[] memory accountAddresses = new ILlamaAccount[](2);
    for (uint256 i; i < accounts.length; i++) {
      accountAddresses[i] = lens.computeLlamaAccountAddress(
        address(accountLogic),
        accounts[i],
        address(uninitializedLlama)
      );
    }

    LlamaPolicyConfig memory policyConfig = LlamaPolicyConfig(
      rootLlamaRoleDescriptions(),
      roleHolders,
      new RolePermissionData[](0),
      COLOR,
      LOGO
    );

    LlamaInstanceConfig memory instanceConfig = LlamaInstanceConfig(
      "NewProject",
      relativeHolderQuorumLogic,
      accountLogic,
      strategyConfigs,
      accounts,
      policyConfig
    );

    modifiedFactory.initialize(instanceConfig);

    assertEq(
      LlamaAccount(payable(address(accountAddresses[0]))).name(),
      "Llama Treasury"
    );
    assertEq(
      LlamaAccount(payable(address(accountAddresses[1]))).name(),
      "Llama Grants"
    );
  }
}

contract CreateAction is LlamaCoreTest {
  bytes data = abi.encodeCall(MockProtocol.pause, (true));

  function test_CreatesAnAction() public {
    vm.expectEmit();
    emit ActionCreated(
      0,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );

    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data
    );
    Action memory action = mpCore.getAction(actionInfo.id);
    uint256 approvalPeriodEnd = toRelativeQuorum(actionInfo.strategy)
      .approvalEndTime(actionInfo);

    assertEq(actionInfo.id, 0);
    assertEq(mpCore.actionsCount(), 1);
    assertEq(action.creationTime, block.timestamp);
    assertEq(approvalPeriodEnd, block.timestamp + 2 days);
    assertEq(
      toRelativeQuorum(actionInfo.strategy).getApprovalSupply(actionInfo),
      3
    );
    assertEq(
      toRelativeQuorum(actionInfo.strategy).getDisapprovalSupply(actionInfo),
      3
    );
  }

  function test_CreatesAnActionWithDescription() public {
    string
      memory description = "# Transfer USDC to service provider \n This action transfers 10,000 USDC to our trusted provider.";
    vm.expectEmit();
    emit ActionCreated(
      0,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      description
    );
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      description
    );

    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data
    );
    Action memory action = mpCore.getAction(actionInfo.id);
    uint256 approvalPeriodEnd = toRelativeQuorum(actionInfo.strategy)
      .approvalEndTime(actionInfo);

    assertEq(actionInfo.id, 0);
    assertEq(mpCore.actionsCount(), 1);
    assertEq(action.creationTime, block.timestamp);
    assertEq(approvalPeriodEnd, block.timestamp + 2 days);
    assertEq(
      toRelativeQuorum(actionInfo.strategy).getApprovalSupply(actionInfo),
      3
    );
    assertEq(
      toRelativeQuorum(actionInfo.strategy).getDisapprovalSupply(actionInfo),
      3
    );
  }

  function testFuzz_RevertIf_PolicyholderDoesNotHavePermission(
    address _target,
    uint256 _value
  ) public {
    vm.assume(
      _target != address(mockProtocol) && _target != address(mpExecutor)
    );

    bytes memory dataTrue = abi.encodeCall(MockProtocol.pause, (true));
    vm.expectRevert(LlamaCore.PolicyholderDoesNotHavePermission.selector);
    vm.prank(actionCreatorAaron);
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(_target),
      _value,
      dataTrue,
      ""
    );
  }

  function test_RevertIf_ActionGuardProhibitsAction() public {
    ILlamaActionGuard guard = ILlamaActionGuard(
      new MockActionGuard(false, true, true, "no action creation")
    );

    vm.prank(address(mpExecutor));
    mpCore.setGuard(address(mockProtocol), PAUSE_SELECTOR, guard);

    vm.prank(actionCreatorAaron);
    vm.expectRevert("no action creation");
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );
  }

  function test_RevertIf_StrategyUnauthorized() public {
    ILlamaStrategy unauthorizedStrategy = ILlamaStrategy(
      makeAddr("unauthorized strategy")
    );
    vm.prank(actionCreatorAaron);
    vm.expectRevert(LlamaCore.UnauthorizedStrategy.selector);
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      unauthorizedStrategy,
      address(mockProtocol),
      0,
      data,
      ""
    );
  }

  function test_RevertIf_StrategyIsFromAnotherLlama() public {
    ILlamaStrategy unauthorizedStrategy = rootStrategy1;
    vm.prank(actionCreatorAaron);
    vm.expectRevert(LlamaCore.UnauthorizedStrategy.selector);
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      unauthorizedStrategy,
      address(mockProtocol),
      0,
      data,
      ""
    );
  }

  function testFuzz_RevertIf_PolicyholderNotMinted(
    address policyholder
  ) public {
    if (policyholder == address(0)) policyholder = address(100); // Faster than vm.assume, since 0 comes up a lot.
    vm.assume(mpPolicy.balanceOf(policyholder) == 0);
    vm.prank(policyholder);
    vm.expectRevert(LlamaCore.PolicyholderDoesNotHavePermission.selector);
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );
  }

  function test_RevertIf_NoPermissionForStrategy() public {
    vm.prank(actionCreatorAaron);
    vm.expectRevert(LlamaCore.PolicyholderDoesNotHavePermission.selector);
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy2,
      address(mockProtocol),
      0,
      data,
      ""
    );
  }

  function testFuzz_RevertIf_NoPermissionForTarget(
    address _incorrectTarget
  ) public {
    vm.assume(
      _incorrectTarget != address(mockProtocol) &&
        _incorrectTarget != address(mpExecutor)
    );
    vm.prank(actionCreatorAaron);
    vm.expectRevert(LlamaCore.PolicyholderDoesNotHavePermission.selector);
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      _incorrectTarget,
      0,
      data,
      ""
    );
  }

  function testFuzz_RevertIf_BadPermissionForSelector(
    bytes4 _badSelector
  ) public {
    vm.assume(
      _badSelector != PAUSE_SELECTOR &&
        _badSelector != FAIL_SELECTOR &&
        _badSelector != RECEIVE_ETH_SELECTOR
    );
    vm.prank(actionCreatorAaron);
    vm.expectRevert(LlamaCore.PolicyholderDoesNotHavePermission.selector);
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      abi.encodeWithSelector(_badSelector),
      ""
    );
  }

  function testFuzz_RevertIf_PermissionExpired(
    uint64 _expirationTimestamp
  ) public {
    vm.assume(
      _expirationTimestamp > block.timestamp + 1 &&
        _expirationTimestamp < type(uint64).max - 1
    );
    address actionCreatorAustin = makeAddr("actionCreatorAustin");

    vm.startPrank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.ActionCreator),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      _expirationTimestamp
    );
    vm.stopPrank();

    vm.prank(address(actionCreatorAustin));
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );

    vm.warp(_expirationTimestamp + 1);
    mpPolicy.revokeExpiredRole(uint8(Roles.ActionCreator), actionCreatorAustin);

    vm.startPrank(address(actionCreatorAustin));
    vm.expectRevert(LlamaCore.PolicyholderDoesNotHavePermission.selector);
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );
  }

  function testFuzz_CreatesAnActionWithScriptAsTarget(
    address scriptAddress
  ) public {
    vm.assume(
      scriptAddress != address(mpExecutor) &&
        scriptAddress != address(mpCore) &&
        scriptAddress != address(mpPolicy)
    );

    PermissionData memory permissionData = PermissionData(
      scriptAddress,
      bytes4(data),
      mpStrategy1
    );

    vm.prank(address(mpExecutor));
    mpCore.setScriptAuthorization(scriptAddress, true);

    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      permissionData,
      true
    );

    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(scriptAddress),
      0,
      data,
      ""
    );
    Action memory action = mpCore.getAction(actionId);

    assertEq(action.isScript, true);
  }

  function testFuzz_CreatesAnActionWithNonScriptAsTarget(
    address nonScriptAddress
  ) public {
    vm.assume(nonScriptAddress != address(mpExecutor));

    PermissionData memory permissionData = PermissionData(
      nonScriptAddress,
      bytes4(data),
      mpStrategy1
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      permissionData,
      true
    );

    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(nonScriptAddress),
      0,
      data,
      ""
    );
    Action memory action = mpCore.getAction(actionId);

    assertEq(action.isScript, false);
  }

  function test_RevertIf_ActionTargetIsExecutor() public {
    vm.prank(actionCreatorAaron);
    vm.expectRevert(LlamaCore.CannotSetExecutorAsTarget.selector);
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mpExecutor),
      0,
      abi.encodeWithSelector(""),
      ""
    );
  }
}

contract CreateActionBySig is LlamaCoreTest {
  function createOffchainSignature(
    uint256 privateKey
  ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
    (v, r, s) = createOffchainSignatureWithDescription(privateKey, "");
  }

  function createOffchainSignatureWithDescription(
    uint256 privateKey,
    string memory description
  ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
    LlamaCoreSigUtils.CreateAction memory createAction = LlamaCoreSigUtils
      .CreateAction({
        role: uint8(Roles.ActionCreator),
        strategy: address(mpStrategy1),
        target: address(mockProtocol),
        value: 0,
        data: abi.encodeCall(MockProtocol.pause, (true)),
        description: description,
        policyholder: actionCreatorAaron,
        nonce: 0
      });
    bytes32 digest = getCreateActionTypedDataHash(createAction);
    (v, r, s) = vm.sign(privateKey, digest);
  }

  function createOffchainSignatureForInstantExecution(
    uint256 privateKey,
    ILlamaStrategy strategy
  ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
    LlamaCoreSigUtils.CreateAction memory createAction = LlamaCoreSigUtils
      .CreateAction({
        role: uint8(Roles.ActionCreator),
        strategy: address(strategy),
        target: address(mockProtocol),
        value: 0,
        data: abi.encodeCall(MockProtocol.pause, (true)),
        description: "",
        policyholder: actionCreatorAaron,
        nonce: 0
      });
    bytes32 digest = getCreateActionTypedDataHash(createAction);
    (v, r, s) = vm.sign(privateKey, digest);
  }

  function createActionBySig(
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal returns (uint256 actionId) {
    actionId = mpCore.createActionBySig(
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true)),
      "",
      v,
      r,
      s
    );
  }

  function test_CreatesActionBySig() public {
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionCreatorAaronPrivateKey
    );
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));

    vm.expectEmit();
    emit ActionCreated(
      0,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );

    uint256 actionId = createActionBySig(v, r, s);
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data
    );
    Action memory action = mpCore.getAction(actionId);

    uint256 approvalPeriodEnd = toRelativeQuorum(actionInfo.strategy)
      .approvalEndTime(actionInfo);

    assertEq(actionId, 0);
    assertEq(mpCore.actionsCount(), 1);
    assertEq(action.creationTime, block.timestamp);
    assertEq(approvalPeriodEnd, block.timestamp + 2 days);
    assertEq(
      toRelativeQuorum(actionInfo.strategy).getApprovalSupply(actionInfo),
      3
    );
    assertEq(
      toRelativeQuorum(actionInfo.strategy).getDisapprovalSupply(actionInfo),
      3
    );
  }

  function test_CreatesActionBySigWithDescription() public {
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignatureWithDescription(
      actionCreatorAaronPrivateKey,
      "# Action 0 \n This is my action."
    );
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));

    vm.expectEmit();
    emit ActionCreated(
      0,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      "# Action 0 \n This is my action."
    );

    uint256 actionId = mpCore.createActionBySig(
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true)),
      "# Action 0 \n This is my action.",
      v,
      r,
      s
    );
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data
    );
    Action memory action = mpCore.getAction(actionId);

    uint256 approvalPeriodEnd = toRelativeQuorum(actionInfo.strategy)
      .approvalEndTime(actionInfo);

    assertEq(actionId, 0);
    assertEq(mpCore.actionsCount(), 1);
    assertEq(action.creationTime, block.timestamp);
    assertEq(approvalPeriodEnd, block.timestamp + 2 days);
    assertEq(
      toRelativeQuorum(actionInfo.strategy).getApprovalSupply(actionInfo),
      3
    );
    assertEq(
      toRelativeQuorum(actionInfo.strategy).getDisapprovalSupply(actionInfo),
      3
    );
  }

  function test_CheckNonceIncrements() public {
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionCreatorAaronPrivateKey
    );
    assertEq(
      mpCore.nonces(actionCreatorAaron, LlamaCore.createActionBySig.selector),
      0
    );
    createActionBySig(v, r, s);
    assertEq(
      mpCore.nonces(actionCreatorAaron, LlamaCore.createActionBySig.selector),
      1
    );
  }

  function test_OperationCannotBeReplayed() public {
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionCreatorAaronPrivateKey
    );
    createActionBySig(v, r, s);
    // Invalid Signature error since the recovered signer address during the second call is not the same as policyholder
    // since nonce has increased.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    createActionBySig(v, r, s);
  }

  function test_RevertIf_SignerIsNotPolicyHolder() public {
    (, uint256 randomSignerPrivateKey) = makeAddrAndKey("randomSigner");
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      randomSignerPrivateKey
    );
    // Invalid Signature error since the recovered signer address is not the same as the policyholder passed in as
    // parameter.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    createActionBySig(v, r, s);
  }

  function test_RevertIf_SignerIsZeroAddress() public {
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionCreatorAaronPrivateKey
    );
    // Invalid Signature error since the recovered signer address is zero address due to invalid signature values
    // (v,r,s).
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    createActionBySig((v + 1), r, s);
  }

  function test_RevertIf_PolicyholderIncrementsNonce() public {
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionCreatorAaronPrivateKey
    );

    vm.prank(actionCreatorAaron);
    mpCore.incrementNonce(LlamaCore.createActionBySig.selector);

    // Invalid Signature error since the recovered signer address during the call is not the same as policyholder
    // since nonce has increased.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    createActionBySig(v, r, s);
  }

  function test_ActionCanBeCreatedQueuedAndExecutedInOneBlock() public {
    // Create the instant execution strategy and assign the permission to `Roles.ActionCreator`
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](1);
    newStrategies[0] = LlamaRelativeStrategyBase.Config({
      approvalPeriod: 0,
      queuingPeriod: 0,
      expirationPeriod: 2 days,
      isFixedLengthApprovalPeriod: false,
      minApprovalPct: 0,
      minDisapprovalPct: 10_001,
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });
    ILlamaStrategy instantExecutionStrategy = lens.computeLlamaStrategyAddress(
      address(relativeQuantityQuorumLogic),
      DeployUtils.encodeStrategy(newStrategies[0]),
      address(mpCore)
    );
    PermissionData memory newPermissionData = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      instantExecutionStrategy
    );
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));

    vm.startPrank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(relativeQuantityQuorumLogic, true);
    mpCore.createStrategies(
      relativeQuantityQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      newPermissionData,
      true
    );
    vm.stopPrank();

    (
      uint8 v,
      bytes32 r,
      bytes32 s
    ) = createOffchainSignatureForInstantExecution(
        actionCreatorAaronPrivateKey,
        instantExecutionStrategy
      );

    MockAtomicActionExecutor mockAtomicActionExecutor = new MockAtomicActionExecutor(
        mpCore
      );

    mineBlock();

    vm.expectEmit();
    emit ActionExecuted(
      0,
      address(mockAtomicActionExecutor),
      instantExecutionStrategy,
      actionCreatorAaron,
      bytes("")
    );
    mockAtomicActionExecutor.createQueueAndExecute(
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      instantExecutionStrategy,
      address(mockProtocol),
      0,
      data,
      "",
      v,
      r,
      s
    );
  }
}

contract CancelAction is LlamaCoreTest {
  ActionInfo actionInfo;

  function setUp() public override {
    LlamaCoreTest.setUp();
    actionInfo = _createAction();
  }

  function test_CreatorCancelFlow() public {
    vm.prank(actionCreatorAaron);
    vm.expectEmit();
    emit ActionCanceled(actionInfo.id, actionCreatorAaron);
    mpCore.cancelAction(actionInfo);

    uint256 state = uint256(mpCore.getActionState(actionInfo));
    uint256 canceled = uint256(ActionState.Canceled);
    assertEq(state, canceled);
  }

  function test_CreatorCanCancelAfterMinExecutionTime() public {
    actionInfo = _createApproveAndQueueAction();

    vm.prank(disapproverDave);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");

    vm.warp(actionInfo.strategy.minExecutionTime(actionInfo) + 1);

    vm.expectRevert(LlamaCore.CannotDisapproveAfterMinExecutionTime.selector);
    vm.prank(disapproverDrake);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");

    vm.prank(actionCreatorAaron);
    vm.expectEmit();
    emit ActionCanceled(actionInfo.id, actionCreatorAaron);
    mpCore.cancelAction(actionInfo);
  }

  function testFuzz_RevertIf_NotCreator(address _randomCaller) public {
    vm.assume(_randomCaller != actionCreatorAaron);
    vm.prank(_randomCaller);
    vm.expectRevert(LlamaRelativeStrategyBase.OnlyActionCreator.selector);
    mpCore.cancelAction(actionInfo);
  }

  function testFuzz_RevertIf_InvalidActionId(
    ActionInfo calldata _actionInfo
  ) public {
    vm.prank(actionCreatorAaron);
    vm.expectRevert(LlamaCore.InfoHashMismatch.selector);
    mpCore.cancelAction(_actionInfo);
  }

  function test_RevertIf_ActionDoesNotExist() public {
    uint256 unusedActionId = mpCore.actionsCount();
    assertEq((mpCore.getAction(unusedActionId).infoHash), bytes32(0));

    ActionInfo memory _actionInfo = ActionInfo(
      unusedActionId,
      address(0),
      uint8(0),
      ILlamaStrategy(address(0)),
      address(0),
      uint256(0),
      bytes(abi.encode(0))
    );
    vm.expectRevert(LlamaCore.InfoHashMismatch.selector);
    mpCore.cancelAction(_actionInfo);
  }

  function test_RevertIf_AlreadyCanceled() public {
    vm.startPrank(actionCreatorAaron);
    mpCore.cancelAction(actionInfo);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaRelativeStrategyBase.CannotCancelInState.selector,
        ActionState.Canceled
      )
    );
    mpCore.cancelAction(actionInfo);
  }

  function test_RevertIf_ActionExecuted() public {
    ActionInfo memory _actionInfo = _executeCompleteActionFlow();

    vm.prank(actionCreatorAaron);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaRelativeStrategyBase.CannotCancelInState.selector,
        ActionState.Executed
      )
    );
    mpCore.cancelAction(_actionInfo);
  }

  function test_RevertIf_ActionExpired() public {
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), true);
    _queueAction(actionInfo);

    _disapproveAction(disapproverDave, actionInfo);

    vm.warp(block.timestamp + 15 days);

    vm.prank(actionCreatorAaron);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaRelativeStrategyBase.CannotCancelInState.selector,
        ActionState.Expired
      )
    );
    mpCore.cancelAction(actionInfo);
  }

  function test_RevertIf_ActionFailed() public {
    _approveAction(approverAdam, actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), false);

    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaRelativeStrategyBase.CannotCancelInState.selector,
        ActionState.Failed
      )
    );
    mpCore.cancelAction(actionInfo);
  }

  function test_RevertIf_DisapprovalDoesNotReachQuorum() public {
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), true);
    _queueAction(actionInfo);

    vm.expectRevert(LlamaRelativeStrategyBase.OnlyActionCreator.selector);
    mpCore.cancelAction(actionInfo);
  }
}

contract CancelActionBySig is LlamaCoreTest {
  function createOffchainSignature(
    ActionInfo memory actionInfo,
    uint256 privateKey
  ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
    LlamaCoreSigUtils.CancelAction memory cancelAction = LlamaCoreSigUtils
      .CancelAction({
        policyholder: actionCreatorAaron,
        actionInfo: actionInfo,
        nonce: 0
      });
    bytes32 digest = getCancelActionTypedDataHash(cancelAction);
    (v, r, s) = vm.sign(privateKey, digest);
  }

  function cancelActionBySig(
    ActionInfo memory actionInfo,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal {
    mpCore.cancelActionBySig(actionCreatorAaron, actionInfo, v, r, s);
  }

  function test_CancelActionBySig() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      actionCreatorAaronPrivateKey
    );

    vm.expectEmit();
    emit ActionCanceled(actionInfo.id, actionCreatorAaron);

    cancelActionBySig(actionInfo, v, r, s);

    uint256 state = uint256(mpCore.getActionState(actionInfo));
    uint256 canceled = uint256(ActionState.Canceled);
    assertEq(state, canceled);
  }

  function test_CheckNonceIncrements() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      actionCreatorAaronPrivateKey
    );

    assertEq(
      mpCore.nonces(actionCreatorAaron, LlamaCore.cancelActionBySig.selector),
      0
    );
    cancelActionBySig(actionInfo, v, r, s);
    assertEq(
      mpCore.nonces(actionCreatorAaron, LlamaCore.cancelActionBySig.selector),
      1
    );
  }

  function test_OperationCannotBeReplayed() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      actionCreatorAaronPrivateKey
    );
    cancelActionBySig(actionInfo, v, r, s);
    // Invalid Signature error since the recovered signer address during the second call is not the same as policyholder
    // since nonce has increased.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    cancelActionBySig(actionInfo, v, r, s);
  }

  function test_RevertIf_SignerIsNotPolicyHolder() public {
    ActionInfo memory actionInfo = _createAction();

    (, uint256 randomSignerPrivateKey) = makeAddrAndKey("randomSigner");
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      randomSignerPrivateKey
    );
    // Invalid Signature error since the recovered signer address is not the same as the policyholder passed in as
    // parameter.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    cancelActionBySig(actionInfo, v, r, s);
  }

  function test_RevertIf_SignerIsZeroAddress() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      actionCreatorAaronPrivateKey
    );
    // Invalid Signature error since the recovered signer address is zero address due to invalid signature values
    // (v,r,s).
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    cancelActionBySig(actionInfo, (v + 1), r, s);
  }

  function test_RevertIf_PolicyholderIncrementsNonce() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      actionCreatorAaronPrivateKey
    );

    vm.prank(actionCreatorAaron);
    mpCore.incrementNonce(LlamaCore.cancelActionBySig.selector);

    // Invalid Signature error since the recovered signer address during the call is not the same as policyholder
    // since nonce has increased.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    cancelActionBySig(actionInfo, v, r, s);
  }
}

contract QueueAction is LlamaCoreTest {
  function test_RevertIf_NotApproved() public {
    ActionInfo memory actionInfo = _createAction();
    _approveAction(approverAdam, actionInfo);

    vm.warp(block.timestamp + 6 days);

    vm.expectRevert(
      abi.encodePacked(
        LlamaCore.InvalidActionState.selector,
        uint256(ActionState.Failed)
      )
    );
    mpCore.queueAction(actionInfo);
  }

  function testFuzz_RevertIf_InvalidActionId(
    ActionInfo calldata actionInfo
  ) public {
    vm.expectRevert(LlamaCore.InfoHashMismatch.selector);
    mpCore.queueAction(actionInfo);
  }

  function testFuzz_RevertIf_MinExecutionTimeIsInThePast(
    uint64 blockTimestamp,
    uint64 minExecutionTime
  ) public {
    blockTimestamp = toUint64(
      bound(blockTimestamp, block.timestamp, type(uint64).max / 2)
    ); // Arbitrary bound that
    // won't revert.
    minExecutionTime = toUint64(bound(minExecutionTime, 0, blockTimestamp));
    vm.warp(blockTimestamp);

    // Approve an action.
    ActionInfo memory actionInfo = _createAction();
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);
    vm.warp(block.timestamp + 6 days);
    assertEq(mpStrategy1.isActionApproved(actionInfo), true);

    // Queue reverts because minExecutionTime is in the past.
    assertEq(
      uint8(mpCore.getActionState(actionInfo)),
      uint8(ActionState.Approved)
    );
    vm.mockCall(
      address(actionInfo.strategy),
      abi.encodeWithSelector(ILlamaStrategy.minExecutionTime.selector),
      abi.encode(minExecutionTime)
    );
    vm.expectRevert(LlamaCore.MinExecutionTimeCannotBeInThePast.selector);
    mpCore.queueAction(actionInfo);
  }

  function testFuzz_SuccessfullyQueuesAction(
    uint64 blockTimestamp,
    uint64 minExecutionTime
  ) public {
    blockTimestamp = toUint64(
      bound(blockTimestamp, block.timestamp, type(uint64).max / 2)
    ); // Arbitrary bound that
    // won't revert.
    minExecutionTime = toUint64(bound(minExecutionTime, 0, blockTimestamp));
    vm.warp(blockTimestamp);

    // Approve an action.
    ActionInfo memory actionInfo = _createAction();
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);
    vm.warp(block.timestamp + 6 days);
    assertEq(mpStrategy1.isActionApproved(actionInfo), true);

    // Queue it.
    assertEq(
      uint8(mpCore.getActionState(actionInfo)),
      uint8(ActionState.Approved)
    );
    mpCore.queueAction(actionInfo);
    assertEq(
      uint8(mpCore.getActionState(actionInfo)),
      uint8(ActionState.Queued)
    );
  }

  function test_RevertIf_AlreadyQueuedAutomatically() public {
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      false,
      2,
      1,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createActionUsingAbsolutePeerReview(
      absolutePeerReview
    );
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);
    ActionState actionState = mpCore.getActionState(actionInfo);
    assertEq(uint8(actionState), uint8(ActionState.Queued));

    vm.expectRevert(
      abi.encodePacked(
        LlamaCore.InvalidActionState.selector,
        uint256(ActionState.Queued)
      )
    );
    // will revert because action was already queued automatically by the final action approval
    mpCore.queueAction(actionInfo);
  }
}

contract ExecuteAction is LlamaCoreTest {
  ActionInfo actionInfo;

  function _executeScriptAuthorizationActionFlow(bool authorize) internal {
    bytes memory data = abi.encodeCall(
      mpCore.setScriptAuthorization,
      (address(mockScript), authorize)
    );
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mpCore),
      0,
      data,
      ""
    );
    actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mpCore),
      0,
      data
    );
    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), true);
    _queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    _executeAction(actionInfo);
  }

  function setUp() public override {
    LlamaCoreTest.setUp();

    actionInfo = _createAction();
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), true);
  }

  function test_ActionExecution() public {
    mpCore.queueAction(actionInfo);
    vm.warp(block.timestamp + 6 days);

    vm.expectEmit();
    emit ActionExecuted(
      0,
      address(this),
      mpStrategy1,
      actionCreatorAaron,
      bytes("")
    );
    mpCore.executeAction(actionInfo);
  }

  function testFuzz_ScriptsCanTransferValue(uint256 value) public {
    address actionCreatorAustin = makeAddr("actionCreatorAustin");

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    vm.prank(address(mpExecutor));
    mpCore.setScriptAuthorization(address(mockScript), true);

    bytes memory data = abi.encodeWithSelector(
      EXECUTE_SCRIPT_WITH_VALUE_SELECTOR
    );
    vm.prank(actionCreatorAustin);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mockScript),
      value,
      data,
      ""
    );
    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAustin,
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mockScript),
      value,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.deal(address(this), value);

    vm.expectEmit();
    emit ScriptExecutedWithValue(value);
    mpCore.executeAction{value: value}(_actionInfo);
  }

  function test_ScriptsAlwaysUseDelegatecall() public {
    address actionCreatorAustin = makeAddr("actionCreatorAustin");

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    vm.prank(address(mpExecutor));
    mpCore.setScriptAuthorization(address(mockScript), true);

    bytes memory data = abi.encodeWithSelector(EXECUTE_SCRIPT_SELECTOR);
    vm.prank(actionCreatorAustin);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mockScript),
      0,
      data,
      ""
    );
    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAustin,
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mockScript),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.expectEmit();
    // Checking that the result is a delegatecall because msg.sender is this mpCore and not mpExecutor
    emit ActionExecuted(
      _actionInfo.id,
      address(this),
      mpStrategy1,
      actionCreatorAustin,
      abi.encode(address(mpCore))
    );
    mpCore.executeAction(_actionInfo);
  }

  function test_RevertIf_NotQueued() public {
    vm.expectRevert(
      abi.encodePacked(
        LlamaCore.InvalidActionState.selector,
        uint256(ActionState.Approved)
      )
    );
    mpCore.executeAction(actionInfo);

    // Check that it's in the Approved state
    assertEq(uint256(mpCore.getActionState(actionInfo)), uint256(3));
  }

  function test_RevertIf_ActionGuardProhibitsActionPreExecution() public {
    ILlamaActionGuard guard = ILlamaActionGuard(
      new MockActionGuard(true, false, true, "no action pre-execution")
    );

    vm.prank(address(mpExecutor));
    mpCore.setGuard(address(mockProtocol), PAUSE_SELECTOR, guard);

    actionInfo = _createAction();
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(actionInfo);
    vm.warp(block.timestamp + 6 days);

    vm.expectRevert("no action pre-execution");
    mpCore.executeAction(actionInfo);
  }

  function test_RevertIf_ActionGuardProhibitsActionPostExecution() public {
    ILlamaActionGuard guard = ILlamaActionGuard(
      new MockActionGuard(true, true, false, "no action post-execution")
    );

    vm.prank(address(mpExecutor));
    mpCore.setGuard(address(mockProtocol), PAUSE_SELECTOR, guard);

    actionInfo = _createAction();
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(actionInfo);
    vm.warp(block.timestamp + 6 days);

    vm.expectRevert("no action post-execution");
    mpCore.executeAction(actionInfo);
  }

  function testFuzz_RevertIf_InvalidAction(
    ActionInfo calldata _actionInfo
  ) public {
    vm.expectRevert(LlamaCore.InfoHashMismatch.selector);
    mpCore.executeAction(_actionInfo);
  }

  function testFuzz_RevertIf_MinExecutionTimeNotReached(
    uint256 timeElapsed
  ) public {
    // Using a reasonable upper limit for elapsedTime
    vm.assume(timeElapsed < 10_000 days);
    mpCore.queueAction(actionInfo);
    uint256 executionTime = mpCore.getAction(actionInfo.id).minExecutionTime;

    vm.warp(block.timestamp + timeElapsed);

    if (executionTime > block.timestamp) {
      vm.expectRevert(LlamaCore.MinExecutionTimeNotReached.selector);
      mpCore.executeAction(actionInfo);
    }
  }

  function testFuzz_ExecuteActionWithValue(uint256 value) public {
    bytes memory data = abi.encodeCall(MockProtocol.receiveEth, ());
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      value,
      data,
      ""
    );
    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      value,
      data
    );

    assertEq(address(mockProtocol).balance, 0);

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.deal(actionCreatorAaron, value);

    vm.prank(actionCreatorAaron);
    mpCore.executeAction{value: value}(_actionInfo);

    assertEq(address(mockProtocol).balance, value);
  }

  function testFuzz_RevertIf_IncorrectMsgValue(uint256 value) public {
    vm.assume(value != 1 ether);
    bytes memory data = abi.encodeCall(MockProtocol.receiveEth, ());
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      1 ether,
      data,
      ""
    );
    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      1 ether,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.deal(actionCreatorAaron, value);

    vm.prank(actionCreatorAaron);
    (bool status, bytes memory _data) = address(mpCore).call{value: value}(
      (abi.encodeCall(mpCore.executeAction, (_actionInfo)))
    );
    assertFalse(status, "expectRevert: call did not revert");
    assertEq(_data, bytes.concat(LlamaCore.IncorrectMsgValue.selector));
  }

  function test_RevertIf_FailedActionExecution() public {
    bytes memory data = abi.encodeCall(MockProtocol.fail, ());
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );
    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(_actionInfo), true);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    bytes memory expectedErr = abi.encodeWithSelector(
      LlamaCore.FailedActionExecution.selector,
      abi.encodeWithSelector(MockProtocol.Failed.selector)
    );
    vm.expectRevert(expectedErr);
    mpCore.executeAction(_actionInfo);
  }

  function test_HandlesReentrancy() public {
    address actionCreatorAustin = makeAddr("actionCreatorAustin");
    bytes memory expectedErr = abi.encodeWithSelector(
      LlamaCore.FailedActionExecution.selector,
      abi.encodeWithSelector(
        LlamaCore.InvalidActionState.selector,
        (ActionState.Approved)
      )
    );

    vm.startPrank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    vm.stopPrank();

    bytes memory data = abi.encodeCall(LlamaCore.executeAction, (actionInfo));
    vm.prank(actionCreatorAustin);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mpCore),
      0,
      data,
      ""
    );
    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAustin,
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mpCore),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.expectRevert(expectedErr);
    mpCore.executeAction(_actionInfo);
  }

  function test_ScriptAuthorizationDoesNotAffectExecution() external {
    address actionCreatorAustin = makeAddr("actionCreatorAustin");
    vm.prank(address(mpExecutor));
    mpCore.setScriptAuthorization(address(mockScript), false);

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    bytes memory data = abi.encodeWithSelector(EXECUTE_SCRIPT_SELECTOR);
    vm.prank(actionCreatorAustin);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mockScript),
      0,
      data,
      ""
    );
    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAustin,
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mockScript),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    vm.warp(block.timestamp + 6 days);

    vm.prank(address(mpExecutor));
    mpCore.setScriptAuthorization(address(mockScript), true);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.expectEmit();
    // Checking that the result is a call because msg.sender is mpExecutor
    emit ActionExecuted(
      _actionInfo.id,
      address(this),
      mpStrategy1,
      actionCreatorAustin,
      abi.encode(address(mpExecutor))
    );
    mpCore.executeAction(_actionInfo);
  }

  function test_ScriptUnauthorizationDoesNotAffectExecution() external {
    address actionCreatorAustin = makeAddr("actionCreatorAustin");
    vm.prank(address(mpExecutor));
    mpCore.setScriptAuthorization(address(mockScript), true);

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    bytes memory data = abi.encodeWithSelector(EXECUTE_SCRIPT_SELECTOR);
    vm.prank(actionCreatorAustin);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mockScript),
      0,
      data,
      ""
    );
    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAustin,
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mockScript),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    vm.warp(block.timestamp + 6 days);

    vm.prank(address(mpExecutor));
    mpCore.setScriptAuthorization(address(mockScript), false);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.expectEmit();
    // Checking that the result is a delegatecall because msg.sender is mpCore not mpExecutor
    emit ActionExecuted(
      _actionInfo.id,
      address(this),
      mpStrategy1,
      actionCreatorAustin,
      abi.encode(address(mpCore))
    );
    mpCore.executeAction(_actionInfo);
  }

  function test_ScriptAuthorizationFromActionDoesNotAffectExecution() external {
    _executeScriptAuthorizationActionFlow(false);

    bytes memory data = abi.encodeWithSelector(EXECUTE_SCRIPT_SELECTOR);
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockScript),
      0,
      data,
      ""
    );

    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockScript),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    _executeScriptAuthorizationActionFlow(true);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.expectEmit();
    // Checking that the result is a call because msg.sender is mpExecutor
    emit ActionExecuted(
      _actionInfo.id,
      address(this),
      mpStrategy1,
      actionCreatorAaron,
      abi.encode(address(mpExecutor))
    );
    mpCore.executeAction(_actionInfo);
  }

  function test_ScriptUnauthorizationFromActionDoesNotAffectExecution()
    external
  {
    _executeScriptAuthorizationActionFlow(true);

    bytes memory data = abi.encodeWithSelector(EXECUTE_SCRIPT_SELECTOR);
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockScript),
      0,
      data,
      ""
    );

    ActionInfo memory _actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockScript),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, _actionInfo);
    _approveAction(approverAlicia, _actionInfo);

    _executeScriptAuthorizationActionFlow(false);

    mpCore.queueAction(_actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.expectEmit();
    // Checking that the result is a delegatecall because msg.sender is mpCore and not mpExecutor
    emit ActionExecuted(
      _actionInfo.id,
      address(this),
      mpStrategy1,
      actionCreatorAaron,
      abi.encode(address(mpCore))
    );
    mpCore.executeAction(_actionInfo);
  }
}

contract CastApproval is LlamaCoreTest {
  ActionInfo actionInfo;

  function setUp() public override {
    LlamaCoreTest.setUp();
    actionInfo = _createAction();
  }

  function test_SuccessfulApproval() public {
    _approveAction(approverAdam, actionInfo);
    assertEq(mpCore.getAction(0).totalApprovals, 1);
    assertEq(mpCore.approvals(0, approverAdam), true);
  }

  function test_SuccessfulApprovalWithReason(string calldata reason) public {
    vm.expectEmit();
    emit ApprovalCast(
      actionInfo.id,
      approverAdam,
      uint8(Roles.Approver),
      1,
      reason
    );
    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, reason);
  }

  function test_SuccessfullyQueuesUponReachingApprovalThreshold() public {
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      false,
      2,
      1,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory _actionInfo = createActionUsingAbsolutePeerReview(
      absolutePeerReview
    );
    _approveAction(approverAdam, _actionInfo);

    vm.expectEmit();
    emit ApprovalCast(
      _actionInfo.id,
      approverAlicia,
      uint8(Roles.Approver),
      1,
      ""
    );
    vm.expectEmit();
    emit ActionQueued(
      _actionInfo.id,
      approverAlicia,
      absolutePeerReview,
      actionCreatorAaron,
      absolutePeerReview.minExecutionTime(_actionInfo)
    );
    vm.prank(approverAlicia);
    mpCore.castApproval(uint8(Roles.Approver), _actionInfo, "");

    ActionState actionState = mpCore.getActionState(_actionInfo);
    assertEq(uint8(actionState), uint8(ActionState.Queued));
  }

  function test_UsesQuantityFromPreviousTimestamp() public {
    // Generate a new user so they have no checkpoint history (to ensure checkpoints are monotonically increasing).
    address newApprover = makeAddr("newApprover");

    // Go back to 1 second before action creation and give the user a weight of 25.
    uint256 initialTimestamp = block.timestamp;
    vm.warp(mpCore.getAction(actionInfo.id).creationTime - 1);
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.Approver),
      newApprover,
      25,
      type(uint64).max
    );

    // At action creation time, give the user a weight of 2.
    vm.warp(mpCore.getAction(actionInfo.id).creationTime);
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.Approver),
      newApprover,
      2,
      type(uint64).max
    );

    // Go back to the original timestamp and cast approval, ensuring we see a weight of 25 cast.
    vm.warp(initialTimestamp);
    assertEq(0, mpCore.getAction(actionInfo.id).totalApprovals);
    vm.prank(newApprover);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    assertEq(25, mpCore.getAction(actionInfo.id).totalApprovals);
  }

  function test_RevertIf_ActionNotActive() public {
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(actionInfo);

    vm.expectRevert(
      abi.encodePacked(
        LlamaCore.InvalidActionState.selector,
        uint256(ActionState.Queued)
      )
    );
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
  }

  function test_RevertIf_DuplicateApproval() public {
    _approveAction(approverAdam, actionInfo);

    vm.expectRevert(LlamaCore.DuplicateCast.selector);
    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
  }

  function test_RevertIf_InvalidPolicyholder() public {
    address notPolicyholder = 0x9D3de545F58C696946b4Cf2c884fcF4f7914cB53;
    vm.prank(notPolicyholder);

    vm.expectRevert(LlamaCore.InvalidPolicyholder.selector);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");

    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
  }

  function test_RevertIf_NoQuantity() public {
    ILlamaStrategy newStrategy = deployMockPoorStrategyAndCreatePermission();

    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      newStrategy,
      address(mockProtocol),
      0,
      data,
      ""
    );
    actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      newStrategy,
      address(mockProtocol),
      0,
      data
    );
    vm.warp(block.timestamp + 1);

    vm.prank(actionCreatorAaron);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaCore.CannotCastWithZeroQuantity.selector,
        actionCreatorAaron,
        uint8(Roles.ActionCreator)
      )
    );
    mpCore.castApproval(uint8(Roles.ActionCreator), actionInfo, "");
  }

  function testFuzz_ReturnQuantity(uint96 quantity) public {
    // We subtract by 3 because total quantity cannot be greater than type(uint96).max.
    // Two other policyholders already have a quantity of 1 and bound is inclusive.
    uint96 boundedQuantity = uint96(bound(quantity, 1, type(uint96).max - 3));
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.Approver),
      approverAdam,
      boundedQuantity,
      type(uint64).max
    );

    mineBlock();

    actionInfo = _createAction();

    vm.prank(approverAdam);
    uint96 returnedQuantity = mpCore.castApproval(
      uint8(Roles.Approver),
      actionInfo,
      ""
    );

    assertEq(boundedQuantity, returnedQuantity);
  }

  function test_DoesNotAutoQueueWhenFixedLengthApprovalPeriod() public {
    LlamaRelativeStrategyBase.Config[]
      memory newConfigs = new LlamaRelativeStrategyBase.Config[](1);
    newConfigs[0] = _createStrategy(1, true);
    ILlamaStrategy newStrategy = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      DeployUtils.encodeStrategy(newConfigs[0]),
      address(mpCore)
    );
    vm.prank(address(mpExecutor));
    mpCore.createStrategies(
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newConfigs)
    );

    PermissionData memory newPermissionData = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      newStrategy
    );
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      newPermissionData,
      true
    );

    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      newStrategy,
      address(mockProtocol),
      0,
      data,
      ""
    );
    actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      newStrategy,
      address(mockProtocol),
      0,
      data
    );
    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    uint8 actionState = uint8(mpCore.getActionState(actionInfo));

    assertEq(actionState, uint8(ActionState.Active)); // should still be active since fixed length is true
    assertEq(newStrategy.isActionApproved(actionInfo), true);

    vm.warp(newStrategy.minExecutionTime(actionInfo));

    actionState = uint8(mpCore.getActionState(actionInfo));
    assertEq(actionState, uint8(ActionState.Approved)); // should be approved now

    uint256 executionTime = block.timestamp +
      toRelativeQuorum(newStrategy).queuingPeriod();
    vm.expectEmit();
    emit ActionQueued(
      actionInfo.id,
      address(this),
      newStrategy,
      actionCreatorAaron,
      executionTime
    );
    mpCore.queueAction(actionInfo);

    actionState = uint8(mpCore.getActionState(actionInfo));
    assertEq(actionState, uint8(ActionState.Queued));
  }
}

contract CastApprovalBySig is LlamaCoreTest {
  function createOffchainSignature(
    ActionInfo memory actionInfo,
    uint256 privateKey
  ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
    LlamaCoreSigUtils.CastApproval memory castApproval = LlamaCoreSigUtils
      .CastApproval({
        actionInfo: actionInfo,
        role: uint8(Roles.Approver),
        reason: "",
        policyholder: approverAdam,
        nonce: 0
      });
    bytes32 digest = getCastApprovalTypedDataHash(castApproval);
    (v, r, s) = vm.sign(privateKey, digest);
  }

  function castApprovalBySig(
    ActionInfo memory actionInfo,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal {
    mpCore.castApprovalBySig(
      approverAdam,
      uint8(Roles.Approver),
      actionInfo,
      "",
      v,
      r,
      s
    );
  }

  function test_CastsApprovalBySig() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      approverAdamPrivateKey
    );

    vm.expectEmit();
    emit ApprovalCast(
      actionInfo.id,
      approverAdam,
      uint8(Roles.Approver),
      1,
      ""
    );

    castApprovalBySig(actionInfo, v, r, s);

    assertEq(mpCore.getAction(0).totalApprovals, 1);
    assertEq(mpCore.approvals(0, approverAdam), true);
  }

  function test_CheckNonceIncrements() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      approverAdamPrivateKey
    );

    assertEq(
      mpCore.nonces(approverAdam, LlamaCore.castApprovalBySig.selector),
      0
    );
    castApprovalBySig(actionInfo, v, r, s);
    assertEq(
      mpCore.nonces(approverAdam, LlamaCore.castApprovalBySig.selector),
      1
    );
  }

  function test_OperationCannotBeReplayed() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      approverAdamPrivateKey
    );
    castApprovalBySig(actionInfo, v, r, s);
    // Invalid Signature error since the recovered signer address during the second call is not the same as policyholder
    // since nonce has increased.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    castApprovalBySig(actionInfo, v, r, s);
  }

  function test_RevertIf_SignerIsNotPolicyHolder() public {
    ActionInfo memory actionInfo = _createAction();

    (, uint256 randomSignerPrivateKey) = makeAddrAndKey("randomSigner");
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      randomSignerPrivateKey
    );
    // Invalid Signature error since the recovered signer address is not the same as the policyholder passed in as
    // parameter.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    castApprovalBySig(actionInfo, v, r, s);
  }

  function test_RevertIf_SignerIsZeroAddress() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      approverAdamPrivateKey
    );
    // Invalid Signature error since the recovered signer address is zero address due to invalid signature values
    // (v,r,s).
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    castApprovalBySig(actionInfo, (v + 1), r, s);
  }

  function test_RevertIf_PolicyholderIncrementsNonce() public {
    ActionInfo memory actionInfo = _createAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      approverAdamPrivateKey
    );

    vm.prank(approverAdam);
    mpCore.incrementNonce(LlamaCore.castApprovalBySig.selector);

    // Invalid Signature error since the recovered signer address during the call is not the same as policyholder
    // since nonce has increased.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    castApprovalBySig(actionInfo, v, r, s);
  }

  function test_ActionCreatorCanRelayMessage() public {
    // Testing that ActionCreatorCannotCast() error is not hit
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      true,
      2,
      1,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createActionUsingAbsolutePeerReview(
      absolutePeerReview
    );

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      approverAdamPrivateKey
    );
    vm.prank(actionCreatorAaron);
    castApprovalBySig(actionInfo, v, r, s);
  }

  function test_ReturnQuantity() public {
    uint96 quantity = 77;
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.Approver),
      approverAdam,
      quantity,
      type(uint64).max
    );

    mineBlock();

    ActionInfo memory actionInfo = _createAction();
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      approverAdamPrivateKey
    );
    uint96 returnedQuantity = mpCore.castApprovalBySig(
      approverAdam,
      uint8(Roles.Approver),
      actionInfo,
      "",
      v,
      r,
      s
    );
    assertEq(quantity, returnedQuantity);
  }

  function test_SuccessfullyQueuesUponReachingApprovalThreshold() public {
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      false,
      2,
      1,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createActionUsingAbsolutePeerReview(
      absolutePeerReview
    );
    _approveAction(approverAlicia, actionInfo);

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      approverAdamPrivateKey
    );
    vm.expectEmit();
    emit ApprovalCast(
      actionInfo.id,
      approverAdam,
      uint8(Roles.Approver),
      1,
      ""
    );
    vm.expectEmit();
    emit ActionQueued(
      actionInfo.id,
      address(this),
      absolutePeerReview,
      actionCreatorAaron,
      absolutePeerReview.minExecutionTime(actionInfo)
    );
    castApprovalBySig(actionInfo, v, r, s);

    ActionState actionState = mpCore.getActionState(actionInfo);
    assertEq(uint8(actionState), uint8(ActionState.Queued));
  }
}

contract CastDisapproval is LlamaCoreTest {
  function test_SuccessfulDisapproval() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    vm.prank(disapproverDrake);
    vm.expectEmit();
    emit DisapprovalCast(
      actionInfo.id,
      disapproverDrake,
      uint8(Roles.Disapprover),
      1,
      ""
    );

    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");

    assertEq(mpCore.getAction(0).totalDisapprovals, 1);
    assertEq(mpCore.disapprovals(0, disapproverDrake), true);
  }

  function test_SuccessfulDisapprovalWithReason(string calldata reason) public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();
    vm.expectEmit();
    emit DisapprovalCast(
      actionInfo.id,
      disapproverDrake,
      uint8(Roles.Disapprover),
      1,
      reason
    );
    vm.prank(disapproverDrake);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, reason);
  }

  function test_UsesQuantityFromPreviousTimestamp() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();
    // Generate a new user so they have no checkpoint history (to ensure checkpoints are monotonically increasing).
    address newApprover = makeAddr("newApprover");

    // Go back to 1 second before action creation and give the user a weight of 25.
    uint256 initialTimestamp = block.timestamp;
    vm.warp(mpCore.getAction(actionInfo.id).creationTime - 1);
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.Disapprover),
      newApprover,
      25,
      type(uint64).max
    );

    // At action creation time, give the user a weight of 2.
    vm.warp(mpCore.getAction(actionInfo.id).creationTime);
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.Disapprover),
      newApprover,
      2,
      type(uint64).max
    );

    // Go back to the original timestamp and cast approval, ensuring we see a weight of 25 cast.
    vm.warp(initialTimestamp);
    assertEq(0, mpCore.getAction(actionInfo.id).totalDisapprovals);
    vm.prank(newApprover);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");
    assertEq(25, mpCore.getAction(actionInfo.id).totalDisapprovals);
  }

  function test_RevertIf_ActionNotQueued() public {
    ActionInfo memory actionInfo = _createAction();

    vm.expectRevert(
      abi.encodePacked(
        LlamaCore.InvalidActionState.selector,
        uint256(ActionState.Active)
      )
    );
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");
  }

  function test_RevertIf_DuplicateDisapproval() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    _disapproveAction(disapproverDrake, actionInfo);

    vm.expectRevert(LlamaCore.DuplicateCast.selector);
    vm.prank(disapproverDrake);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");
  }

  function test_RevertIf_InvalidPolicyholder() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();
    address notPolicyholder = 0x9D3de545F58C696946b4Cf2c884fcF4f7914cB53;
    vm.prank(notPolicyholder);

    vm.expectRevert(LlamaCore.InvalidPolicyholder.selector);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");

    vm.prank(disapproverDrake);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");
  }

  function test_FailsIfDisapproved() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    vm.prank(disapproverDave);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");
    vm.prank(disapproverDrake);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");

    ActionState state = mpCore.getActionState(actionInfo);
    assertEq(uint8(state), uint8(ActionState.Failed));

    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaCore.InvalidActionState.selector,
        ActionState.Failed
      )
    );
    mpCore.executeAction(actionInfo);
  }

  function test_RevertIf_NoQuantity() public {
    ILlamaStrategy newStrategy = deployMockPoorStrategyAndCreatePermission();

    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      newStrategy,
      address(mockProtocol),
      0,
      data,
      ""
    );
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      newStrategy,
      address(mockProtocol),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaCore.CannotCastWithZeroQuantity.selector,
        actionCreatorAaron,
        uint8(Roles.ActionCreator)
      )
    );
    vm.prank(actionCreatorAaron);
    mpCore.castDisapproval(uint8(Roles.ActionCreator), actionInfo, "");
  }

  function test_RevertIf_CastAfterMinExecutionTime(
    uint256 timeAfterExecutionTime
  ) public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();
    timeAfterExecutionTime = bound(
      timeAfterExecutionTime,
      0,
      uint256(
        LlamaRelativeHolderQuorum(address(actionInfo.strategy))
          .expirationPeriod()
      )
    );
    vm.prank(disapproverDave);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");

    ActionState state = mpCore.getActionState(actionInfo);
    assertEq(uint8(state), uint8(ActionState.Queued));

    vm.warp(
      actionInfo.strategy.minExecutionTime(actionInfo) + timeAfterExecutionTime
    );

    vm.expectRevert(LlamaCore.CannotDisapproveAfterMinExecutionTime.selector);

    vm.prank(disapproverDrake);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");

    state = mpCore.getActionState(actionInfo);
    assertEq(uint8(state), uint8(ActionState.Queued));

    mpCore.executeAction(actionInfo); // should not revert
  }

  function testFuzz_ReturnQuantity(uint96 quantity) public {
    // We subtract by 3 because total quantity cannot be greater than type(uint96).max.
    // Two other policyholders already have a quantity of 1 and bound is inclusive.
    uint96 boundedQuantity = uint96(bound(quantity, 1, type(uint96).max - 3));
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.Disapprover),
      disapproverDrake,
      boundedQuantity,
      type(uint64).max
    );

    mineBlock();

    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    vm.prank(disapproverDrake);
    uint96 returnedQuantity = mpCore.castDisapproval(
      uint8(Roles.Disapprover),
      actionInfo,
      ""
    );

    assertEq(boundedQuantity, returnedQuantity);
  }
}

contract CastDisapprovalBySig is LlamaCoreTest {
  function createOffchainSignature(
    ActionInfo memory actionInfo,
    uint256 privateKey
  ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
    LlamaCoreSigUtils.CastDisapproval memory castDisapproval = LlamaCoreSigUtils
      .CastDisapproval({
        actionInfo: actionInfo,
        role: uint8(Roles.Disapprover),
        reason: "",
        policyholder: disapproverDrake,
        nonce: 0
      });
    bytes32 digest = getCastDisapprovalTypedDataHash(castDisapproval);
    (v, r, s) = vm.sign(privateKey, digest);
  }

  function castDisapprovalBySig(
    ActionInfo memory actionInfo,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal {
    mpCore.castDisapprovalBySig(
      disapproverDrake,
      uint8(Roles.Disapprover),
      actionInfo,
      "",
      v,
      r,
      s
    );
  }

  function test_CastsDisapprovalBySig() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      disapproverDrakePrivateKey
    );

    vm.expectEmit();
    emit DisapprovalCast(
      actionInfo.id,
      disapproverDrake,
      uint8(Roles.Disapprover),
      1,
      ""
    );

    castDisapprovalBySig(actionInfo, v, r, s);

    assertEq(mpCore.getAction(0).totalDisapprovals, 1);
    assertEq(mpCore.disapprovals(0, disapproverDrake), true);
  }

  function test_CheckNonceIncrements() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      disapproverDrakePrivateKey
    );

    assertEq(
      mpCore.nonces(disapproverDrake, LlamaCore.castDisapprovalBySig.selector),
      0
    );
    castDisapprovalBySig(actionInfo, v, r, s);
    assertEq(
      mpCore.nonces(disapproverDrake, LlamaCore.castDisapprovalBySig.selector),
      1
    );
  }

  function test_OperationCannotBeReplayed() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      disapproverDrakePrivateKey
    );
    castDisapprovalBySig(actionInfo, v, r, s);
    // Invalid Signature error since the recovered signer address during the second call is not the same as policyholder
    // since nonce has increased.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    castDisapprovalBySig(actionInfo, v, r, s);
  }

  function test_RevertIf_SignerIsNotPolicyHolder() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    (, uint256 randomSignerPrivateKey) = makeAddrAndKey("randomSigner");
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      randomSignerPrivateKey
    );
    // Invalid Signature error since the recovered signer address during the second call is not the same as policyholder
    // since nonce has increased.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    castDisapprovalBySig(actionInfo, v, r, s);
  }

  function test_RevertIf_SignerIsZeroAddress() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      disapproverDrakePrivateKey
    );
    // Invalid Signature error since the recovered signer address is zero address due to invalid signature values
    // (v,r,s).
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    castDisapprovalBySig(actionInfo, (v + 1), r, s);
  }

  function test_RevertIf_PolicyholderIncrementsNonce() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      disapproverDrakePrivateKey
    );

    vm.prank(disapproverDrake);
    mpCore.incrementNonce(LlamaCore.castDisapprovalBySig.selector);

    // Invalid Signature error since the recovered signer address during the second call is not the same as policyholder
    // since nonce has increased.
    vm.expectRevert(LlamaCore.InvalidSignature.selector);
    castDisapprovalBySig(actionInfo, v, r, s);
  }

  function test_FailsIfDisapproved() public {
    ActionInfo memory actionInfo = _createApproveAndQueueAction();

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      disapproverDrakePrivateKey
    );

    // First disapproval.
    vm.expectEmit();
    emit DisapprovalCast(
      actionInfo.id,
      disapproverDrake,
      uint8(Roles.Disapprover),
      1,
      ""
    );
    castDisapprovalBySig(actionInfo, v, r, s);
    assertEq(mpCore.getAction(actionInfo.id).totalDisapprovals, 1);

    // Second disapproval.
    vm.prank(disapproverDave);
    mpCore.castDisapproval(uint8(Roles.Disapprover), actionInfo, "");

    // Assertions.
    ActionState state = mpCore.getActionState(actionInfo);
    assertEq(uint8(state), uint8(ActionState.Failed));

    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaCore.InvalidActionState.selector,
        ActionState.Failed
      )
    );
    mpCore.executeAction(actionInfo);
  }

  function test_ActionCreatorCanRelayMessage() public {
    // Testing that ActionCreatorCannotCast() error is not hit
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      true,
      2,
      1,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createActionUsingAbsolutePeerReview(
      absolutePeerReview
    );

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 1 days);

    mpCore.queueAction(actionInfo);

    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      disapproverDrakePrivateKey
    );
    vm.prank(actionCreatorAaron);
    castDisapprovalBySig(actionInfo, v, r, s);
  }

  function test_ReturnQuantity() public {
    uint96 quantity = 77;
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.Disapprover),
      disapproverDrake,
      quantity,
      type(uint64).max
    );

    mineBlock();

    ActionInfo memory actionInfo = _createApproveAndQueueAction();
    (uint8 v, bytes32 r, bytes32 s) = createOffchainSignature(
      actionInfo,
      disapproverDrakePrivateKey
    );
    uint96 returnedQuantity = mpCore.castDisapprovalBySig(
      disapproverDrake,
      uint8(Roles.Disapprover),
      actionInfo,
      "",
      v,
      r,
      s
    );
    assertEq(quantity, returnedQuantity);
  }
}

contract CreateStrategies is LlamaCoreTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaCore.OnlyLlama.selector);
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](3);

    vm.prank(caller);
    mpCore.createStrategies(
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );
  }

  function test_CreateNewStrategies(
    uint256 salt1,
    uint256 salt2,
    uint256 salt3,
    bool isFixedLengthApprovalPeriod
  ) public {
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](3);
    ILlamaStrategy[] memory strategyAddresses = new ILlamaStrategy[](3);
    vm.assume(salt1 != salt2);
    vm.assume(salt1 != salt3);
    vm.assume(salt2 != salt3);

    newStrategies[0] = _createStrategy(salt1, isFixedLengthApprovalPeriod);
    newStrategies[1] = _createStrategy(salt2, isFixedLengthApprovalPeriod);
    newStrategies[2] = _createStrategy(salt3, isFixedLengthApprovalPeriod);

    for (uint256 i = 0; i < newStrategies.length; i++) {
      strategyAddresses[i] = lens.computeLlamaStrategyAddress(
        address(relativeHolderQuorumLogic),
        DeployUtils.encodeStrategy(newStrategies[i]),
        address(mpCore)
      );
    }

    vm.startPrank(address(mpExecutor));

    vm.expectEmit();
    emit StrategyAuthorizationSet(strategyAddresses[0], true);
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddresses[0],
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategy(newStrategies[0])
    );

    vm.expectEmit();
    emit StrategyAuthorizationSet(strategyAddresses[1], true);
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddresses[1],
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategy(newStrategies[1])
    );

    vm.expectEmit();
    emit StrategyAuthorizationSet(strategyAddresses[2], true);
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddresses[2],
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategy(newStrategies[2])
    );

    mpCore.createStrategies(
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );

    assertEqStrategyStatus(mpCore, strategyAddresses[0], true, true);
    assertEqStrategyStatus(mpCore, strategyAddresses[1], true, true);
    assertEqStrategyStatus(mpCore, strategyAddresses[2], true, true);
  }

  function test_CreateNewStrategiesWithAdditionalStrategyLogic() public {
    ILlamaStrategy additionalStrategyLogic = _deployAndAuthorizeAdditionalStrategyLogic();

    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](3);
    ILlamaStrategy[] memory strategyAddresses = new ILlamaStrategy[](3);

    newStrategies[0] = LlamaRelativeStrategyBase.Config({
      approvalPeriod: 4 days,
      queuingPeriod: 14 days,
      expirationPeriod: 3 days,
      isFixedLengthApprovalPeriod: false,
      minApprovalPct: 0,
      minDisapprovalPct: 2000,
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });

    newStrategies[1] = LlamaRelativeStrategyBase.Config({
      approvalPeriod: 5 days,
      queuingPeriod: 14 days,
      expirationPeriod: 3 days,
      isFixedLengthApprovalPeriod: false,
      minApprovalPct: 0,
      minDisapprovalPct: 2000,
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });

    newStrategies[2] = LlamaRelativeStrategyBase.Config({
      approvalPeriod: 6 days,
      queuingPeriod: 14 days,
      expirationPeriod: 3 days,
      isFixedLengthApprovalPeriod: false,
      minApprovalPct: 0,
      minDisapprovalPct: 2000,
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });

    for (uint256 i = 0; i < newStrategies.length; i++) {
      strategyAddresses[i] = lens.computeLlamaStrategyAddress(
        address(additionalStrategyLogic),
        DeployUtils.encodeStrategy(newStrategies[i]),
        address(mpCore)
      );
    }

    vm.startPrank(address(mpExecutor));

    vm.expectEmit();
    emit StrategyAuthorizationSet(strategyAddresses[0], true);
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddresses[0],
      additionalStrategyLogic,
      DeployUtils.encodeStrategy(newStrategies[0])
    );

    vm.expectEmit();
    emit StrategyAuthorizationSet(strategyAddresses[1], true);
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddresses[1],
      additionalStrategyLogic,
      DeployUtils.encodeStrategy(newStrategies[1])
    );

    vm.expectEmit();
    emit StrategyAuthorizationSet(strategyAddresses[2], true);
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddresses[2],
      additionalStrategyLogic,
      DeployUtils.encodeStrategy(newStrategies[2])
    );

    mpCore.createStrategies(
      additionalStrategyLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );

    assertEqStrategyStatus(mpCore, strategyAddresses[0], true, true);
    assertEqStrategyStatus(mpCore, strategyAddresses[1], true, true);
    assertEqStrategyStatus(mpCore, strategyAddresses[2], true, true);
  }

  function test_RevertIf_StrategyLogicNotAuthorized() public {
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](1);

    newStrategies[0] = LlamaRelativeStrategyBase.Config({
      approvalPeriod: 4 days,
      queuingPeriod: 14 days,
      expirationPeriod: 3 days,
      isFixedLengthApprovalPeriod: false,
      minApprovalPct: 0,
      minDisapprovalPct: 2000,
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });

    vm.startPrank(address(mpExecutor));

    vm.expectRevert(LlamaCore.UnauthorizedStrategyLogic.selector);
    mpCore.createStrategies(
      ILlamaStrategy(randomLogicAddress),
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );
  }

  function test_RevertIf_StrategiesAreIdentical() public {
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](2);

    LlamaRelativeStrategyBase.Config
      memory duplicateStrategy = LlamaRelativeStrategyBase.Config({
        approvalPeriod: 4 days,
        queuingPeriod: 14 days,
        expirationPeriod: 3 days,
        isFixedLengthApprovalPeriod: false,
        minApprovalPct: 0,
        minDisapprovalPct: 2000,
        approvalRole: uint8(Roles.Approver),
        disapprovalRole: uint8(Roles.Disapprover),
        forceApprovalRoles: new uint8[](0),
        forceDisapprovalRoles: new uint8[](0)
      });

    newStrategies[0] = duplicateStrategy;
    newStrategies[1] = duplicateStrategy;

    vm.startPrank(address(mpExecutor));

    vm.expectRevert(Errors.FailedDeployment.selector);
    mpCore.createStrategies(
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );
  }

  function test_RevertIf_IdenticalStrategyIsAlreadyDeployed() public {
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies1 = new LlamaRelativeStrategyBase.Config[](1);
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies2 = new LlamaRelativeStrategyBase.Config[](1);

    LlamaRelativeStrategyBase.Config
      memory duplicateStrategy = LlamaRelativeStrategyBase.Config({
        approvalPeriod: 4 days,
        queuingPeriod: 14 days,
        expirationPeriod: 3 days,
        isFixedLengthApprovalPeriod: false,
        minApprovalPct: 0,
        minDisapprovalPct: 2000,
        approvalRole: uint8(Roles.Approver),
        disapprovalRole: uint8(Roles.Disapprover),
        forceApprovalRoles: new uint8[](0),
        forceDisapprovalRoles: new uint8[](0)
      });

    newStrategies1[0] = duplicateStrategy;
    newStrategies2[0] = duplicateStrategy;

    vm.startPrank(address(mpExecutor));
    mpCore.createStrategies(
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies1)
    );

    vm.expectRevert(Errors.FailedDeployment.selector);
    mpCore.createStrategies(
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies2)
    );
  }

  function test_CanBeCalledByASuccessfulAction() public {
    address actionCreatorAustin = makeAddr("actionCreatorAustin");

    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](1);

    newStrategies[0] = LlamaRelativeStrategyBase.Config({
      approvalPeriod: 4 days,
      queuingPeriod: 14 days,
      expirationPeriod: 3 days,
      isFixedLengthApprovalPeriod: false,
      minApprovalPct: 0,
      minDisapprovalPct: 2000,
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });

    ILlamaStrategy strategyAddress = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      DeployUtils.encodeStrategy(newStrategies[0]),
      address(mpCore)
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    bytes memory data = abi.encodeCall(
      LlamaCore.createStrategies,
      (
        relativeHolderQuorumLogic,
        DeployUtils.encodeStrategyConfigs(newStrategies)
      )
    );
    vm.prank(actionCreatorAustin);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mpCore),
      0,
      data,
      ""
    );
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAustin,
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mpCore),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    mpCore.executeAction(actionInfo);

    assertEqStrategyStatus(mpCore, strategyAddress, true, true);
  }

  function test_RevertIf_StrategyLogicIsZeroAddress() public {
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](1);

    newStrategies[0] = LlamaRelativeStrategyBase.Config({
      approvalPeriod: 4 days,
      queuingPeriod: 14 days,
      expirationPeriod: 3 days,
      isFixedLengthApprovalPeriod: false,
      minApprovalPct: 0,
      minDisapprovalPct: 2000,
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });

    vm.startPrank(address(mpExecutor));

    mpCore.setStrategyLogicAuthorization(ILlamaStrategy(address(0)), true);

    vm.expectRevert();
    mpCore.createStrategies(
      ILlamaStrategy(address(0)),
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );
  }

  function test_ActionCanBeCreatedQueuedAndExecutedInOneBlock() public {
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](1);

    newStrategies[0] = LlamaRelativeStrategyBase.Config({
      approvalPeriod: 0,
      queuingPeriod: 0,
      expirationPeriod: 2 days,
      isFixedLengthApprovalPeriod: false,
      minApprovalPct: 0,
      minDisapprovalPct: 10_001,
      approvalRole: uint8(Roles.Approver),
      disapprovalRole: uint8(Roles.Disapprover),
      forceApprovalRoles: new uint8[](0),
      forceDisapprovalRoles: new uint8[](0)
    });

    ILlamaStrategy strategyAddress = lens.computeLlamaStrategyAddress(
      address(relativeQuantityQuorumLogic),
      DeployUtils.encodeStrategy(newStrategies[0]),
      address(mpCore)
    );
    PermissionData memory newPermissionData = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      strategyAddress
    );
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));

    vm.startPrank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(relativeQuantityQuorumLogic, true);
    mpCore.createStrategies(
      relativeQuantityQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      newPermissionData,
      true
    );
    vm.stopPrank();

    mineBlock();

    uint256 preExecutionTimestamp = block.timestamp;

    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      strategyAddress,
      address(mockProtocol),
      0,
      data,
      ""
    );

    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      strategyAddress,
      address(mockProtocol),
      0,
      data
    );
    mpCore.queueAction(actionInfo);
    mpCore.executeAction(actionInfo);

    uint256 postExecutionTimestamp = block.timestamp;
    assertEq(postExecutionTimestamp, preExecutionTimestamp);
  }
}

contract SetStrategyAuthorization is LlamaCoreTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaCore.OnlyLlama.selector);
    vm.prank(caller);
    mpCore.setStrategyAuthorization(mpStrategy1, false);
  }

  function testFuzz_RevertIf_StrategyIsNotAlreadyDeployed(
    address strategy
  ) public {
    (bool strategyDeployed, ) = mpCore.strategies(ILlamaStrategy(strategy));
    vm.assume(!strategyDeployed);
    vm.expectRevert(LlamaCore.NonExistentStrategy.selector);
    vm.prank(address(mpExecutor));
    mpCore.setStrategyAuthorization(ILlamaStrategy(strategy), true);
  }

  function test_UnauthorizeStrategy() public {
    assertEqStrategyStatus(mpCore, mpStrategy1, true, true);

    vm.prank(address(mpExecutor));
    mpCore.setStrategyAuthorization(mpStrategy1, false);
    assertEqStrategyStatus(mpCore, mpStrategy1, true, false);
  }

  function test_ReauthorizeStrategy() public {
    assertEqStrategyStatus(mpCore, mpStrategy1, true, true);

    vm.startPrank(address(mpExecutor));
    mpCore.setStrategyAuthorization(mpStrategy1, false);
    assertEqStrategyStatus(mpCore, mpStrategy1, true, false);

    mpCore.setStrategyAuthorization(mpStrategy1, true);
    assertEqStrategyStatus(mpCore, mpStrategy1, true, true);
    vm.stopPrank();
  }

  function test_EmitsStrategyAuthorizedEvent() public {
    vm.startPrank(address(mpExecutor));
    vm.expectEmit();
    emit StrategyAuthorizationSet(mpStrategy1, false);
    mpCore.setStrategyAuthorization(mpStrategy1, false);

    vm.expectEmit();
    emit StrategyAuthorizationSet(mpStrategy1, true);
    mpCore.setStrategyAuthorization(mpStrategy1, true);

    vm.expectEmit();
    emit StrategyAuthorizationSet(mpStrategy2, false);
    mpCore.setStrategyAuthorization(mpStrategy2, false);

    vm.expectEmit();
    emit StrategyAuthorizationSet(mpStrategy2, true);
    mpCore.setStrategyAuthorization(mpStrategy2, true);
    vm.stopPrank();
  }
}

contract CreateAccounts is LlamaCoreTest {
  function encodeMockAccount(
    MockAccountLogicContract.Config memory account
  ) internal pure returns (bytes memory encoded) {
    encoded = abi.encode(account);
  }

  function encodeMockAccountConfigs(
    MockAccountLogicContract.Config[] memory accounts
  ) internal pure returns (bytes[] memory encoded) {
    encoded = new bytes[](accounts.length);
    for (uint256 i = 0; i < accounts.length; i++) {
      encoded[i] = encodeMockAccount(accounts[i]);
    }
  }

  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaCore.OnlyLlama.selector);

    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](3);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount2"});
    newAccounts[1] = LlamaAccount.Config({name: "LlamaAccount3"});
    newAccounts[2] = LlamaAccount.Config({name: "LlamaAccount4"});

    vm.prank(caller);
    mpCore.createAccounts(
      accountLogic,
      DeployUtils.encodeAccountConfigs(newAccounts)
    );
  }

  function test_CreateNewAccounts() public {
    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](3);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount2"});
    newAccounts[1] = LlamaAccount.Config({name: "LlamaAccount3"});
    newAccounts[2] = LlamaAccount.Config({name: "LlamaAccount4"});

    ILlamaAccount[] memory accountAddresses = new ILlamaAccount[](3);

    for (uint256 i; i < newAccounts.length; i++) {
      accountAddresses[i] = lens.computeLlamaAccountAddress(
        address(accountLogic),
        DeployUtils.encodeAccount(newAccounts[i]),
        address(mpCore)
      );
    }

    vm.expectEmit();
    emit AccountCreated(
      accountAddresses[0],
      accountLogic,
      DeployUtils.encodeAccount(newAccounts[0])
    );
    vm.expectEmit();
    emit AccountCreated(
      accountAddresses[1],
      accountLogic,
      DeployUtils.encodeAccount(newAccounts[1])
    );
    vm.expectEmit();
    emit AccountCreated(
      accountAddresses[2],
      accountLogic,
      DeployUtils.encodeAccount(newAccounts[2])
    );

    vm.prank(address(mpExecutor));
    mpCore.createAccounts(
      accountLogic,
      DeployUtils.encodeAccountConfigs(newAccounts)
    );
  }

  function test_CreateNewAccountsWithAdditionalAccountLogic() public {
    ILlamaAccount additionalAccountLogic = _deployAndAuthorizeAdditionalAccountLogic();

    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](3);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount2"});
    newAccounts[1] = LlamaAccount.Config({name: "LlamaAccount3"});
    newAccounts[2] = LlamaAccount.Config({name: "LlamaAccount4"});

    ILlamaAccount[] memory accountAddresses = new ILlamaAccount[](3);

    for (uint256 i; i < newAccounts.length; i++) {
      accountAddresses[i] = lens.computeLlamaAccountAddress(
        address(additionalAccountLogic),
        DeployUtils.encodeAccount(newAccounts[i]),
        address(mpCore)
      );
    }

    vm.expectEmit();
    emit AccountCreated(
      accountAddresses[0],
      additionalAccountLogic,
      DeployUtils.encodeAccount(newAccounts[0])
    );
    vm.expectEmit();
    emit AccountCreated(
      accountAddresses[1],
      additionalAccountLogic,
      DeployUtils.encodeAccount(newAccounts[1])
    );
    vm.expectEmit();
    emit AccountCreated(
      accountAddresses[2],
      additionalAccountLogic,
      DeployUtils.encodeAccount(newAccounts[2])
    );

    vm.prank(address(mpExecutor));
    mpCore.createAccounts(
      additionalAccountLogic,
      DeployUtils.encodeAccountConfigs(newAccounts)
    );
  }

  function test_CreateNewAccountsWithMockAccountLogic() public {
    ILlamaAccount mockAccountLogic = _deployAndAuthorizeMockAccountLogic();

    MockAccountLogicContract.Config[]
      memory newAccounts = new MockAccountLogicContract.Config[](1);
    newAccounts[0] = MockAccountLogicContract.Config({
      creationTime: block.timestamp
    });

    ILlamaAccount[] memory accountAddresses = new ILlamaAccount[](1);

    for (uint256 i; i < newAccounts.length; i++) {
      accountAddresses[i] = lens.computeLlamaAccountAddress(
        address(mockAccountLogic),
        encodeMockAccount(newAccounts[i]),
        address(mpCore)
      );
    }

    vm.expectEmit();
    emit AccountCreated(
      accountAddresses[0],
      mockAccountLogic,
      encodeMockAccount(newAccounts[0])
    );

    vm.prank(address(mpExecutor));
    mpCore.createAccounts(
      mockAccountLogic,
      encodeMockAccountConfigs(newAccounts)
    );

    assertEq(
      MockAccountLogicContract(address(accountAddresses[0])).creationTime(),
      block.timestamp
    );
  }

  function test_RevertIf_AccountLogicNotAuthorized() public {
    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](3);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount2"});
    newAccounts[1] = LlamaAccount.Config({name: "LlamaAccount3"});
    newAccounts[2] = LlamaAccount.Config({name: "LlamaAccount4"});

    vm.expectRevert(LlamaCore.UnauthorizedAccountLogic.selector);
    vm.prank(address(mpExecutor));
    mpCore.createAccounts(
      ILlamaAccount(randomLogicAddress),
      DeployUtils.encodeAccountConfigs(newAccounts)
    );
  }

  function test_RevertIf_AccountLogicUnauthorized() public {
    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](3);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount2"});
    newAccounts[1] = LlamaAccount.Config({name: "LlamaAccount3"});
    newAccounts[2] = LlamaAccount.Config({name: "LlamaAccount4"});

    vm.prank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(ILlamaAccount(accountLogic), false);

    vm.expectRevert(LlamaCore.UnauthorizedAccountLogic.selector);
    vm.prank(address(mpExecutor));
    mpCore.createAccounts(
      ILlamaAccount(accountLogic),
      DeployUtils.encodeAccountConfigs(newAccounts)
    );
  }

  function test_RevertIf_Reinitialized() public {
    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](3);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount2"});
    newAccounts[1] = LlamaAccount.Config({name: "LlamaAccount3"});
    newAccounts[2] = LlamaAccount.Config({name: "LlamaAccount4"});

    ILlamaAccount[] memory accountAddresses = new ILlamaAccount[](3);

    for (uint256 i; i < newAccounts.length; i++) {
      accountAddresses[i] = lens.computeLlamaAccountAddress(
        address(accountLogic),
        DeployUtils.encodeAccount(newAccounts[i]),
        address(mpCore)
      );
    }

    vm.startPrank(address(mpExecutor));
    mpCore.createAccounts(
      accountLogic,
      DeployUtils.encodeAccountConfigs(newAccounts)
    );

    vm.expectRevert(Initializable.InvalidInitialization.selector);
    accountAddresses[0].initialize(DeployUtils.encodeAccount(newAccounts[0]));

    vm.expectRevert(Initializable.InvalidInitialization.selector);
    accountAddresses[1].initialize(DeployUtils.encodeAccount(newAccounts[1]));

    vm.expectRevert(Initializable.InvalidInitialization.selector);
    accountAddresses[2].initialize(DeployUtils.encodeAccount(newAccounts[2]));
  }

  function test_RevertIf_AccountsAreIdentical() public {
    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](2);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount1"});
    newAccounts[1] = LlamaAccount.Config({name: "LlamaAccount1"});

    vm.prank(address(mpExecutor));
    vm.expectRevert(Errors.FailedDeployment.selector);
    mpCore.createAccounts(
      accountLogic,
      DeployUtils.encodeAccountConfigs(newAccounts)
    );
  }

  function test_RevertIf_IdenticalAccountIsAlreadyDeployed() public {
    LlamaAccount.Config[] memory newAccounts1 = new LlamaAccount.Config[](1);
    newAccounts1[0] = LlamaAccount.Config({name: "LlamaAccount1"});
    LlamaAccount.Config[] memory newAccounts2 = new LlamaAccount.Config[](1);
    newAccounts2[0] = LlamaAccount.Config({name: "LlamaAccount1"});

    vm.startPrank(address(mpExecutor));
    mpCore.createAccounts(
      accountLogic,
      DeployUtils.encodeAccountConfigs(newAccounts1)
    );

    vm.expectRevert(Errors.FailedDeployment.selector);
    mpCore.createAccounts(
      accountLogic,
      DeployUtils.encodeAccountConfigs(newAccounts2)
    );
  }

  function test_CanBeCalledByASuccessfulAction() public {
    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](1);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount1"});
    address actionCreatorAustin = makeAddr("actionCreatorAustin");

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );

    ILlamaAccount accountAddress = lens.computeLlamaAccountAddress(
      address(accountLogic),
      DeployUtils.encodeAccount(newAccounts[0]),
      address(mpCore)
    );

    bytes memory data = abi.encodeCall(
      LlamaCore.createAccounts,
      (accountLogic, DeployUtils.encodeAccountConfigs(newAccounts))
    );
    vm.prank(actionCreatorAustin);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mpCore),
      0,
      data,
      ""
    );
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAustin,
      uint8(Roles.TestRole2),
      mpStrategy1,
      address(mpCore),
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    mpCore.queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.expectEmit();
    emit AccountCreated(
      accountAddress,
      accountLogic,
      DeployUtils.encodeAccount(newAccounts[0])
    );
    mpCore.executeAction(actionInfo);
  }

  function test_CanBeReauthorized() public {
    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](3);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount2"});
    newAccounts[1] = LlamaAccount.Config({name: "LlamaAccount3"});
    newAccounts[2] = LlamaAccount.Config({name: "LlamaAccount4"});

    ILlamaAccount accountAddress = lens.computeLlamaAccountAddress(
      address(accountLogic),
      DeployUtils.encodeAccount(newAccounts[0]),
      address(mpCore)
    );
    ILlamaAccount accountAddress1 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      DeployUtils.encodeAccount(newAccounts[1]),
      address(mpCore)
    );
    ILlamaAccount accountAddress2 = lens.computeLlamaAccountAddress(
      address(accountLogic),
      DeployUtils.encodeAccount(newAccounts[2]),
      address(mpCore)
    );

    vm.prank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(ILlamaAccount(accountLogic), false);

    vm.expectRevert(LlamaCore.UnauthorizedAccountLogic.selector);
    vm.prank(address(mpExecutor));
    mpCore.createAccounts(
      ILlamaAccount(accountLogic),
      DeployUtils.encodeAccountConfigs(newAccounts)
    );

    vm.prank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(ILlamaAccount(accountLogic), true);

    vm.expectEmit();
    emit AccountCreated(
      accountAddress,
      accountLogic,
      DeployUtils.encodeAccount(newAccounts[0])
    );
    emit AccountCreated(
      accountAddress1,
      accountLogic,
      DeployUtils.encodeAccount(newAccounts[1])
    );
    emit AccountCreated(
      accountAddress2,
      accountLogic,
      DeployUtils.encodeAccount(newAccounts[2])
    );
    vm.prank(address(mpExecutor));
    mpCore.createAccounts(
      ILlamaAccount(accountLogic),
      DeployUtils.encodeAccountConfigs(newAccounts)
    );
  }

  function test_RevertIf_AccountLogicIsZeroAddress() public {
    LlamaAccount.Config[] memory newAccounts = new LlamaAccount.Config[](1);
    newAccounts[0] = LlamaAccount.Config({name: "LlamaAccount2"});

    vm.prank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(ILlamaAccount(address(0)), true);

    vm.expectRevert();
    mpCore.createAccounts(
      ILlamaAccount(address(0)),
      DeployUtils.encodeAccountConfigs(newAccounts)
    );
  }
}

contract SetGuard is LlamaCoreTest {
  event ActionGuardSet(
    address indexed target,
    bytes4 indexed selector,
    ILlamaActionGuard actionGuard
  );

  function testFuzz_RevertIf_CallerIsNotLlama(
    address caller,
    address target,
    bytes4 selector,
    ILlamaActionGuard guard
  ) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaCore.OnlyLlama.selector);
    vm.prank(caller);
    mpCore.setGuard(target, selector, guard);
  }

  function testFuzz_UpdatesGuardAndEmitsActionGuardSetEvent(
    address target,
    bytes4 selector,
    ILlamaActionGuard guard
  ) public {
    vm.assume(target != address(mpCore) && target != address(mpPolicy));
    vm.prank(address(mpExecutor));
    vm.expectEmit();
    emit ActionGuardSet(target, selector, guard);
    mpCore.setGuard(target, selector, guard);
    assertEq(address(mpCore.actionGuard(target, selector)), address(guard));
  }

  function testFuzz_RevertIf_TargetIsCore(
    bytes4 selector,
    ILlamaActionGuard guard
  ) public {
    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaCore.RestrictedAddress.selector);
    mpCore.setGuard(address(mpCore), selector, guard);
  }

  function testFuzz_RevertIf_TargetIsPolicy(
    bytes4 selector,
    ILlamaActionGuard guard
  ) public {
    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaCore.RestrictedAddress.selector);
    mpCore.setGuard(address(mpPolicy), selector, guard);
  }

  function test_GuardIsSetAtActionCreation() external {
    ILlamaActionGuard guard = ILlamaActionGuard(
      new MockActionGuard(true, false, true, "no action pre-execution")
    );
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));

    vm.prank(address(mpExecutor));
    mpCore.setGuard(address(mockProtocol), bytes4(data), guard);

    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );
    Action memory action = mpCore.getAction(actionId);
    assertEq(address(guard), address(action.guard));
  }

  function test_GuardIsZeroAddressIfDoesNotExist() external {
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));

    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      address(mockProtocol),
      0,
      data,
      ""
    );
    Action memory action = mpCore.getAction(actionId);
    assertEq(address(0), address(action.guard));
  }

  function test_GuardCannotBeEnabledDuringAction() external {
    ILlamaActionGuard guard = ILlamaActionGuard(
      new MockActionGuard(true, false, false, "no action pre or post-execution")
    );
    ActionInfo memory actionInfo = _createAction();

    vm.prank(address(mpExecutor));
    mpCore.setGuard(address(mockProtocol), MockProtocol.pause.selector, guard);

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    _queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    _executeAction(actionInfo);
  }

  function test_GuardCannotBeDisabledDuringAction() external {
    ILlamaActionGuard guard = ILlamaActionGuard(
      new MockActionGuard(true, true, false, "no action post-execution")
    );
    vm.prank(address(mpExecutor));
    mpCore.setGuard(address(mockProtocol), MockProtocol.pause.selector, guard);

    ActionInfo memory actionInfo = _createAction();

    vm.prank(address(mpExecutor));
    mpCore.setGuard(
      address(mockProtocol),
      MockProtocol.pause.selector,
      ILlamaActionGuard(address(0))
    );

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    _queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    vm.expectRevert("no action post-execution");
    mpCore.executeAction(actionInfo);
  }
}

contract AuthorizeScript is LlamaCoreTest {
  function testFuzz_RevertIf_CallerIsNotLlama(
    address caller,
    address script,
    bool authorized
  ) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaCore.OnlyLlama.selector);
    vm.prank(caller);
    mpCore.setScriptAuthorization(script, authorized);
  }

  function testFuzz_UpdatesScriptMappingAndEmitsScriptAuthorizationSetEvent(
    address script,
    bool authorized
  ) public {
    vm.assume(
      script != address(mpCore) &&
        script != address(mpPolicy) &&
        script != address(mpExecutor)
    );
    vm.prank(address(mpExecutor));
    vm.expectEmit();
    emit ScriptAuthorizationSet(script, authorized);
    mpCore.setScriptAuthorization(script, authorized);
    assertEq(mpCore.authorizedScripts(script), authorized);
  }

  function testFuzz_RevertIf_ScriptIsCore(bool authorized) public {
    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaCore.RestrictedAddress.selector);
    mpCore.setScriptAuthorization(address(mpCore), authorized);
  }

  function testFuzz_RevertIf_ScriptIsPolicy(bool authorized) public {
    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaCore.RestrictedAddress.selector);
    mpCore.setScriptAuthorization(address(mpPolicy), authorized);
  }
}

contract IncrementNonce is LlamaCoreTest {
  using stdStorage for StdStorage;

  function testFuzz_IncrementsNonceForAllCallersAndSelectors(
    address caller,
    bytes4 selector,
    uint256 initialNonce
  ) public {
    initialNonce = bound(initialNonce, 0, type(uint256).max - 1);
    stdstore
      .target(address(mpCore))
      .sig(mpCore.nonces.selector)
      .with_key(caller)
      .with_key(selector)
      .checked_write(initialNonce);

    assertEq(mpCore.nonces(caller, selector), initialNonce);
    vm.prank(caller);
    mpCore.incrementNonce(selector);
    assertEq(mpCore.nonces(caller, selector), initialNonce + 1);
  }
}

contract GetActionState is LlamaCoreTest {
  function testFuzz_RevertsOnInvalidAction(
    ActionInfo calldata actionInfo
  ) public {
    vm.expectRevert(LlamaCore.InfoHashMismatch.selector);
    mpCore.getActionState(actionInfo);
  }

  function test_CanceledActionsHaveStateCanceled() public {
    ActionInfo memory actionInfo = _createAction();
    vm.prank(actionCreatorAaron);
    mpCore.cancelAction(actionInfo);

    uint256 currentState = uint256(mpCore.getActionState(actionInfo));
    uint256 canceledState = uint256(ActionState.Canceled);
    assertEq(currentState, canceledState);
  }

  function test_UnpassedActionsPriorToApprovalPeriodEndHaveStateActive()
    public
  {
    address actionCreatorAustin = makeAddr("actionCreatorAustin");

    vm.startPrank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    vm.stopPrank();

    vm.prank(actionCreatorAustin);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole2),
      mpStrategy2,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true)),
      ""
    );

    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAustin,
      uint8(Roles.TestRole2),
      mpStrategy2,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true))
    );

    uint256 currentState = uint256(mpCore.getActionState(actionInfo));
    uint256 activeState = uint256(ActionState.Active);
    assertEq(currentState, activeState);
  }

  function test_ApprovedActionsWithFixedLengthHaveStateActive() public {
    ActionInfo memory actionInfo = _createAction();
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 1 days);

    uint256 currentState = uint256(mpCore.getActionState(actionInfo));
    uint256 activeState = uint256(ActionState.Active);
    assertEq(currentState, activeState);
  }

  function test_PassedActionsQueueOnPassingApproval() public {
    address actionCreatorAustin = makeAddr("actionCreatorAustin");

    vm.startPrank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole2),
      actionCreatorAustin,
      DEFAULT_ROLE_QTY,
      DEFAULT_ROLE_EXPIRATION
    );
    vm.stopPrank();

    vm.prank(actionCreatorAustin);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole2),
      mpStrategy2,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true)),
      ""
    );
    vm.warp(block.timestamp + 1);

    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAustin,
      uint8(Roles.TestRole2),
      mpStrategy2,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true))
    );

    uint256 currentState = uint256(mpCore.getActionState(actionInfo));
    uint256 activeState = uint256(ActionState.Active);
    assertEq(currentState, activeState);

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);
    _approveAction(approverAndy, actionInfo);

    currentState = uint256(mpCore.getActionState(actionInfo));
    uint256 queuedState = uint256(ActionState.Queued);
    assertEq(currentState, queuedState);
  }

  function testFuzz_ApprovedActionsHaveStateApproved(
    uint256 _timeSinceCreation
  ) public {
    ActionInfo memory actionInfo = _createAction();
    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    uint256 approvalEndTime = toRelativeQuorum(actionInfo.strategy)
      .approvalEndTime(actionInfo);
    vm.assume(
      _timeSinceCreation < toRelativeQuorum(mpStrategy1).approvalPeriod() * 2
    );
    vm.warp(block.timestamp + _timeSinceCreation);

    uint256 currentState = uint256(mpCore.getActionState(actionInfo));
    uint256 expectedState = uint256(
      block.timestamp < approvalEndTime
        ? ActionState.Active
        : ActionState.Approved
    );
    assertEq(currentState, expectedState);
  }

  function test_QueuedActionsHaveStateQueued() public {
    ActionInfo memory actionInfo = _createAction();

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), true);
    _queueAction(actionInfo);

    uint256 currentState = uint256(mpCore.getActionState(actionInfo));
    uint256 queuedState = uint256(ActionState.Queued);
    assertEq(currentState, queuedState);
  }

  function test_ExecutedActionsHaveStateExecuted() public {
    ActionInfo memory actionInfo = _createAction();

    _approveAction(approverAdam, actionInfo);
    _approveAction(approverAlicia, actionInfo);

    vm.warp(block.timestamp + 6 days);

    assertEq(mpStrategy1.isActionApproved(actionInfo), true);
    _queueAction(actionInfo);

    _disapproveAction(disapproverDave, actionInfo);

    vm.warp(block.timestamp + 5 days);

    _executeAction(actionInfo);

    uint256 currentState = uint256(mpCore.getActionState(actionInfo));
    uint256 executedState = uint256(ActionState.Executed);
    assertEq(currentState, executedState);
  }

  function test_RejectedActionsHaveStateFailed() public {
    ActionInfo memory actionInfo = _createAction();
    vm.warp(block.timestamp + 12 days);

    uint256 currentState = uint256(mpCore.getActionState(actionInfo));
    uint256 failedState = uint256(ActionState.Failed);
    assertEq(currentState, failedState);
  }
}

contract SetAccountLogicAuthorization is LlamaCoreTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address _caller) public {
    vm.assume(_caller != address(mpExecutor));
    vm.expectRevert(LlamaCore.OnlyLlama.selector);
    vm.prank(_caller);
    mpCore.setAccountLogicAuthorization(
      ILlamaAccount(randomLogicAddress),
      true
    );
  }

  function test_SetsValueInStorageMappingToTrue() public {
    assertEq(
      mpCore.authorizedAccountLogics(ILlamaAccount(randomLogicAddress)),
      false
    );
    vm.prank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(
      ILlamaAccount(randomLogicAddress),
      true
    );
    assertEq(
      mpCore.authorizedAccountLogics(ILlamaAccount(randomLogicAddress)),
      true
    );
  }

  function test_SetsValueInStorageMappingToFalse() public {
    vm.prank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(
      ILlamaAccount(randomLogicAddress),
      true
    );
    assertEq(
      mpCore.authorizedAccountLogics(ILlamaAccount(randomLogicAddress)),
      true
    );

    vm.prank(address(mpExecutor));
    mpCore.setAccountLogicAuthorization(
      ILlamaAccount(randomLogicAddress),
      false
    );
    assertEq(
      mpCore.authorizedAccountLogics(ILlamaAccount(randomLogicAddress)),
      false
    );
  }

  function test_EmitsAccountLogicAuthorizationSetEvent() public {
    vm.prank(address(mpExecutor));
    vm.expectEmit();
    emit AccountLogicAuthorizationSet(ILlamaAccount(randomLogicAddress), true);
    mpCore.setAccountLogicAuthorization(
      ILlamaAccount(randomLogicAddress),
      true
    );
  }
}

contract SetStrategyLogicAuthorization is LlamaCoreTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address _caller) public {
    vm.assume(_caller != address(mpExecutor));
    vm.expectRevert(LlamaCore.OnlyLlama.selector);
    vm.prank(_caller);
    mpCore.setStrategyLogicAuthorization(
      ILlamaStrategy(randomLogicAddress),
      true
    );
  }

  function test_RevertIf_StrategyLogicUnauthorized() public {
    uint256 salt = 0;
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](1);
    newStrategies[0] = _createStrategy(salt, true);

    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaCore.UnauthorizedStrategyLogic.selector);
    mpCore.createStrategies(
      ILlamaStrategy(randomLogicAddress),
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );
  }

  function test_SetsValueInStorageMappingToTrue() public {
    assertEq(
      mpCore.authorizedStrategyLogics(ILlamaStrategy(randomLogicAddress)),
      false
    );
    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(
      ILlamaStrategy(randomLogicAddress),
      true
    );
    assertEq(
      mpCore.authorizedStrategyLogics(ILlamaStrategy(randomLogicAddress)),
      true
    );
  }

  function test_SetsValueInStorageMappingToFalse() public {
    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(
      ILlamaStrategy(randomLogicAddress),
      true
    );
    assertEq(
      mpCore.authorizedStrategyLogics(ILlamaStrategy(randomLogicAddress)),
      true
    );

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(
      ILlamaStrategy(randomLogicAddress),
      false
    );
    assertEq(
      mpCore.authorizedStrategyLogics(ILlamaStrategy(randomLogicAddress)),
      false
    );
  }

  function test_CanBeReauthorized() public {
    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(relativeHolderQuorumLogic, false);

    uint256 salt = 0;
    LlamaRelativeStrategyBase.Config[]
      memory newStrategies = new LlamaRelativeStrategyBase.Config[](1);
    newStrategies[0] = _createStrategy(salt, true);
    ILlamaStrategy[] memory strategyAddresses = new ILlamaStrategy[](1);
    strategyAddresses[0] = lens.computeLlamaStrategyAddress(
      address(relativeHolderQuorumLogic),
      DeployUtils.encodeStrategy(newStrategies[0]),
      address(mpCore)
    );

    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaCore.UnauthorizedStrategyLogic.selector);
    mpCore.createStrategies(
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(relativeHolderQuorumLogic, true);

    vm.prank(address(mpExecutor));
    vm.expectEmit();
    emit StrategyCreated(
      strategyAddresses[0],
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategy(newStrategies[0])
    );
    mpCore.createStrategies(
      relativeHolderQuorumLogic,
      DeployUtils.encodeStrategyConfigs(newStrategies)
    );
  }

  function test_EmitsStrategyLogicAuthorizedEvent() public {
    vm.prank(address(mpExecutor));
    vm.expectEmit();
    emit StrategyLogicAuthorizationSet(
      ILlamaStrategy(randomLogicAddress),
      true
    );
    mpCore.setStrategyLogicAuthorization(
      ILlamaStrategy(randomLogicAddress),
      true
    );
  }
}

contract LlamaCoreHarness is LlamaCore {
  function infoHash_exposed(
    ActionInfo calldata actionInfo
  ) external pure returns (bytes32) {
    return _infoHash(actionInfo);
  }

  function exposed_newCastCount(
    uint96 currentCount,
    uint96 quantity
  ) external pure returns (uint96) {
    return _newCastCount(currentCount, quantity);
  }
}

contract InfoHash is LlamaCoreTest {
  LlamaCoreHarness llamaCoreHarness;

  function setUp() public override {
    llamaCoreHarness = new LlamaCoreHarness();
  }

  function testFuzz_InfoHashIsDefinedAsHashingThePackedStruct(
    ActionInfo calldata actionInfo
  ) public {
    bytes32 infoHash1 = llamaCoreHarness.infoHash_exposed(actionInfo);
    bytes32 infoHash2 = keccak256(
      abi.encodePacked(
        actionInfo.id,
        actionInfo.creator,
        actionInfo.creatorRole,
        actionInfo.strategy,
        actionInfo.target,
        actionInfo.value,
        actionInfo.data
      )
    );
    assertEq(infoHash1, infoHash2);
  }
}

contract NewCastCount is LlamaCoreTest {
  LlamaCoreHarness llamaCoreHarness;

  function setUp() public override {
    llamaCoreHarness = new LlamaCoreHarness();
  }

  function testFuzz_NewCastCountIsUint96OverflowResistant(
    uint96 currentCount,
    uint96 quantity
  ) public {
    // Ensure the sum of the inputs doesn't overflow a uint256.
    uint256 sum = uint256(currentCount) + quantity;
    uint256 expectedCount = sum >= type(uint96).max ? type(uint96).max : sum;
    assertEq(
      expectedCount,
      llamaCoreHarness.exposed_newCastCount(currentCount, quantity)
    );
  }
}
