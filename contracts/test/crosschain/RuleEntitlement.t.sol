// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

import {RuleEntitlement} from "contracts/src/spaces/entitlements/rule/RuleEntitlement.sol";
import {IEntitlementBase} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IRuleEntitlement,IRuleEntitlementBase} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract RuleEntitlementTest is TestUtils, IEntitlementBase {
  RuleEntitlement internal implementation;
  RuleEntitlement internal ruleEntitlement;

  address internal entitlement;
  address internal deployer;
  address internal space;

  uint256 internal roleId = 0;

  function setUp() public {
    deployer = _randomAddress();
    space = _randomAddress();

    vm.startPrank(deployer);
    implementation = new RuleEntitlement();
    entitlement = address(
      new ERC1967Proxy(
        address(implementation),
        abi.encodeCall(RuleEntitlement.initialize, (space))
      )
    );
    vm.stopPrank();

    ruleEntitlement = RuleEntitlement(entitlement);
  }

  modifier givenRuleEntitlementIsSet() {
    uint256 chainId = 31337;
    address erc20Contract = _randomAddress();
    address erc721Contract = _randomAddress();
    uint256 threshold = 100;

    // we have 3 operations total
    IRuleEntitlementBase.Operation[]
      memory operations = new IRuleEntitlementBase.Operation[](3);

    // we have 2 check operations
    IRuleEntitlementBase.CheckOperation[]
      memory checkOperations = new IRuleEntitlementBase.CheckOperation[](2);

    // and 1 logical operation
    IRuleEntitlementBase.LogicalOperation[]
      memory logicalOperations = new IRuleEntitlementBase.LogicalOperation[](1);

    // for the first check operation, we are checking ERC20 balance of 100 on chain 31337
    checkOperations[0] = IRuleEntitlementBase.CheckOperation(
      IRuleEntitlementBase.CheckOperationType.ERC20,
      chainId,
      erc20Contract,
      threshold
    );

    // for the second check operation, we are checking ERC721 balance of 100 on chain 31337
    checkOperations[1] = IRuleEntitlementBase.CheckOperation(
      IRuleEntitlementBase.CheckOperationType.ERC721,
      chainId,
      erc721Contract,
      threshold
    );

    // we are combining the two check operations with an AND operation so both must pass
    logicalOperations[0] = IRuleEntitlementBase.LogicalOperation(
      IRuleEntitlementBase.LogicalOperationType.AND,
      0,
      1
    );

    // the first operation is a check operation
    operations[0] = IRuleEntitlementBase.Operation(
      IRuleEntitlementBase.CombinedOperationType.CHECK,
      0
    );

    // the second operation is a check operation
    operations[1] = IRuleEntitlementBase.Operation(
      IRuleEntitlementBase.CombinedOperationType.CHECK,
      1
    );

    // the third operation is a logical operation
    operations[2] = IRuleEntitlementBase.Operation(
      IRuleEntitlementBase.CombinedOperationType.LOGICAL,
      0
    );

    // we are combining all the operations into a rule data struct
    IRuleEntitlementBase.RuleData memory ruleData = IRuleEntitlementBase.RuleData(
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
    IRuleEntitlementBase.Operation[] memory ruleOperations = ruleEntitlement
      .getRuleData(roleId)
      .operations;
    assertEq(ruleOperations.length, 3);
  }

  function test_removeRuleEntitlement() external givenRuleEntitlementIsSet {
    vm.prank(space);
    ruleEntitlement.removeEntitlement(roleId);
    IRuleEntitlementBase.Operation[] memory ruleOperations = ruleEntitlement
      .getRuleData(roleId)
      .operations;
    assertEq(ruleOperations.length, 0);
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
    IRuleEntitlementBase.Operation[]
      memory operations = new IRuleEntitlementBase.Operation[](4);
    IRuleEntitlementBase.CheckOperation[]
      memory checkOperations = new IRuleEntitlementBase.CheckOperation[](2);
    IRuleEntitlementBase.LogicalOperation[]
      memory logicalOperations = new IRuleEntitlementBase.LogicalOperation[](2);
    checkOperations[0] = IRuleEntitlementBase.CheckOperation(
      IRuleEntitlementBase.CheckOperationType.ERC20,
      31337,
      address(0x12),
      100
    );
    checkOperations[1] = IRuleEntitlementBase.CheckOperation(
      IRuleEntitlementBase.CheckOperationType.ERC721,
      31337,
      address(0x21),
      100
    );
    // This operation is referring to a parent so will revert
    logicalOperations[0] = IRuleEntitlementBase.LogicalOperation(
      IRuleEntitlementBase.LogicalOperationType.AND,
      0,
      3
    );
    logicalOperations[1] = IRuleEntitlementBase.LogicalOperation(
      IRuleEntitlementBase.LogicalOperationType.AND,
      0,
      1
    );
    operations[0] = IRuleEntitlementBase.Operation(
      IRuleEntitlementBase.CombinedOperationType.CHECK,
      0
    );
    operations[1] = IRuleEntitlementBase.Operation(
      IRuleEntitlementBase.CombinedOperationType.CHECK,
      1
    );
    operations[2] = IRuleEntitlementBase.Operation(
      IRuleEntitlementBase.CombinedOperationType.LOGICAL,
      0
    );
    operations[3] = IRuleEntitlementBase.Operation(
      IRuleEntitlementBase.CombinedOperationType.LOGICAL,
      1
    );

    IRuleEntitlementBase.RuleData memory ruleData = IRuleEntitlementBase.RuleData(
      operations,
      checkOperations,
      logicalOperations
    );

    bytes memory encodedData = abi.encode(ruleData);

    vm.expectRevert(
      abi.encodeWithSelector(
        IRuleEntitlementBase.InvalidRightOperationIndex.selector,
        3,
        2
      )
    );

    vm.prank(space);
    ruleEntitlement.setEntitlement(0, encodedData);

    IRuleEntitlementBase.Operation[] memory ruleOperations = ruleEntitlement
      .getRuleData(uint256(0))
      .operations;
    assertEq(ruleOperations.length, 0);
  }
}
