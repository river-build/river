// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IEntitlementChecker} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";
import {EntitlementGated} from "contracts/src/spaces/facets/gated/EntitlementGated.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IEntitlementDataQueryableBase} from "contracts/src/spaces/facets/entitlements/extensions/IEntitlementDataQueryable.sol";

/// @dev _onEntitlementCheckResultPosted is not implemented to avoid confusion
contract MockEntitlementGated is EntitlementGated {
  mapping(uint256 => IRuleEntitlement.RuleData) ruleDatasByRoleId;
  mapping(uint256 => IRuleEntitlement.RuleDataV2) ruleDatasV2ByRoleId;

  IRuleEntitlement.RuleData encodedRuleData;

  constructor(IEntitlementChecker checker) {
    _setEntitlementChecker(checker);
  }

  // This function is used to get the RuleData for the requestEntitlementCheck function
  // jamming it in here so it can be called from the test
  function getRuleData(
    uint256 roleId
  ) external view returns (IRuleEntitlement.RuleData memory) {
    return ruleDatasByRoleId[roleId];
  }

  /// @dev This function is used to get the RuleDataV2 for the requestEntitlementCheck function
  function getRuleDataV2(
    uint256 roleId
  ) external view returns (IRuleEntitlement.RuleDataV2 memory) {
    return ruleDatasV2ByRoleId[roleId];
  }

  /// @dev This function is used to request a v1 entitlement check for a roleId and RuleData v1
  function requestEntitlementCheckV1RuleDataV1(
    uint256 roleId,
    IRuleEntitlement.RuleData calldata ruleData
  ) external returns (bytes32) {
    ruleDatasByRoleId[roleId] = ruleData;
    bytes32 transactionId = keccak256(
      abi.encodePacked(tx.origin, block.number)
    );
    _requestEntitlementCheck(
      msg.sender,
      transactionId,
      IRuleEntitlement(address(this)),
      roleId
    );
    return transactionId;
  }

  /// @dev This function is used to request a v1 entitlement check for a roleId and RuleData v2
  function requestEntitlementCheckV1RuleDataV2(
    uint256[] calldata roleIds,
    IRuleEntitlement.RuleDataV2 calldata ruleData
  ) external returns (bytes32) {
    for (uint256 i = 0; i < roleIds.length; i++) {
      ruleDatasV2ByRoleId[roleIds[i]] = ruleData;
    }
    bytes32 transactionId = keccak256(
      abi.encodePacked(tx.origin, block.number)
    );

    for (uint256 i = 0; i < roleIds.length; i++) {
      _requestEntitlementCheck(
        msg.sender,
        transactionId,
        IRuleEntitlement(address(this)),
        roleIds[i]
      );
    }
    return transactionId;
  }

  /// @dev This function is used to request an entitlement check v2 for a roleId and RuleData v1
  function requestEntitlementCheckV2RuleDataV1(
    uint256[] calldata roleIds,
    IRuleEntitlement.RuleData calldata ruleData
  ) external payable returns (bytes32) {
    for (uint256 i = 0; i < roleIds.length; i++) {
      ruleDatasByRoleId[roleIds[i]] = ruleData;
    }
    bytes32 transactionId = keccak256(
      abi.encodePacked(tx.origin, block.number)
    );

    for (uint256 i = 0; i < roleIds.length; i++) {
      _requestEntitlementCheckV2(
        msg.sender,
        address(this),
        transactionId,
        IRuleEntitlement(address(this)),
        roleIds[i]
      );
    }
    return transactionId;
  }

  /// @dev This function is used to request a v2 entitlement check for a roleId and RuleData v2
  function requestEntitlementCheckV2RuleDataV2(
    uint256[] calldata roleIds,
    IRuleEntitlement.RuleDataV2 calldata ruleData
  ) external payable returns (bytes32) {
    for (uint256 i = 0; i < roleIds.length; i++) {
      ruleDatasV2ByRoleId[roleIds[i]] = ruleData;
    }
    bytes32 transactionId = keccak256(
      abi.encodePacked(tx.origin, block.number)
    );

    for (uint256 i = 0; i < roleIds.length; i++) {
      _requestEntitlementCheckV2(
        msg.sender,
        address(this),
        transactionId,
        IRuleEntitlement(address(this)),
        roleIds[i]
      );
    }
    return transactionId;
  }

  function getCrossChainEntitlementData(
    bytes32,
    uint256 roleId
  )
    external
    view
    returns (IEntitlementDataQueryableBase.EntitlementData memory)
  {
    if (ruleDatasByRoleId[roleId].operations.length > 0) {
      return
        IEntitlementDataQueryableBase.EntitlementData(
          "RuleEntitlement",
          abi.encode(ruleDatasByRoleId[roleId])
        );
    } else {
      return
        IEntitlementDataQueryableBase.EntitlementData(
          "RuleEntitlementV2",
          abi.encode(ruleDatasV2ByRoleId[roleId])
        );
    }
  }
}
