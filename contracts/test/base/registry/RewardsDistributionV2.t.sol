// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

// interfaces
import {IERC173, IOwnableBase} from "contracts/src/diamond/facets/ownable/IERC173.sol";
import {IRewardsDistributionBase} from "contracts/src/base/registry/facets/distribution/v2/IRewardsDistribution.sol";

// libraries
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {UpgradeableBeacon} from "solady/utils/UpgradeableBeacon.sol";
import {StakingRewards} from "contracts/src/base/registry/facets/distribution/v2/StakingRewards.sol";
import {RewardsDistributionStorage} from "contracts/src/base/registry/facets/distribution/v2/RewardsDistributionStorage.sol";

// contracts
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";
import {EIP712Utils} from "contracts/test/utils/EIP712Utils.sol";
import {EIP712Facet} from "contracts/src/diamond/utils/cryptography/signature/EIP712Facet.sol";
import {NodeOperatorFacet} from "contracts/src/base/registry/facets/operator/NodeOperatorFacet.sol";
import {River} from "contracts/src/tokens/river/base/River.sol";
import {MainnetDelegation} from "contracts/src/tokens/river/base/delegation/MainnetDelegation.sol";
import {SpaceDelegationFacet} from "contracts/src/base/registry/facets/delegation/SpaceDelegationFacet.sol";
import {RewardsDistribution} from "contracts/src/base/registry/facets/distribution/v2/RewardsDistribution.sol";
import {DelegationProxy} from "contracts/src/base/registry/facets/distribution/v2/DelegationProxy.sol";

contract RewardsDistributionV2Test is
  BaseSetup,
  EIP712Utils,
  IOwnableBase,
  IRewardsDistributionBase
{
  using FixedPointMathLib for uint256;

  bytes32 internal constant STAKE_TYPEHASH =
    keccak256(
      "Stake(uint96 amount,address delegatee,address beneficiary,address owner,uint256 nonce,uint256 deadline)"
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

    eip712Facet = EIP712Facet(baseRegistry);
    operatorFacet = NodeOperatorFacet(baseRegistry);
    river = River(riverToken);
    mainnetDelegationFacet = MainnetDelegation(baseRegistry);
    rewardsDistributionFacet = RewardsDistribution(baseRegistry);
    spaceDelegationFacet = SpaceDelegationFacet(baseRegistry);

    messenger.setXDomainMessageSender(mainnetProxyDelegation);

    vm.prank(deployer);
    rewardsDistributionFacet.setRewardNotifier(NOTIFIER, true);

    rewardDuration = rewardsDistributionFacet.stakingState().rewardDuration;

    vm.label(baseRegistry, "RewardsDistribution");
  }

  function test_storageSlot() public pure {
    bytes32 slot = keccak256(
      abi.encode(
        uint256(keccak256("facets.registry.rewards.distribution.v2.storage")) -
          1
      )
    ) & ~bytes32(uint256(0xff));
    assertEq(slot, RewardsDistributionStorage.STORAGE_SLOT, "slot");
  }

  function test_fuzz_upgradeDelegationProxy_revertIf_notOwner(
    address caller
  ) public {
    vm.assume(caller != deployer);
    vm.expectRevert(abi.encodeWithSelector(Ownable__NotOwner.selector, caller));
    vm.prank(caller);
    rewardsDistributionFacet.upgradeDelegationProxy(address(this));
  }

  function test_fuzz_upgradeDelegationProxy(address newImplementation) public {
    vm.assume(uint160(newImplementation) > 10);
    vm.assume(newImplementation.code.length == 0);
    vm.etch(newImplementation, type(DelegationProxy).runtimeCode);

    vm.expectEmit(address(rewardsDistributionFacet));
    emit DelegationProxyUpgraded(newImplementation);
    vm.prank(deployer);
    rewardsDistributionFacet.upgradeDelegationProxy(newImplementation);

    assertEq(
      UpgradeableBeacon(rewardsDistributionFacet.beacon()).implementation(),
      newImplementation
    );
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
    address beneficiary,
    uint256 deadline
  ) public givenOperator(operator, commissionRate) {
    vm.assume(beneficiary != address(0) && beneficiary != operator);
    vm.assume(amount > 0);
    commissionRate = bound(commissionRate, 0, 10000);
    deadline = bound(deadline, block.timestamp, type(uint256).max);

    privateKey = boundPrivateKey(privateKey);
    address user = vm.addr(privateKey);
    bridgeTokensForUser(user, amount);

    (uint8 v, bytes32 r, bytes32 s) = signPermit(
      privateKey,
      riverToken,
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

  function test_fuzz_stakeOnBehalf_revertIf_pastDeadline(
    uint256 deadline
  ) public givenOperator(OPERATOR, 0) {
    deadline = bound(deadline, 0, block.timestamp - 1);
    vm.expectRevert(RewardsDistribution__ExpiredDeadline.selector);
    rewardsDistributionFacet.stakeOnBehalf(
      1,
      OPERATOR,
      address(this),
      address(this),
      deadline,
      ""
    );
  }

  function test_stakeOnBehalf_revertIf_invalidSignature()
    public
    givenOperator(OPERATOR, 0)
  {
    vm.expectRevert(RewardsDistribution__InvalidSignature.selector);
    rewardsDistributionFacet.stakeOnBehalf(
      1,
      OPERATOR,
      address(this),
      address(this),
      block.timestamp,
      ""
    );
  }

  function test_fuzz_stakeOnBehalf(
    uint256 privateKey,
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary,
    uint256 deadline
  ) public givenOperator(operator, commissionRate) returns (uint256 depositId) {
    vm.assume(beneficiary != address(0) && beneficiary != operator);
    vm.assume(amount > 0);
    commissionRate = bound(commissionRate, 0, 10000);
    deadline = bound(deadline, block.timestamp, type(uint256).max);

    privateKey = boundPrivateKey(privateKey);
    address owner = vm.addr(privateKey);

    bridgeTokensForUser(address(this), amount);

    bytes memory signature;
    {
      bytes32 structHash = keccak256(
        abi.encode(
          STAKE_TYPEHASH,
          amount,
          operator,
          beneficiary,
          owner,
          eip712Facet.nonces(owner),
          deadline
        )
      );
      (uint8 v, bytes32 r, bytes32 s) = signIntent(
        privateKey,
        address(eip712Facet),
        structHash
      );
      signature = abi.encodePacked(r, s, v);
    }

    river.approve(address(rewardsDistributionFacet), amount);
    depositId = rewardsDistributionFacet.stakeOnBehalf(
      amount,
      operator,
      beneficiary,
      owner,
      deadline,
      signature
    );

    verifyStake(
      owner,
      depositId,
      amount,
      operator,
      commissionRate,
      beneficiary
    );
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

  function test_fuzz_initiateWithdraw_rewardsNotDiluted(
    address[2] memory depositors,
    uint96[2] memory amounts,
    address operator,
    uint256 timeLapse
  ) public {
    vm.assume(depositors[0] != depositors[1]);
    vm.assume(
      operator != OPERATOR &&
        operator != depositors[0] &&
        operator != depositors[1]
    );
    vm.assume(OPERATOR != depositors[0] && OPERATOR != depositors[1]);
    timeLapse = bound(timeLapse, 0, rewardDuration);

    test_notifyRewardAmount();

    uint256 depositId0 = test_fuzz_stake(
      depositors[0],
      amounts[0],
      operator,
      0,
      depositors[0]
    );
    uint256 depositId1 = test_fuzz_stake(
      depositors[1],
      amounts[1],
      OPERATOR,
      0,
      depositors[1]
    );

    // immediately initiate withdraw for the first depositor
    vm.prank(depositors[0]);
    rewardsDistributionFacet.initiateWithdraw(depositId0);

    vm.warp(block.timestamp + timeLapse);

    // poke the second depositor
    vm.prank(depositors[1]);
    rewardsDistributionFacet.increaseStake(depositId1, 0);

    uint256 currentReward = rewardsDistributionFacet.currentReward(
      depositors[1]
    );

    StakingState memory state = rewardsDistributionFacet.stakingState();
    uint256 rewardRate = state.rewardRate;
    uint256 rewardPerTokenAccumulated = state.rewardPerTokenAccumulated;

    // verify the second depositor receives all the rewards
    assertEq(
      rewardPerTokenAccumulated,
      rewardRate.fullMulDiv(timeLapse, amounts[1]),
      "rewardPerTokenAccumulated"
    );
    assertEq(
      currentReward,
      rewardRate.fullMulDiv(timeLapse, StakingRewards.SCALE_FACTOR),
      "currentReward"
    );
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

    verifyWithdraw(
      address(this),
      depositId,
      amount,
      amount,
      operator,
      beneficiary
    );
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

  function test_fuzz_claimReward_revertIf_notBeneficiary(
    address beneficiary
  ) public {
    vm.assume(beneficiary != address(this));
    vm.expectRevert(RewardsDistribution__NotBeneficiary.selector);
    rewardsDistributionFacet.claimReward(beneficiary, address(this));
  }

  function test_fuzz_claimReward_revertIf_notOperatorClaimer(
    address claimer,
    address operator
  )
    public
    givenOperator(operator, 0)
    givenSpaceHasPointedToOperator(space, operator)
  {
    vm.assume(claimer != address(this));
    setOperatorClaimAddress(operator, claimer);

    vm.expectRevert(RewardsDistribution__NotClaimer.selector);
    rewardsDistributionFacet.claimReward(operator, address(this));

    vm.expectRevert(RewardsDistribution__NotClaimer.selector);
    rewardsDistributionFacet.claimReward(space, address(this));
  }

  // TODO: fuzz more depositors
  function test_fuzz_claimReward_byBeneficiary(
    address depositor,
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary,
    uint256 rewardAmount,
    uint256 timeLapse
  ) public {
    vm.assume(depositor != address(this));
    vm.assume(operator != OPERATOR && operator != address(this));
    vm.assume(
      beneficiary != operator &&
        beneficiary != OPERATOR &&
        beneficiary != address(this) &&
        beneficiary != address(rewardsDistributionFacet)
    );
    commissionRate = bound(commissionRate, 0, 10000);
    timeLapse = bound(timeLapse, 0, rewardDuration);
    rewardAmount = boundReward(rewardAmount);

    test_fuzz_notifyRewardAmount(rewardAmount);
    test_stake();
    test_fuzz_stake(depositor, amount, operator, commissionRate, beneficiary);

    vm.warp(block.timestamp + timeLapse);

    uint256 currentReward = rewardsDistributionFacet.currentReward(beneficiary);

    vm.prank(beneficiary);
    uint256 reward = rewardsDistributionFacet.claimReward(
      beneficiary,
      beneficiary
    );

    verifyClaim(beneficiary, beneficiary, reward, currentReward, timeLapse);
  }

  function test_fuzz_claimReward_byOperator(
    uint96 amount,
    address operator,
    uint256 commissionRate,
    uint256 rewardAmount,
    uint256 timeLapse
  ) public {
    vm.assume(
      operator != address(this) && operator != address(rewardsDistributionFacet)
    );
    commissionRate = bound(commissionRate, 0, 10000);
    timeLapse = bound(timeLapse, 0, rewardDuration);
    amount = uint96(bound(amount, 1 ether, type(uint96).max));
    rewardAmount = boundReward(rewardAmount);

    test_fuzz_notifyRewardAmount(rewardAmount);
    test_fuzz_stake(
      address(this),
      amount,
      operator,
      commissionRate,
      address(this)
    );

    vm.warp(block.timestamp + timeLapse);

    uint256 currentReward = rewardsDistributionFacet.currentReward(operator);

    vm.prank(operator);
    uint256 reward = rewardsDistributionFacet.claimReward(operator, operator);

    verifyClaim(operator, operator, reward, currentReward, timeLapse);
  }

  function test_fuzz_claimReward_bySpaceOperator(
    uint96 amount,
    address operator,
    uint256 commissionRate,
    uint256 rewardAmount,
    uint256 timeLapse
  ) public {
    vm.assume(
      operator != address(this) && operator != address(rewardsDistributionFacet)
    );
    commissionRate = bound(commissionRate, 0, 10000);
    timeLapse = bound(timeLapse, 0, rewardDuration);
    amount = uint96(bound(amount, 1 ether, type(uint96).max));
    rewardAmount = boundReward(rewardAmount);

    test_fuzz_notifyRewardAmount(rewardAmount);
    test_fuzz_stake_toSpace(
      address(this),
      amount,
      operator,
      commissionRate,
      address(this)
    );

    vm.warp(block.timestamp + timeLapse);

    uint256 currentReward = rewardsDistributionFacet.currentReward(space);

    vm.prank(operator);
    uint256 reward = rewardsDistributionFacet.claimReward(space, operator);

    verifyClaim(space, operator, reward, currentReward, timeLapse);
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
      0,
      "stakedByDepositor"
    );
    assertEq(river.balanceOf(depositor), withdrawAmount, "withdrawAmount");

    StakingRewards.Deposit memory deposit = rewardsDistributionFacet
      .depositById(depositId);
    assertEq(deposit.amount, 0, "depositAmount");
    assertEq(deposit.owner, depositor, "owner");
    assertEq(deposit.commissionEarningPower, 0, "commissionEarningPower");
    assertEq(deposit.delegatee, address(0), "delegatee");
    assertEq(deposit.pendingWithdrawal, depositAmount, "pendingWithdrawal");
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

  function verifyClaim(
    address beneficiary,
    address claimer,
    uint256 reward,
    uint256 currentReward,
    uint256 timeLapse
  ) internal view {
    assertEq(reward, currentReward, "reward");
    assertEq(river.balanceOf(claimer), reward, "reward balance");

    StakingState memory state = rewardsDistributionFacet.stakingState();
    uint256 earningPower = rewardsDistributionFacet
      .treasureByBeneficiary(beneficiary)
      .earningPower;

    assertEq(
      state.rewardRate.fullMulDiv(timeLapse, state.totalStaked).fullMulDiv(
        earningPower,
        StakingRewards.SCALE_FACTOR
      ),
      reward,
      "expected reward"
    );
  }
}
