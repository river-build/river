// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

import {RuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/RuleEntitlementV2.sol";
import {IEntitlementBase} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract RuleEntitlementTest is TestUtils, IEntitlementBase {
  RuleEntitlementV2 internal implementation;
  RuleEntitlementV2 internal ruleEntitlement;

  address internal entitlement;
  address internal deployer;
  address internal space;

  uint256 internal roleId = 0;

  function setUp() public {
    deployer = _randomAddress();
    space = _randomAddress();

    vm.startPrank(deployer);
    implementation = new RuleEntitlementV2();
    entitlement = address(
      new ERC1967Proxy(
        address(implementation),
        abi.encodeCall(RuleEntitlementV2.initialize, (space))
      )
    );
    vm.stopPrank();

    ruleEntitlement = RuleEntitlementV2(entitlement);
  }

  modifier givenRuleEntitlementIsSet() {
    uint256 chainId = 31337;
    address erc20Contract = _randomAddress();
    address erc721Contract = _randomAddress();
    uint256 threshold = 100;

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
    IRuleEntitlementV2.ERC20Params memory erc20Params = IRuleEntitlementV2
      .ERC20Params(threshold);

    checkOperations[0] = IRuleEntitlementV2.CheckOperation(
      IRuleEntitlementV2.CheckOperationType.ERC20,
      chainId,
      erc20Contract,
      abi.encode(erc20Params)
    );

    // for the second check operation, we are checking ERC721 balance of 100 on chain 31337
    IRuleEntitlementV2.ERC721Params memory erc721Params = IRuleEntitlementV2
      .ERC721Params(threshold);
    checkOperations[1] = IRuleEntitlementV2.CheckOperation(
      IRuleEntitlementV2.CheckOperationType.ERC721,
      chainId,
      erc721Contract,
      abi.encode(erc721Params)
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

    bytes memory encodedData = abi.encode(ruleData);

    vm.prank(space);
    ruleEntitlement.setEntitlement(roleId, encodedData);
    _;
  }

  function test_setRuleEntitlement() external givenRuleEntitlementIsSet {
    IRuleEntitlementV2.Operation[] memory ruleOperations = ruleEntitlement
      .getRuleDataV2(roleId)
      .operations;
    assertEq(ruleOperations.length, 3);
  }

  function test_removeRuleEntitlement() external givenRuleEntitlementIsSet {
    vm.prank(space);
    ruleEntitlement.removeEntitlement(roleId);

    IRuleEntitlementV2.RuleData memory ruleData = ruleEntitlement.getRuleDataV2(
      roleId
    );

    assertEq(ruleData.operations.length, 0);
  }

  function test_revertWhenNotAllowedToRemove()
    external
    givenRuleEntitlementIsSet
  {
    vm.expectRevert(Entitlement__NotAllowed.selector);
    vm.prank(_randomAddress());
    ruleEntitlement.removeEntitlement(roleId);
  }

  // =============================================================
  //                  Request Entitlement Check
  // =============================================================
  function test_revertOnDirectionFailureEntitlementRule() external {
    IRuleEntitlementV2.Operation[]
      memory operations = new IRuleEntitlementV2.Operation[](4);
    IRuleEntitlementV2.CheckOperation[]
      memory checkOperations = new IRuleEntitlementV2.CheckOperation[](2);
    IRuleEntitlementV2.LogicalOperation[]
      memory logicalOperations = new IRuleEntitlementV2.LogicalOperation[](2);
    checkOperations[0] = IRuleEntitlementV2.CheckOperation(
      IRuleEntitlementV2.CheckOperationType.ERC20,
      31337,
      address(0x12),
      abi.encode(IRuleEntitlementV2.ERC20Params(100))
    );
    checkOperations[1] = IRuleEntitlementV2.CheckOperation(
      IRuleEntitlementV2.CheckOperationType.ERC721,
      31337,
      address(0x21),
      abi.encode(IRuleEntitlementV2.ERC721Params(100))
    );
    // This operation is referring to a parent so will revert
    logicalOperations[0] = IRuleEntitlementV2.LogicalOperation(
      IRuleEntitlementV2.LogicalOperationType.AND,
      0,
      3
    );
    logicalOperations[1] = IRuleEntitlementV2.LogicalOperation(
      IRuleEntitlementV2.LogicalOperationType.AND,
      0,
      1
    );
    operations[0] = IRuleEntitlementV2.Operation(
      IRuleEntitlementV2.CombinedOperationType.CHECK,
      0
    );
    operations[1] = IRuleEntitlementV2.Operation(
      IRuleEntitlementV2.CombinedOperationType.CHECK,
      1
    );
    operations[2] = IRuleEntitlementV2.Operation(
      IRuleEntitlementV2.CombinedOperationType.LOGICAL,
      0
    );
    operations[3] = IRuleEntitlementV2.Operation(
      IRuleEntitlementV2.CombinedOperationType.LOGICAL,
      1
    );

    IRuleEntitlementV2.RuleData memory ruleData = IRuleEntitlementV2.RuleData(
      operations,
      checkOperations,
      logicalOperations
    );

    bytes memory encodedData = abi.encode(ruleData);

    vm.expectRevert(
      abi.encodeWithSelector(
        IRuleEntitlementV2.InvalidRightOperationIndex.selector,
        3,
        2
      )
    );

    vm.prank(space);
    ruleEntitlement.setEntitlement(0, encodedData);

    IRuleEntitlementV2.Operation[] memory ruleOperations = ruleEntitlement
      .getRuleDataV2(uint256(0))
      .operations;
    assertEq(ruleOperations.length, 0);
  }
}
