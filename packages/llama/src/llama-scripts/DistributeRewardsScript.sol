// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IRegistryDiamond} from "@llama/src/interfaces/IRegistryDiamond.sol";
import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {LlamaBaseScript} from "@llama/src/llama-scripts/LlamaBaseScript.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Distribute Rewards Script
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice A script that gets the total rewards, transfers the amount to the rewards distributor,
/// and calls the distributeRewards function with the active operators.
// source: https://basescan.org/address/0xbd936b4121c9ff5c365f528415109faa4c70baff#code
contract DistributeRewardsScriptBase is LlamaBaseScript {
  // =============================
  // ========= Constants =========
  // =============================

  /// @dev The `RegistryDiamond` contract address.
  IRegistryDiamond internal constant REGISTRY_DIAMOND =
    IRegistryDiamond(0x7c0422b31401C936172C897802CF0373B35B7698);

  /// @dev The Treasury Llama account address.
  LlamaAccount public constant RIVER_TREASURY =
    LlamaAccount(payable(0x8ee48C016b932A69779A25133b53F0fFf66C85C0));

  /// @dev The RVR ERC20 token address.
  IERC20 internal constant RVR_TOKEN =
    IERC20(0x9172852305F32819469bf38A3772f29361d7b768);

  // ========================================
  // ======= Distribute rewards function ====
  // ========================================

  function distributeOperatorRewards() external onlyDelegateCall {
    uint256 totalAmount = REGISTRY_DIAMOND.getPeriodDistributionAmount();
    address[] memory activeOperators = REGISTRY_DIAMOND.getActiveOperators();

    RIVER_TREASURY.transferERC20(
      LlamaAccount.ERC20Data({
        token: RVR_TOKEN,
        recipient: address(REGISTRY_DIAMOND),
        amount: totalAmount
      })
    );

    for (uint256 i = 0; i < activeOperators.length; i++) {
      REGISTRY_DIAMOND.distributeRewards(activeOperators[i]);
    }
  }
}

/// @title Distribute Rewards Script
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice A script that gets the total rewards, transfers the amount to the rewards distributor,
/// and calls the distributeRewards function with the active operators.
// Source: https://sepolia.basescan.org/address/0x073b7df907dbd74cf4747f4741f16ff5e631ca3f#code
contract DistributeRewardsScriptBaseSepolia is LlamaBaseScript {
  // =============================
  // ========= Constants =========
  // =============================

  /// @dev The `RegistryDiamond` contract address.
  IRegistryDiamond internal constant REGISTRY_DIAMOND =
    IRegistryDiamond(0x08cC41b782F27d62995056a4EF2fCBAe0d3c266F);

  /// @dev The Treasury Llama account address.
  LlamaAccount internal constant RIVER_TREASURY =
    LlamaAccount(payable(0x8ee48C016b932A69779A25133b53F0fFf66C85C0));

  /// @dev The RVR ERC20 token address.
  IERC20 internal constant RVR_TOKEN =
    IERC20(0x49442708a16Bf7917764F14A2D103f40Eb27BdD8);

  // ========================================
  // ======= Distribute rewards function ====
  // ========================================

  function distributeOperatorRewards() external onlyDelegateCall {
    uint256 totalAmount = REGISTRY_DIAMOND.getPeriodDistributionAmount();
    address[] memory activeOperators = REGISTRY_DIAMOND.getActiveOperators();

    RIVER_TREASURY.transferERC20(
      LlamaAccount.ERC20Data({
        token: RVR_TOKEN,
        recipient: address(REGISTRY_DIAMOND),
        amount: totalAmount
      })
    );

    for (uint256 i = 0; i < activeOperators.length; i++) {
      REGISTRY_DIAMOND.distributeRewards(activeOperators[i]);
    }
  }
}
