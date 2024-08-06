// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementDataQueryable, IEntitlementDataQueryableBase} from "contracts/src/spaces/facets/entitlements/extensions/IEntitlementDataQueryable.sol";
import {IEntitlementsManager} from "contracts/src/spaces/facets/entitlements/IEntitlementsManager.sol";
import {IRolesBase, IRoles} from "contracts/src/spaces/facets/roles/IRoles.sol";
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IChannel} from "contracts/src/spaces/facets/channels/IChannel.sol";

// libraries
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";
import {Vm} from "forge-std/Test.sol";

// contracts

import {MembershipBaseSetup} from "contracts/test/spaces/membership/MembershipBaseSetup.sol";

// mocks
import {MockUserEntitlement} from "contracts/test/mocks/MockUserEntitlement.sol";

contract EntitlementDataQueryableTest is
  MembershipBaseSetup,
  IEntitlementDataQueryableBase,
  IRolesBase
{
  IEntitlementDataQueryable internal entitlements;
  MockUserEntitlement internal mockEntitlement;

  bytes32 internal constant CHECK_REQUESTED =
    keccak256(
      "EntitlementCheckRequested(address,address,bytes32,uint256,address[])"
    );

  function setUp() public override {
    super.setUp();

    entitlements = IEntitlementDataQueryable(everyoneSpace);
    mockEntitlement = new MockUserEntitlement();
    mockEntitlement.initialize(everyoneSpace);

    vm.prank(founder);
    IEntitlementsManager(everyoneSpace).addEntitlementModule(
      address(mockEntitlement)
    );
  }

  function test_getEntitlementDataByRole() external view {
    EntitlementData[] memory entitlement = entitlements
      .getEntitlementDataByPermission(Permissions.JoinSpace);

    assertEq(entitlement.length, 1);
    assertEq(entitlement[0].entitlementType, "UserEntitlement");
  }

  function test_fuzz_getChannelEntitlementDataByPermission(
    address[] memory users
  ) external {
    vm.assume(users.length > 0);
    for (uint256 i; i < users.length; ++i) {
      if (users[i] == address(0)) users[i] = vm.randomAddress();
    }

    string[] memory permissions = new string[](1);
    permissions[0] = Permissions.Read;

    CreateEntitlement[] memory createEntitlements = new CreateEntitlement[](1);
    createEntitlements[0] = CreateEntitlement({
      module: IEntitlement(mockEntitlement),
      data: abi.encode(users)
    });

    vm.prank(founder);
    uint256 roleId = IRoles(everyoneSpace).createRole(
      "test-channel-member",
      permissions,
      createEntitlements
    );

    uint256[] memory roles = new uint256[](1);
    roles[0] = roleId;
    bytes32 channelId = "test-channel";

    vm.prank(founder);
    IChannel(everyoneSpace).createChannel(channelId, "Metadata", roles);

    EntitlementData[] memory channelEntitlements = entitlements
      .getChannelEntitlementDataByPermission(channelId, Permissions.Read);

    assertEq(channelEntitlements.length, 1);
    assertEq(channelEntitlements[0].entitlementType, "MockUserEntitlement");
    assertEq(channelEntitlements[0].entitlementData, abi.encode(users));
  }

  function test_fuzz_getCrossChainEntitlementData(address alice) public {
    // user must be EOA or implement `onERC721Received`
    vm.assume(alice != address(0) && alice.code.length == 0);
    vm.recordLogs();

    vm.prank(alice);
    membership.joinSpace(alice);

    Vm.Log[] memory requestLogs = vm.getRecordedLogs(); // Retrieve the recorded logs

    (, bytes32 transactionId, uint256 roleId, ) = _getRequestedEntitlementData(
      requestLogs
    );

    EntitlementData memory data = IEntitlementDataQueryable(userSpace)
      .getCrossChainEntitlementData(transactionId, roleId);

    assertTrue(data.entitlementData.length > 0);
    assertEq(data.entitlementType, "RuleEntitlementV2");
  }

  // TODO: debug this test
  // `forge test --mt test_getCrossChainEntitlementData_fail -vvv`
  function test_getCrossChainEntitlementData_fail() external {
    vm.expectRevert(); // comment this line to debug the test
    this.test_fuzz_getCrossChainEntitlementData(
      0xea475d60c118d7058beF4bDd9c32bA51139a74e0
    );
  }

  function _getRequestedEntitlementData(
    Vm.Log[] memory requestLogs
  )
    internal
    pure
    returns (
      address contractAddress,
      bytes32 transactionId,
      uint256 roleId,
      address[] memory selectedNodes
    )
  {
    for (uint256 i; i < requestLogs.length; ++i) {
      if (
        requestLogs[i].topics.length > 0 &&
        requestLogs[i].topics[0] == CHECK_REQUESTED
      ) {
        (, contractAddress, transactionId, roleId, selectedNodes) = abi.decode(
          requestLogs[i].data,
          (address, address, bytes32, uint256, address[])
        );
        return (contractAddress, transactionId, roleId, selectedNodes);
      }
    }
    revert("Entitlement check request not found");
  }
}
