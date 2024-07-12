// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IEntitlementChecker} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";
import {EntitlementGatedV2} from "contracts/src/spaces/facets/gated/EntitlementGatedV2.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";

import {RuleDataUtil} from "contracts/src/spaces/entitlements/rule/RuleDataUtil.sol";

contract MockEntitlementGatedV2 is EntitlementGatedV2 {
  mapping(uint256 => IRuleEntitlementV2.RuleData) ruleDatasByRoleId;
  IRuleEntitlementV2.RuleData encodedRuleData;

  constructor(IEntitlementChecker checker) {
    _setEntitlementChecker(checker);
  }

  // This function is used to set the RuleData for the requestEntitlementCheck function
  // jamming it in here so it can be called from the test
  function getRuleDataV2(
    uint256 roleId
  ) external view returns (IRuleEntitlementV2.RuleData memory) {
    return ruleDatasByRoleId[roleId];
  }

  function getRuleData(
    uint256 roleId
  ) external view returns (IRuleEntitlement.RuleData memory) {
    IRuleEntitlementV2.RuleData memory ruleData = ruleDatasByRoleId[roleId];
    return RuleDataUtil.convertV2ToV1RuleData(ruleData);
  }

  function requestEntitlementCheck(
    uint256 roleId,
    IRuleEntitlement.RuleData calldata ruleData
  ) external returns (bytes32) {
    IRuleEntitlementV2.RuleData memory ruleDataV2 = RuleDataUtil
      .convertV1ToV2RuleData(ruleData);
    IRuleEntitlementV2.RuleData storage storedRuleData = ruleDatasByRoleId[
      roleId
    ];

    // Copy these nested memory arrays into storage. Likely not ideal for production, but this is a test contract.
    // Copy operations
    delete storedRuleData.operations;
    for (uint256 i = 0; i < ruleDataV2.operations.length; i++) {
      storedRuleData.operations.push(ruleDataV2.operations[i]);
    }

    // copy checkops
    delete storedRuleData.checkOperations;
    for (uint256 i = 0; i < ruleDataV2.checkOperations.length; i++) {
      storedRuleData.checkOperations.push(ruleDataV2.checkOperations[i]);
    }

    // copy logicalops
    delete storedRuleData.logicalOperations;
    for (uint256 i = 0; i < ruleDataV2.logicalOperations.length; i++) {
      storedRuleData.logicalOperations.push(ruleDataV2.logicalOperations[i]);
    }

    bytes32 transactionId = keccak256(
      abi.encodePacked(tx.origin, block.number)
    );
    _requestEntitlementCheck(
      transactionId,
      IRuleEntitlementV2(address(this)),
      0
    );
    return transactionId;
  }

  function requestEntitlementCheckV2(
    uint256 roleId,
    IRuleEntitlementV2.RuleData calldata ruleData
  ) external returns (bytes32) {
    ruleDatasByRoleId[roleId] = ruleData;
    bytes32 transactionId = keccak256(
      abi.encodePacked(tx.origin, block.number)
    );
    _requestEntitlementCheck(
      transactionId,
      IRuleEntitlementV2(address(this)),
      0
    );
    return transactionId;
  }
}
