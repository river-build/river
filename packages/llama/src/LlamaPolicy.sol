// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {LibString} from "@solady/utils/LibString.sol";

import {ILlamaPolicyMetadata} from "./interfaces/ILlamaPolicyMetadata.sol";
import {PolicyholderCheckpoints} from "./lib/PolicyholderCheckpoints.sol";
import {SupplyCheckpoints} from "./lib/SupplyCheckpoints.sol";
import {ERC721NonTransferableMinimalProxy} from "./lib/ERC721NonTransferableMinimalProxy.sol";
import {LlamaUtils} from "./lib/LlamaUtils.sol";
import {LlamaPolicyConfig, PermissionData} from "./lib/Structs.sol";
import {RoleDescription} from "./lib/UDVTs.sol";
import {LlamaExecutor} from "./LlamaExecutor.sol";

/// @title Llama Policy
/// @author Llama (devsdosomething..xyz)
/// @notice An ERC721 contract where each token is non-transferable, functions as the respective policy for a given
/// policyholder and has roles assigned to `create`, `approve` and `disapprove` actions.
/// @dev The roles and permissions determine how the policyholder can interact with the Llama core contract.
contract LlamaPolicy is ERC721NonTransferableMinimalProxy {
  using PolicyholderCheckpoints for PolicyholderCheckpoints.History;
  using SupplyCheckpoints for SupplyCheckpoints.History;

  // ======================================
  // ======== Errors and Modifiers ========
  // ======================================

  /// @dev Roleholder cannot be set at the same timestamp as an action creation.
  error ActionCreationAtSameTimestamp();

  /// @dev Thrown when revoking a policy from an address without one
  /// @param userAddress The address of the possible policyholder.
  error AddressDoesNotHoldPolicy(address userAddress);

  /// @dev Cannot set "all holders" role.
  error AllHoldersRole();

  /// @dev Policy can only be initialized once.
  error AlreadyInitialized();

  /// @dev The indices would result in `Panic: Index Out of Bounds`.
  /// @dev Thrown when the `end` index is greater than array length or when the `start` index is greater than the `end`
  /// index.
  error InvalidIndices();

  /// @dev Thrown when the provided policyholder and role are not in the expected state for the function.
  error InvalidRoleHolderInput();

  /// @dev Policy tokens cannot be transferred.
  error NonTransferableToken();

  /// @dev Only callable by a Llama instance's executor.
  error OnlyLlama();

  /// @dev Only callable by the Llama Factory.
  error OnlyLlamaFactory();

  /// @dev Operations can only occur on initialized roles.
  error RoleNotInitialized(uint8 role);

  /// @dev Checks that the caller is the Llama executor and reverts if not.
  modifier onlyLlama() {
    if (msg.sender != llamaExecutor) revert OnlyLlama();
    _;
  }

  /// @dev Ensures that none of the ERC721 `transfer` and `approval` functions can be called, so that the policies are
  /// non-transferable.
  modifier nonTransferableToken() {
    _; // We put this ahead of the revert so we don't get an unreachable code warning.
    revert NonTransferableToken();
  }

  // ========================
  // ======== Events ========
  // ========================

  /// @dev Emitted when a policyholder is assigned a role.
  event RoleAssigned(
    address indexed policyholder,
    uint8 indexed role,
    uint64 expiration,
    uint96 quantity
  );

  /// @dev Emitted when a role is initialized with a description.
  event RoleInitialized(uint8 indexed role, RoleDescription description);

  /// @dev Emitted when a permission ID is assigned to a role.
  event RolePermissionAssigned(
    uint8 indexed role,
    bytes32 indexed permissionId,
    PermissionData permissionData,
    bool hasPermission
  );

  /// @dev Emitted when a new Llama policy metadata contract is set.
  event PolicyMetadataSet(
    ILlamaPolicyMetadata policyMetadata,
    ILlamaPolicyMetadata indexed policyMetadataLogic,
    bytes initializationData
  );

  /// @dev Emitted when an expired role is explicitly revoked from a policyholder.
  event ExpiredRoleRevoked(
    address indexed caller,
    address indexed policyholder,
    uint8 indexed role
  );

  // =================================================
  // ======== Constants and Storage Variables ========
  // =================================================

  /// @dev A special role used to reference all policyholders.
  uint8 internal constant ALL_HOLDERS_ROLE = 0;

  /// @dev At deployment, this role is given permission to call the `setRolePermission` function.
  /// However, this may change depending on how the Llama instance is configured. This is done to mitigate the chances
  /// of deploying a misconfigured Llama instance that is unusable. See the documentation for more info.
  uint8 internal constant BOOTSTRAP_ROLE = 1;

  /// @dev Tracks total supplies of a given role. There are two notions of total supply:
  ///   - The `numberOfHolders` is simply the number of policyholders that hold the role.
  ///   - The `totalQuantity` is the sum of the quantity of the role for each policyholder that
  ///     holds the role.
  /// Both versions of supply are tracked to enable different types of strategies.
  mapping(uint8 role => SupplyCheckpoints.History) internal roleSupplyCkpts;

  /// @dev Checkpoints a token ID's "balance" (quantity) of a given role. The quantity of the
  /// role is how much quantity the role-holder gets when approving/disapproving (regardless of
  /// strategy).
  mapping(uint256 tokenId => mapping(uint8 role => PolicyholderCheckpoints.History))
    internal roleBalanceCkpts;

  /// @notice Returns `true` if the role can create actions with the given permission ID.
  mapping(uint8 role => mapping(bytes32 permissionId => bool hasPermission))
    public canCreateAction;

  /// @notice The highest role ID that has been initialized.
  uint8 public numRoles;

  /// @notice The address of the `LlamaExecutor` of this instance.
  address public llamaExecutor;

  /// @notice The Llama policy metadata contract.
  ILlamaPolicyMetadata public llamaPolicyMetadata;

  // ======================================================
  // ======== Contract Creation and Initialization ========
  // ======================================================

  /// @dev This contract is deployed as a minimal proxy from the core's `initialize` function. The
  /// `_disableInitializers` locks the implementation (logic) contract, preventing any future initialization of it.
  constructor() {
    _disableInitializers();
  }

  /// @notice Initializes a new `LlamaPolicy` clone.
  /// @dev This function is called by the `initialize` function in the `LlamaCore` contract. The `initializer` modifier
  /// ensures that this function can be invoked at most once.
  /// @param _name The ERC-721 name of the policy NFT.
  /// @param config The struct that contains the configuration for this instance's policy.
  /// @param policyMetadataLogic The `LlamaPolicyMetadata` implementation (logic) contract.
  /// @param executor The instance's `LlamaExecutor`.
  /// @param bootstrapPermissionData The permission data that hashes to the permission ID that allows policyholders to
  /// change role permissions.
  function initialize(
    string memory _name,
    LlamaPolicyConfig calldata config,
    ILlamaPolicyMetadata policyMetadataLogic,
    address executor,
    PermissionData memory bootstrapPermissionData
  ) external initializer {
    __initializeERC721MinimalProxy(
      _name,
      string.concat("LL-", LibString.replace(LibString.upper(_name), " ", "-"))
    );
    llamaExecutor = executor;

    // Initialize the roles.
    emit RoleInitialized(ALL_HOLDERS_ROLE, RoleDescription.wrap("All Holders"));
    for (
      uint256 i = 0;
      i < config.roleDescriptions.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      _initializeRole(config.roleDescriptions[i]);
    }

    // Assign the role holders.
    for (
      uint256 i = 0;
      i < config.roleHolders.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      _setRoleHolder(
        config.roleHolders[i].role,
        config.roleHolders[i].policyholder,
        config.roleHolders[i].quantity,
        config.roleHolders[i].expiration
      );
    }

    // Assign the role permissions.
    for (
      uint256 i = 0;
      i < config.rolePermissions.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      _setRolePermission(
        config.rolePermissions[i].role,
        config.rolePermissions[i].permissionData,
        config.rolePermissions[i].hasPermission
      );
    }

    // Must have assigned roles during initialization, otherwise the system cannot be used. However,
    // we do not check that roles were assigned "properly" as there is no single correct way, so
    // this is more of a sanity check, not a guarantee that the system will work after initialization.
    if (numRoles == 0 || getRoleSupplyAsNumberOfHolders(ALL_HOLDERS_ROLE) == 0)
      revert InvalidRoleHolderInput();

    // Gives holders of role ID 1 permission to change role permissions. This is required to reduce the chance that an
    // instance is deployed with an invalid configuration that results in the instance being unusable.
    _setRolePermission(BOOTSTRAP_ROLE, bootstrapPermissionData, true);

    _setAndInitializePolicyMetadata(
      policyMetadataLogic,
      abi.encode(config.color, config.logo)
    );
  }

  // ===========================================
  // ======== External and Public Logic ========
  // ===========================================

  // -------- Role and Permission Management --------

  /// @notice Initializes the next unassigned role with the given `description`.
  /// @param description The description of the role to initialize.
  function initializeRole(RoleDescription description) external onlyLlama {
    _initializeRole(description);
  }

  /// @notice Assigns a role to a policyholder.
  /// @param role ID of the role to set (uint8 ensures onchain enumerability when burning policies).
  /// @param policyholder Policyholder to assign the role to.
  /// @param quantity Quantity of the role to assign to the policyholder, i.e. their (dis)approval quantity.
  /// @param expiration When the role expires.
  function setRoleHolder(
    uint8 role,
    address policyholder,
    uint96 quantity,
    uint64 expiration
  ) external onlyLlama {
    _setRoleHolder(role, policyholder, quantity, expiration);
  }

  /// @notice Assigns a permission ID to a role.
  /// @param role ID of the role to assign permission to.
  /// @param permissionData The `(target, selector, strategy)` tuple that will be keccak256 hashed to generate the
  /// permission ID to assign or unassign to the role.
  /// @param hasPermission Whether to assign the permission or remove the permission.
  function setRolePermission(
    uint8 role,
    PermissionData memory permissionData,
    bool hasPermission
  ) external onlyLlama {
    _setRolePermission(role, permissionData, hasPermission);
  }

  /// @notice Revokes a policyholder's expired role.
  /// @param role Role that has expired.
  /// @param policyholder Policyholder that held the role.
  /// @dev This function needs to be explicitly called to revoke expired roles by monitoring through offchain
  /// infrastructure, otherwise expired roles can continue to create actions (if they have the right permissions) and
  /// take part in the approval/disapproval process if the strategy allows it.
  function revokeExpiredRole(uint8 role, address policyholder) external {
    // Read the most recent checkpoint for the policyholder's role balance.
    if (!isRoleExpired(policyholder, role)) revert InvalidRoleHolderInput();
    _setRoleHolder(role, policyholder, 0, 0);
    emit ExpiredRoleRevoked(msg.sender, policyholder, role);
  }

  /// @notice Revokes all roles from the `policyholder` and burns their policy.
  /// @param policyholder Policyholder to revoke all roles from.
  function revokePolicy(address policyholder) external onlyLlama {
    if (balanceOf(policyholder) == 0)
      revert AddressDoesNotHoldPolicy(policyholder);
    // We start from i = 1 here because a value of zero is reserved for the "all holders" role, and
    // that will get removed automatically when the token is burned. Similarly, use we `<=` to make sure
    // the last role is also revoked.
    for (uint256 i = 1; i <= numRoles; i = LlamaUtils.uncheckedIncrement(i)) {
      if (hasRole(policyholder, uint8(i)))
        _setRoleHolder(uint8(i), policyholder, 0, 0);
    }
    _burn(policyholder);
  }

  /// @notice Updates the description of a role.
  /// @param role ID of the role to update.
  /// @param description New description of the role.
  function updateRoleDescription(
    uint8 role,
    RoleDescription description
  ) external onlyLlama {
    if (role > numRoles) revert RoleNotInitialized(role);
    emit RoleInitialized(role, description);
  }

  // -------- Metadata --------

  /// @notice Sets the Llama policy metadata contract which contains the function body for `tokenURI()` and
  /// `contractURI()`.
  /// @dev This is handled by a separate contract to ensure contract size stays under 24kB.
  /// @param llamaPolicyMetadataLogic The logic contract address for the Llama policy metadata contract.
  /// @param config The configuration data used to initialize the Llama policy metadata logic contract.
  function setAndInitializePolicyMetadata(
    ILlamaPolicyMetadata llamaPolicyMetadataLogic,
    bytes memory config
  ) external onlyLlama {
    _setAndInitializePolicyMetadata(llamaPolicyMetadataLogic, config);
  }

  // -------- Role and Permission Getters --------

  /// @notice Returns the latest quantity of the `role` for the given `policyholder`. The returned value is the
  /// quantity of the role when approving/disapproving (regardless of strategy).
  /// @param policyholder Policyholder to get the role quantity for.
  /// @param role ID of the role.
  /// @return The latest quantity of the role for the given policyholder.
  function getQuantity(
    address policyholder,
    uint8 role
  ) external view returns (uint96) {
    uint256 tokenId = _tokenId(policyholder);
    return roleBalanceCkpts[tokenId][role].latest();
  }

  /// @notice Returns the past quantity of the `role` for the given `policyholder` at `timestamp`. The returned
  /// value is the quantity of the role when approving/disapproving (regardless of strategy).
  /// @param policyholder Policyholder to get the role quantity for.
  /// @param role ID of the role.
  /// @param timestamp Timestamp at which to get the quantity of the role for the given policyholder.
  /// @return The past quantity of the role for the given policyholder at `timestamp`.
  function getPastQuantity(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view returns (uint96) {
    uint256 tokenId = _tokenId(policyholder);
    return
      roleBalanceCkpts[tokenId][role].getAtProbablyRecentTimestamp(timestamp);
  }

  /// @notice Returns the latest total number of role holders for given `role`.
  /// @param role ID of the role.
  /// @return numberOfHolders The latest total number of role holders for given `role`.
  function getRoleSupplyAsNumberOfHolders(
    uint8 role
  ) public view returns (uint96 numberOfHolders) {
    (numberOfHolders, ) = roleSupplyCkpts[role].latest();
  }

  /// @notice Returns the past total number of role holders for given `role` at `timestamp`.
  /// @param role ID of the role.
  /// @param timestamp Timestamp at which to get the past total number of role holders for given `role`.
  /// @return numberOfHolders The past total number of role holders for given `role` at `timestamp`.
  function getPastRoleSupplyAsNumberOfHolders(
    uint8 role,
    uint256 timestamp
  ) external view returns (uint96 numberOfHolders) {
    (numberOfHolders, ) = roleSupplyCkpts[role].getAtProbablyRecentTimestamp(
      timestamp
    );
  }

  /// @notice Returns the latest sum of quantity across all role holders for given `role`.
  /// @param role ID of the role.
  /// @return totalQuantity The latest sum of quantity across all role holders for given `role`.
  function getRoleSupplyAsQuantitySum(
    uint8 role
  ) external view returns (uint96 totalQuantity) {
    (, totalQuantity) = roleSupplyCkpts[role].latest();
  }

  /// @notice Returns the sum of quantity across all role holders for given `role` at `timestamp`.
  /// @param role ID of the role.
  /// @param timestamp Timestamp at which to get the sum of quantity across all role holders for given `role`.
  /// @return totalQuantity The past sum of quantity across all role holders for given `role` at `timestamp`.
  function getPastRoleSupplyAsQuantitySum(
    uint8 role,
    uint256 timestamp
  ) external view returns (uint96 totalQuantity) {
    (, totalQuantity) = roleSupplyCkpts[role].getAtProbablyRecentTimestamp(
      timestamp
    );
  }

  /// @notice Returns all policyholder checkpoints for the given `policyholder` and `role`.
  /// @param policyholder Policyholder to get the checkpoints for.
  /// @param role ID of the role.
  /// @return All policyholder checkpoints for the given `policyholder` and `role`.
  function roleBalanceCheckpoints(
    address policyholder,
    uint8 role
  ) external view returns (PolicyholderCheckpoints.History memory) {
    uint256 tokenId = _tokenId(policyholder);
    return roleBalanceCkpts[tokenId][role];
  }

  /// @notice Returns all supply checkpoints for the given `role`.
  /// @param role ID of the role.
  /// @return All supply checkpoints for the given `role`.
  function roleSupplyCheckpoints(
    uint8 role
  ) external view returns (SupplyCheckpoints.History memory) {
    return roleSupplyCkpts[role];
  }

  /// @notice Returns all policyholder checkpoints for the given policyholder and role between `start` and
  /// `end`, where `start` is inclusive and `end` is exclusive.
  /// @param policyholder Policyholder to get the checkpoints for.
  /// @param role Role held by policyholder to get the checkpoints for.
  /// @param start Start index of the checkpoints to get from their checkpoint history array. This index is inclusive.
  /// @param end End index of the checkpoints to get from their checkpoint history array. This index is exclusive.
  /// @return All policyholder checkpoints for the given policyholder and role between `start` and `end`.
  function roleBalanceCheckpoints(
    address policyholder,
    uint8 role,
    uint256 start,
    uint256 end
  ) external view returns (PolicyholderCheckpoints.History memory) {
    if (start > end) revert InvalidIndices();
    uint256 checkpointsLength = roleBalanceCkpts[_tokenId(policyholder)][role]
      ._checkpoints
      .length;
    if (end > checkpointsLength) revert InvalidIndices();

    uint256 tokenId = _tokenId(policyholder);
    uint256 sliceLength = end - start;
    PolicyholderCheckpoints.Checkpoint[]
      memory checkpoints = new PolicyholderCheckpoints.Checkpoint[](
        sliceLength
      );
    for (uint256 i = start; i < end; i = LlamaUtils.uncheckedIncrement(i)) {
      checkpoints[i - start] = roleBalanceCkpts[tokenId][role]._checkpoints[i];
    }
    return PolicyholderCheckpoints.History(checkpoints);
  }

  /// @notice Returns all supply checkpoints for the given role between `start` and
  /// `end`, where `start` is inclusive and `end` is exclusive.
  /// @param role Role held by policyholder to get the checkpoints for.
  /// @param start Start index of the checkpoints to get from their checkpoint history array. This index is inclusive.
  /// @param end End index of the checkpoints to get from their checkpoint history array. This index is exclusive.
  /// @return All supply checkpoints for the given role between `start` and `end`.
  function roleSupplyCheckpoints(
    uint8 role,
    uint256 start,
    uint256 end
  ) external view returns (SupplyCheckpoints.History memory) {
    if (start > end) revert InvalidIndices();
    uint256 checkpointsLength = roleSupplyCkpts[role]._checkpoints.length;
    if (end > checkpointsLength) revert InvalidIndices();

    uint256 sliceLength = end - start;
    SupplyCheckpoints.Checkpoint[]
      memory checkpoints = new SupplyCheckpoints.Checkpoint[](sliceLength);
    for (uint256 i = start; i < end; i = LlamaUtils.uncheckedIncrement(i)) {
      checkpoints[i - start] = roleSupplyCkpts[role]._checkpoints[i];
    }
    return SupplyCheckpoints.History(checkpoints);
  }

  /// @notice Returns the number of policyholder checkpoints for the given `policyholder` and `role`.
  /// @dev Useful for knowing the max index when requesting a range of checkpoints in `roleBalanceCheckpoints`.
  /// @param policyholder Policyholder to get the number of checkpoints for.
  /// @param role ID of the role.
  /// @return The number of policyholder checkpoints for the given `policyholder` and `role`.
  function roleBalanceCheckpointsLength(
    address policyholder,
    uint8 role
  ) external view returns (uint256) {
    uint256 tokenId = _tokenId(policyholder);
    return roleBalanceCkpts[tokenId][role]._checkpoints.length;
  }

  /// @notice Returns the number of supply checkpoints for the given `role`.
  /// @dev Useful for knowing the max index when requesting a range of checkpoints in `roleSupplyCheckpoints`.
  /// @param role ID of the role.
  /// @return The number of supply checkpoints for the given `role`.
  function roleSupplyCheckpointsLength(
    uint8 role
  ) external view returns (uint256) {
    return roleSupplyCkpts[role]._checkpoints.length;
  }

  /// @notice Returns `true` if the `policyholder` has the `role`, `false` otherwise.
  /// @param policyholder Policyholder to check if they have the role.
  /// @param role ID of the role.
  /// @return `true` if the `policyholder` has the `role`, `false` otherwise.
  function hasRole(
    address policyholder,
    uint8 role
  ) public view returns (bool) {
    uint96 quantity = roleBalanceCkpts[_tokenId(policyholder)][role].latest();
    return quantity > 0;
  }

  /// @notice Returns `true` if the `policyholder` has the `role` at `timestamp`, `false` otherwise.
  /// @param policyholder Policyholder to check if they have the role.
  /// @param role ID of the role.
  /// @param timestamp Timestamp to check if the role was held at.
  /// @return `true` if the `policyholder` has the `role` at `timestamp`, `false` otherwise.
  function hasRole(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view returns (bool) {
    uint256 quantity = roleBalanceCkpts[_tokenId(policyholder)][role]
      .getAtProbablyRecentTimestamp(timestamp);
    return quantity > 0;
  }

  /// @notice Returns `true` if the given `policyholder` has a given `permissionId` under the `role`,
  /// `false` otherwise.
  /// @param policyholder Policyholder to check if they have the permission under the role.
  /// @param role ID of the role.
  /// @param permissionId ID of the permission.
  /// @return `true` if the given `policyholder` has a given `permissionId` under the `role`, `false` otherwise.
  function hasPermissionId(
    address policyholder,
    uint8 role,
    bytes32 permissionId
  ) external view returns (bool) {
    uint96 quantity = roleBalanceCkpts[_tokenId(policyholder)][role].latest();
    return quantity > 0 && canCreateAction[role][permissionId];
  }

  /// @notice Returns `true` if the `role` held by `policyholder` is expired, `false` otherwise.
  /// @param policyholder Policyholder to check if their role is expired.
  /// @param role ID of the role.
  /// @return `true` if the `role` held by `policyholder` is expired, `false` otherwise.
  function isRoleExpired(
    address policyholder,
    uint8 role
  ) public view returns (bool) {
    (, , uint64 expiration, uint96 quantity) = roleBalanceCkpts[
      _tokenId(policyholder)
    ][role].latestCheckpoint();
    return quantity > 0 && block.timestamp > expiration;
  }

  /// @notice Returns the expiration timestamp of the `role` held by `policyholder`.
  /// @param policyholder Policyholder to get the expiration timestamp of their role.
  /// @param role ID of the role.
  /// @return The expiration timestamp of the `role` held by `policyholder`.
  function roleExpiration(
    address policyholder,
    uint8 role
  ) external view returns (uint64) {
    (, , uint64 expiration, ) = roleBalanceCkpts[_tokenId(policyholder)][role]
      .latestCheckpoint();
    return expiration;
  }

  /// @notice Returns the total number of policies in existence.
  /// @dev This is just an alias for convenience/familiarity.
  /// @return The total number of policies in existence.
  function totalSupply() external view returns (uint256) {
    return getRoleSupplyAsNumberOfHolders(ALL_HOLDERS_ROLE);
  }

  // -------- ERC-721 Getters --------

  /// @notice Returns the token URI for the given `tokenId` of this Llama instance.
  /// @param tokenId The ID of the policy token.
  /// @return The token URI for the given `tokenId` of this Llama instance.
  function tokenURI(
    uint256 tokenId
  ) public view override returns (string memory) {
    ownerOf(tokenId); // ensure token exists, will revert with NOT_MINTED error if not
    return llamaPolicyMetadata.getTokenURI(name, llamaExecutor, tokenId);
  }

  /// @notice Returns a URI for the storefront-level metadata for your contract.
  /// @return The contract URI for the given Llama instance.
  function contractURI() public view returns (string memory) {
    return llamaPolicyMetadata.getContractURI(name, llamaExecutor);
  }

  // -------- ERC-721 Methods --------

  /// @dev overriding `transferFrom` to disable transfers
  function transferFrom(
    address,
    /* from */ address,
    /* to */ uint256 /* policyId */
  ) public pure override nonTransferableToken {}

  /// @dev overriding `safeTransferFrom` to disable transfers
  function safeTransferFrom(
    address,
    /* from */ address,
    /* to */ uint256 /* id */
  ) public pure override nonTransferableToken {}

  /// @dev overriding `safeTransferFrom` to disable transfers
  function safeTransferFrom(
    address,
    /* from */ address,
    /* to */ uint256,
    /* policyId */ bytes calldata /* data */
  ) public pure override nonTransferableToken {}

  /// @dev overriding `approve` to disable approvals
  function approve(
    address,
    /* spender */ uint256 /* id */
  ) public pure override nonTransferableToken {}

  /// @dev overriding `approve` to disable approvals
  function setApprovalForAll(
    address,
    /* operator */ bool /* approved */
  ) public pure override nonTransferableToken {}

  // ================================
  // ======== Internal Logic ========
  // ================================

  /// @dev Initializes the next unassigned role with the given `description`.
  function _initializeRole(RoleDescription description) internal {
    numRoles += 1;
    emit RoleInitialized(numRoles, description);
  }

  /// @dev Checks if the conditions are met for a `role` to be updated.
  function _assertValidRoleHolderUpdate(
    uint8 role,
    uint96 quantity,
    uint64 expiration
  ) internal view {
    // Ensure role is initialized.
    if (role > numRoles) revert RoleNotInitialized(role);

    // Cannot set the ALL_HOLDERS_ROLE because this is handled in the _mint / _burn methods and can
    // create duplicate entries if set here.
    if (role == ALL_HOLDERS_ROLE) revert AllHoldersRole();

    // An expiration of zero is only allowed if the role is being removed. Roles are removed when
    // the quantity is zero. In other words, the relationships that are required between the role
    // quantity and expiration fields are:
    //   - quantity > 0 && expiration > block.timestamp: This means you are adding a role
    //   - quantity == 0 && expiration == 0: This means you are removing a role
    bool case1 = quantity > 0 && expiration > block.timestamp;
    bool case2 = quantity == 0 && expiration == 0;
    if (!(case1 || case2)) revert InvalidRoleHolderInput();
  }

  /// @dev Sets the `role` for the given `policyholder` to the given `quantity` and `expiration`.
  function _setRoleHolder(
    uint8 role,
    address policyholder,
    uint96 quantity,
    uint64 expiration
  ) internal {
    _assertValidRoleHolderUpdate(role, quantity, expiration);

    // Save off whether or not the policyholder has a nonzero quantity of this role. This is used
    // below when updating the total supply of the role. The policy contract has an invariant that
    // even when a role is expired, i.e. `block.timestamp > expiration`, that role is still active
    // until explicitly revoked with `revokeExpiredRole`. Based on the assertions above for
    // determining valid inputs to this method, this means we know if a user had a role simply by
    // checking if the quantity is nonzero, and we don't need to check the expiration when setting
    // the `hadRole` and `willHaveRole` variables.
    uint256 tokenId = _tokenId(policyholder);
    uint96 initialQuantity = roleBalanceCkpts[tokenId][role].latest();
    bool hadRole = initialQuantity > 0;
    bool willHaveRole = quantity > 0;

    // Now we update the policyholder's role balance checkpoint.
    roleBalanceCkpts[tokenId][role].push(
      willHaveRole ? quantity : 0,
      expiration
    );

    // If they don't hold a policy, we mint one for them. This means that even if you use 0 quantity
    // and 0 expiration, a policy is still minted even though they hold no roles. This is because
    // they do hold the ALL_HOLDERS_ROLE simply by having a policy, so we allow this.
    if (balanceOf(policyholder) == 0) _mint(policyholder);

    // Lastly we update the total supply of the role. If the expiration is zero, it means the role
    // was removed. Determining how to update total supply requires knowing if the policyholder currently
    // has a nonzero quantity of this role. This is strictly a quantity check and ignores the
    // expiration because this is used to determine whether or not to update the total supply.
    uint96 quantityDiff;
    unchecked {
      // Safety: Can never underflow due to ternary operator check.
      quantityDiff = initialQuantity > quantity
        ? initialQuantity - quantity
        : quantity - initialQuantity;
    }

    (uint96 numberOfHolders, uint96 totalQuantity) = roleSupplyCkpts[role]
      .latest();

    if (hadRole && !willHaveRole) {
      roleSupplyCkpts[role].push(
        numberOfHolders - 1,
        totalQuantity - quantityDiff
      );
    } else if (!hadRole && willHaveRole) {
      roleSupplyCkpts[role].push(
        numberOfHolders + 1,
        totalQuantity + quantityDiff
      );
    } else if (hadRole && willHaveRole && initialQuantity > quantity) {
      roleSupplyCkpts[role].push(numberOfHolders, totalQuantity - quantityDiff);
    } else if (hadRole && willHaveRole && initialQuantity < quantity) {
      roleSupplyCkpts[role].push(numberOfHolders, totalQuantity + quantityDiff);
    } else {
      // There are two ways to reach this branch, both of which are no-ops:
      //   1. `hadRole` and `willHaveRole` are both false. We allow this without reverting so you can give
      //      someone a policy with only the `ALL_HOLDERS_ROLE` by passing in any other role that won't be set.
      //   2. `hadRole` and `willHaveRole` are both true, and `initialQuantity == quantity`. We allow this without
      //      reverting so that you can update the expiration of an existing role.
    }
    emit RoleAssigned(policyholder, role, expiration, quantity);
  }

  /// @dev Sets a role's permission along with whether that permission is valid or not.
  function _setRolePermission(
    uint8 role,
    PermissionData memory permissionData,
    bool hasPermission
  ) internal {
    if (role > numRoles) revert RoleNotInitialized(role);
    bytes32 permissionId = LlamaUtils.computePermissionId(permissionData);
    canCreateAction[role][permissionId] = hasPermission;
    emit RolePermissionAssigned(
      role,
      permissionId,
      permissionData,
      hasPermission
    );
  }

  /// @dev Mints a policyholder's policy.
  function _mint(address policyholder) internal {
    uint256 tokenId = _tokenId(policyholder);
    ERC721NonTransferableMinimalProxy._mint(policyholder, tokenId);

    (uint96 numberOfHolders, uint96 totalQuantity) = roleSupplyCkpts[
      ALL_HOLDERS_ROLE
    ].latest();
    unchecked {
      // Safety: Can never overflow a uint96 by incrementing.
      roleSupplyCkpts[ALL_HOLDERS_ROLE].push(
        numberOfHolders + 1,
        totalQuantity + 1
      );
    }

    roleBalanceCkpts[tokenId][ALL_HOLDERS_ROLE].push(1, type(uint64).max);
    emit RoleAssigned(policyholder, ALL_HOLDERS_ROLE, type(uint64).max, 1);
  }

  /// @dev Burns a policyholder's policy.
  function _burn(address policyholder) internal {
    uint256 tokenId = _tokenId(policyholder);
    ERC721NonTransferableMinimalProxy._burn(tokenId);

    (uint96 numberOfHolders, uint96 totalQuantity) = roleSupplyCkpts[
      ALL_HOLDERS_ROLE
    ].latest();
    unchecked {
      // Safety: Can never underflow, since we only burn tokens that currently exist.
      roleSupplyCkpts[ALL_HOLDERS_ROLE].push(
        numberOfHolders - 1,
        totalQuantity - 1
      );
    }

    roleBalanceCkpts[tokenId][ALL_HOLDERS_ROLE].push(0, 0);
    emit RoleAssigned(policyholder, ALL_HOLDERS_ROLE, 0, 0);
  }

  /// @dev Sets the Llama policy metadata contract.
  function _setAndInitializePolicyMetadata(
    ILlamaPolicyMetadata llamaPolicyMetadataLogic,
    bytes memory config
  ) internal {
    llamaPolicyMetadata = ILlamaPolicyMetadata(
      Clones.cloneDeterministic(
        address(llamaPolicyMetadataLogic),
        keccak256(config)
      )
    );
    llamaPolicyMetadata.initialize(config);
    emit PolicyMetadataSet(
      llamaPolicyMetadata,
      llamaPolicyMetadataLogic,
      config
    );
  }

  /// @dev Returns the token ID for a `policyholder`.
  function _tokenId(address policyholder) internal pure returns (uint256) {
    return uint256(uint160(policyholder));
  }
}
