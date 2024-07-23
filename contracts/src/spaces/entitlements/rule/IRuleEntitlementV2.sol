// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// interfaces
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";


interface IRuleEntitlementV2 is IEntitlement, IRuleEntitlement {
  // Repeated here to be extensible in V2 separately from V1, where future checktypes will not be supported.
  enum CheckOperationV2Type {
    NONE,
    MOCK,
    ERC20,
    ERC721,
    ERC1155,
    ISENTITLED
  }

  struct CheckOperationV2 {
    CheckOperationV2Type opType;
    uint256 chainId;
    address contractAddress;
    bytes params; // ABI-encoded params for the check operation, specific to the check type.
  }

  // These params may never be decoded within a contract, but the layout is defined here as documentation.
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

  struct RuleDataV2 {
    Operation[] operations;
    CheckOperationV2[] checkOperations;
    LogicalOperation[] logicalOperations;
  }

  function encodeRuleDataV2(
    RuleDataV2 memory data
  ) external pure returns (bytes memory);

  function getRuleDataV2(
    uint256 roleId
  ) external view returns (RuleDataV2 memory);
}
