// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";

library RuleEntitlementUtil {
  function getNoopRuleData()
    internal
    pure
    returns (IRuleEntitlementV2.RuleData memory data)
  {
    data = IRuleEntitlementV2.RuleData({
      operations: new IRuleEntitlementV2.Operation[](1),
      checkOperations: new IRuleEntitlementV2.CheckOperation[](0),
      logicalOperations: new IRuleEntitlementV2.LogicalOperation[](0)
    });
    IRuleEntitlementV2.Operation memory noop = IRuleEntitlementV2.Operation({
      opType: IRuleEntitlementV2.CombinedOperationType.NONE,
      index: 0
    });

    data.operations[0] = noop;
  }

  function getMockERC721RuleData()
    internal
    pure
    returns (IRuleEntitlementV2.RuleData memory data)
  {
    data = IRuleEntitlementV2.RuleData({
      operations: new IRuleEntitlementV2.Operation[](1),
      checkOperations: new IRuleEntitlementV2.CheckOperation[](1),
      logicalOperations: new IRuleEntitlementV2.LogicalOperation[](0)
    });
    IRuleEntitlementV2.CheckOperation memory checkOp = IRuleEntitlementV2
      .CheckOperation({
        opType: IRuleEntitlementV2.CheckOperationType.ERC721,
        chainId: 11155111,
        contractAddress: address(0xb088b3f2b35511A611bF2aaC13fE605d491D6C19),
        params: abi.encode(IRuleEntitlementV2.ERC721Params({threshold: 1}))
      });
    IRuleEntitlementV2.Operation memory op = IRuleEntitlementV2.Operation({
      opType: IRuleEntitlementV2.CombinedOperationType.CHECK,
      index: 0
    });

    data.operations[0] = op;
    data.checkOperations[0] = checkOp;
  }

  function getMockERC20RuleData()
    internal
    pure
    returns (IRuleEntitlementV2.RuleData memory data)
  {
    data = IRuleEntitlementV2.RuleData({
      operations: new IRuleEntitlementV2.Operation[](1),
      checkOperations: new IRuleEntitlementV2.CheckOperation[](1),
      logicalOperations: new IRuleEntitlementV2.LogicalOperation[](0)
    });
    IRuleEntitlementV2.CheckOperation memory checkOp = IRuleEntitlementV2
      .CheckOperation({
        opType: IRuleEntitlementV2.CheckOperationType.ERC20,
        chainId: 31337,
        contractAddress: address(0x11),
        params: abi.encode(IRuleEntitlementV2.ERC20Params({threshold: 100}))
      });
    IRuleEntitlementV2.Operation memory op = IRuleEntitlementV2.Operation({
      opType: IRuleEntitlementV2.CombinedOperationType.CHECK,
      index: 0
    });
    data.operations[0] = op;
    data.checkOperations[0] = checkOp;
  }

  function getMockERC1155RuleData()
    internal
    pure
    returns (IRuleEntitlementV2.RuleData memory data)
  {
    data = IRuleEntitlementV2.RuleData({
      operations: new IRuleEntitlementV2.Operation[](1),
      checkOperations: new IRuleEntitlementV2.CheckOperation[](1),
      logicalOperations: new IRuleEntitlementV2.LogicalOperation[](0)
    });
    IRuleEntitlementV2.CheckOperation memory checkOp = IRuleEntitlementV2
      .CheckOperation({
        opType: IRuleEntitlementV2.CheckOperationType.ERC1155,
        chainId: 31341,
        contractAddress: address(0x55),
        params: abi.encode(
          IRuleEntitlementV2.ERC1155Params({tokenId: 1, threshold: 500})
        )
      });
    IRuleEntitlementV2.Operation memory op = IRuleEntitlementV2.Operation({
      opType: IRuleEntitlementV2.CombinedOperationType.CHECK,
      index: 0
    });
    data.operations[0] = op;
    data.checkOperations[0] = checkOp;
  }
}
