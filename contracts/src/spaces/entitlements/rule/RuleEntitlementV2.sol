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
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// libraries
import {RuleDataUtil} from "contracts/src/spaces/entitlements/rule/RuleDataUtil.sol";

// interfaces
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IRuleEntitlement} from "./IRuleEntitlement.sol";
import {IRuleEntitlementV2} from "./IRuleEntitlementV2.sol";

contract RuleEntitlementV2 is
  Initializable,
  ERC165Upgradeable,
  ContextUpgradeable,
  UUPSUpgradeable,
  IRuleEntitlementV2
{
  // keccak256(abi.encode(uint256(keccak256("spaces.entitlements.rule.storage.v2")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant STORAGE_SLOT =
    0x858b72ffb9b2fa0fc89266b0dd2710729cbe0194d0dc7ad7f830ebf836219000;

  struct Entitlement {
    address grantedBy;
    uint256 grantedTime;
    bytes data;
  }

  struct Layout {
    mapping(uint256 => Entitlement) entitlementsByRoleId;
  }

  address public SPACE_ADDRESS;
  string public constant name = "Rule Entitlement V2";
  string public constant description = "Entitlement for crosschain rules";
  string public constant moduleType = "RuleEntitlementV2";

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address _space) public initializer {
    __UUPSUpgradeable_init();
    __ERC165_init();
    __Context_init();

    SPACE_ADDRESS = _space;
  }

  modifier onlySpace() {
    if (_msgSender() != SPACE_ADDRESS) {
      revert Entitlement__NotAllowed();
    }
    _;
  }

  /// @notice allow the contract to be upgraded while retaining state
  /// @param newImplementation address of the new implementation
  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlySpace {}

  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override returns (bool) {
    return
      interfaceId == type(IEntitlement).interfaceId ||
      super.supportsInterface(interfaceId);
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
    address sender = _msgSender();
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

    Entitlement storage entitlement = layout().entitlementsByRoleId[roleId];

    entitlement.grantedBy = sender;
    entitlement.grantedTime = currentTime;
    entitlement.data = abi.encode(data);
  }

  // @inheritdoc IEntitlement
  function removeEntitlement(uint256 roleId) external onlySpace {
    Layout storage ds = layout();

    Entitlement memory entitlement = ds.entitlementsByRoleId[roleId];
    if (entitlement.grantedBy == address(0)) {
      revert Entitlement__InvalidValue();
    }

    delete ds.entitlementsByRoleId[roleId].grantedBy;
    delete ds.entitlementsByRoleId[roleId].grantedTime;
    delete ds.entitlementsByRoleId[roleId].data;
    delete ds.entitlementsByRoleId[roleId];
  }

  // @inheritdoc IEntitlement
  function getEntitlementDataByRoleId(
    uint256 roleId
  ) external view returns (bytes memory) {
    Entitlement storage entitlement = layout().entitlementsByRoleId[roleId];
    return abi.encode(entitlement.data);
  }

  function encodeRuleDataV2(
    RuleData calldata data
  ) external pure returns (bytes memory) {
    return abi.encode(data);
  }

  function getRuleDataV2(
    uint256 roleId
  ) external view returns (RuleData memory data) {
    bytes memory ruleData = layout().entitlementsByRoleId[roleId].data;

    if (ruleData.length == 0) {
      return
        RuleData(
          new Operation[](0),
          new CheckOperation[](0),
          new LogicalOperation[](0)
        );
    }

    return abi.decode(ruleData, (IRuleEntitlementV2.RuleData));
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
    RuleData memory v2Data = abi.decode(
      layout().entitlementsByRoleId[roleId].data,
      (RuleData)
    );
    return RuleDataUtil.convertV2ToV1RuleData(v2Data);
  }

  function layout() internal pure returns (Layout storage ds) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      ds.slot := slot
    }
  }
}
