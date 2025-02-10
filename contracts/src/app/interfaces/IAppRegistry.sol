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
    string[] permissions;
    IAppHooks hooks;
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

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Errors                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  error AppAlreadyRegistered();
  error AppNotRegistered();
}

interface IAppRegistry is IAppRegistryBase {
  function register(
    Registration calldata registration
  ) external returns (uint256);
}
