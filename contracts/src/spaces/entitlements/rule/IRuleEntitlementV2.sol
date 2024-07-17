// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// interfaces
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";

/**
 * @title IRuleEntitlementV2
 * @dev This contract manages entitlement rules based on blockchain operations. It is the V2
 * version of the RuleEntitlement contract with support for extensible parameters for check operations.
 *
 * The contract maintains a tree-like data structure to combine various types of operations.
 * The tree is implemented as a dynamic array of 'Operation' structs, and is built in post-order fashion.
 *
 * Post-order Tree Structure:
 * In a post-order binary tree, children nodes must be added before their respective parent nodes.
 * The 'LogicalOperation' nodes refer to their child nodes via indices in the 'operations' array.
 * As new LogicalOperation nodes are added, they can only reference existing nodes in the 'operations' array,
 * ensuring a valid post-order tree structure.
 */
interface IRuleEntitlementV2 is IEntitlement {
  // =============================================================
  //                           Errors
  // =============================================================
  error CheckOperationsLimitReached(uint256 limit);
  error OperationsLimitReached(uint256 limit);
  error LogicalOperationLimitReached(uint256 limit);
  error InvalidCheckOperationIndex(
    uint8 operationIndex,
    uint8 checkOperationsLength
  );
  error InvalidLogicalOperationIndex(
    uint8 operationIndex,
    uint8 logicalOperationsLength
  );
  error InvalidOperationType(IRuleEntitlementV2.CombinedOperationType opType);
  error InvalidLeftOperationIndex(
    uint8 leftOperationIndex,
    uint8 currentOperationIndex
  );
  error InvalidRightOperationIndex(
    uint8 rightOperationIndex,
    uint8 currentOperationIndex
  );

  // =============================================================
  //                           Enums
  // =============================================================
  enum CheckOperationType {
    NONE,
    MOCK,
    ERC20,
    ERC721,
    ERC1155,
    ISENTITLED
  }

  // Enum for Operation oneof operation_clause
  enum LogicalOperationType {
    NONE,
    AND,
    OR
  }

  // Redefined Operation struct
  enum CombinedOperationType {
    NONE,
    CHECK,
    LOGICAL
  }

  // =============================================================
  //                           Structs
  // =============================================================
  struct CheckOperation {
    CheckOperationType opType;
    uint256 chainId;
    address contractAddress;
    bytes params;
  }

  struct ERC20Params {
    uint256 threshold;
  }

  struct ERC721Params {
    uint256 threshold;
  }

  struct ERC1155Params {
    uint256 tokenId;
    uint256 threshold;
  }

  struct MockParams {
    uint256 threshold;
  }

  struct LogicalOperation {
    LogicalOperationType logOpType;
    uint8 leftOperationIndex;
    uint8 rightOperationIndex;
  }

  struct Operation {
    CombinedOperationType opType;
    uint8 index; // Index in either checkOperations or logicalOperations arrays
  }

  struct RuleData {
    Operation[] operations;
    CheckOperation[] checkOperations;
    LogicalOperation[] logicalOperations;
  }

  // =============================================================
  //                           Functions
  // =============================================================

  /**
   * @notice Encodes the RuleData struct into bytes
   * @param data RuleData struct to encode
   * @return Encoded bytes of the RuleData struct
   */
  function encodeRuleDataV2(
    RuleData memory data
  ) external pure returns (bytes memory);

  /**
   * @notice Decodes the RuleData struct from bytes
   * @param roleId Role ID
   * @return data RuleData struct
   */
  function getRuleDataV2(
    uint256 roleId
  ) external view returns (RuleData memory data);

  // =============================================================
  //        IRuleEntitlement V1 Compatibility Functions
  // =============================================================
  // The following methods cause the RuleEntitlementV2 contract to conform to the
  // IRuleEntitlement (V1) interface.
  /**
   * @notice Encodes the RuleData struct into bytes
   * @param data RuleData struct to encode
   * @return Encoded bytes of the RuleData struct
   */
  function encodeRuleData(
    IRuleEntitlement.RuleData memory data
  ) external pure returns (bytes memory);

  /**
   * @notice Decodes the RuleData struct from bytes
   * @param roleId Role ID
   * @return data RuleData struct
   */
  function getRuleData(
    uint256 roleId
  ) external view returns (IRuleEntitlement.RuleData memory data);
}
