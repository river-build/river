// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

// interfaces
import {IVotesEnumerable} from "contracts/src/diamond/facets/governance/votes/enumerable/IVotesEnumerable.sol";
import {IAuthorizedClaimers} from "contracts/src/tokens/river/mainnet/claimer/IAuthorizedClaimers.sol";
import {IMainnetDelegation} from "contracts/src/tokens/river/base/delegation/IMainnetDelegation.sol";
import {ICrossDomainMessenger} from "./ICrossDomainMessenger.sol";

// libraries
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";

// contracts

contract DelegationRelayer {
  address public immutable MESSENGER;
  address public immutable BASE_REGISTRY;

  address public immutable RIVER;
  address public immutable CLAIMER_MANAGER;

  constructor(
    address _rvr,
    address _claimers,
    address _messenger,
    address _target
  ) {
    RIVER = _rvr;
    CLAIMER_MANAGER = IAuthorizedClaimers(_claimers);
    MESSENGER = _messenger;
    BASE_REGISTRY = _target;
  }
}
