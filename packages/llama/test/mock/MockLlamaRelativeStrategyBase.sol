// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ActionInfo} from "@llama/src/lib/Structs.sol";
import {LlamaRelativeStrategyBase} from "@llama/src/strategies/relative/LlamaRelativeStrategyBase.sol";

// @dev A mock strategy implementation (logic) contract. To be used for testing the abstract `LlamaRelativeStrategyBase`
// contract
contract MockLlamaRelativeStrategyBase is LlamaRelativeStrategyBase {
  function getApprovalQuantityAt(
    address,
    /* policyholder */ uint8,
    /* role */ uint256 /* timestamp */
  ) external view override returns (uint96) {}

  function getDisapprovalQuantityAt(
    address,
    /* policyholder */ uint8,
    /* role */ uint256 /* timestamp */
  ) external view override returns (uint96) {}

  function getApprovalSupply(
    ActionInfo calldata
  ) public view override returns (uint96) {}

  function getDisapprovalSupply(
    ActionInfo calldata
  ) public view override returns (uint96) {}
}
