// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IOwnableBase} from "contracts/src/diamond/facets/ownable/IERC173.sol";
import {IEntitlementsManager} from "contracts/src/spaces/facets/entitlements/IEntitlementsManager.sol";
import {IEntitlementsManagerBase} from "contracts/src/spaces/facets/entitlements/IEntitlementsManager.sol";
import {IMembershipBase} from "contracts/src/spaces/facets/membership/IMembership.sol";
import {IChannel} from "contracts/src/spaces/facets/channels/IChannel.sol";
import {IRoles, IRolesBase} from "contracts/src/spaces/facets/roles/IRoles.sol";
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";

// libraries
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";
import {RuleEntitlementUtil} from "../../crosschain/RuleEntitlementUtil.sol";

// contracts
import {EntitlementsManager} from "contracts/src/spaces/facets/entitlements/EntitlementsManager.sol";
import {MockUserEntitlement} from "contracts/test/mocks/MockUserEntitlement.sol";
import {MembershipFacet} from "contracts/src/spaces/facets/membership/MembershipFacet.sol";

// errors

// solhint-disable-next-line max-line-length
import {EntitlementsService__InvalidEntitlementAddress, EntitlementsService__InvalidEntitlementInterface, EntitlementsService__ImmutableEntitlement, EntitlementsService__EntitlementDoesNotExist, EntitlementsService__EntitlementAlreadyExists} from "contracts/src/spaces/facets/entitlements/EntitlementsManagerService.sol";

import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";

contract EntitlementsManagerTest is
  BaseSetup,
  IEntitlementsManagerBase,
  IMembershipBase
{
  EntitlementsManager internal entitlements;
  MockUserEntitlement internal mockEntitlement;
  MockUserEntitlement internal mockImmutableEntitlement;
  address[] internal immutableEntitlements;

  function setUp() public override {
    super.setUp();

    entitlements = EntitlementsManager(everyoneSpace);

    mockEntitlement = new MockUserEntitlement();

    mockImmutableEntitlement = new MockUserEntitlement();
    immutableEntitlements.push(address(mockImmutableEntitlement));
  }

  function test_addImmutableEntitlements() external {
    vm.prank(founder);
    entitlements.addImmutableEntitlements(immutableEntitlements);
  }

  function test_addImmutableEntitlements_revert_when_not_owner() external {
    address user = _randomAddress();

    vm.prank(user);
    vm.expectRevert(
      abi.encodeWithSelector(IOwnableBase.Ownable__NotOwner.selector, user)
    );
    entitlements.addImmutableEntitlements(immutableEntitlements);
  }

  function test_addImmutableEntitlements_revert_when_invalid_entitlement_address()
    external
  {
    address[] memory invalidEntitlements = new address[](1);
    invalidEntitlements[0] = address(0);

    vm.prank(founder);
    vm.expectRevert(EntitlementsService__InvalidEntitlementAddress.selector);
    entitlements.addImmutableEntitlements(invalidEntitlements);
  }

  function test_addImmutableEntitlements_revert_when_invalid_entitlement_interface()
    external
  {
    vm.prank(founder);
    vm.expectRevert(EntitlementsService__InvalidEntitlementAddress.selector);
    entitlements.addImmutableEntitlements(new address[](1));
  }

  function test_addImmutableEntitlements_revert_when_already_exists() external {
    vm.startPrank(founder);
    entitlements.addImmutableEntitlements(immutableEntitlements);
    vm.stopPrank();

    vm.prank(founder);
    vm.expectRevert(EntitlementsService__EntitlementAlreadyExists.selector);
    entitlements.addImmutableEntitlements(immutableEntitlements);
  }

  // =============================================================
  //                      Add Entitlements
  // =============================================================

  function test_addEntitlement() external {
    vm.prank(founder);
    entitlements.addEntitlementModule(address(mockEntitlement));
  }

  function test_addEntitlement_revert_when_not_owner() external {
    address user = _randomAddress();

    vm.prank(user);
    vm.expectRevert(
      abi.encodeWithSelector(IOwnableBase.Ownable__NotOwner.selector, user)
    );
    entitlements.addEntitlementModule(address(mockEntitlement));
  }

  function test_addEntitlement_revert_when_invalid_entitlement_address()
    external
  {
    vm.prank(founder);
    vm.expectRevert(EntitlementsService__InvalidEntitlementAddress.selector);
    entitlements.addEntitlementModule(address(0));
  }

  function test_addEntitlement_revert_when_invalid_entitlement_interface()
    external
  {
    vm.prank(founder);
    vm.expectRevert(EntitlementsService__InvalidEntitlementInterface.selector);
    entitlements.addEntitlementModule(address(this));
  }

  function test_addEntitlement_revert_when_already_exists() external {
    vm.startPrank(founder);
    entitlements.addEntitlementModule(address(mockEntitlement));

    vm.expectRevert(EntitlementsService__EntitlementAlreadyExists.selector);
    entitlements.addEntitlementModule(address(mockEntitlement));
    vm.stopPrank();
  }

  function _arrangeInitialEntitlements() internal {
    vm.startPrank(founder);
    entitlements.addImmutableEntitlements(immutableEntitlements);
    entitlements.addEntitlementModule(address(mockEntitlement));
    vm.stopPrank();
  }

  // =============================================================
  //                      Remove Entitlements
  // =============================================================

  function test_removeEntitlement() external {
    _arrangeInitialEntitlements();

    vm.prank(founder);
    entitlements.removeEntitlementModule(address(mockEntitlement));
  }

  function test_removeEntitlement_revert_when_not_owner() external {
    _arrangeInitialEntitlements();

    address user = _randomAddress();

    vm.prank(user);
    vm.expectRevert(
      abi.encodeWithSelector(IOwnableBase.Ownable__NotOwner.selector, user)
    );
    entitlements.removeEntitlementModule(address(mockEntitlement));
  }

  function test_removeEntitlement_revert_when_invalid_entitlement_address()
    external
  {
    vm.prank(founder);
    vm.expectRevert(EntitlementsService__InvalidEntitlementAddress.selector);
    entitlements.removeEntitlementModule(address(0));
  }

  function test_removeEntitlement_revert_when_invalid_entitlement_interface()
    external
  {
    vm.prank(founder);
    vm.expectRevert(EntitlementsService__InvalidEntitlementInterface.selector);
    entitlements.removeEntitlementModule(address(this));
  }

  function test_removeEntitlement_revert_when_does_not_exist() external {
    vm.prank(founder);
    vm.expectRevert(EntitlementsService__EntitlementDoesNotExist.selector);
    entitlements.removeEntitlementModule(address(mockEntitlement));
  }

  function test_removeEntitlement_revert_when_removing_immutable_entitlement()
    external
  {
    _arrangeInitialEntitlements();

    vm.prank(founder);
    vm.expectRevert(EntitlementsService__ImmutableEntitlement.selector);
    entitlements.removeEntitlementModule(address(mockImmutableEntitlement));
  }

  // =============================================================
  //                      Get Entitlements
  // =============================================================
  function test_getEntitlements() external {
    _arrangeInitialEntitlements();

    Entitlement[] memory allEntitlements = entitlements.getEntitlements();
    assertEq(allEntitlements.length > 0, true);
  }

  // =============================================================
  //                      Get Entitlement
  // =============================================================

  function test_getSingleEntitlement() external {
    _arrangeInitialEntitlements();
    Entitlement memory entitlement = entitlements.getEntitlement(
      address(mockEntitlement)
    );

    assertEq(address(entitlement.moduleAddress), address(mockEntitlement));
  }

  function test_getEntitlementDataByRole() external {
    _arrangeInitialEntitlements();

    IEntitlementsManager.EntitlementData[] memory entitlement = entitlements
      .getEntitlementDataByPermission(Permissions.JoinSpace);

    assertEq(entitlement.length == 1, true);
    assertEq(
      keccak256(abi.encodePacked(entitlement[0].entitlementType)),
      keccak256(abi.encodePacked("UserEntitlement"))
    );
  }

  function test_GetChannelEntitlementDataByPermission() external {
    _arrangeInitialEntitlements();

    string[] memory permissions = new string[](1);
    permissions[0] = Permissions.Read;
    address[] memory users = new address[](1);
    users[0] = founder;
    IRolesBase.CreateEntitlement[]
      memory createEntitlements = new IRolesBase.CreateEntitlement[](1);
    createEntitlements[0] = IRolesBase.CreateEntitlement({
      module: IEntitlement(mockEntitlement),
      data: abi.encode(users)
    });

    uint256 roleId = IRoles(everyoneSpace).createRole(
      "test-channel-member",
      permissions,
      createEntitlements
    );
    vm.stopPrank();

    uint256[] memory roles = new uint256[](1);
    roles[0] = roleId;
    bytes32 channelId = "test-channel";
    IChannel(everyoneSpace).createChannel(channelId, "Metadata", roles);

    IEntitlementsManager.EntitlementData[]
      memory channelEntitlements = entitlements
        .getChannelEntitlementDataByPermission(channelId, Permissions.Read);

    assertEq(channelEntitlements.length == 1, true);
    assertEq(
      keccak256(abi.encodePacked(channelEntitlements[0].entitlementType)),
      keccak256(abi.encodePacked("MockUserEntitlement"))
    );
    assertEq(
      keccak256(abi.encodePacked(channelEntitlements[0].entitlementData)),
      keccak256(abi.encode(users))
    );
  }

  function test_getEntitlement_revert_when_invalid_entitlement_address()
    external
  {
    vm.prank(founder);
    vm.expectRevert(EntitlementsService__InvalidEntitlementAddress.selector);
    entitlements.getEntitlement(address(0));
  }

  function test_getEntitlement_revert_when_does_not_exist() external {
    vm.prank(founder);
    vm.expectRevert(EntitlementsService__EntitlementDoesNotExist.selector);
    entitlements.getEntitlement(address(mockEntitlement));
  }

  // =============================================================
  //                      Is Entitled To Space
  // =============================================================

  function test_isEntitledToSpace() external {
    address user = _randomAddress();

    assertEq(entitlements.isEntitledToSpace(user, "test"), false);

    assertEq(
      entitlements.isEntitledToSpace(founder, Permissions.JoinSpace),
      true
    );

    vm.prank(user);
    MembershipFacet(everyoneSpace).joinSpace(user);

    assertEq(
      entitlements.isEntitledToSpace(founder, Permissions.JoinSpace),
      true
    );
  }
}
