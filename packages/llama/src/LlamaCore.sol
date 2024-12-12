// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {ILlamaActionGuard} from "@llama/src/interfaces/ILlamaActionGuard.sol";
import {ILlamaPolicyMetadata} from "@llama/src/interfaces/ILlamaPolicyMetadata.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionState} from "@llama/src/lib/Enums.sol";
import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";
import {Action, ActionInfo, LlamaInstanceConfig, LlamaPolicyConfig, PermissionData, RoleHolderData, RolePermissionData} from "@llama/src/lib/Structs.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

/// @title Llama Core
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice Manages the action process from creation to execution.
contract LlamaCore is Initializable {
  // =========================
  // ======== Structs ========
  // =========================

  /// @dev Stores the two different status values for a strategy.
  struct StrategyStatus {
    bool deployed; // Whether or not the strategy has been deployed from this `LlamaCore`.
    bool authorized; // Whether or not the strategy has been authorized for action creations in this `LlamaCore`.
  }

  // ======================================
  // ======== Errors and Modifiers ========
  // ======================================

  /// @dev Bootstrap strategy must be deployed and authorized during initialization.
  /// @dev This should never be thrown in production.
  error BootstrapStrategyNotAuthorized();

  /// @dev Policyholder cannot cast if it has 0 quantity of role.
  /// @param policyholder Address of policyholder.
  /// @param role The role being used in the cast.
  error CannotCastWithZeroQuantity(address policyholder, uint8 role);

  /// @dev Policyholder cannot cast after the minimum execution time.
  error CannotDisapproveAfterMinExecutionTime();

  /// @dev An action's target contract cannot be the executor.
  error CannotSetExecutorAsTarget();

  /// @dev Address cannot be used.
  error RestrictedAddress();

  /// @dev Policyholders can only cast once.
  error DuplicateCast();

  /// @dev Action execution failed.
  /// @param reason Data returned by the function called by the action.
  error FailedActionExecution(bytes reason);

  /// @dev `ActionInfo` does not hash to the correct value.
  error InfoHashMismatch();

  /// @dev `msg.value` does not equal the action's value.
  error IncorrectMsgValue();

  /// @dev The action is not in the expected state.
  /// @param current The current state of the action.
  error InvalidActionState(ActionState current);

  /// @dev The policyholder does not have the role at action creation time.
  error InvalidPolicyholder();

  /// @dev The recovered signer does not match the expected policyholder.
  error InvalidSignature();

  /// @dev An action cannot queue successfully if it's `minExecutionTime` is less than `block.timestamp`.
  error MinExecutionTimeCannotBeInThePast();

  /// @dev The provided strategy address does not map to a deployed strategy.
  error NonExistentStrategy();

  /// @dev Only callable by a Llama instance's executor.
  error OnlyLlama();

  /// @dev Policyholder does not have the permission ID to create the action.
  error PolicyholderDoesNotHavePermission();

  /// @dev If `block.timestamp` is less than `minExecutionTime`, the action cannot be executed.
  error MinExecutionTimeNotReached();

  /// @dev Actions can only be created with authorized strategies.
  error UnauthorizedStrategy();

  /// @dev Strategies can only be created with valid logic contracts.
  error UnauthorizedStrategyLogic();

  /// @dev Accounts can only be created with valid logic contracts.
  error UnauthorizedAccountLogic();

  /// @dev Checks that the caller is the Llama Executor and reverts if not.
  modifier onlyLlama() {
    if (msg.sender != address(executor)) revert OnlyLlama();
    _;
  }

  // ========================
  // ======== Events ========
  // ========================

  /// @dev Emitted when an account is created.
  event AccountCreated(
    ILlamaAccount account,
    ILlamaAccount indexed accountLogic,
    bytes initializationData
  );

  /// @dev Emitted when a new account implementation (logic) contract is authorized or unauthorized.
  event AccountLogicAuthorizationSet(
    ILlamaAccount indexed accountLogic,
    bool authorized
  );

  /// @dev Emitted when an action is created.
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

  /// @dev Emitted when an action is canceled.
  event ActionCanceled(uint256 id, address indexed caller);

  /// @dev Emitted when an action guard is set.
  event ActionGuardSet(
    address indexed target,
    bytes4 indexed selector,
    ILlamaActionGuard actionGuard
  );

  /// @dev Emitted when an action is queued.
  event ActionQueued(
    uint256 id,
    address indexed caller,
    ILlamaStrategy indexed strategy,
    address indexed creator,
    uint256 minExecutionTime
  );

  /// @dev Emitted when an action is executed.
  event ActionExecuted(
    uint256 id,
    address indexed caller,
    ILlamaStrategy indexed strategy,
    address indexed creator,
    bytes result
  );

  /// @dev Emitted when an approval is cast.
  event ApprovalCast(
    uint256 id,
    address indexed policyholder,
    uint8 indexed role,
    uint256 quantity,
    string reason
  );

  /// @dev Emitted when a disapproval is cast.
  event DisapprovalCast(
    uint256 id,
    address indexed policyholder,
    uint8 indexed role,
    uint256 quantity,
    string reason
  );

  /// @dev Emitted when a deployed strategy is authorized or unauthorized.
  event StrategyAuthorizationSet(
    ILlamaStrategy indexed strategy,
    bool authorized
  );

  /// @dev Emitted when a strategy is created.
  event StrategyCreated(
    ILlamaStrategy strategy,
    ILlamaStrategy indexed strategyLogic,
    bytes initializationData
  );

  /// @dev Emitted when a new strategy implementation (logic) contract is authorized or unauthorized.
  event StrategyLogicAuthorizationSet(
    ILlamaStrategy indexed strategyLogic,
    bool authorized
  );

  /// @dev Emitted when a script is authorized or unauthorized.
  event ScriptAuthorizationSet(address indexed script, bool authorized);

  // =================================================
  // ======== Constants and Storage Variables ========
  // =================================================

  /// @dev EIP-712 base typehash.
  bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
    keccak256(
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

  /// @dev EIP-712 createAction typehash.
  bytes32 internal constant CREATE_ACTION_TYPEHASH =
    keccak256(
      "CreateAction(address policyholder,uint8 role,address strategy,address target,uint256 value,bytes data,string description,uint256 nonce)"
    );

  /// @dev EIP-712 cancelAction typehash.
  bytes32 internal constant CANCEL_ACTION_TYPEHASH =
    keccak256(
      "CancelAction(address policyholder,ActionInfo actionInfo,uint256 nonce)ActionInfo(uint256 id,address creator,uint8 creatorRole,address strategy,address target,uint256 value,bytes data)"
    );

  /// @dev EIP-712 castApproval typehash.
  bytes32 internal constant CAST_APPROVAL_TYPEHASH =
    keccak256(
      "CastApproval(address policyholder,uint8 role,ActionInfo actionInfo,string reason,uint256 nonce)ActionInfo(uint256 id,address creator,uint8 creatorRole,address strategy,address target,uint256 value,bytes data)"
    );

  /// @dev EIP-712 castDisapproval typehash.
  bytes32 internal constant CAST_DISAPPROVAL_TYPEHASH =
    keccak256(
      "CastDisapproval(address policyholder,uint8 role,ActionInfo actionInfo,string reason,uint256 nonce)ActionInfo(uint256 id,address creator,uint8 creatorRole,address strategy,address target,uint256 value,bytes data)"
    );

  /// @dev EIP-712 actionInfo typehash.
  bytes32 internal constant ACTION_INFO_TYPEHASH =
    keccak256(
      "ActionInfo(uint256 id,address creator,uint8 creatorRole,address strategy,address target,uint256 value,bytes data)"
    );

  /// @dev Mapping of actionIds to Actions. This data can be accessed through the `getAction` function.
  mapping(uint256 actionId => Action) internal actions;

  /// @notice The contract that executes actions for this Llama instance.
  LlamaExecutor public executor;

  /// @notice The ERC721 contract that defines the policies for this Llama instance.
  LlamaPolicy public policy;

  /// @notice Name of this Llama instance.
  string public name;

  /// @notice The current number of actions created.
  uint256 public actionsCount;

  /// @notice Mapping of actionIds to policyholders to approvals.
  mapping(uint256 actionId => mapping(address policyholder => bool hasApproved))
    public approvals;

  /// @notice Mapping of actionIds to policyholders to disapprovals.
  mapping(uint256 actionId => mapping(address policyholder => bool hasDisapproved))
    public disapprovals;

  /// @notice Mapping of all deployed strategies and their current authorization status.
  mapping(ILlamaStrategy strategy => StrategyStatus authorizationStatus)
    public strategies;

  /// @notice Mapping of all authorized scripts.
  mapping(address script => bool isAuthorized) public authorizedScripts;

  /// @notice Mapping of policyholders to function selectors to current nonces for EIP-712 signatures.
  /// @dev This is used to prevent replay attacks by incrementing the nonce for each operation (`createAction`,
  /// `cancelAction`, `castApproval` and `castDisapproval`) signed by the policyholder.
  mapping(address policyholder => mapping(bytes4 selector => uint256 currentNonce))
    public nonces;

  /// @notice Mapping of target to selector to actionGuard address.
  mapping(address target => mapping(bytes4 selector => ILlamaActionGuard guard))
    public actionGuard;

  /// @notice Mapping of all authorized Llama account implementation (logic) contracts.
  mapping(ILlamaAccount accountLogic => bool isAuthorized)
    public authorizedAccountLogics;

  /// @notice Mapping of all authorized Llama strategy implementation (logic) contracts.
  mapping(ILlamaStrategy strategyLogic => bool isAuthorized)
    public authorizedStrategyLogics;

  // ======================================================
  // ======== Contract Creation and Initialization ========
  // ======================================================

  /// @dev This contract is deployed as a minimal proxy from the factory's `deploy` function. The `_disableInitializers`
  /// locks the implementation (logic) contract, preventing any future initialization of it.
  constructor() {
    _disableInitializers();
  }

  /// @notice Initializes a new `LlamaCore` clone.
  /// @dev This function is called by the `deploy` function in the `LlamaFactory` contract. The `initializer` modifier
  /// ensures that this function can be invoked at most once.
  /// @param config The struct that contains the configuration for this Llama instance. See `Structs.sol` for details on
  /// the parameters
  /// @param policyLogic The `LlamaPolicy` implementation (logic) contract
  /// @param policyMetadataLogic The `LlamaPolicyMetadata` implementation (logic) contract
  function initialize(
    LlamaInstanceConfig calldata config,
    LlamaPolicy policyLogic,
    ILlamaPolicyMetadata policyMetadataLogic
  ) external initializer {
    name = config.name;
    // Deploy the executor.
    executor = new LlamaExecutor();

    // Since the `LlamaCore` salt is dependent on the name and deployer, we can use a constant salt of 0 here.
    // The policy address will still be deterministic and dependent on the name and deployer because with CREATE2
    // the resulting address is a function of the deployer address (the core address).
    policy = LlamaPolicy(Clones.cloneDeterministic(address(policyLogic), 0));

    // Calculated from the first strategy configuration passed in.
    ILlamaStrategy bootstrapStrategy = ILlamaStrategy(
      Clones.predictDeterministicAddress(
        address(config.strategyLogic),
        keccak256(config.initialStrategies[0]),
        address(this)
      )
    );
    PermissionData memory bootstrapPermissionData = PermissionData(
      address(policy),
      LlamaPolicy.setRolePermission.selector,
      bootstrapStrategy
    );

    // Initialize `LlamaPolicy` with holders of role ID 1 (Bootstrap Role) given permission to change role
    // permissions. This is required to reduce the chance that an instance is deployed with an invalid configuration
    // that results in the instance being unusable.
    policy.initialize(
      config.name,
      config.policyConfig,
      policyMetadataLogic,
      address(executor),
      bootstrapPermissionData
    );

    // Authorize strategy logic contract and deploy strategies.
    _setStrategyLogicAuthorization(config.strategyLogic, true);
    _deployStrategies(config.strategyLogic, config.initialStrategies);

    // Check that the bootstrap strategy was deployed and authorized to the pre-calculated address.
    // This should never be thrown in production and is just here as an extra safety check.
    if (!strategies[bootstrapStrategy].authorized)
      revert BootstrapStrategyNotAuthorized();

    // Authorize account logic contract and deploy accounts.
    _setAccountLogicAuthorization(config.accountLogic, true);
    _deployAccounts(config.accountLogic, config.initialAccounts);
  }

  // ===========================================
  // ======== External and Public Logic ========
  // ===========================================

  // -------- Action Lifecycle Management --------

  /// @notice Creates an action. The creator needs to hold a policy with the permission ID of the provided
  /// `(target, selector, strategy)`.
  /// @dev Use `""` for `description` if there is no description.
  /// @param role The role that will be used to determine the permission ID of the policyholder.
  /// @param strategy The strategy contract that will determine how the action is executed.
  /// @param target The contract called when the action is executed.
  /// @param value The value in wei to be sent when the action is executed.
  /// @param data Data to be called on the target when the action is executed.
  /// @param description A human readable description of the action and the changes it will enact.
  /// @return actionId Action ID of the newly created action.
  function createAction(
    uint8 role,
    ILlamaStrategy strategy,
    address target,
    uint256 value,
    bytes calldata data,
    string memory description
  ) external returns (uint256 actionId) {
    actionId = _createAction(
      msg.sender,
      role,
      strategy,
      target,
      value,
      data,
      description
    );
  }

  /// @notice Creates an action via an off-chain signature. The creator needs to hold a policy with the permission ID
  /// of the provided `(target, selector, strategy)`.
  /// @dev Use `""` for `description` if there is no description.
  /// @param policyholder The policyholder that signed the message.
  /// @param role The role that will be used to determine the permission ID of the policyholder.
  /// @param strategy The strategy contract that will determine how the action is executed.
  /// @param target The contract called when the action is executed.
  /// @param value The value in wei to be sent when the action is executed.
  /// @param data Data to be called on the target when the action is executed.
  /// @param description A human readable description of the action and the changes it will enact.
  /// @param v ECDSA signature component: Parity of the `y` coordinate of point `R`
  /// @param r ECDSA signature component: x-coordinate of `R`
  /// @param s ECDSA signature component: `s` value of the signature
  /// @return actionId Action ID of the newly created action.
  function createActionBySig(
    address policyholder,
    uint8 role,
    ILlamaStrategy strategy,
    address target,
    uint256 value,
    bytes calldata data,
    string memory description,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external returns (uint256 actionId) {
    bytes32 digest = _getCreateActionTypedDataHash(
      policyholder,
      role,
      strategy,
      target,
      value,
      data,
      description
    );
    address signer = ecrecover(digest, v, r, s);
    if (signer == address(0) || signer != policyholder)
      revert InvalidSignature();
    actionId = _createAction(
      signer,
      role,
      strategy,
      target,
      value,
      data,
      description
    );
  }

  /// @notice Queue an action by its `actionInfo` struct if it's in Approved state.
  /// @param actionInfo Data required to create an action.
  function queueAction(ActionInfo calldata actionInfo) external {
    Action storage action = actions[actionInfo.id];
    ActionState currentState = getActionState(actionInfo);
    if (currentState != ActionState.Approved)
      revert InvalidActionState(currentState);

    _queueAction(action, actionInfo);
  }

  /// @notice Execute an action by its `actionInfo` struct if it's in Queued state and `minExecutionTime` has passed.
  /// @param actionInfo Data required to create an action.
  function executeAction(ActionInfo calldata actionInfo) external payable {
    // Initial checks that action is ready to execute.
    Action storage action = actions[actionInfo.id];
    ActionState currentState = getActionState(actionInfo);

    if (currentState != ActionState.Queued)
      revert InvalidActionState(currentState);
    if (block.timestamp < action.minExecutionTime)
      revert MinExecutionTimeNotReached();
    if (msg.value != actionInfo.value) revert IncorrectMsgValue();

    action.executed = true;

    // Check pre-execution action guard.
    ILlamaActionGuard guard = action.guard;
    if (guard != ILlamaActionGuard(address(0)))
      guard.validatePreActionExecution(actionInfo);

    // Execute action.
    (bool success, bytes memory result) = executor.execute{
      value: actionInfo.value
    }(actionInfo.target, action.isScript, actionInfo.data);

    if (!success) revert FailedActionExecution(result);

    // Check post-execution action guard.
    if (guard != ILlamaActionGuard(address(0)))
      guard.validatePostActionExecution(actionInfo);

    // Action successfully executed.
    emit ActionExecuted(
      actionInfo.id,
      msg.sender,
      actionInfo.strategy,
      actionInfo.creator,
      result
    );
  }

  /// @notice Cancels an action by its `actionInfo` struct.
  /// @dev Rules for cancelation are defined by the strategy.
  /// @param actionInfo Data required to create an action.
  function cancelAction(ActionInfo calldata actionInfo) external {
    _cancelAction(msg.sender, actionInfo);
  }

  /// @notice Cancels an action by its `actionInfo` struct via an off-chain signature.
  /// @dev Rules for cancelation are defined by the strategy.
  /// @param policyholder The policyholder that signed the message.
  /// @param actionInfo Data required to create an action.
  /// @param v ECDSA signature component: Parity of the `y` coordinate of point `R`
  /// @param r ECDSA signature component: x-coordinate of `R`
  /// @param s ECDSA signature component: `s` value of the signature
  function cancelActionBySig(
    address policyholder,
    ActionInfo calldata actionInfo,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    bytes32 digest = _getCancelActionTypedDataHash(policyholder, actionInfo);
    address signer = ecrecover(digest, v, r, s);
    if (signer == address(0) || signer != policyholder)
      revert InvalidSignature();
    _cancelAction(signer, actionInfo);
  }

  /// @notice How policyholders add their support of the approval of an action with a reason.
  /// @dev Use `""` for `reason` if there is no reason.
  /// @param role The role the policyholder uses to cast their approval.
  /// @param actionInfo Data required to create an action.
  /// @param reason The reason given for the approval by the policyholder.
  /// @return The quantity of the cast.
  function castApproval(
    uint8 role,
    ActionInfo calldata actionInfo,
    string calldata reason
  ) external returns (uint96) {
    return _castApproval(msg.sender, role, actionInfo, reason);
  }

  /// @notice How policyholders add their support of the approval of an action via an off-chain signature.
  /// @dev Use `""` for `reason` if there is no reason.
  /// @param policyholder The policyholder that signed the message.
  /// @param role The role the policyholder uses to cast their approval.
  /// @param actionInfo Data required to create an action.
  /// @param reason The reason given for the approval by the policyholder.
  /// @param v ECDSA signature component: Parity of the `y` coordinate of point `R`
  /// @param r ECDSA signature component: x-coordinate of `R`
  /// @param s ECDSA signature component: `s` value of the signature
  /// @return The quantity of the cast.
  function castApprovalBySig(
    address policyholder,
    uint8 role,
    ActionInfo calldata actionInfo,
    string calldata reason,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external returns (uint96) {
    bytes32 digest = _getCastApprovalTypedDataHash(
      policyholder,
      role,
      actionInfo,
      reason
    );
    address signer = ecrecover(digest, v, r, s);
    if (signer == address(0) || signer != policyholder)
      revert InvalidSignature();
    return _castApproval(signer, role, actionInfo, reason);
  }

  /// @notice How policyholders add their support of the disapproval of an action with a reason.
  /// @dev Use `""` for `reason` if there is no reason.
  /// @param role The role the policyholder uses to cast their disapproval.
  /// @param actionInfo Data required to create an action.
  /// @param reason The reason given for the disapproval by the policyholder.
  /// @return The quantity of the cast.
  function castDisapproval(
    uint8 role,
    ActionInfo calldata actionInfo,
    string calldata reason
  ) external returns (uint96) {
    return _castDisapproval(msg.sender, role, actionInfo, reason);
  }

  /// @notice How policyholders add their support of the disapproval of an action via an off-chain signature.
  /// @dev Use `""` for `reason` if there is no reason.
  /// @param policyholder The policyholder that signed the message.
  /// @param role The role the policyholder uses to cast their disapproval.
  /// @param actionInfo Data required to create an action.
  /// @param reason The reason given for the approval by the policyholder.
  /// @param v ECDSA signature component: Parity of the `y` coordinate of point `R`
  /// @param r ECDSA signature component: x-coordinate of `R`
  /// @param s ECDSA signature component: `s` value of the signature
  /// @return The quantity of the cast.
  function castDisapprovalBySig(
    address policyholder,
    uint8 role,
    ActionInfo calldata actionInfo,
    string calldata reason,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external returns (uint96) {
    bytes32 digest = _getCastDisapprovalTypedDataHash(
      policyholder,
      role,
      actionInfo,
      reason
    );
    address signer = ecrecover(digest, v, r, s);
    if (signer == address(0) || signer != policyholder)
      revert InvalidSignature();
    return _castDisapproval(signer, role, actionInfo, reason);
  }

  // -------- Instance Management --------

  /// @notice Sets `strategyLogic` authorization status, which determines if it can be used to create new strategies.
  /// @dev Unauthorizing a strategy logic contract will not affect previously deployed strategies.
  /// @dev Be careful not to conflate this with `setStrategyAuthorization`.
  /// @param strategyLogic The strategy logic contract to authorize.
  /// @param authorized `true` to authorize the strategy logic, `false` to unauthorize it.
  function setStrategyLogicAuthorization(
    ILlamaStrategy strategyLogic,
    bool authorized
  ) external onlyLlama {
    _setStrategyLogicAuthorization(strategyLogic, authorized);
  }

  /// @notice Deploy new strategies and add them to the mapping of authorized strategies.
  /// @param llamaStrategyLogic address of the Llama strategy logic contract.
  /// @param strategyConfigs Array of new strategy configurations.
  function createStrategies(
    ILlamaStrategy llamaStrategyLogic,
    bytes[] calldata strategyConfigs
  ) external onlyLlama {
    _deployStrategies(llamaStrategyLogic, strategyConfigs);
  }

  /// @notice Sets `strategy` authorization status, which determines if it can be used to create actions.
  /// @dev To unauthorize a deployed `strategy`, set `authorized` to `false`.
  /// @dev Be careful not to conflate this with `setStrategyLogicAuthorization`.
  /// @param strategy The address of the deployed strategy contract.
  /// @param authorized `true` to authorize the strategy, `false` to unauthorize it.
  function setStrategyAuthorization(
    ILlamaStrategy strategy,
    bool authorized
  ) external onlyLlama {
    _setStrategyAuthorization(strategy, authorized);
  }

  /// @notice Sets `accountLogic` authorization status, which determines if it can be used to create new accounts.
  /// @dev Unauthorizing an account logic contract will not affect previously deployed accounts.
  /// @param accountLogic The account logic contract to authorize.
  /// @param authorized `true` to authorize the account logic, `false` to unauthorize it.
  function setAccountLogicAuthorization(
    ILlamaAccount accountLogic,
    bool authorized
  ) external onlyLlama {
    _setAccountLogicAuthorization(accountLogic, authorized);
  }

  /// @notice Deploy new accounts.
  /// @param llamaAccountLogic address of the Llama account logic contract.
  /// @param accountConfigs Array of new account configurations.
  function createAccounts(
    ILlamaAccount llamaAccountLogic,
    bytes[] calldata accountConfigs
  ) external onlyLlama {
    _deployAccounts(llamaAccountLogic, accountConfigs);
  }

  /// @notice Sets `guard` as the action guard for the given `target` and `selector`.
  /// @dev To remove a guard, set `guard` to the zero address.
  /// @param target The target contract where the `guard` will apply.
  /// @param selector The function selector where the `guard` will apply.
  function setGuard(
    address target,
    bytes4 selector,
    ILlamaActionGuard guard
  ) external onlyLlama {
    if (target == address(this) || target == address(policy))
      revert RestrictedAddress();
    actionGuard[target][selector] = guard;
    emit ActionGuardSet(target, selector, guard);
  }

  /// @notice Sets `script` authorization status, which determines if it can be delegatecalled from the executor.
  /// @dev To unauthorize a `script`, set `authorized` to `false`.
  /// @param script The address of the script contract.
  /// @param authorized `true` to authorize the script, `false` to unauthorize it.
  function setScriptAuthorization(
    address script,
    bool authorized
  ) external onlyLlama {
    if (script == address(this) || script == address(policy))
      revert RestrictedAddress();
    authorizedScripts[script] = authorized;
    emit ScriptAuthorizationSet(script, authorized);
  }

  // -------- User Nonce Management --------

  /// @notice Increments the caller's nonce for the given `selector`. This is useful for revoking
  /// signatures that have not been used yet.
  /// @param selector The function selector to increment the nonce for.
  function incrementNonce(bytes4 selector) external {
    // Safety: Can never overflow a uint256 by incrementing.
    nonces[msg.sender][selector] = LlamaUtils.uncheckedIncrement(
      nonces[msg.sender][selector]
    );
  }

  // -------- Action and State Getters --------

  /// @notice Get an Action struct by `actionId`.
  /// @param actionId ID of the action.
  /// @return The Action struct.
  function getAction(uint256 actionId) external view returns (Action memory) {
    return actions[actionId];
  }

  /// @notice Get the current action state of an action by its `actionInfo` struct.
  /// @param actionInfo Data required to create an action.
  /// @return The current action state of the action.
  function getActionState(
    ActionInfo calldata actionInfo
  ) public view returns (ActionState) {
    // We don't need an explicit check on the action ID to make sure it exists, because if the
    // action does not exist, the expected payload hash from storage will be `bytes32(0)`, so
    // bypassing this check by providing a non-existent actionId would require finding a collision
    // to get a hash of zero.
    Action storage action = actions[actionInfo.id];
    _validateActionInfoHash(action.infoHash, actionInfo);

    if (action.canceled) return ActionState.Canceled;

    if (action.executed) return ActionState.Executed;

    if (actionInfo.strategy.isActionActive(actionInfo))
      return ActionState.Active;

    if (!actionInfo.strategy.isActionApproved(actionInfo))
      return ActionState.Failed;

    if (action.minExecutionTime == 0) return ActionState.Approved;

    if (actionInfo.strategy.isActionDisapproved(actionInfo))
      return ActionState.Failed;

    if (actionInfo.strategy.isActionExpired(actionInfo))
      return ActionState.Expired;

    return ActionState.Queued;
  }

  // ================================
  // ======== Internal Logic ========
  // ================================

  /// @dev Creates an action. The creator needs to hold a policy with the permission ID of the provided
  /// `(target, selector, strategy)`.
  function _createAction(
    address policyholder,
    uint8 role,
    ILlamaStrategy strategy,
    address target,
    uint256 value,
    bytes calldata data,
    string memory description
  ) internal returns (uint256 actionId) {
    if (target == address(executor)) revert CannotSetExecutorAsTarget();
    if (!strategies[strategy].authorized) revert UnauthorizedStrategy();

    PermissionData memory permission = PermissionData(
      target,
      bytes4(data),
      strategy
    );
    bytes32 permissionId = LlamaUtils.computePermissionId(permission);

    // Typically (such as in Governor contracts) this should check that the caller has permission
    // at `block.number|timestamp - 1` but here we're just checking if the caller *currently* has
    // permission. Technically this introduces a race condition if e.g. an action to revoke a role
    // from someone (or revoke a permission from a role) is ready to be executed at the same time as
    // an action is created, as the order of transactions in the block then affects if action
    // creation would succeed. However, we are ok with this tradeoff because it means we don't need
    // to checkpoint the `canCreateAction` mapping which is simpler and cheaper, and in practice
    // this race condition is unlikely to matter.
    if (!policy.hasPermissionId(policyholder, role, permissionId))
      revert PolicyholderDoesNotHavePermission();

    // Update `actionsCount` and create `actionInfo` struct.
    actionId = actionsCount;
    actionsCount = LlamaUtils.uncheckedIncrement(actionsCount); // Safety: Can never overflow a uint256 by incrementing.
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      policyholder,
      role,
      strategy,
      target,
      value,
      data
    );

    // Scope to avoid stack too deep
    {
      // Save action.
      Action storage newAction = actions[actionId];
      newAction.infoHash = _infoHash(actionInfo);
      newAction.creationTime = LlamaUtils.toUint64(block.timestamp);
      newAction.isScript = authorizedScripts[target];

      // Validate action creation.
      strategy.validateActionCreation(actionInfo);

      ILlamaActionGuard guard = actionGuard[target][bytes4(data)];
      if (guard != ILlamaActionGuard(address(0))) {
        guard.validateActionCreation(actionInfo);
        newAction.guard = guard;
      }
    }

    emit ActionCreated(
      actionId,
      policyholder,
      role,
      strategy,
      target,
      value,
      data,
      description
    );
  }

  /// @dev Cancels an action by its `actionInfo` struct.
  function _cancelAction(
    address policyholder,
    ActionInfo calldata actionInfo
  ) internal {
    Action storage action = actions[actionInfo.id];
    _validateActionInfoHash(action.infoHash, actionInfo);

    // We don't need an explicit check on action existence because if it doesn't exist the strategy will be the zero
    // address, and Solidity will revert since there is no code at the zero address.
    actionInfo.strategy.validateActionCancelation(actionInfo, policyholder);

    action.canceled = true;
    emit ActionCanceled(actionInfo.id, policyholder);
  }

  /// @dev How policyholders that have the right role contribute towards the approval of an action with a reason.
  function _castApproval(
    address policyholder,
    uint8 role,
    ActionInfo calldata actionInfo,
    string memory reason
  ) internal returns (uint96) {
    (Action storage action, uint96 quantity) = _preCastAssertions(
      actionInfo,
      policyholder,
      role,
      ActionState.Active
    );

    action.totalApprovals = _newCastCount(action.totalApprovals, quantity);
    approvals[actionInfo.id][policyholder] = true;
    emit ApprovalCast(actionInfo.id, policyholder, role, quantity, reason);

    // We call `getActionState` here to determine if we should queue the action. This works because the ordering
    // in `LlamaCore.getActionState` checks `.isActionActive()` first, and if not, then it calls `.isActionApproved`.
    // If `.isActionActive()` returns `true`, then we don't queue.
    // If `.isActionApproved()` returns `true`, then we queue.
    ActionState currentState = getActionState(actionInfo);
    if (currentState == ActionState.Approved) _queueAction(action, actionInfo);

    return quantity;
  }

  /// @dev How policyholders that have the right role contribute towards the disapproval of an action with a reason.
  function _castDisapproval(
    address policyholder,
    uint8 role,
    ActionInfo calldata actionInfo,
    string memory reason
  ) internal returns (uint96) {
    (Action storage action, uint96 quantity) = _preCastAssertions(
      actionInfo,
      policyholder,
      role,
      ActionState.Queued
    );

    action.totalDisapprovals = _newCastCount(
      action.totalDisapprovals,
      quantity
    );
    disapprovals[actionInfo.id][policyholder] = true;
    emit DisapprovalCast(actionInfo.id, policyholder, role, quantity, reason);
    return quantity;
  }

  /// @dev Updates state of an action to `ActionState::Queued` and emits an event. Used in `queueAction` and
  /// `_castApproval`.
  function _queueAction(
    Action storage action,
    ActionInfo calldata actionInfo
  ) internal {
    uint64 minExecutionTime = actionInfo.strategy.minExecutionTime(actionInfo);
    if (minExecutionTime < block.timestamp)
      revert MinExecutionTimeCannotBeInThePast();
    action.minExecutionTime = minExecutionTime;
    emit ActionQueued(
      actionInfo.id,
      msg.sender,
      actionInfo.strategy,
      actionInfo.creator,
      minExecutionTime
    );
  }

  /// @dev The only `expectedState` values allowed to be passed into this method are Active or Queued.
  function _preCastAssertions(
    ActionInfo calldata actionInfo,
    address policyholder,
    uint8 role,
    ActionState expectedState
  ) internal view returns (Action storage action, uint96 quantity) {
    action = actions[actionInfo.id];
    ActionState currentState = getActionState(actionInfo);
    if (currentState != expectedState) revert InvalidActionState(currentState);

    bool isApproval = expectedState == ActionState.Active;
    bool alreadyCast = isApproval
      ? approvals[actionInfo.id][policyholder]
      : disapprovals[actionInfo.id][policyholder];
    if (alreadyCast) revert DuplicateCast();

    // We look up data at `action.creationTime - 1` to avoid race conditions: A user's role balances
    // can change after action creation in the same block, so we can't actually know what the
    // correct values are at the time of action creation.
    uint256 checkpointTime = action.creationTime - 1;
    bool hasRole = policy.hasRole(policyholder, role, checkpointTime);
    if (!hasRole) revert InvalidPolicyholder();

    if (isApproval) {
      actionInfo.strategy.checkIfApprovalEnabled(
        actionInfo,
        policyholder,
        role
      );
      quantity = actionInfo.strategy.getApprovalQuantityAt(
        policyholder,
        role,
        checkpointTime
      );
      if (quantity == 0) revert CannotCastWithZeroQuantity(policyholder, role);
    } else {
      if (block.timestamp >= action.minExecutionTime)
        revert CannotDisapproveAfterMinExecutionTime();
      actionInfo.strategy.checkIfDisapprovalEnabled(
        actionInfo,
        policyholder,
        role
      );
      quantity = actionInfo.strategy.getDisapprovalQuantityAt(
        policyholder,
        role,
        checkpointTime
      );
      if (quantity == 0) revert CannotCastWithZeroQuantity(policyholder, role);
    }
  }

  /// @dev Returns the new total count of approvals or disapprovals.
  function _newCastCount(
    uint96 currentCount,
    uint96 quantity
  ) internal pure returns (uint96) {
    if (uint256(currentCount) + quantity >= type(uint96).max)
      return type(uint96).max;
    return currentCount + quantity;
  }

  /// @dev Sets the authorization status for a strategy implementation (logic) contract.
  function _setStrategyLogicAuthorization(
    ILlamaStrategy strategyLogic,
    bool authorized
  ) internal {
    authorizedStrategyLogics[strategyLogic] = authorized;
    emit StrategyLogicAuthorizationSet(strategyLogic, authorized);
  }

  /// @dev Deploys new strategies. Takes in the strategy logic contract to be used and an array of configurations to
  /// initialize the new strategies with.
  function _deployStrategies(
    ILlamaStrategy llamaStrategyLogic,
    bytes[] calldata strategyConfigs
  ) internal {
    if (!authorizedStrategyLogics[llamaStrategyLogic])
      revert UnauthorizedStrategyLogic();

    uint256 strategyLength = strategyConfigs.length;
    for (
      uint256 i = 0;
      i < strategyLength;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      bytes32 salt = keccak256(strategyConfigs[i]);
      ILlamaStrategy strategy = ILlamaStrategy(
        Clones.cloneDeterministic(address(llamaStrategyLogic), salt)
      );
      strategy.initialize(strategyConfigs[i]);
      strategies[strategy].deployed = true;
      _setStrategyAuthorization(strategy, true);
      emit StrategyCreated(strategy, llamaStrategyLogic, strategyConfigs[i]);
    }
  }

  /// @dev Sets the `strategy` authorization status to `authorized`.
  function _setStrategyAuthorization(
    ILlamaStrategy strategy,
    bool authorized
  ) internal {
    if (!strategies[strategy].deployed) revert NonExistentStrategy();
    strategies[strategy].authorized = authorized;
    emit StrategyAuthorizationSet(strategy, authorized);
  }

  /// @dev Authorizes an account implementation (logic) contract.
  function _setAccountLogicAuthorization(
    ILlamaAccount accountLogic,
    bool authorized
  ) internal {
    authorizedAccountLogics[accountLogic] = authorized;
    emit AccountLogicAuthorizationSet(accountLogic, authorized);
  }

  /// @dev Deploys new accounts. Takes in the account logic contract to be used and an array of configurations to
  /// initialize the new accounts with.
  function _deployAccounts(
    ILlamaAccount llamaAccountLogic,
    bytes[] calldata accountConfigs
  ) internal {
    if (!authorizedAccountLogics[llamaAccountLogic])
      revert UnauthorizedAccountLogic();

    uint256 accountLength = accountConfigs.length;
    for (
      uint256 i = 0;
      i < accountLength;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      bytes32 salt = keccak256(accountConfigs[i]);
      ILlamaAccount account = ILlamaAccount(
        Clones.cloneDeterministic(address(llamaAccountLogic), salt)
      );
      account.initialize(accountConfigs[i]);
      emit AccountCreated(account, llamaAccountLogic, accountConfigs[i]);
    }
  }

  /// @dev Returns the hash of the `createAction` parameters using the `actionInfo` struct.
  function _infoHash(
    ActionInfo memory actionInfo
  ) internal pure returns (bytes32) {
    return
      keccak256(
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
  }

  /// @dev Validates that the hash of the `actionInfo` struct matches the provided hash.
  function _validateActionInfoHash(
    bytes32 actualHash,
    ActionInfo calldata actionInfo
  ) internal pure {
    bytes32 expectedHash = _infoHash(actionInfo);
    if (actualHash != expectedHash) revert InfoHashMismatch();
  }

  /// @dev Returns the current nonce for a given policyholder and selector, and increments it. Used to prevent
  /// replay attacks.
  function _useNonce(
    address policyholder,
    bytes4 selector
  ) internal returns (uint256 nonce) {
    nonce = nonces[policyholder][selector];
    nonces[policyholder][selector] = LlamaUtils.uncheckedIncrement(nonce);
  }

  // -------- EIP-712 Getters --------

  /// @dev Returns the EIP-712 domain separator.
  function _getDomainHash() internal view returns (bytes32) {
    return
      keccak256(
        abi.encode(
          EIP712_DOMAIN_TYPEHASH,
          keccak256(bytes(name)),
          keccak256(bytes("1")),
          block.chainid,
          address(this)
        )
      );
  }

  /// @dev Returns the hash of the ABI-encoded EIP-712 message for the `CreateAction` domain, which can be used to
  /// recover the signer.
  function _getCreateActionTypedDataHash(
    address policyholder,
    uint8 role,
    ILlamaStrategy strategy,
    address target,
    uint256 value,
    bytes calldata data,
    string memory description
  ) internal returns (bytes32) {
    // Calculating and storing nonce in memory and using that below, instead of calculating in place to prevent stack
    // too deep error.
    uint256 nonce = _useNonce(policyholder, msg.sig);

    bytes32 createActionHash = keccak256(
      abi.encode(
        CREATE_ACTION_TYPEHASH,
        policyholder,
        role,
        address(strategy),
        target,
        value,
        keccak256(data),
        keccak256(bytes(description)),
        nonce
      )
    );

    return
      keccak256(
        abi.encodePacked("\x19\x01", _getDomainHash(), createActionHash)
      );
  }

  /// @dev Returns the hash of the ABI-encoded EIP-712 message for the `CancelAction` domain, which can be used to
  /// recover the signer.
  function _getCancelActionTypedDataHash(
    address policyholder,
    ActionInfo calldata actionInfo
  ) internal returns (bytes32) {
    bytes32 cancelActionHash = keccak256(
      abi.encode(
        CANCEL_ACTION_TYPEHASH,
        policyholder,
        _getActionInfoHash(actionInfo),
        _useNonce(policyholder, msg.sig)
      )
    );

    return
      keccak256(
        abi.encodePacked("\x19\x01", _getDomainHash(), cancelActionHash)
      );
  }

  /// @dev Returns the hash of the ABI-encoded EIP-712 message for the `CastApproval` domain, which can be used to
  /// recover the signer.
  function _getCastApprovalTypedDataHash(
    address policyholder,
    uint8 role,
    ActionInfo calldata actionInfo,
    string calldata reason
  ) internal returns (bytes32) {
    bytes32 castApprovalHash = keccak256(
      abi.encode(
        CAST_APPROVAL_TYPEHASH,
        policyholder,
        role,
        _getActionInfoHash(actionInfo),
        keccak256(bytes(reason)),
        _useNonce(policyholder, msg.sig)
      )
    );

    return
      keccak256(
        abi.encodePacked("\x19\x01", _getDomainHash(), castApprovalHash)
      );
  }

  /// @dev Returns the hash of the ABI-encoded EIP-712 message for the `CastDisapproval` domain, which can be used to
  /// recover the signer.
  function _getCastDisapprovalTypedDataHash(
    address policyholder,
    uint8 role,
    ActionInfo calldata actionInfo,
    string calldata reason
  ) internal returns (bytes32) {
    bytes32 castDisapprovalHash = keccak256(
      abi.encode(
        CAST_DISAPPROVAL_TYPEHASH,
        policyholder,
        role,
        _getActionInfoHash(actionInfo),
        keccak256(bytes(reason)),
        _useNonce(policyholder, msg.sig)
      )
    );

    return
      keccak256(
        abi.encodePacked("\x19\x01", _getDomainHash(), castDisapprovalHash)
      );
  }

  /// @dev Returns the hash of `actionInfo`.
  function _getActionInfoHash(
    ActionInfo calldata actionInfo
  ) internal pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          ACTION_INFO_TYPEHASH,
          actionInfo.id,
          actionInfo.creator,
          actionInfo.creatorRole,
          address(actionInfo.strategy),
          actionInfo.target,
          actionInfo.value,
          keccak256(actionInfo.data)
        )
      );
  }
}
