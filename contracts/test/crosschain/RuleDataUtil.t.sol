// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

import {RuleDataUtil} from "contracts/src/spaces/entitlements/rule/RuleDataUtil.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";

contract RuleDataUtilTest is TestUtils {
  address erc20Contract;
  address erc721Contract;

  function setUp() public {
    erc20Contract = _randomAddress();
    erc721Contract = _randomAddress();
  }

  function getV1RuleData()
    internal
    view
    returns (IRuleEntitlement.RuleData memory)
  {
    // we have 3 operations total
    IRuleEntitlement.Operation[]
      memory operations = new IRuleEntitlement.Operation[](3);

    // we have 2 check operations
    IRuleEntitlement.CheckOperation[]
      memory checkOperations = new IRuleEntitlement.CheckOperation[](2);

    // and 1 logical operation
    IRuleEntitlement.LogicalOperation[]
      memory logicalOperations = new IRuleEntitlement.LogicalOperation[](1);

    // for the first check operation, we are checking ERC20 balance of 100 on chain 31337
    checkOperations[0] = IRuleEntitlement.CheckOperation(
      IRuleEntitlement.CheckOperationType.ERC20,
      31337,
      erc20Contract,
      100
    );

    // for the second check operation, we are checking ERC721 balance of 50 on chain 31338
    checkOperations[1] = IRuleEntitlement.CheckOperation(
      IRuleEntitlement.CheckOperationType.ERC721,
      31338,
      erc721Contract,
      50
    );

    // we are combining the two check operations with an AND operation so both must pass
    logicalOperations[0] = IRuleEntitlement.LogicalOperation(
      IRuleEntitlement.LogicalOperationType.AND,
      0,
      1
    );

    // the first operation is a check operation
    operations[0] = IRuleEntitlement.Operation(
      IRuleEntitlement.CombinedOperationType.CHECK,
      0
    );

    // the second operation is a check operation
    operations[1] = IRuleEntitlement.Operation(
      IRuleEntitlement.CombinedOperationType.CHECK,
      1
    );

    // the third operation is a logical operation
    operations[2] = IRuleEntitlement.Operation(
      IRuleEntitlement.CombinedOperationType.LOGICAL,
      0
    );

    // we are combining all the operations into a rule data struct
    IRuleEntitlement.RuleData memory ruleData = IRuleEntitlement.RuleData(
      operations,
      checkOperations,
      logicalOperations
    );

    return ruleData;
  }

  function getV2RuleData()
    internal
    view
    returns (IRuleEntitlementV2.RuleData memory)
  {
    // we have 3 operations total
    IRuleEntitlementV2.Operation[]
      memory operations = new IRuleEntitlementV2.Operation[](3);

    // we have 2 check operations
    IRuleEntitlementV2.CheckOperation[]
      memory checkOperations = new IRuleEntitlementV2.CheckOperation[](2);

    // and 1 logical operation
    IRuleEntitlementV2.LogicalOperation[]
      memory logicalOperations = new IRuleEntitlementV2.LogicalOperation[](1);

    // for the first check operation, we are checking ERC20 balance of 100 on chain 31337
    checkOperations[0] = IRuleEntitlementV2.CheckOperation(
      IRuleEntitlementV2.CheckOperationType.ERC20,
      31337,
      erc20Contract,
      abi.encode(IRuleEntitlementV2.ERC20Params({threshold: 100}))
    );

    // for the second check operation, we are checking ERC721 balance of50 on chain 31338
    checkOperations[1] = IRuleEntitlementV2.CheckOperation(
      IRuleEntitlementV2.CheckOperationType.ERC721,
      31338,
      erc721Contract,
      abi.encode(IRuleEntitlementV2.ERC721Params({threshold: 50}))
    );

    // we are combining the two check operations with an AND operation so both must pass
    logicalOperations[0] = IRuleEntitlementV2.LogicalOperation(
      IRuleEntitlementV2.LogicalOperationType.AND,
      0,
      1
    );

    // the first operation is a check operation
    operations[0] = IRuleEntitlementV2.Operation(
      IRuleEntitlementV2.CombinedOperationType.CHECK,
      0
    );

    // the second operation is a check operation
    operations[1] = IRuleEntitlementV2.Operation(
      IRuleEntitlementV2.CombinedOperationType.CHECK,
      1
    );

    // the third operation is a logical operation
    operations[2] = IRuleEntitlementV2.Operation(
      IRuleEntitlementV2.CombinedOperationType.LOGICAL,
      0
    );

    // we are combining all the operations into a rule data struct
    IRuleEntitlementV2.RuleData memory ruleData = IRuleEntitlementV2.RuleData(
      operations,
      checkOperations,
      logicalOperations
    );

    return ruleData;
  }

  function assertRuleDataV2Equal(
    IRuleEntitlementV2.RuleData memory expected,
    IRuleEntitlementV2.RuleData memory actual
  ) internal {
    assertEq(expected.operations.length, actual.operations.length);
    assertEq(expected.checkOperations.length, actual.checkOperations.length);
    assertEq(
      expected.logicalOperations.length,
      actual.logicalOperations.length
    );

    for (uint256 i = 0; i < expected.operations.length; i++) {
      assertEq(
        uint8(expected.operations[i].opType),
        uint8(actual.operations[i].opType)
      );
      assertEq(expected.operations[i].index, actual.operations[i].index);
    }

    for (uint256 i = 0; i < expected.checkOperations.length; i++) {
      assertEq(
        uint8(expected.checkOperations[i].opType),
        uint8(actual.checkOperations[i].opType)
      );
      assertEq(
        expected.checkOperations[i].chainId,
        actual.checkOperations[i].chainId
      );
      assertEq(
        expected.checkOperations[i].contractAddress,
        actual.checkOperations[i].contractAddress
      );
      assertEq(
        expected.checkOperations[i].params,
        actual.checkOperations[i].params
      );
    }

    for (uint256 i = 0; i < expected.logicalOperations.length; i++) {
      assertEq(
        uint8(expected.logicalOperations[i].logOpType),
        uint8(actual.logicalOperations[i].logOpType)
      );
      assertEq(
        expected.logicalOperations[i].leftOperationIndex,
        actual.logicalOperations[i].leftOperationIndex
      );
      assertEq(
        expected.logicalOperations[i].rightOperationIndex,
        actual.logicalOperations[i].rightOperationIndex
      );
    }
  }

  function assertRuleDataV1Equal(
    IRuleEntitlement.RuleData memory expected,
    IRuleEntitlement.RuleData memory actual
  ) internal {
    assertEq(expected.operations.length, actual.operations.length);
    assertEq(expected.checkOperations.length, actual.checkOperations.length);
    assertEq(
      expected.logicalOperations.length,
      actual.logicalOperations.length
    );

    for (uint256 i = 0; i < expected.operations.length; i++) {
      assertEq(
        uint8(expected.operations[i].opType),
        uint8(actual.operations[i].opType)
      );
      assertEq(expected.operations[i].index, actual.operations[i].index);
    }

    for (uint256 i = 0; i < expected.checkOperations.length; i++) {
      assertEq(
        uint8(expected.checkOperations[i].opType),
        uint8(actual.checkOperations[i].opType)
      );
      assertEq(
        expected.checkOperations[i].chainId,
        actual.checkOperations[i].chainId
      );
      assertEq(
        expected.checkOperations[i].contractAddress,
        actual.checkOperations[i].contractAddress
      );
      assertEq(
        expected.checkOperations[i].threshold,
        actual.checkOperations[i].threshold
      );
    }

    for (uint256 i = 0; i < expected.logicalOperations.length; i++) {
      assertEq(
        uint8(expected.logicalOperations[i].logOpType),
        uint8(actual.logicalOperations[i].logOpType)
      );
      assertEq(
        expected.logicalOperations[i].leftOperationIndex,
        actual.logicalOperations[i].leftOperationIndex
      );
      assertEq(
        expected.logicalOperations[i].rightOperationIndex,
        actual.logicalOperations[i].rightOperationIndex
      );
    }
  }

  function test_V1ToV2() external {
    IRuleEntitlement.RuleData memory v1RuleData = getV1RuleData();
    IRuleEntitlementV2.RuleData memory v2RuleData = RuleDataUtil
      .convertV1ToV2RuleData(v1RuleData);

    IRuleEntitlementV2.RuleData memory expected = getV2RuleData();
    assertRuleDataV2Equal(expected, v2RuleData);
  }

  function test_V2ToV1() external {
    IRuleEntitlementV2.RuleData memory v2RuleData = getV2RuleData();
    IRuleEntitlement.RuleData memory v1RuleData = RuleDataUtil
      .convertV2ToV1RuleData(v2RuleData);

    IRuleEntitlement.RuleData memory expected = getV1RuleData();
    assertRuleDataV1Equal(expected, v1RuleData);
  }
}
