// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

// interfaces
import {IERC173} from "contracts/src/diamond/facets/ownable/IERC173.sol";
import {IRewardsDistributionBase} from "contracts/src/base/registry/facets/distribution/v2/IRewardsDistribution.sol";

// contracts
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";
import {NodeOperatorFacet} from "contracts/src/base/registry/facets/operator/NodeOperatorFacet.sol";
import {River} from "contracts/src/tokens/river/base/River.sol";
import {MainnetDelegation} from "contracts/src/tokens/river/base/delegation/MainnetDelegation.sol";
import {SpaceDelegationFacet} from "contracts/src/base/registry/facets/delegation/SpaceDelegationFacet.sol";
import {RewardsDistribution} from "contracts/src/base/registry/facets/distribution/v2/RewardsDistribution.sol";
import {StakingRewards} from "contracts/src/base/registry/facets/distribution/v2/StakingRewards.sol";

contract RewardsDistributionV2Test is BaseSetup, IRewardsDistributionBase {
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

  function setUp() public override {
    super.setUp();

    operatorFacet = NodeOperatorFacet(baseRegistry);
    river = River(riverToken);
    mainnetDelegationFacet = MainnetDelegation(baseRegistry);
    rewardsDistributionFacet = RewardsDistribution(baseRegistry);
    spaceDelegationFacet = SpaceDelegationFacet(baseRegistry);

    messenger.setXDomainMessageSender(mainnetProxyDelegation);

    vm.prank(deployer);
    rewardsDistributionFacet.setStakeAndRewardTokens(riverToken, riverToken);
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

  function test_fuzz_stake(
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary
  ) public givenOperator(operator, commissionRate) {
    vm.assume(beneficiary != address(0));
    amount = uint96(bound(amount, 1, type(uint96).max));
    commissionRate = bound(commissionRate, 0, 10000);

    bridgeTokensForUser(address(this), amount);
    river.approve(address(rewardsDistributionFacet), amount);
    uint256 depositId = rewardsDistributionFacet.stake(
      amount,
      operator,
      beneficiary
    );

    verifyStake(
      address(this),
      depositId,
      amount,
      operator,
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
    vm.assume(beneficiary != address(0));
    amount = uint96(bound(amount, 1, type(uint96).max));
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

  function test_increaseStake_revertIf_notDepositor()
    public
    givenOperator(OPERATOR, 0)
  {
    uint96 amount = 1 ether;
    bridgeTokensForUser(address(this), amount);
    river.approve(address(rewardsDistributionFacet), amount);
    uint256 depositId = rewardsDistributionFacet.stake(
      amount,
      OPERATOR,
      address(this)
    );

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
    vm.assume(beneficiary != address(0));
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
    vm.prank(operator);
    operatorFacet.setClaimAddressForOperator(claimer, operator);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           SPACE                            */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function pointSpaceToOperator(address space, address operator) internal {
    vm.assume(space != address(0));
    vm.assume(operator != address(0));
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

  function bridgeTokensForUser(address user, uint256 amount) internal {
    vm.assume(user != address(0));
    vm.prank(bridge);
    river.mint(user, amount);
  }

  function verifyStake(
    address depositor,
    uint256 depositId,
    uint96 amount,
    address operator,
    uint256 commissionRate,
    address beneficiary
  ) internal view {
    assertEq(rewardsDistributionFacet.stakedByDepositor(depositor), amount);

    StakingRewards.Deposit memory deposit = rewardsDistributionFacet
      .depositById(depositId);
    assertEq(deposit.amount, amount);
    assertEq(deposit.owner, depositor);
    assertEq(
      deposit.commissionEarningPower,
      (amount * commissionRate) / StakingRewards.SCALE_FACTOR
    );
    assertEq(deposit.delegatee, operator);
    assertEq(deposit.beneficiary, beneficiary);

    assertEq(
      deposit.commissionEarningPower +
        rewardsDistributionFacet
          .treasureByBeneficiary(beneficiary)
          .earningPower,
      amount
    );
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
