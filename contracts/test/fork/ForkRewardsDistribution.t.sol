// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// utils
import {DeployBase} from "contracts/scripts/common/DeployBase.s.sol";
import {TestUtils} from "../utils/TestUtils.sol";
import {RewardsVerifier} from "../base/registry/RewardsVerifier.t.sol";
import {DeployRewardsDistributionV2} from "contracts/scripts/deployments/facets/DeployRewardsDistributionV2.s.sol";

//interfaces
import {IDiamondCut} from "contracts/src/diamond/facets/cut/IDiamondCut.sol";
import {IDiamondLoupe} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";
import {IDiamond} from "contracts/src/diamond/IDiamond.sol";
import {INodeOperator} from "contracts/src/base/registry/facets/operator/INodeOperator.sol";
import {IMainnetDelegationBase} from "contracts/src/tokens/river/base/delegation/IMainnetDelegation.sol";

//libraries
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
import {StakingRewards} from "contracts/src/base/registry/facets/distribution/v2/StakingRewards.sol";

//contracts
import {MainnetDelegation} from "contracts/src/tokens/river/base/delegation/MainnetDelegation.sol";
import {MockMessenger} from "contracts/test/mocks/MockMessenger.sol";
import {NodeOperatorStatus} from "contracts/src/base/registry/facets/operator/NodeOperatorStorage.sol";
import {OwnableFacet} from "contracts/src/diamond/facets/ownable/OwnableFacet.sol";
import {RewardsDistribution} from "contracts/src/base/registry/facets/distribution/v2/RewardsDistribution.sol";
import {River} from "contracts/src/tokens/river/base/River.sol";

// deployers
import {SpaceDelegationFacet} from "contracts/src/base/registry/facets/delegation/SpaceDelegationFacet.sol";

contract ForkRewardsDistributionTest is
  DeployBase,
  RewardsVerifier,
  TestUtils,
  IDiamond,
  IMainnetDelegationBase
{
  using FixedPointMathLib for uint256;

  uint256 internal constant rewardDuration = 14 days;
  address internal baseRegistry;
  address internal spaceFactory;
  DeployRewardsDistributionV2 internal distributionV2Helper;
  address internal owner;
  address[] internal activeOperators;

  function setUp() public {
    vm.createSelectFork("base", 23200000);

    vm.setEnv("DEPLOYMENT_CONTEXT", "omega");

    baseRegistry = getDeployment("baseRegistry");
    spaceFactory = getDeployment("spaceFactory");
    river = River(getDeployment("river"));
    rewardsDistributionFacet = RewardsDistribution(baseRegistry);
    owner = OwnableFacet(baseRegistry).owner();

    governanceActions();

    getActiveOperators();
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_stake(
    address depositor,
    uint96 amount,
    address beneficiary
  ) public returns (uint256 depositId) {
    address operator = activeOperators[0];
    vm.assume(depositor != address(rewardsDistributionFacet));
    vm.assume(beneficiary != address(0) && beneficiary != operator);

    depositId = stake(depositor, amount, beneficiary, operator);

    verifyStake(
      depositor,
      depositId,
      amount,
      operator,
      getCommissionRate(operator),
      beneficiary
    );
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_increaseStake(
    uint96 amount0,
    uint96 amount1,
    address beneficiary
  ) public {
    address operator = activeOperators[0];
    vm.assume(beneficiary != address(0) && beneficiary != operator);
    amount0 = uint96(bound(amount0, 1, type(uint96).max));
    amount1 = uint96(bound(amount1, 0, type(uint96).max - amount0));

    uint96 totalAmount = amount0 + amount1;
    deal(address(river), address(this), totalAmount, true);

    river.approve(address(rewardsDistributionFacet), totalAmount);
    uint256 depositId = rewardsDistributionFacet.stake(
      amount0,
      operator,
      beneficiary
    );

    vm.expectEmit(address(rewardsDistributionFacet));
    emit IncreaseStake(depositId, amount1);

    rewardsDistributionFacet.increaseStake(depositId, amount1);

    verifyStake(
      address(this),
      depositId,
      totalAmount,
      operator,
      getCommissionRate(operator),
      beneficiary
    );
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_redelegate(uint96 amount) public {
    address operator0 = activeOperators[0];
    address operator1 = activeOperators[1];

    uint256 depositId = stake(address(this), amount, address(this), operator0);

    vm.expectEmit(address(rewardsDistributionFacet));
    emit Redelegate(depositId, operator1);

    rewardsDistributionFacet.redelegate(depositId, operator1);

    assertEq(
      rewardsDistributionFacet.treasureByBeneficiary(operator0).earningPower,
      0
    );

    verifyStake(
      address(this),
      depositId,
      amount,
      operator1,
      getCommissionRate(operator1),
      address(this)
    );
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_changeBeneficiary(
    uint96 amount,
    address beneficiary
  ) public {
    address operator = activeOperators[0];
    vm.assume(beneficiary != address(0) && beneficiary != operator);

    uint256 depositId = stake(address(this), amount, address(this), operator);

    vm.expectEmit(address(rewardsDistributionFacet));
    emit ChangeBeneficiary(depositId, beneficiary);

    rewardsDistributionFacet.changeBeneficiary(depositId, beneficiary);

    verifyStake(
      address(this),
      depositId,
      amount,
      operator,
      getCommissionRate(operator),
      beneficiary
    );
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_initiateWithdraw(
    uint96 amount,
    address beneficiary
  ) public returns (uint256 depositId) {
    address operator = activeOperators[0];
    vm.assume(beneficiary != address(0) && beneficiary != operator);

    depositId = stake(address(this), amount, beneficiary, operator);

    vm.expectEmit(address(rewardsDistributionFacet));
    emit InitiateWithdraw(address(this), depositId, amount);

    rewardsDistributionFacet.initiateWithdraw(depositId);

    verifyWithdraw(address(this), depositId, amount, 0, operator, beneficiary);
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_withdraw(
    uint96 amount,
    address beneficiary
  ) public returns (uint256 depositId) {
    address operator = activeOperators[0];
    depositId = test_fuzz_initiateWithdraw(amount, beneficiary);

    address proxy = rewardsDistributionFacet.delegationProxyById(depositId);
    uint256 cd = river.lockCooldown(proxy);

    vm.warp(cd);

    vm.expectEmit(address(rewardsDistributionFacet));
    emit Withdraw(depositId, amount);

    rewardsDistributionFacet.withdraw(depositId);

    verifyWithdraw(address(this), depositId, 0, amount, operator, beneficiary);
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_notifyRewardAmount(uint256 reward) public {
    reward = bound(reward, rewardDuration, 1e27);
    deal(address(river), address(rewardsDistributionFacet), reward, true);

    vm.expectEmit(address(rewardsDistributionFacet));
    emit NotifyRewardAmount(owner, reward);

    vm.prank(owner);
    rewardsDistributionFacet.notifyRewardAmount(reward);

    StakingState memory state = rewardsDistributionFacet.stakingState();

    assertEq(
      state.rewardEndTime,
      block.timestamp + rewardDuration,
      "rewardEndTime"
    );
    assertEq(state.lastUpdateTime, block.timestamp, "lastUpdateTime");
    assertEq(
      state.rewardRate,
      reward.fullMulDiv(StakingRewards.SCALE_FACTOR, rewardDuration),
      "rewardRate"
    );
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_claimReward_byBeneficiary(
    address depositor,
    uint96 amount,
    address beneficiary,
    uint256 rewardAmount,
    uint256 timeLapse
  ) public {
    address operator0 = activeOperators[0];
    address operator1 = activeOperators[1];
    vm.assume(
      depositor != address(this) &&
        depositor != address(rewardsDistributionFacet)
    );
    vm.assume(
      beneficiary != operator0 &&
        beneficiary != operator1 &&
        beneficiary != address(this) &&
        beneficiary != address(rewardsDistributionFacet)
    );
    amount = uint96(bound(amount, 1, type(uint96).max - 1 ether));
    timeLapse = bound(timeLapse, 0, rewardDuration);

    test_fuzz_notifyRewardAmount(rewardAmount);
    stake(address(this), 1 ether, address(this), operator0);
    stake(depositor, amount, beneficiary, operator1);

    skip(timeLapse);

    uint256 currentReward = rewardsDistributionFacet.currentReward(beneficiary);

    vm.expectEmit(address(rewardsDistributionFacet));
    emit ClaimReward(beneficiary, beneficiary, currentReward);

    vm.prank(beneficiary);
    uint256 reward = rewardsDistributionFacet.claimReward(
      beneficiary,
      beneficiary
    );

    verifyClaim(beneficiary, beneficiary, reward, currentReward, timeLapse);
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_claimReward_byOperator(
    uint96 amount,
    uint256 rewardAmount,
    uint256 timeLapse
  ) public {
    address operator = activeOperators[0];
    timeLapse = bound(timeLapse, 0, rewardDuration);
    amount = uint96(bound(amount, 1 ether, type(uint96).max));

    test_fuzz_notifyRewardAmount(rewardAmount);
    stake(address(this), amount, address(this), operator);

    skip(timeLapse);

    uint256 currentReward = rewardsDistributionFacet.currentReward(operator);

    vm.expectEmit(address(rewardsDistributionFacet));
    emit ClaimReward(operator, operator, currentReward);

    vm.prank(operator);
    uint256 reward = rewardsDistributionFacet.claimReward(operator, operator);

    verifyClaim(operator, operator, reward, currentReward, timeLapse);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           HELPER                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function governanceActions() internal {
    distributionV2Helper = new DeployRewardsDistributionV2();
    address distributionV2Impl = address(new RewardsDistribution());
    address mainnetDelegationImpl = IDiamondLoupe(baseRegistry).facetAddress(
      MainnetDelegation.setBatchDelegation.selector
    );
    address spaceDelegationImpl = IDiamondLoupe(baseRegistry).facetAddress(
      SpaceDelegationFacet.addSpaceDelegation.selector
    );

    // replace the mainnet delegation and space delegation implementations
    vm.etch(mainnetDelegationImpl, type(MainnetDelegation).runtimeCode);
    vm.etch(spaceDelegationImpl, type(SpaceDelegationFacet).runtimeCode);

    FacetCut[] memory facetCuts = new FacetCut[](3);
    facetCuts[0] = distributionV2Helper.makeCut(
      distributionV2Impl,
      FacetCutAction.Add
    );
    bytes4[] memory selectors = new bytes4[](2);
    selectors[0] = SpaceDelegationFacet.setSpaceFactory.selector;
    selectors[1] = SpaceDelegationFacet.getSpaceFactory.selector;
    facetCuts[1] = FacetCut(spaceDelegationImpl, FacetCutAction.Add, selectors);
    selectors = new bytes4[](1);
    selectors[0] = MainnetDelegation.getDepositIdByDelegator.selector;
    facetCuts[2] = FacetCut(
      mainnetDelegationImpl,
      FacetCutAction.Add,
      selectors
    );
    bytes memory initPayload = distributionV2Helper.makeInitData(
      address(river),
      address(river),
      rewardDuration
    );

    vm.startPrank(owner);
    IDiamondCut(baseRegistry).diamondCut(
      facetCuts,
      distributionV2Impl,
      initPayload
    );
    rewardsDistributionFacet.setRewardNotifier(owner, true);
    SpaceDelegationFacet(baseRegistry).setSpaceFactory(spaceFactory);
    vm.stopPrank();
  }

  function getActiveOperators() internal {
    address[] memory operators = INodeOperator(baseRegistry).getOperators();
    for (uint256 i; i < operators.length; ++i) {
      NodeOperatorStatus status = INodeOperator(baseRegistry).getOperatorStatus(
        operators[i]
      );
      if (status == NodeOperatorStatus.Active) {
        activeOperators.push(operators[i]);
      }
    }
  }

  function getCommissionRate(address operator) internal view returns (uint256) {
    return INodeOperator(baseRegistry).getCommissionRate(operator);
  }

  function stake(
    address depositor,
    uint96 amount,
    address beneficiary,
    address operator
  ) internal returns (uint256 depositId) {
    vm.assume(depositor != address(0));
    vm.assume(beneficiary != address(0));
    vm.assume(amount > 0);
    deal(address(river), depositor, amount, true);

    vm.startPrank(depositor);
    river.approve(address(rewardsDistributionFacet), amount);

    vm.expectEmit(true, true, true, false, address(rewardsDistributionFacet));
    emit Stake(depositor, operator, beneficiary, depositId, amount);

    depositId = rewardsDistributionFacet.stake(amount, operator, beneficiary);
    vm.stopPrank();
  }
}
