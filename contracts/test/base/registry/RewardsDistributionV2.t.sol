// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

// interfaces
import {IERC173} from "contracts/src/diamond/facets/ownable/IERC173.sol";
import {IRewardsDistributionBase} from "contracts/src/base/registry/facets/distribution/v2/IRewardsDistribution.sol";

// libraries
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {StakingRewards} from "contracts/src/base/registry/facets/distribution/v2/StakingRewards.sol";

// contracts
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";
import {NodeOperatorFacet} from "contracts/src/base/registry/facets/operator/NodeOperatorFacet.sol";
import {River} from "contracts/src/tokens/river/base/River.sol";
import {MainnetDelegation} from "contracts/src/tokens/river/base/delegation/MainnetDelegation.sol";
import {SpaceDelegationFacet} from "contracts/src/base/registry/facets/delegation/SpaceDelegationFacet.sol";
import {RewardsDistribution} from "contracts/src/base/registry/facets/distribution/v2/RewardsDistribution.sol";

contract RewardsDistributionV2Test is BaseSetup, IRewardsDistributionBase {
  using FixedPointMathLib for uint256;

  bytes32 private constant PERMIT_TYPEHASH =
    keccak256(
      "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );

  NodeOperatorFacet internal operatorFacet;
  River internal river;
  MainnetDelegation internal mainnetDelegationFacet;
  RewardsDistribution internal rewardsDistributionFacet;
  SpaceDelegationFacet internal spaceDelegationFacet;

  address internal OPERATOR = makeAddr("OPERATOR");
  address internal NOTIFIER = makeAddr("NOTIFIER");
  uint256 internal rewardDuration;

  function setUp() public override {
    super.setUp();

    operatorFacet = NodeOperatorFacet(baseRegistry);
    river = River(riverToken);
    mainnetDelegationFacet = MainnetDelegation(baseRegistry);
    rewardsDistributionFacet = RewardsDistribution(baseRegistry);
    spaceDelegationFacet = SpaceDelegationFacet(baseRegistry);

    messenger.setXDomainMessageSender(mainnetProxyDelegation);

    vm.startPrank(deployer);
    rewardsDistributionFacet.setStakeAndRewardTokens(riverToken, riverToken);
    rewardsDistributionFacet.setRewardNotifier(NOTIFIER, true);
    vm.stopPrank();

    (, , , rewardDuration, , , , , ) = rewardsDistributionFacet.stakingState();

    vm.label(baseRegistry, "RewardsDistribution");
  }

  function test_stake_revertIf_notOperator() public {
    vm.expectRevert(RewardsDistribution__NotOperatorOrSpace.selector);
    rewardsDistributionFacet.stake(1, address(this), address(this));
  }

  function test_stake_revertIf_amountIsZero()
    public
    givenOperator(OPERATOR, 0)
  {
    vm.expectRevert(StakingRewards.StakingRewards__InvalidAmount.selector);
    rewardsDistributionFacet.stake(0, OPERATOR, address(this));
  }

  function test_stake_revertIf_beneficiaryIsZero()
    public
    givenOperator(OPERATOR, 0)
  {
    vm.expectRevert(StakingRewards.StakingRewards__InvalidAddress.selector);
    rewardsDistributionFacet.stake(1, OPERATOR, address(0));
  }

  function test_stake() public returns (uint256 depositId) {
    depositId = test_fuzz_stake(
      address(this),
      1 ether,
      OPERATOR,
      0,
      address(this)
    );
  }

  function test_fuzz_stake(
    address depositor,
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary
  ) public givenOperator(operator, commissionRate) returns (uint256 depositId) {
    vm.assume(beneficiary != address(0) && beneficiary != operator);
    vm.assume(amount > 0);
    commissionRate = bound(commissionRate, 0, 10000);

    bridgeTokensForUser(depositor, amount);

    vm.startPrank(depositor);
    river.approve(address(rewardsDistributionFacet), amount);
    depositId = rewardsDistributionFacet.stake(amount, operator, beneficiary);
    vm.stopPrank();

    verifyStake(
      depositor,
      depositId,
      amount,
      operator,
      commissionRate,
      beneficiary
    );
  }

  function test_fuzz_stake_toSpace(
    address depositor,
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary
  )
    public
    givenOperator(operator, commissionRate)
    givenSpaceHasPointedToOperator(space, operator)
    returns (uint256 depositId)
  {
    vm.assume(
      beneficiary != address(0) &&
        beneficiary != operator &&
        beneficiary != space
    );
    vm.assume(amount > 0);
    commissionRate = bound(commissionRate, 0, 10000);

    bridgeTokensForUser(depositor, amount);

    vm.startPrank(depositor);
    river.approve(address(rewardsDistributionFacet), amount);
    depositId = rewardsDistributionFacet.stake(amount, space, beneficiary);
    vm.stopPrank();

    verifyStake(
      depositor,
      depositId,
      amount,
      space,
      commissionRate,
      beneficiary
    );
  }

  function test_fuzz_permitAndStake(
    uint256 privateKey,
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary
  ) public givenOperator(operator, commissionRate) {
    vm.assume(beneficiary != address(0) && beneficiary != operator);
    vm.assume(amount > 0);
    commissionRate = bound(commissionRate, 0, 10000);

    privateKey = boundPrivateKey(privateKey);
    address user = vm.addr(privateKey);
    bridgeTokensForUser(user, amount);

    uint256 deadline = block.timestamp + 100;
    (uint8 v, bytes32 r, bytes32 s) = signPermit(
      privateKey,
      user,
      address(rewardsDistributionFacet),
      amount,
      deadline
    );

    vm.prank(user);
    uint256 depositId = rewardsDistributionFacet.permitAndStake(
      amount,
      operator,
      beneficiary,
      deadline,
      v,
      r,
      s
    );

    verifyStake(user, depositId, amount, operator, commissionRate, beneficiary);
  }

  function test_increaseStake_revertIf_notDepositor() public {
    uint256 depositId = test_stake();

    vm.prank(_randomAddress());
    vm.expectRevert(RewardsDistribution__NotDepositOwner.selector);
    rewardsDistributionFacet.increaseStake(depositId, 1);
  }

  function test_increaseStake_pokeOnly() public {
    test_fuzz_increaseStake(1 ether, 0, OPERATOR, 0, address(this));
  }

  function test_fuzz_increaseStake(
    uint96 amount0,
    uint96 amount1,
    address operator,
    uint256 commissionRate,
    address beneficiary
  ) public givenOperator(operator, commissionRate) {
    vm.assume(beneficiary != address(0) && beneficiary != operator);
    amount0 = uint96(bound(amount0, 1, type(uint96).max));
    amount1 = uint96(bound(amount1, 0, type(uint96).max - amount0));
    commissionRate = bound(commissionRate, 0, 10000);

    uint96 totalAmount = amount0 + amount1;
    bridgeTokensForUser(address(this), totalAmount);
    river.approve(address(rewardsDistributionFacet), totalAmount);
    uint256 depositId = rewardsDistributionFacet.stake(
      amount0,
      operator,
      beneficiary
    );

    rewardsDistributionFacet.increaseStake(depositId, amount1);

    verifyStake(
      address(this),
      depositId,
      totalAmount,
      operator,
      commissionRate,
      beneficiary
    );
  }

  function test_redelegate_revertIf_notOperator() public {
    uint256 depositId = test_stake();

    vm.expectRevert(RewardsDistribution__NotOperatorOrSpace.selector);
    rewardsDistributionFacet.redelegate(depositId, _randomAddress());
  }

  function test_redelegate_revertIf_notDepositor() public {
    uint256 depositId = test_stake();

    address delegatee = _randomAddress();
    registerOperator(delegatee);

    vm.prank(_randomAddress());
    vm.expectRevert(RewardsDistribution__NotDepositOwner.selector);
    rewardsDistributionFacet.redelegate(depositId, delegatee);
  }

  function test_fuzz_redelegate(
    uint96 amount,
    address operator0,
    uint256 commissionRate0,
    address operator1,
    uint256 commissionRate1
  ) public givenOperator(operator1, commissionRate1) {
    vm.assume(operator0 != operator1);
    vm.assume(operator1 != address(this));
    commissionRate1 = bound(commissionRate1, 0, 10000);

    uint256 depositId = test_fuzz_stake(
      address(this),
      amount,
      operator0,
      commissionRate0,
      address(this)
    );

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
      commissionRate1,
      address(this)
    );
  }

  function test_changeBeneficiary_revertIf_notDepositor() public {
    uint256 depositId = test_stake();

    vm.prank(_randomAddress());
    vm.expectRevert(RewardsDistribution__NotDepositOwner.selector);
    rewardsDistributionFacet.changeBeneficiary(depositId, _randomAddress());
  }

  function test_changeBeneficiary_revertIf_newBeneficiaryIsZero() public {
    uint256 depositId = test_stake();

    vm.expectRevert(StakingRewards.StakingRewards__InvalidAddress.selector);
    rewardsDistributionFacet.changeBeneficiary(depositId, address(0));
  }

  function test_changeBeneficiary() public {
    test_fuzz_changeBeneficiary(1 ether, OPERATOR, 0, _randomAddress());
  }

  function test_fuzz_changeBeneficiary(
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary
  ) public {
    vm.assume(beneficiary != address(0) && beneficiary != operator);
    commissionRate = bound(commissionRate, 0, 10000);

    uint256 depositId = test_fuzz_stake(
      address(this),
      amount,
      operator,
      commissionRate,
      address(this)
    );

    rewardsDistributionFacet.changeBeneficiary(depositId, beneficiary);

    verifyStake(
      address(this),
      depositId,
      amount,
      operator,
      commissionRate,
      beneficiary
    );
  }

  function test_initiateWithdraw_revertIf_notDepositor() public {
    uint256 depositId = test_stake();

    vm.prank(_randomAddress());
    vm.expectRevert(RewardsDistribution__NotDepositOwner.selector);
    rewardsDistributionFacet.initiateWithdraw(depositId);
  }

  function test_initiateWithdraw() public returns (uint256 depositId) {
    return test_fuzz_initiateWithdraw(1 ether, OPERATOR, 0, address(this));
  }

  function test_fuzz_initiateWithdraw(
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary
  ) public returns (uint256 depositId) {
    depositId = test_fuzz_stake(
      address(this),
      amount,
      operator,
      commissionRate,
      beneficiary
    );

    rewardsDistributionFacet.initiateWithdraw(depositId);

    verifyWithdraw(address(this), depositId, amount, 0, operator, beneficiary);
  }

  function test_withdraw_revertIf_notDepositor() public {
    uint256 depositId = test_initiateWithdraw();

    vm.prank(_randomAddress());
    vm.expectRevert(RewardsDistribution__NotDepositOwner.selector);
    rewardsDistributionFacet.withdraw(depositId);
  }

  function test_withdraw_revertIf_stillLocked() public {
    uint256 depositId = test_initiateWithdraw();

    address proxy = rewardsDistributionFacet.delegationProxyById(depositId);
    uint256 cd = river.lockCooldown(proxy);

    vm.warp(cd - 1);

    vm.expectRevert(SafeTransferLib.TransferFromFailed.selector);
    rewardsDistributionFacet.withdraw(depositId);
  }

  function test_withdraw() public {
    test_fuzz_withdraw(1 ether, OPERATOR, 0, address(this));
  }

  function test_fuzz_withdraw(
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary
  ) public {
    uint256 depositId = test_fuzz_initiateWithdraw(
      amount,
      operator,
      commissionRate,
      beneficiary
    );

    address proxy = rewardsDistributionFacet.delegationProxyById(depositId);
    uint256 cd = river.lockCooldown(proxy);

    vm.warp(cd);

    rewardsDistributionFacet.withdraw(depositId);

    verifyWithdraw(address(this), depositId, 0, amount, operator, beneficiary);
  }

  function test_fuzz_notifyRewardAmount_revertIf_notNotifier(
    address caller
  ) public {
    vm.assume(caller != NOTIFIER);
    vm.prank(caller);
    vm.expectRevert(RewardsDistribution__NotRewardNotifier.selector);
    rewardsDistributionFacet.notifyRewardAmount(1);
  }

  function test_fuzz_notifyRewardAmount_revertIf_invalidRewardRate(
    uint256 reward
  ) public {
    reward = bound(reward, 0, rewardDuration - 1);
    vm.prank(NOTIFIER);
    vm.expectRevert(StakingRewards.StakingRewards__InvalidRewardRate.selector);
    rewardsDistributionFacet.notifyRewardAmount(reward);
  }

  function test_fuzz_notifyRewardAmount_revertIf_insufficientReward(
    uint256 reward
  ) public {
    reward = boundReward(reward);
    vm.prank(NOTIFIER);
    vm.expectRevert(StakingRewards.StakingRewards__InsufficientReward.selector);
    rewardsDistributionFacet.notifyRewardAmount(reward);
  }

  function test_notifyRewardAmount() public {
    test_fuzz_notifyRewardAmount(1 ether);
  }

  function test_fuzz_notifyRewardAmount(uint256 reward) public {
    reward = boundReward(reward);
    bridgeTokensForUser(address(rewardsDistributionFacet), reward);

    vm.prank(NOTIFIER);
    rewardsDistributionFacet.notifyRewardAmount(reward);

    (
      ,
      ,
      ,
      ,
      uint256 rewardEndTime,
      uint256 lastUpdateTime,
      uint256 rewardRate,
      ,

    ) = rewardsDistributionFacet.stakingState();
    assertEq(rewardEndTime, block.timestamp + rewardDuration, "rewardEndTime");
    assertEq(lastUpdateTime, block.timestamp, "lastUpdateTime");
    assertEq(
      rewardRate,
      reward.fullMulDiv(StakingRewards.SCALE_FACTOR, rewardDuration),
      "rewardRate"
    );
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                          OPERATOR                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  modifier givenOperator(address operator, uint256 commissionRate) {
    registerOperator(operator);
    setOperatorCommissionRate(operator, commissionRate);
    _;
  }

  function registerOperator(address operator) internal {
    vm.assume(operator != address(0));
    vm.prank(operator);
    operatorFacet.registerOperator(operator);
  }

  function setOperatorCommissionRate(
    address operator,
    uint256 commissionRate
  ) internal {
    vm.assume(operator != address(0));
    commissionRate = bound(commissionRate, 0, 10000);
    vm.prank(operator);
    operatorFacet.setCommissionRate(commissionRate);
  }

  function setOperatorClaimAddress(address operator, address claimer) internal {
    vm.assume(operator != address(0));
    vm.assume(claimer != address(0));
    vm.assume(claimer != operator);
    vm.prank(operator);
    operatorFacet.setClaimAddressForOperator(claimer, operator);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           SPACE                            */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function pointSpaceToOperator(address space, address operator) internal {
    vm.assume(space != address(0));
    vm.assume(operator != address(0));
    vm.assume(space != operator);
    vm.prank(IERC173(space).owner());
    spaceDelegationFacet.addSpaceDelegation(space, operator);
  }

  modifier givenSpaceHasPointedToOperator(address space, address operator) {
    pointSpaceToOperator(space, operator);
    _;
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           HELPER                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function boundReward(uint256 reward) internal view returns (uint256) {
    return
      bound(
        reward,
        rewardDuration,
        rewardDuration.fullMulDiv(
          type(uint256).max,
          StakingRewards.SCALE_FACTOR
        )
      );
  }

  function bridgeTokensForUser(address user, uint256 amount) internal {
    vm.assume(user != address(0));
    vm.prank(bridge);
    river.mint(user, amount);
  }

  function verifyStake(
    address depositor,
    uint256 depositId,
    uint96 amount,
    address delegatee,
    uint256 commissionRate,
    address beneficiary
  ) internal view {
    assertEq(
      rewardsDistributionFacet.stakedByDepositor(depositor),
      amount,
      "stakedByDepositor"
    );

    StakingRewards.Deposit memory deposit = rewardsDistributionFacet
      .depositById(depositId);
    assertEq(deposit.amount, amount, "amount");
    assertEq(deposit.owner, depositor, "owner");
    assertEq(deposit.delegatee, delegatee, "delegatee");
    assertEq(deposit.beneficiary, beneficiary, "beneficiary");
    assertApproxEqAbs(
      deposit.commissionEarningPower,
      (amount * commissionRate) / 10000,
      1,
      "commissionEarningPower"
    );

    assertEq(
      deposit.commissionEarningPower +
        rewardsDistributionFacet
          .treasureByBeneficiary(beneficiary)
          .earningPower,
      amount,
      "earningPower"
    );

    assertEq(
      rewardsDistributionFacet.treasureByBeneficiary(delegatee).earningPower,
      deposit.commissionEarningPower,
      "commissionEarningPower"
    );

    assertEq(river.getVotes(delegatee), amount, "votes");
  }

  function verifyWithdraw(
    address depositor,
    uint256 depositId,
    uint96 depositAmount,
    uint96 withdrawAmount,
    address operator,
    address beneficiary
  ) internal view {
    assertEq(
      rewardsDistributionFacet.stakedByDepositor(depositor),
      depositAmount,
      "stakedByDepositor"
    );
    assertEq(river.balanceOf(depositor), withdrawAmount, "withdrawAmount");

    StakingRewards.Deposit memory deposit = rewardsDistributionFacet
      .depositById(depositId);
    assertEq(deposit.amount, depositAmount, "depositAmount");
    assertEq(deposit.owner, depositor, "owner");
    assertEq(deposit.commissionEarningPower, 0, "commissionEarningPower");
    assertEq(deposit.delegatee, address(0), "delegatee");
    assertEq(deposit.beneficiary, beneficiary, "beneficiary");

    assertEq(
      rewardsDistributionFacet.treasureByBeneficiary(beneficiary).earningPower,
      0,
      "earningPower"
    );

    assertEq(
      rewardsDistributionFacet.treasureByBeneficiary(operator).earningPower,
      0,
      "commissionEarningPower"
    );

    assertEq(river.getVotes(operator), 0, "votes");
  }

  function signPermit(
    uint256 privateKey,
    address owner,
    address spender,
    uint256 value,
    uint256 deadline
  ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
    bytes32 domainSeparator = river.DOMAIN_SEPARATOR();
    uint256 nonces = river.nonces(owner);

    bytes32 structHash = keccak256(
      abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces, deadline)
    );

    bytes32 typeDataHash = keccak256(
      abi.encodePacked("\x19\x01", domainSeparator, structHash)
    );

    (v, r, s) = vm.sign(privateKey, typeDataHash);
  }
}
