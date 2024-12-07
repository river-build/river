// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;
import "forge-std/console.sol";
import {Test, console2} from "forge-std/Test.sol";

import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {IOptimismMintableERC20} from "@llama/src/interfaces/IOptimismMintableERC20.sol";
import {IRewardsDistribution} from "@llama/src/interfaces/IRewardsDistribution.sol";
import {INodeOperator} from "@llama/src/interfaces/INodeOperator.sol";
import {IMainnetDelegation, IMainnetDelegationBase} from "@llama/src/interfaces/IMainnetDelegation.sol";
import {DistributeRewardsScriptBase, DistributeRewardsScriptBaseSepolia} from "@llama/src/llama-scripts/DistributeRewardsScript.sol";
import {LlamaTestSetup} from "@llama/test/utils/LlamaTestSetup.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Base Sepolia test
contract DistributeRewardsTestSetupBaseSepolia is LlamaTestSetup {
  // RIVER_EXECUTOR, RIVER_CORE addresses identical on base, base_sepolia
  address public constant RIVER_EXECUTOR =
    0x63217D4c321CC02Ed306cB3843309184D347667B;
  address public constant RIVER_CORE =
    0xA547373eB2b3c93AdeB27ec72133Fb7B92F70F7f;
  uint256 public constant BLOCK_NUMBER = 11_875_276;
  DistributeRewardsScriptBaseSepolia public rewardsScript;

  function setUp() public override {
    vm.createSelectFork(vm.rpcUrl("base_sepolia"), BLOCK_NUMBER);
    rewardsScript = new DistributeRewardsScriptBaseSepolia();
  }
}

contract DistributeRewardsBaseSepolia is DistributeRewardsTestSetupBaseSepolia {
  function test_BaseSepolia_DistributeRewards() public {
    // check block number
    assertEq(block.number, BLOCK_NUMBER);
    // Authorize script
    vm.prank(address(RIVER_EXECUTOR));
    LlamaCore(RIVER_CORE).setScriptAuthorization(address(rewardsScript), true);

    // Call distributeRewardsFromTreasury
    vm.prank(address(RIVER_CORE));
    LlamaExecutor(RIVER_EXECUTOR).execute(
      address(rewardsScript),
      true,
      abi.encodeWithSignature("distributeOperatorRewards()")
    );
  }
}

// Base test
contract DistributeRewardsTestSetupBase is LlamaTestSetup {
  address public constant RIVER_EXECUTOR =
    0x63217D4c321CC02Ed306cB3843309184D347667B;
  address public constant RIVER_CORE =
    0xA547373eB2b3c93AdeB27ec72133Fb7B92F70F7f;
  uint256 public constant BLOCK_NUMBER = 16_403_851;
  /// @dev The Treasury Llama account address.
  address public constant RIVER_TREASURY =
    0x8ee48C016b932A69779A25133b53F0fFf66C85C0;
  /// @dev The RVR ERC20 token address.
  IOptimismMintableERC20 internal constant RVR_TOKEN =
    IOptimismMintableERC20(0x9172852305F32819469bf38A3772f29361d7b768);

  /// Base Registry Diamond
  address internal constant REGISTRY_DIAMOND =
    0x7c0422b31401C936172C897802CF0373B35B7698;
  // Base Registry Facets
  IRewardsDistribution internal constant REWARDS_DISTRIBUTION =
    IRewardsDistribution(REGISTRY_DIAMOND);
  INodeOperator internal constant NODE_OPERATOR =
    INodeOperator(REGISTRY_DIAMOND);
  IMainnetDelegation internal constant MAINNET_DELEGATION =
    IMainnetDelegation(REGISTRY_DIAMOND);

  /// @dev The Base Bridge.
  address internal constant BRIDGE_BASE =
    0x4200000000000000000000000000000000000010;
  // period amount should be a little greater than the actual period amount
  uint256 internal constant PERIOD_AMOUNT = (100 ether) + (30_769_230 ether);
  DistributeRewardsScriptBase public rewardsScript;

  /// operators
  address internal constant FRAMEWORK =
    0x09285F179a9bA06CEBA12DeCd1755Ac6942A8cf4;
  address internal constant HANEDA = 0xbB6Ade9f54743E1e5f5A05373D6cf26513d3f424;
  address internal constant OHARE = 0xf9E7AAfC114990b42b5d9A5fb002465C9Ea41C8c;
  address internal constant HNTLABS =
    0x245c79838294922EA5dBB86778Cf262CfC2e2ab0;

  uint256 internal constant SCALING_FACTOR = 10_000;

  struct Operators {
    address operator;
    string name;
    uint256 commissionRate;
    address operatorClaimer;
    uint256 claimableAmtPost;
  }
  Operators[] internal baseOperators;

  function setUp() public override {
    vm.createSelectFork(vm.rpcUrl("base"), BLOCK_NUMBER);
    rewardsScript = new DistributeRewardsScriptBase();
    // mint RVR from Bridge
    console.log("RIVER_TREASURY: ", RIVER_TREASURY);
    vm.prank(BRIDGE_BASE);
    // mint a little more than period amount to RIVER_TREASURY
    //RVR_TOKEN.mint(RIVER_TREASURY, PERIOD_AMOUNT);
    uint256 bal = RVR_TOKEN.balanceOf(RIVER_TREASURY);
    console.log("RVR_TOKEN.balanceOf(RIVER_TREASURY): ", bal);
  }

  // Function to multiply a number by a decimal represented as an integer
  function multiplyByDecimal(
    uint256 number,
    uint256 decimalMultiplier
  ) public pure returns (uint256) {
    return (number * decimalMultiplier) / SCALING_FACTOR;
  }
}

contract DistributeRewardsBase is DistributeRewardsTestSetupBase {
  function test_Base_DistributeRewards() public {
    // check block number
    assertEq(block.number, BLOCK_NUMBER);
    // assert treasury balance
    assertGe(RVR_TOKEN.balanceOf(RIVER_TREASURY), PERIOD_AMOUNT);

    // check period distribution amount
    uint256 periodDistributionAmount = REWARDS_DISTRIBUTION
      .getPeriodDistributionAmount();
    console.log("periodDistributionAmount: ", periodDistributionAmount);

    // check an operators claimable amount before distribution
    uint256 frameworkClaimableAmt = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(FRAMEWORK);
    console.log("frameworkClaimableAmt pre: ", frameworkClaimableAmt);
    uint256 hanedaClaimableAmt = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(HANEDA);
    console.log("hanedaClaimableAmt pre: ", hanedaClaimableAmt);
    uint256 ohareClaimableAmt = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(OHARE);
    console.log("ohareClaimableAmt pre: ", ohareClaimableAmt);
    uint256 hntlabsClaimableAmt = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(HNTLABS);
    console.log("hntlabsClaimableAmt pre: ", hntlabsClaimableAmt);

    // get commission amounts for each operator
    uint256 frameworkCommissionRate = NODE_OPERATOR.getCommissionRate(
      FRAMEWORK
    );
    console.log("frameworkCommissionRate: ", frameworkCommissionRate);
    uint256 hanedaCommissionRate = NODE_OPERATOR.getCommissionRate(HANEDA);
    console.log("hanedaCommissionRate: ", hanedaCommissionRate);
    uint256 ohareCommissionRate = NODE_OPERATOR.getCommissionRate(OHARE);
    console.log("ohareCommissionRate: ", ohareCommissionRate);
    uint256 hntlabsCommissionRate = NODE_OPERATOR.getCommissionRate(HNTLABS);
    console.log("hntlabsCommissionRate: ", hntlabsCommissionRate);

    // Authorize script
    vm.prank(address(RIVER_EXECUTOR));
    LlamaCore(RIVER_CORE).setScriptAuthorization(address(rewardsScript), true);

    // Call distributeRewardsFromTreasury
    vm.prank(address(RIVER_CORE));
    LlamaExecutor(RIVER_EXECUTOR).execute(
      address(rewardsScript),
      true,
      abi.encodeWithSignature("distributeOperatorRewards()")
    );
    // get claimable amount after distributing rewards
    uint256 frameworkClaimableAmtPost = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(FRAMEWORK);
    console.log("frameworkClaimableAmt post: ", frameworkClaimableAmtPost);
    uint256 hanedaClaimableAmtPost = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(HANEDA);
    console.log("hanedaClaimableAmt post: ", hanedaClaimableAmtPost);
    uint256 ohareClaimableAmtPost = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(OHARE);
    console.log("ohareClaimableAmt post: ", ohareClaimableAmtPost);
    uint256 hntlabsClaimableAmtPost = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(HNTLABS);
    console.log("hntlabsClaimableAmt post: ", hntlabsClaimableAmtPost);

    // get operator claim addresses to claim rewards
    address frameworkClaimer = NODE_OPERATOR.getClaimAddressForOperator(
      FRAMEWORK
    );
    console.log("frameworkClaimer: ", frameworkClaimer);
    address hanedaClaimer = NODE_OPERATOR.getClaimAddressForOperator(HANEDA);
    console.log("hanedaClaimer: ", hanedaClaimer);
    address ohareClaimer = NODE_OPERATOR.getClaimAddressForOperator(OHARE);
    console.log("ohareClaimer: ", ohareClaimer);
    address hntlabsClaimer = NODE_OPERATOR.getClaimAddressForOperator(HNTLABS);
    console.log("hntlabsClaimer: ", hntlabsClaimer);

    // claimable amt for authorized claimer
    // claim operator rewards for each operator claimer
    uint256 frameworkClaimerBalancePre = RVR_TOKEN.balanceOf(frameworkClaimer);
    vm.prank(frameworkClaimer);
    REWARDS_DISTRIBUTION.operatorClaim();
    uint256 frameworkClaimerBalancePost = RVR_TOKEN.balanceOf(frameworkClaimer);
    assertEq(
      frameworkClaimerBalancePost,
      frameworkClaimerBalancePre + frameworkClaimableAmtPost
    );

    uint256 hanedaClaimerBalancePre = RVR_TOKEN.balanceOf(hanedaClaimer);
    vm.prank(hanedaClaimer);
    REWARDS_DISTRIBUTION.operatorClaim();
    uint256 hanedaClaimerBalancePost = RVR_TOKEN.balanceOf(hanedaClaimer);
    assertEq(
      hanedaClaimerBalancePost,
      hanedaClaimerBalancePre + hanedaClaimableAmtPost
    );

    uint256 ohareClaimerBalancePre = RVR_TOKEN.balanceOf(ohareClaimer);
    vm.prank(ohareClaimer);
    REWARDS_DISTRIBUTION.operatorClaim();
    uint256 ohareClaimerBalancePost = RVR_TOKEN.balanceOf(ohareClaimer);
    assertEq(
      ohareClaimerBalancePost,
      ohareClaimerBalancePre + ohareClaimableAmtPost
    );

    uint256 hntlabsClaimerBalancePre = RVR_TOKEN.balanceOf(hntlabsClaimer);
    vm.prank(hntlabsClaimer);
    REWARDS_DISTRIBUTION.operatorClaim();
    uint256 hntlabsClaimerBalancePost = RVR_TOKEN.balanceOf(hntlabsClaimer);
    assertEq(
      hntlabsClaimerBalancePost,
      hntlabsClaimerBalancePre + hntlabsClaimableAmtPost
    );
  }

  function test_Base_ClaimByAddress() public {
    // check block number
    assertEq(block.number, BLOCK_NUMBER);
    // assert treasury balance
    assertGe(RVR_TOKEN.balanceOf(RIVER_TREASURY), PERIOD_AMOUNT);

    // check period distribution amount
    uint256 periodDistributionAmount = REWARDS_DISTRIBUTION
      .getPeriodDistributionAmount();
    console.log("periodDistributionAmount: ", periodDistributionAmount);

    // check an operators claimable amount before distribution
    uint256 frameworkClaimableAmt = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(FRAMEWORK);
    console.log("frameworkClaimableAmt pre: ", frameworkClaimableAmt);
    uint256 hanedaClaimableAmt = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(HANEDA);
    console.log("hanedaClaimableAmt pre: ", hanedaClaimableAmt);
    uint256 ohareClaimableAmt = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(OHARE);
    console.log("ohareClaimableAmt pre: ", ohareClaimableAmt);
    uint256 hntlabsClaimableAmt = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(HNTLABS);
    console.log("hntlabsClaimableAmt pre: ", hntlabsClaimableAmt);

    // get commission amounts for each operator
    uint256 frameworkCommissionRate = NODE_OPERATOR.getCommissionRate(
      FRAMEWORK
    );
    console.log("frameworkCommissionRate: ", frameworkCommissionRate);
    uint256 hanedaCommissionRate = NODE_OPERATOR.getCommissionRate(HANEDA);
    console.log("hanedaCommissionRate: ", hanedaCommissionRate);
    uint256 ohareCommissionRate = NODE_OPERATOR.getCommissionRate(OHARE);
    console.log("ohareCommissionRate: ", ohareCommissionRate);
    uint256 hntlabsCommissionRate = NODE_OPERATOR.getCommissionRate(HNTLABS);
    console.log("hntlabsCommissionRate: ", hntlabsCommissionRate);

    // Authorize script
    vm.prank(address(RIVER_EXECUTOR));
    LlamaCore(RIVER_CORE).setScriptAuthorization(address(rewardsScript), true);

    // Call distributeRewardsFromTreasury
    vm.prank(address(RIVER_CORE));
    LlamaExecutor(RIVER_EXECUTOR).execute(
      address(rewardsScript),
      true,
      abi.encodeWithSignature("distributeOperatorRewards()")
    );
    // get claimable amount after distributing rewards
    uint256 frameworkClaimableAmtPost = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(FRAMEWORK);
    console.log("frameworkClaimableAmt post: ", frameworkClaimableAmtPost);
    uint256 hanedaClaimableAmtPost = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(HANEDA);
    console.log("hanedaClaimableAmt post: ", hanedaClaimableAmtPost);
    uint256 ohareClaimableAmtPost = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(OHARE);
    console.log("ohareClaimableAmt post: ", ohareClaimableAmtPost);
    uint256 hntlabsClaimableAmtPost = REWARDS_DISTRIBUTION
      .getClaimableAmountForOperator(HNTLABS);
    console.log("hntlabsClaimableAmt post: ", hntlabsClaimableAmtPost);

    // get operator claim addresses to claim rewards
    address frameworkClaimer = NODE_OPERATOR.getClaimAddressForOperator(
      FRAMEWORK
    );
    console.log("frameworkClaimer: ", frameworkClaimer);
    address hanedaClaimer = NODE_OPERATOR.getClaimAddressForOperator(HANEDA);
    console.log("hanedaClaimer: ", hanedaClaimer);
    address ohareClaimer = NODE_OPERATOR.getClaimAddressForOperator(OHARE);
    console.log("ohareClaimer: ", ohareClaimer);
    address hntlabsClaimer = NODE_OPERATOR.getClaimAddressForOperator(HNTLABS);
    console.log("hntlabsClaimer: ", hntlabsClaimer);

    baseOperators.push(
      Operators(
        FRAMEWORK,
        "framework",
        frameworkCommissionRate,
        frameworkClaimer,
        frameworkClaimableAmtPost
      )
    );
    baseOperators.push(
      Operators(
        HANEDA,
        "haneda",
        hanedaCommissionRate,
        hanedaClaimer,
        hanedaClaimableAmtPost
      )
    );
    baseOperators.push(
      Operators(
        OHARE,
        "ohare",
        ohareCommissionRate,
        ohareClaimer,
        ohareClaimableAmtPost
      )
    );
    baseOperators.push(
      Operators(
        HNTLABS,
        "hntlabs",
        hntlabsCommissionRate,
        hntlabsClaimer,
        hntlabsClaimableAmtPost
      )
    );

    /* uncomment when stack too deep error is fixed
    uint256 expectedClaimableAmtPost = (periodDistributionAmount * baseOperators[0].commissionRate) / SCALING_FACTOR;
    assertEq(baseOperators[0].claimableAmtPost, expectedClaimableAmtPost);
    */

    // claim operator rewards for each operator claimer by address
    for (uint256 i = 0; i < baseOperators.length; i++) {
      address claimer = baseOperators[i].operatorClaimer;
      uint256 claimableAmtPost = baseOperators[i].claimableAmtPost;
      uint256 claimerBalancePre = RVR_TOKEN.balanceOf(claimer);
      vm.prank(claimer);
      REWARDS_DISTRIBUTION.operatorClaimByAddress(baseOperators[i].operator);
      uint256 claimerBalancePost = RVR_TOKEN.balanceOf(claimer);
      assertEq(claimerBalancePost, claimerBalancePre + claimableAmtPost);
    }

    // claim delegator rewards by operator's delegate address
    // get delegator claim addresses for each operator
    for (uint256 i = 0; i < baseOperators.length; i++) {
      IMainnetDelegationBase.Delegation[]
        memory delegations = MAINNET_DELEGATION.getMainnetDelegationsByOperator(
          baseOperators[i].operator
        );
      for (uint256 j = 0; j < delegations.length; j++) {
        address delegator = delegations[j].delegator;
        address claimer = MAINNET_DELEGATION.getAuthorizedClaimer(delegator);
        uint256 claimableAmt = REWARDS_DISTRIBUTION
          .getClaimableAmountForDelegator(delegator);
        console.log(
          "delegator claimable amount post: ",
          claimableAmt,
          " for operator: ",
          baseOperators[i].name
        );
        console.log(
          "delegator: ",
          delegator,
          " for operator: ",
          baseOperators[i].name
        );
        console.log(
          "claimer for delegator: ",
          claimer,
          " for operator: ",
          baseOperators[i].name
        );
        uint256 claimerBalancePre = RVR_TOKEN.balanceOf(claimer);
        vm.prank(claimer);
        // claim for the delegator
        REWARDS_DISTRIBUTION.mainnetClaimByAddress(delegator);
        uint256 claimerBalancePost = RVR_TOKEN.balanceOf(claimer);
        assertEq(claimerBalancePost, claimerBalancePre + claimableAmt);
      }
    }
  }
}
