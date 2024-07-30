// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

// libraries

import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";

// contracts
import {RolesBaseSetup} from "contracts/test/spaces/roles/RolesBaseSetup.sol";

// mocks

contract RolesTest_SetChannelPermissionsOverrides is RolesBaseSetup {
  // =============================================================
  // Channel Permissions
  // =============================================================
  function test_setChannelPermissionOverrides()
    external
    givenRoleExists
    givenRoleIsInChannel
  {
    string[] memory permissions = new string[](1);
    permissions[0] = Permissions.Read;

    vm.prank(founder);
    roles.setChannelPermissionOverrides(ROLE_ID, CHANNEL_ID, permissions);

    // get the channel permissions
    string[] memory channelPermissions = roles.getChannelPermissionOverrides(
      ROLE_ID,
      CHANNEL_ID
    );

    assertEq(channelPermissions.length, 1);
    assertEq(channelPermissions[0], permissions[0]);
  }
}
