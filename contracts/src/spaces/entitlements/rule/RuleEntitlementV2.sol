// SPDX-License-Identifier: MIT

/**
 * @title RuleEntitlementV2
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
pragma solidity ^0.8.0;

// contracts

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {RuleDataUtil} from "contracts/src/spaces/entitlements/rule/RuleDataUtil.sol";
import {RuleEntitlementStorage} from "contracts/src/spaces/entitlements/rule/RuleEntitlementStorage.sol";

// interfaces
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IRuleEntitlement} from "./IRuleEntitlement.sol";
import {IRuleEntitlementV2} from "./IRuleEntitlementV2.sol";

// contracts
import {IntrospectionFacet} from "contracts/src/diamond/facets/introspection/IntrospectionFacet.sol";

contract RuleEntitlementV2 is IntrospectionFacet, IRuleEntitlementV2 {
  using EnumerableSet for EnumerableSet.Bytes32Set;

  string public constant name = "Rule Entitlement V2";
  string public constant description = "Entitlement for crosschain rules";
  string public constant moduleType = "RuleEntitlementV2";

  constructor(address _space) {
    __IntrospectionBase_init();
    _addInterface(type(IRuleEntitlementV2).interfaceId);
    _addInterface(type(IEntitlement).interfaceId);

    RuleEntitlementStorage.layout().space = _space;
  }

  modifier onlySpace() {
    if (msg.sender != SPACE_ADDRESS()) {
      revert Entitlement__NotAllowed();
    }
    _;
  }

  // =============================================================
  //                           External
  // =============================================================
  function SPACE_ADDRESS() public view returns (address) {
    return RuleEntitlementStorage.layout().space;
  }

  // @inheritdoc IEntitlement
  function isCrosschain() external pure override returns (bool) {
    // TODO possible optimization: return false if no crosschain operations
    return true;
  }

  // @inheritdoc IEntitlement
  function isEntitled(
    bytes32, //channelId,
    address[] memory, //user,
    bytes32 //permission
  ) external pure returns (bool) {
    // TODO possible optimization: if there are no crosschain operations, evaluate locally
    return false;
  }

  // @inheritdoc IEntitlement
  function setEntitlement(
    uint256 roleId,
    bytes calldata entitlementData
  ) external onlySpace {
    // Decode the data
    RuleData memory data = abi.decode(entitlementData, (RuleData));

    if (entitlementData.length == 0 || data.operations.length == 0) {
      return;
    }

    // Cache sender and currentTime
    address sender = msg.sender;
    uint256 currentTime = block.timestamp;

    // Cache lengths of operations arrays to reduce state access cost
    uint256 operationsLength = data.operations.length;
    uint256 checkOperationsLength = data.checkOperations.length;
    uint256 logicalOperationsLength = data.logicalOperations.length;

    // Step 1: Validate Operation against CheckOperation and LogicalOperation
    for (uint256 i = 0; i < operationsLength; i++) {
      CombinedOperationType opType = data.operations[i].opType; // cache the operation type
      uint8 index = data.operations[i].index; // cache the operation index

      if (opType == CombinedOperationType.CHECK) {
        if (index >= checkOperationsLength) {
          revert InvalidCheckOperationIndex(
            index,
            uint8(checkOperationsLength)
          );
        }
      } else if (opType == CombinedOperationType.LOGICAL) {
        // Use custom error in revert statement
        if (index >= logicalOperationsLength) {
          revert InvalidLogicalOperationIndex(
            index,
            uint8(logicalOperationsLength)
          );
        }

        // Verify the logical operations make a DAG
        LogicalOperation memory logicalOp = data.logicalOperations[index];
        uint8 leftOperationIndex = logicalOp.leftOperationIndex;
        uint8 rightOperationIndex = logicalOp.rightOperationIndex;

        // Use custom errors in revert statements
        if (leftOperationIndex >= i) {
          revert InvalidLeftOperationIndex(leftOperationIndex, uint8(i));
        }

        if (rightOperationIndex >= i) {
          revert InvalidRightOperationIndex(rightOperationIndex, uint8(i));
        }
      }
    }

    RuleEntitlementStorage.Layout storage ds = RuleEntitlementStorage.layout();

    RuleEntitlementStorage.Entitlement storage entitlement = ds
      .entitlementsByRoleId[roleId];

    entitlement.grantedBy = sender;
    entitlement.grantedTime = currentTime;

    // All checks passed; initialize state variables
    // Manually copy _checkOperations to checkOperations
    for (uint256 i = 0; i < checkOperationsLength; i++) {
      entitlement.data.checkOperations.push(data.checkOperations[i]);
    }

    for (uint256 i = 0; i < logicalOperationsLength; i++) {
      entitlement.data.logicalOperations.push(data.logicalOperations[i]);
    }

    for (uint256 i = 0; i < operationsLength; i++) {
      entitlement.data.operations.push(data.operations[i]);
    }
  }

  // @inheritdoc IEntitlement
  function removeEntitlement(uint256 roleId) external onlySpace {
    RuleEntitlementStorage.Layout storage ds = RuleEntitlementStorage.layout();

    RuleEntitlementStorage.Entitlement memory entitlement = ds
      .entitlementsByRoleId[roleId];
    if (entitlement.grantedBy == address(0)) {
      revert Entitlement__InvalidValue();
    }

    delete ds.entitlementsByRoleId[roleId];
  }

  // @inheritdoc IEntitlement
  function getEntitlementDataByRoleId(
    uint256 roleId
  ) external view returns (bytes memory) {
    RuleEntitlementStorage.Layout storage ds = RuleEntitlementStorage.layout();

    return abi.encode(ds.entitlementsByRoleId[roleId].data);
  }

  function encodeRuleDataV2(
    RuleData calldata data
  ) external pure returns (bytes memory) {
    return abi.encode(data);
  }

  function getRuleDataV2(
    uint256 roleId
  ) external view returns (RuleData memory data) {
    return RuleEntitlementStorage.layout().entitlementsByRoleId[roleId].data;
  }

  // =============================================================
  //        IRuleEntitlement V1 Compatibility Functions
  // =============================================================
  // The following methods cause the RuleEntitlementV2 contract to conform to the
  // IRuleEntitlement (V1) interface.

  // This method should encode the V1 rule data into bytes representation of
  // the V2 format. This allows V1 clients and nodes to be compatible with V2 spaces.
  function encodeRuleData(
    IRuleEntitlement.RuleData memory data
  ) external pure returns (bytes memory) {
    IRuleEntitlementV2.RuleData memory v2Data = RuleDataUtil
      .convertV1ToV2RuleData(data);
    return abi.encode(v2Data);
  }

  // Retrieve internal V2 RuleData struct and convert it to V1 RuleData struct for
  // V1 clients and nodes to be compatible with V2 spaces.
  function getRuleData(
    uint256 roleId
  ) external view returns (IRuleEntitlement.RuleData memory data) {
    RuleEntitlementStorage.Layout storage ds = RuleEntitlementStorage.layout();

    IRuleEntitlementV2.RuleData memory v2Data = ds
      .entitlementsByRoleId[roleId]
      .data;

    return RuleDataUtil.convertV2ToV1RuleData(v2Data);
  }
}
