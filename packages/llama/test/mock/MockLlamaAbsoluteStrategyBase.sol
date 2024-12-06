// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ActionInfo} from "@llama/src/lib/Structs.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";

// @dev A mock strategy implementation (logic) contract. To be used for testing the abstract `LlamaAbsoluteStrategyBase`
// contract
contract MockLlamaAbsoluteStrategyBase is LlamaAbsoluteStrategyBase {
  function validateActionCreation(ActionInfo calldata) external view override {}

  function checkIfApprovalEnabled(
    ActionInfo calldata,
    address,
    uint8
  ) external view override {}

  function checkIfDisapprovalEnabled(
    ActionInfo calldata,
    address,
    uint8
  ) external view override {}
}
