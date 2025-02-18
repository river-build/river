// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";

//interfaces
import {IAppRegistryBase} from "contracts/src/app/interfaces/IAppRegistry.sol";
import {IAppInstallerBase} from "contracts/src/app/interfaces/IAppInstaller.sol";
import {IAppHooks} from "contracts/src/app/interfaces/IAppHooks.sol";
import {IEntitlementsManager} from "contracts/src/spaces/facets/entitlements/IEntitlementsManager.sol";
import {IEntitlementBase} from "contracts/src/spaces/entitlements/IEntitlement.sol";

//libraries
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";

//contracts
import {InstallFacet} from "contracts/src/spaces/facets/install/InstallFacet.sol";

contract IntegrationInstallApp is
  BaseSetup,
  IAppRegistryBase,
  IAppInstallerBase,
  IEntitlementBase
{
  InstallFacet installer;
  IEntitlementsManager entitlementsManager;

  address appAddress;
  address appOwner;
  uint256 appId;
  function setUp() public override {
    super.setUp();
    installer = InstallFacet(space);
    entitlementsManager = IEntitlementsManager(space);
    appAddress = _randomAddress();
    appOwner = _randomAddress();
  }

  modifier givenAppIsRegistered() {
    _registerApp();
    _;
  }

  modifier givenAppIsInstalled() {
    bytes32[] memory emptyChannelIds = new bytes32[](0);

    vm.prank(founder);
    vm.expectEmit(address(appInstaller));
    emit AppInstalled(space, appId, emptyChannelIds);
    installer.installApp(appId, emptyChannelIds);
    _;
  }

  function test_installApp() public givenAppIsRegistered givenAppIsInstalled {
    assertContains(appInstaller.installedApps(space), appId);
    assertTrue(
      entitlementsManager.isEntitledToSpace(appAddress, Permissions.Read)
    );
  }

  function test_installApp_revertWith_Entitlement__NotAllowed()
    public
    givenAppIsRegistered
  {
    bytes32[] memory emptyChannelIds = new bytes32[](0);

    vm.prank(_randomAddress());
    vm.expectRevert(Entitlement__NotAllowed.selector);
    installer.installApp(appId, emptyChannelIds);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                         Internals                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function _registerApp() internal {
    bytes32[] memory permissions = new bytes32[](2);
    permissions[0] = bytes32(abi.encodePacked(Permissions.Read));
    permissions[1] = bytes32(abi.encodePacked(Permissions.Write));

    Registration memory registration = Registration({
      appAddress: appAddress,
      owner: appOwner,
      uri: "app.xyz",
      name: "App",
      symbol: "APP",
      permissions: permissions,
      hooks: IAppHooks(address(0)),
      disabled: false
    });

    vm.prank(appOwner);
    appId = appRegistry.register(registration);
  }
}
