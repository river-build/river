// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementGated} from "./IEntitlementGated.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IEntitlementChecker} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";

// libraries

// contracts
import {EntitlementGatedBase} from "./EntitlementGatedBase.sol";
import {Facet} from "@river-build/diamond/src/facets/Facet.sol";
import {ReentrancyGuard} from "solady/utils/ReentrancyGuard.sol";

contract EntitlementGated is
  IEntitlementGated,
  EntitlementGatedBase,
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
    _addInterface(type(IEntitlementGated).interfaceId);
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

  /// @notice Post the result of the entitlement check for a specific role
  /// @dev Only the entitlement checker can call this function
  /// @param transactionId The unique identifier for the transaction
  /// @param roleId The role ID for the entitlement check
  /// @param result The result of the entitlement check (PASSED or FAILED)
  function postEntitlementCheckResultV2(
    bytes32 transactionId,
    uint256 roleId,
    NodeVoteStatus result
  ) external payable onlyEntitlementChecker nonReentrant {
    _postEntitlementCheckResultV2(transactionId, roleId, result);
  }

  /// deprecated Use EntitlementDataQueryable.getCrossChainEntitlementData instead
  function getRuleData(
    bytes32 transactionId,
    uint256 roleId
  ) external view returns (IRuleEntitlement.RuleData memory) {
    return _getRuleData(transactionId, roleId);
  }
}
