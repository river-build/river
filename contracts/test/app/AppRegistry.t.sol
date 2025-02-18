// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces
import {IAppHooks} from "contracts/src/app/interfaces/IAppHooks.sol";
import {IAppRegistryBase} from "contracts/src/app/interfaces/IAppRegistry.sol";
import {IAppInstallerBase} from "contracts/src/app/interfaces/IAppInstaller.sol";

//libraries
import {App} from "contracts/src/app/libraries/App.sol";
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";

//contracts
import {AppRegistry} from "contracts/src/app/facets/AppRegistry.sol";
import {AppInstaller} from "contracts/src/app/facets/AppInstaller.sol";

import {DeployAppStore} from "contracts/scripts/deployments/diamonds/DeployAppStore.s.sol";

contract AppRegistryTest is TestUtils, IAppRegistryBase, IAppInstallerBase {
  DeployAppStore deployAppStore = new DeployAppStore();

  AppRegistry public appRegistry;
  AppInstaller public appInstaller;

  function setUp() external {
    address deployer = getDeployer();
    address appStore = deployAppStore.deploy(deployer);

    appRegistry = AppRegistry(appStore);
    appInstaller = AppInstaller(appStore);
  }

  modifier givenAppIsRegistered(Registration memory registration) {
    _registerApp(registration);
    _;
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                         Register                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_register(
    Registration memory registration
  ) external givenAppIsRegistered(registration) {
    assertTrue(appRegistry.isRegistered(registration.appAddress));

    Registration memory reg = appRegistry.getRegistration(
      registration.appAddress
    );

    assertEq(reg.uri, registration.uri);
    assertEq(reg.permissions, registration.permissions);
    assertEq(reg.disabled, registration.disabled);
  }

  function test_revertWith_AppNotOwnedBySender(
    address notOwner,
    Registration memory registration
  ) external givenAppIsRegistered(registration) {
    vm.assume(notOwner != registration.owner);
    vm.prank(notOwner);
    vm.expectRevert(AppNotOwnedBySender.selector);
    appRegistry.register(registration);
  }

  function test_revertWith_AppAlreadyRegistered(
    Registration memory registration
  ) external givenAppIsRegistered(registration) {
    vm.prank(registration.owner);
    vm.expectRevert(AppAlreadyRegistered.selector);
    appRegistry.register(registration);
  }

  function test_revertWith_AppDisabled() external {
    Registration memory registration = Registration({
      appAddress: makeAddr("app"),
      owner: makeAddr("owner"),
      uri: "uri",
      name: "name",
      symbol: "symbol",
      disabled: true,
      permissions: new bytes32[](0),
      hooks: IAppHooks(address(0))
    });

    vm.prank(registration.owner);
    vm.expectRevert(AppDisabled.selector);
    appRegistry.register(registration);
  }

  function test_revertWith_AppPermissionsMissing() external {
    Registration memory registration = Registration({
      appAddress: makeAddr("app"),
      owner: makeAddr("owner"),
      uri: "uri",
      name: "name",
      symbol: "symbol",
      disabled: false,
      permissions: new bytes32[](0),
      hooks: IAppHooks(address(0))
    });

    vm.prank(registration.owner);
    vm.expectRevert(AppPermissionsMissing.selector);
    appRegistry.register(registration);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                   Update Registration                      */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
  function test_updateRegistration(Registration memory registration) external {
    uint256 appId = _registerApp(registration);

    UpdateRegistration memory update = UpdateRegistration({
      uri: "newUri",
      permissions: new bytes32[](0),
      hooks: IAppHooks(address(0)),
      disabled: false
    });

    vm.prank(registration.owner);
    vm.expectEmit(address(appInstaller));
    emit AppUpdated(registration.owner, registration.appAddress, appId, update);
    appRegistry.updateRegistration(appId, update);
  }

  function test_revertWith_AppNotRegistered() external {
    UpdateRegistration memory update = UpdateRegistration({
      uri: "newUri",
      permissions: new bytes32[](0),
      hooks: IAppHooks(address(0)),
      disabled: false
    });

    vm.prank(makeAddr("notOwner"));
    vm.expectRevert(AppNotRegistered.selector);
    appRegistry.updateRegistration(1, update);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                    App Installation                        */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_install(Registration memory registration) external {
    uint256 appId = _registerApp(registration);

    address space = makeAddr("space");
    bytes32[] memory channelIds = new bytes32[](1);
    channelIds[0] = bytes32("cool-channel");

    _installApp(appId, space, channelIds);

    uint256 balance = appInstaller.balanceOf(space, appId);
    assertEq(balance, 1);
  }

  function test_install_revertWith_AppNotRegistered() external {
    address space = makeAddr("space");
    uint256 appId = _randomUint256();
    bytes32[] memory channelIds = new bytes32[](1);
    channelIds[0] = bytes32("cool-channel");

    vm.prank(space);
    vm.expectRevert(AppNotRegistered.selector);
    appInstaller.install(appId, channelIds);
  }

  function test_install_revertWith_AppAlreadyInstalled(
    Registration memory registration
  ) external {
    uint256 appId = _registerApp(registration);

    address space = makeAddr("space");
    bytes32[] memory channelIds = new bytes32[](1);
    channelIds[0] = bytes32("cool-channel");

    _installApp(appId, space, channelIds);

    vm.prank(space);
    vm.expectRevert(AppAlreadyInstalled.selector);
    appInstaller.install(appId, channelIds);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                         Uninstall                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  struct Install {
    address space;
    bytes32[] channelIds;
  }

  function test_uninstall(
    Registration memory registration,
    Install memory install
  ) external {
    uint256 appId = _registerApp(registration);
    _installApp(appId, install.space, install.channelIds);

    uint256 balance = appInstaller.balanceOf(install.space, appId);
    assertEq(balance, 1);

    _uninstallApp(appId, install.space, install.channelIds);

    balance = appInstaller.balanceOf(install.space, appId);
    assertEq(balance, 0);
  }

  function test_uninstall_revertWith_AppNotRegistered() external {
    uint256 appId = _randomUint256();
    address space = makeAddr("space");
    bytes32[] memory channelIds = new bytes32[](1);
    channelIds[0] = bytes32("cool-channel");

    vm.prank(space);
    vm.expectRevert(AppNotRegistered.selector);
    appInstaller.uninstall(appId, channelIds);
  }

  function test_uninstall_revertWith_AppNotInstalled(
    Registration memory registration,
    Install memory install
  ) external assumeValidChannelIds(install.channelIds) {
    uint256 appId = _registerApp(registration);

    vm.prank(install.space);
    vm.expectRevert(AppNotInstalled.selector);
    appInstaller.uninstall(appId, install.channelIds);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                        Internal                            */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  modifier assumeValidChannelIds(bytes32[] memory channelIds) {
    for (uint256 i; i < channelIds.length; ++i) {
      vm.assume(channelIds[i] != bytes32(uint256(uint160(ZERO_SENTINEL))));
    }
    _;
  }

  function _installApp(
    uint256 appId,
    address space,
    bytes32[] memory channelIds
  ) internal assumeEOA(space) {
    for (uint256 i; i < channelIds.length; ++i) {
      vm.assume(channelIds[i] != bytes32(uint256(uint160(ZERO_SENTINEL))));
    }

    vm.prank(space);
    vm.expectEmit(address(appInstaller));
    emit AppInstalled(space, appId, channelIds);
    appInstaller.install(appId, channelIds);
  }

  function _uninstallApp(
    uint256 appId,
    address space,
    bytes32[] memory channelIds
  ) internal {
    vm.prank(space);
    vm.expectEmit(address(appInstaller));
    emit AppUninstalled(space, appId, channelIds);
    appInstaller.uninstall(appId, channelIds);
  }

  function _registerApp(
    Registration memory registration
  ) internal returns (uint256 appId) {
    vm.assume(bytes(registration.uri).length > 0);
    vm.assume(bytes(registration.name).length > 0);
    vm.assume(bytes(registration.symbol).length > 0);
    vm.assume(registration.owner != address(0));
    vm.assume(registration.owner != address(0));
    vm.assume(registration.appAddress != address(0));
    vm.assume(appRegistry.isRegistered(registration.appAddress) == false);
    registration.disabled = false;

    bytes32[] memory permissions = new bytes32[](2);
    permissions[0] = bytes32(abi.encodePacked(Permissions.Read));
    permissions[1] = bytes32(abi.encodePacked(Permissions.Write));

    registration.hooks = IAppHooks(address(0));
    registration.permissions = permissions;

    vm.prank(registration.owner);
    vm.expectEmit(address(appInstaller));
    emit AppRegistered(
      registration.owner,
      registration.appAddress,
      1,
      registration
    );
    return appRegistry.register(registration);
  }
}
