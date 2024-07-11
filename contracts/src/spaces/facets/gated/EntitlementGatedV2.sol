// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementGatedV2} from "./IEntitlementGatedV2.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";
import {IEntitlementChecker} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";

// libraries

// contracts
import {EntitlementGatedBaseV2} from "./EntitlementGatedBaseV2.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {ReentrancyGuard} from "contracts/src/diamond/facets/reentrancy/ReentrancyGuard.sol";

contract EntitlementGatedV2 is
  IEntitlementGatedV2,
  EntitlementGatedBaseV2,
  ReentrancyGuard,
  Facet
{
  function __EntitlementGated_init(
    IEntitlementChecker entitlementChecker
  ) external onlyInitializing {
    __EntitlementGated_init_unchained(entitlementChecker);
  }

  function __EntitlementGated_init_unchained(
    IEntitlementChecker entitlementChecker
  ) internal {
    _addInterface(type(IEntitlementGatedV2).interfaceId);
    _setEntitlementChecker(entitlementChecker);
  }

  // Called by the xchain node to post the result of the entitlement check
  // the internal function validates the transactionId and the result
  function postEntitlementCheckResult(
    bytes32 transactionId,
    uint256 roleId,
    NodeVoteStatus result
  ) external nonReentrant {
    _postEntitlementCheckResult(transactionId, roleId, result);
  }

  function getRuleData(
    bytes32 transactionId,
    uint256 roleId
  ) external view returns (IRuleEntitlementV2.RuleData memory) {
    return _getRuleData(transactionId, roleId);
  }
}
