// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// interfaces
import {IEntitlement} from "../IEntitlement.sol";
import {IRoles} from "contracts/src/spaces/facets/roles/IRoles.sol";
import {IChannel} from "contracts/src/spaces/facets/channels/IChannel.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {UserEntitlementStorage} from "./UserEntitlementStorage.sol";

// contracts
import {IntrospectionFacet} from "contracts/src/diamond/facets/introspection/IntrospectionFacet.sol";
import {Context} from "contracts/src/diamond/utils/Context.sol";
import {IUserEntitlement} from "./IUserEntitlement.sol";

contract UserEntitlement is Context, IntrospectionFacet, IUserEntitlement {
  using EnumerableSet for EnumerableSet.UintSet;

  address constant EVERYONE_ADDRESS = address(1);
  string public constant name = "User Entitlement";
  string public constant description = "Entitlement for users";
  string public constant moduleType = "UserEntitlement";

  modifier onlySpace() {
    if (_msgSender() != SPACE_ADDRESS()) {
      revert Entitlement__NotAllowed();
    }
    _;
  }

  constructor(address space) {
    __IntrospectionBase_init();
    _addInterface(type(IUserEntitlement).interfaceId);
    _addInterface(type(IEntitlement).interfaceId);

    UserEntitlementStorage.Layout storage l = UserEntitlementStorage.layout();
    l.space = space;
  }

  function SPACE_ADDRESS() internal view returns (address) {
    return UserEntitlementStorage.layout().space;
  }

  // @inheritdoc IEntitlement
  function isCrosschain() external pure override returns (bool) {
    return false;
  }

  // @inheritdoc IEntitlement
  function isEntitled(
    bytes32 channelId,
    address[] memory wallets,
    bytes32 permission
  ) external view returns (bool) {
    // Check if channelId is not equal to the zero value for bytes32
    if (channelId != bytes32(0)) {
      return _isEntitledToChannel(channelId, wallets, permission);
    } else {
      return _isEntitledToSpace(wallets, permission);
    }
  }

  // @inheritdoc IEntitlement
  function setEntitlement(
    uint256 roleId,
    bytes calldata entitlementData
  ) external onlySpace {
    address[] memory users = abi.decode(entitlementData, (address[]));

    for (uint256 i = 0; i < users.length; i++) {
      address user = users[i];
      if (user == address(0)) {
        revert Entitlement__InvalidValue();
      }
    }

    UserEntitlementStorage.Layout storage ds = UserEntitlementStorage.layout();

    // First remove any prior values
    while (ds.entitlementsByRoleId[roleId].users.length > 0) {
      address user = ds.entitlementsByRoleId[roleId].users[
        ds.entitlementsByRoleId[roleId].users.length - 1
      ];
      _removeRoleIdFromUser(user, roleId);
      ds.entitlementsByRoleId[roleId].users.pop();
    }
    delete ds.entitlementsByRoleId[roleId];

    ds.entitlementsByRoleId[roleId] = UserEntitlementStorage.Entitlement({
      grantedBy: _msgSender(),
      grantedTime: block.timestamp,
      users: users
    });

    for (uint256 i = 0; i < users.length; i++) {
      ds.roleIdsByUser[users[i]].push(roleId);
    }
  }

  // @inheritdoc IEntitlement
  function removeEntitlement(uint256 roleId) external onlySpace {
    UserEntitlementStorage.Layout storage ds = UserEntitlementStorage.layout();

    if (ds.entitlementsByRoleId[roleId].grantedBy == address(0)) {
      revert Entitlement__InvalidValue();
    }

    // First remove any prior values
    while (ds.entitlementsByRoleId[roleId].users.length > 0) {
      address user = ds.entitlementsByRoleId[roleId].users[
        ds.entitlementsByRoleId[roleId].users.length - 1
      ];
      _removeRoleIdFromUser(user, roleId);
      ds.entitlementsByRoleId[roleId].users.pop();
    }
    delete ds.entitlementsByRoleId[roleId];
  }

  // @inheritdoc IEntitlement
  function getEntitlementDataByRoleId(
    uint256 roleId
  ) external view returns (bytes memory) {
    UserEntitlementStorage.Layout storage ds = UserEntitlementStorage.layout();
    return abi.encode(ds.entitlementsByRoleId[roleId].users);
  }

  // =============================================================
  //                           Internal
  // =============================================================

  /// @notice checks is a user is entitled to a specific channel
  /// @param channelId the channel id
  /// @param wallets the user address who we are checking for
  /// @param permission the permission we are checking for
  /// @return _entitled true if the user is entitled to the channel
  function _isEntitledToChannel(
    bytes32 channelId,
    address[] memory wallets,
    bytes32 permission
  ) internal view returns (bool _entitled) {
    IChannel.Channel memory channel = IChannel(SPACE_ADDRESS()).getChannel(
      channelId
    );

    // get all the roleids for the user
    uint256[] memory rolesIds = _getRoleIdsByUser(wallets);

    // loop over all role ids in a channel
    for (uint256 i = 0; i < channel.roleIds.length; i++) {
      // get each role id
      uint256 roleId = channel.roleIds[i];

      // loop over all the valid entitlements
      for (uint256 j = 0; j < rolesIds.length; j++) {
        // check if the role id for that channel matches the entitlement role id
        // and if the permission matches the role permission
        if (
          rolesIds[j] == roleId &&
          _validateRolePermission(rolesIds[j], permission)
        ) {
          _entitled = true;
        }
      }
    }
  }

  /// @notice gets all the roles given to specific users
  /// @param wallets the array of user addresses
  /// @return roles the array of roles these users have, may include duplicates
  function _getRoleIdsByUser(
    address[] memory wallets
  ) internal view returns (uint256[] memory) {
    uint256 totalLength = 0;

    UserEntitlementStorage.Layout storage ds = UserEntitlementStorage.layout();

    // Calculate total length
    for (uint256 i = 0; i < wallets.length; i++) {
      totalLength += ds.roleIdsByUser[wallets[i]].length;
    }

    totalLength += ds.roleIdsByUser[EVERYONE_ADDRESS].length;

    // Create an array to hold all roles
    uint256[] memory roles = new uint256[](totalLength);
    uint256 currentIndex = 0;

    // Populate the roles array
    for (uint256 i = 0; i < wallets.length; i++) {
      uint256[] memory rolesForWallet = ds.roleIdsByUser[wallets[i]];
      for (uint256 j = 0; j < rolesForWallet.length; j++) {
        roles[currentIndex++] = rolesForWallet[j];
      }
    }

    uint256[] memory rolesForEveryone = ds.roleIdsByUser[EVERYONE_ADDRESS];
    for (uint256 j = 0; j < rolesForEveryone.length; j++) {
      roles[currentIndex++] = rolesForEveryone[j];
    }

    return roles;
  }

  /// @notice checks if a user is entitled to a specific space
  /// @param wallets the user address
  /// @param permission the permission we are checking for
  /// @return _entitled true if the user is entitled to the space
  function _isEntitledToSpace(
    address[] memory wallets,
    bytes32 permission
  ) internal view returns (bool) {
    // get all the roleids for the user
    uint256[] memory rolesIds = _getRoleIdsByUser(wallets);

    for (uint256 i = 0; i < rolesIds.length; i++) {
      if (_validateRolePermission(rolesIds[i], permission)) {
        return true;
      }
    }

    return false;
  }

  /// @notice checks if a role has a specific permission
  /// @param roleId the role id
  /// @param permission the permission we are checking for
  /// @return _hasPermission true if the role has the permission
  function _validateRolePermission(
    uint256 roleId,
    bytes32 permission
  ) internal view returns (bool) {
    string[] memory permissions = IRoles(SPACE_ADDRESS())
      .getPermissionsByRoleId(roleId);
    uint256 permissionLen = permissions.length;

    for (uint256 i = 0; i < permissionLen; i++) {
      bytes32 permissionBytes = bytes32(abi.encodePacked(permissions[i]));
      if (permissionBytes == permission) {
        return true;
      }
    }

    return false;
  }

  function _removeRoleIdFromUser(address user, uint256 roleId) internal {
    UserEntitlementStorage.Layout storage ds = UserEntitlementStorage.layout();

    uint256[] storage roles = ds.roleIdsByUser[user];
    for (uint256 i = 0; i < roles.length; i++) {
      if (roles[i] == roleId) {
        roles[i] = roles[roles.length - 1];
        roles.pop();
        return;
      }
    }

    // Optional: Revert if the roleId is not found
    revert("Role ID not found for the user");
  }
}
