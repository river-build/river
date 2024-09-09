// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IERC5643} from "contracts/src/diamond/facets/token/ERC5643/IERC5643.sol";
import {IERC173} from "contracts/src/diamond/facets/ownable/IERC173.sol";

import {IManagedProxyBase} from "contracts/src/diamond/proxy/managed/IManagedProxy.sol";

// libraries

// contracts
import {ITokenOwnableBase} from "contracts/src/diamond/facets/ownable/token/ITokenOwnable.sol";
import {IMembershipBase} from "contracts/src/spaces/facets/membership/IMembership.sol";

interface ISpaceProxyInitializer is
  ITokenOwnableBase,
  IMembershipBase,
  IManagedProxyBase
{
  function initialize(
    address owner,
    ManagedProxy memory managedProxy,
    TokenOwnable memory tokenOwnable,
    Membership memory membership
  ) external;
}
