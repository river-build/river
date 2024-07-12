// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";

library RuleDataUtil {
  error IncompatibleRuleData();
  error InvalidRuleData();

  function convertV2ToV1CheckOpType(
    IRuleEntitlementV2.CheckOperationType v2Type
  ) internal pure returns (IRuleEntitlement.CheckOperationType) {
    if (v2Type == IRuleEntitlementV2.CheckOperationType.ERC721) {
      return IRuleEntitlement.CheckOperationType.ERC721;
    } else if (v2Type == IRuleEntitlementV2.CheckOperationType.ERC20) {
      return IRuleEntitlement.CheckOperationType.ERC20;
    } else if (v2Type == IRuleEntitlementV2.CheckOperationType.ERC1155) {
      return IRuleEntitlement.CheckOperationType.ERC1155;
    } else if (v2Type == IRuleEntitlementV2.CheckOperationType.ISENTITLED) {
      return IRuleEntitlement.CheckOperationType.ISENTITLED;
    } else if (v2Type == IRuleEntitlementV2.CheckOperationType.MOCK) {
      return IRuleEntitlement.CheckOperationType.MOCK;
    } else if (v2Type == IRuleEntitlementV2.CheckOperationType.NONE) {
      return IRuleEntitlement.CheckOperationType.NONE;
    } else {
      revert InvalidRuleData();
    }
  }

  function convertV1ToV2CheckOpType(
    IRuleEntitlement.CheckOperationType v1Type
  ) internal pure returns (IRuleEntitlementV2.CheckOperationType) {
    if (v1Type == IRuleEntitlement.CheckOperationType.ERC721) {
      return IRuleEntitlementV2.CheckOperationType.ERC721;
    } else if (v1Type == IRuleEntitlement.CheckOperationType.ERC20) {
      return IRuleEntitlementV2.CheckOperationType.ERC20;
    } else if (v1Type == IRuleEntitlement.CheckOperationType.ERC1155) {
      return IRuleEntitlementV2.CheckOperationType.ERC1155;
    } else if (v1Type == IRuleEntitlement.CheckOperationType.ISENTITLED) {
      return IRuleEntitlementV2.CheckOperationType.ISENTITLED;
    } else if (v1Type == IRuleEntitlement.CheckOperationType.MOCK) {
      return IRuleEntitlementV2.CheckOperationType.MOCK;
    } else if (v1Type == IRuleEntitlement.CheckOperationType.NONE) {
      return IRuleEntitlementV2.CheckOperationType.NONE;
    } else {
      revert InvalidRuleData();
    }
  }

  function convertV2ToV1LogicalOpType(
    IRuleEntitlementV2.LogicalOperationType v2Type
  ) internal pure returns (IRuleEntitlement.LogicalOperationType) {
    if (v2Type == IRuleEntitlementV2.LogicalOperationType.AND) {
      return IRuleEntitlement.LogicalOperationType.AND;
    } else if (v2Type == IRuleEntitlementV2.LogicalOperationType.OR) {
      return IRuleEntitlement.LogicalOperationType.OR;
    } else {
      revert InvalidRuleData();
    }
  }

  function convertV1ToV2LogicalOpType(
    IRuleEntitlement.LogicalOperationType v1Type
  ) internal pure returns (IRuleEntitlementV2.LogicalOperationType) {
    if (v1Type == IRuleEntitlement.LogicalOperationType.AND) {
      return IRuleEntitlementV2.LogicalOperationType.AND;
    } else if (v1Type == IRuleEntitlement.LogicalOperationType.OR) {
      return IRuleEntitlementV2.LogicalOperationType.OR;
    } else {
      revert InvalidRuleData();
    }
  }

  function convertV2ToV1CombinedOpType(
    IRuleEntitlementV2.CombinedOperationType v2Type
  ) internal pure returns (IRuleEntitlement.CombinedOperationType) {
    if (v2Type == IRuleEntitlementV2.CombinedOperationType.CHECK) {
      return IRuleEntitlement.CombinedOperationType.CHECK;
    } else if (v2Type == IRuleEntitlementV2.CombinedOperationType.LOGICAL) {
      return IRuleEntitlement.CombinedOperationType.LOGICAL;
    } else if (v2Type == IRuleEntitlementV2.CombinedOperationType.NONE) {
      return IRuleEntitlement.CombinedOperationType.NONE;
    } else {
      revert InvalidRuleData();
    }
  }

  function convertV1ToV2CombinedOpType(
    IRuleEntitlement.CombinedOperationType v1Type
  ) internal pure returns (IRuleEntitlementV2.CombinedOperationType) {
    if (v1Type == IRuleEntitlement.CombinedOperationType.CHECK) {
      return IRuleEntitlementV2.CombinedOperationType.CHECK;
    } else if (v1Type == IRuleEntitlement.CombinedOperationType.LOGICAL) {
      return IRuleEntitlementV2.CombinedOperationType.LOGICAL;
    } else if (v1Type == IRuleEntitlement.CombinedOperationType.NONE) {
      return IRuleEntitlementV2.CombinedOperationType.NONE;
    } else {
      revert InvalidRuleData();
    }
  }

  function convertV2ToV1RuleData(
    IRuleEntitlementV2.RuleData memory v2Data
  ) internal pure returns (IRuleEntitlement.RuleData memory) {
    IRuleEntitlement.RuleData memory v1Data;
    v1Data.operations = new IRuleEntitlement.Operation[](
      v2Data.operations.length
    );
    v1Data.checkOperations = new IRuleEntitlement.CheckOperation[](
      v2Data.checkOperations.length
    );
    v1Data.logicalOperations = new IRuleEntitlement.LogicalOperation[](
      v2Data.logicalOperations.length
    );

    for (uint256 i = 0; i < v2Data.checkOperations.length; i++) {
      IRuleEntitlementV2.CheckOperation memory v2CheckOp = v2Data
        .checkOperations[i];
      IRuleEntitlement.CheckOperation memory v1CheckOp;
      v1CheckOp.opType = convertV2ToV1CheckOpType(v2CheckOp.opType);
      v1CheckOp.chainId = v2CheckOp.chainId;
      v1CheckOp.contractAddress = v2CheckOp.contractAddress;

      // Convert checkOp-specific params
      if (v2CheckOp.opType == IRuleEntitlementV2.CheckOperationType.ERC721) {
        IRuleEntitlementV2.ERC721Params memory v2Params = abi.decode(
          v2CheckOp.params,
          (IRuleEntitlementV2.ERC721Params)
        );
        v1CheckOp.threshold = v2Params.threshold;
      } else if (
        v2CheckOp.opType == IRuleEntitlementV2.CheckOperationType.ERC20
      ) {
        IRuleEntitlementV2.ERC20Params memory v2Params = abi.decode(
          v2CheckOp.params,
          (IRuleEntitlementV2.ERC20Params)
        );
        v1CheckOp.threshold = v2Params.threshold;
      } else if (
        v2CheckOp.opType == IRuleEntitlementV2.CheckOperationType.MOCK
      ) {
        IRuleEntitlementV2.MockParams memory v2Params = abi.decode(
          v2CheckOp.params,
          (IRuleEntitlementV2.MockParams)
        );
        v1CheckOp.threshold = v2Params.threshold;
      } else if (
        v2CheckOp.opType == IRuleEntitlementV2.CheckOperationType.ERC1155
      ) {
        // 1155s are not supported in v1
        revert IncompatibleRuleData();
      }

      v1Data.checkOperations[i] = v1CheckOp;
    }

    for (uint256 i = 0; i < v2Data.operations.length; i++) {
      IRuleEntitlementV2.Operation memory v2Op = v2Data.operations[i];
      IRuleEntitlement.Operation memory v1Op;
      v1Op.opType = convertV2ToV1CombinedOpType(v2Op.opType);
      v1Op.index = v2Op.index;
      v1Data.operations[i] = v1Op;
    }

    for (uint256 i = 0; i < v2Data.logicalOperations.length; i++) {
      IRuleEntitlementV2.LogicalOperation memory v2LogicalOp = v2Data
        .logicalOperations[i];
      IRuleEntitlement.LogicalOperation memory v1LogicalOp;
      v1LogicalOp.logOpType = convertV2ToV1LogicalOpType(v2LogicalOp.logOpType);
      v1LogicalOp.leftOperationIndex = v2LogicalOp.leftOperationIndex;
      v1LogicalOp.rightOperationIndex = v2LogicalOp.rightOperationIndex;
      v1Data.logicalOperations[i] = v1LogicalOp;
    }

    return v1Data;
  }

  function convertV1ToV2RuleData(
    IRuleEntitlement.RuleData memory v1Data
  ) internal pure returns (IRuleEntitlementV2.RuleData memory) {
    IRuleEntitlementV2.RuleData memory v2Data;
    v2Data.operations = new IRuleEntitlementV2.Operation[](
      v1Data.operations.length
    );
    v2Data.checkOperations = new IRuleEntitlementV2.CheckOperation[](
      v1Data.checkOperations.length
    );
    v2Data.logicalOperations = new IRuleEntitlementV2.LogicalOperation[](
      v1Data.logicalOperations.length
    );

    for (uint256 i = 0; i < v1Data.checkOperations.length; i++) {
      IRuleEntitlement.CheckOperation memory v1CheckOp = v1Data.checkOperations[
        i
      ];
      IRuleEntitlementV2.CheckOperation memory v2CheckOp;
      v2CheckOp.opType = convertV1ToV2CheckOpType(v1CheckOp.opType);
      v2CheckOp.chainId = v1CheckOp.chainId;
      v2CheckOp.contractAddress = v1CheckOp.contractAddress;

      // Convert checkOp-specific params
      if (v1CheckOp.opType == IRuleEntitlement.CheckOperationType.ERC721) {
        IRuleEntitlementV2.ERC721Params memory v2Params;
        v2Params.threshold = v1CheckOp.threshold;
        v2CheckOp.params = abi.encode(v2Params);
      } else if (
        v1CheckOp.opType == IRuleEntitlement.CheckOperationType.ERC20
      ) {
        IRuleEntitlementV2.ERC20Params memory v2Params;
        v2Params.threshold = v1CheckOp.threshold;
        v2CheckOp.params = abi.encode(v2Params);
      } else if (v1CheckOp.opType == IRuleEntitlement.CheckOperationType.MOCK) {
        IRuleEntitlementV2.MockParams memory v2Params;
        v2Params.threshold = v1CheckOp.threshold;
        v2CheckOp.params = abi.encode(v2Params);
      } else if (
        v1CheckOp.opType == IRuleEntitlement.CheckOperationType.ERC1155
      ) {
        // 1155s are not supported by V1 RuleDatas, this is invalid
        revert IncompatibleRuleData();
      }

      v2Data.checkOperations[i] = v2CheckOp;
    }

    for (uint256 i = 0; i < v1Data.operations.length; i++) {
      IRuleEntitlement.Operation memory v1Op = v1Data.operations[i];
      IRuleEntitlementV2.Operation memory v2Op;
      v2Op.opType = convertV1ToV2CombinedOpType(v1Op.opType);
      v2Op.index = v1Op.index;
      v2Data.operations[i] = v2Op;
    }

    for (uint256 i = 0; i < v1Data.logicalOperations.length; i++) {
      IRuleEntitlement.LogicalOperation memory v1LogicalOp = v1Data
        .logicalOperations[i];
      IRuleEntitlementV2.LogicalOperation memory v2LogicalOp;
      v2LogicalOp.logOpType = convertV1ToV2LogicalOpType(v1LogicalOp.logOpType);
      v2LogicalOp.leftOperationIndex = v1LogicalOp.leftOperationIndex;
      v2LogicalOp.rightOperationIndex = v1LogicalOp.rightOperationIndex;
      v2Data.logicalOperations[i] = v2LogicalOp;
    }

    return v2Data;
  }
}
