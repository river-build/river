// SPDX-License-Identifier: MIT

/**
 * @title EntitlementRule
 * @dev This contract manages entitlement rules based on blockchain operations.
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

// interfaces
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IRuleEntitlement} from "./IRuleEntitlement.sol";

contract RuleEntitlement is
  Initializable,
  ERC165Upgradeable,
  ContextUpgradeable,
  UUPSUpgradeable,
  IRuleEntitlement
{
  // keccak256(abi.encode(uint256(keccak256("spaces.entitlements.rule.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant STORAGE_SLOT =
    0xa7ba26993e5aed586ba0b4d511980a49b23ea33e13d5f0920b7e42ae1a27cc00;

  struct Entitlement {
    address grantedBy;
    uint256 grantedTime;
    bytes data;
  }

  // @custom:storage-location erc7201:spaces.entitlements.rule.storage
  struct Layout {
    address space;
    mapping(uint256 => Entitlement) entitlementsByRoleId;
  }

  string public constant name = "Rule Entitlement";
  string public constant description = "Entitlement for crosschain rules";
  string public constant moduleType = "RuleEntitlement";

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address _space) public initializer {
    __UUPSUpgradeable_init();
    __ERC165_init();
    __Context_init();
    layout().space = _space;
  }

  modifier onlySpace() {
    if (_msgSender() != layout().space) {
      revert Entitlement__NotAllowed();
    }
    _;
  }

  // =============================================================
  //                           Admin
  // =============================================================

  /// @notice allow the contract to be upgraded while retaining state
  /// @param newImplementation address of the new implementation
  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlySpace {}

  /// @notice get the storage slot for the contract
  /// @return ds storage slot
  function layout() internal pure returns (Layout storage ds) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      ds.slot := slot
    }
  }

  // =============================================================
  //                           External
  // =============================================================
  function SPACE_ADDRESS() external view returns (address) {
    return layout().space;
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override returns (bool) {
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
    bytes32,
    address[] memory,
    bytes32
  ) external pure returns (bool) {
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
    entitlement.data = entitlementData;
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

  function encodeRuleData(
    RuleData calldata data
  ) external pure returns (bytes memory) {
    return abi.encode(data);
  }

  function getRuleData(
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

    return abi.decode(ruleData, (RuleData));
  }
}
