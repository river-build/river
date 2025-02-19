// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppHooks} from "contracts/src/app/interfaces/IAppHooks.sol";
// libraries

// contracts

interface IAppRegistryBase {
  struct Registration {
    address appAddress;
    address owner;
    string uri;
    string name;
    string symbol;
    bool disabled;
    string[] permissions;
    IAppHooks hooks;
  }

  struct UpdateRegistration {
    string uri;
    string[] permissions;
    IAppHooks hooks;
    bool disabled;
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Events                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  event AppRegistered(
    address indexed owner,
    address indexed appAddress,
    uint256 indexed appId,
    Registration registration
  );

  event AppUpdated(
    address indexed owner,
    address indexed appAddress,
    uint256 indexed appId,
    UpdateRegistration registration
  );

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Errors                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  error AppAlreadyRegistered();
  error AppNotRegistered();
  error AppNotOwnedBySender();
  error AppDisabled();
  error AppPermissionsMissing();
  error AppPermissionNotAllowed();
}

interface IAppRegistry is IAppRegistryBase {
  function register(
    Registration calldata registration
  ) external returns (uint256 appId);

  function isRegistered(address appAddress) external view returns (bool);

  function getRegistration(
    address appAddress
  ) external view returns (Registration memory);

  function updateRegistration(
    uint256 appId,
    UpdateRegistration calldata registration
  ) external;
}
