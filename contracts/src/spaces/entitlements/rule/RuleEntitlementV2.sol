// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// contracts

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// interfaces
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IRuleEntitlementV2} from "./IRuleEntitlementV2.sol";

contract RuleEntitlementV2 is
  Initializable,
  ERC165Upgradable,
  ContextUpgradable,
  UUPSUpgradable,
  IRuleEntitlementV2
{
  using EnumerableSet for EnumerableSet.Bytes32Set;

  struct Entitlement {
    address grantedBy;
    uint256 grantedTime;
    RuleDataV2 data;
  }
  mapping(uint256 => Entitlement) internal entitlementsByRoleId;

  address public SPACE_ADDRESS;

  string public constant name = "Rule Entitlement V2";
  string public constant description = "Entitlement for crosschain rules, V2";
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
    return true;
  }

  // @inheritdoc IEntitlement
  function isEntitled(
    bytes32, //channelId,
    address[] memory, //user,
    bytes32 //permission
  ) external pure returns (bool) {
    return false;
  }

  // @inheritdoc IEntitlement
  function setEntitlement(
    uint256 roleId,
    bytes calldata entitlementData
  ) external onlySpace {
    // Decode the data
    RuleDataV2 memory data = abi.decode(entitlementData, (RuleDataV2));

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

    // Step 1: Validate Operation against CheckOperationV2 and LogicalOperation
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

    Entitlement storage entitlement = entitlementsByRoleId[roleId];

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
    Entitlement memory entitlement = entitlementsByRoleId[roleId];
    if (entitlement.grantedBy == address(0)) {
      revert Entitlement__InvalidValue();
    }

    delete entitlementsByRoleId[roleId];
  }

  // @inheritdoc IEntitlement
  function getEntitlementDataByRoleId(
    uint256 roleId
  ) external view returns (bytes memory) {
    Entitlement storage entitlement = entitlementsByRoleId[roleId];
    return abi.encode(entitlement.data);
  }

  function encodeRuleDataV2(
    RuleDataV2 calldata data
  ) external pure returns (bytes memory) {
    return abi.encode(data);
  }

  function getRuleDataV2(
    uint256 roleId
  ) external view returns (RuleDataV2 memory data) {
    return entitlementsByRoleId[roleId].data;
  }

  function encodeRuleData(
    RuleData calldata data
  ) external pure override returns (bytes memory) {
    revert("RuleEntitlementV2: encodeRuleData not supported in V2");
  }

    function getRuleData(
      uint256 roleId
    ) external view override returns (RuleData memory data) {
        revert("RuleEntitlementV2: getRuleData not supported in V2");
    }
}
