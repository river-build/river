// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {IRewardsDistribution} from "./IRewardsDistribution.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {UpgradeableBeacon} from "solady/utils/UpgradeableBeacon.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {StakingRewards} from "./StakingRewards.sol";
import {RewardsDistributionStorage} from "./RewardsDistributionStorage.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {OwnableBase} from "contracts/src/diamond/facets/ownable/OwnableBase.sol";
import {Nonces} from "contracts/src/diamond/utils/Nonces.sol";
import {EIP712Base} from "contracts/src/diamond/utils/cryptography/signature/EIP712Base.sol";
import {DelegationProxy} from "./DelegationProxy.sol";
import {RewardsDistributionBase} from "./RewardsDistributionBase.sol";

contract RewardsDistribution is
  IRewardsDistribution,
  RewardsDistributionBase,
  OwnableBase,
  EIP712Base,
  Nonces,
  Facet
{
  using EnumerableSet for EnumerableSet.UintSet;
  using SafeTransferLib for address;
  using StakingRewards for StakingRewards.Layout;

  bytes32 internal constant STAKE_TYPEHASH =
    keccak256(
      "Stake(uint96 amount,address delegatee,address beneficiary,address owner,uint256 nonce,uint256 deadline)"
    );

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       ADMIN FUNCTIONS                      */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function __RewardsDistribution_init(
    address stakeToken,
    address rewardToken,
    uint256 rewardDuration
  ) external onlyInitializing {
    _addInterface(type(IRewardsDistribution).interfaceId);
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Layout storage staking = ds.staking;
    (staking.stakeToken, staking.rewardToken, staking.rewardDuration) = (
      stakeToken,
      rewardToken,
      rewardDuration
    );
    UpgradeableBeacon _beacon = new UpgradeableBeacon(
      address(this),
      address(new DelegationProxy())
    );
    ds.beacon = address(_beacon);

    emit RewardsDistributionInitialized(
      stakeToken,
      rewardToken,
      rewardDuration
    );
  }

  function upgradeDelegationProxy(
    address newImplementation
  ) external onlyOwner {
    address _beacon = RewardsDistributionStorage.layout().beacon;
    UpgradeableBeacon(_beacon).upgradeTo(newImplementation);

    emit DelegationProxyUpgraded(newImplementation);
  }

  function setRewardNotifier(
    address notifier,
    bool enabled
  ) external onlyOwner {
    RewardsDistributionStorage.layout().isRewardNotifier[notifier] = enabled;

    emit RewardNotifierSet(notifier, enabled);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       STATE MUTATING                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function stake(
    uint96 amount,
    address delegatee,
    address beneficiary
  ) external returns (uint256 depositId) {
    depositId = _stake(amount, delegatee, beneficiary, msg.sender);
  }

  function permitAndStake(
    uint96 amount,
    address delegatee,
    address beneficiary,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external returns (uint256 depositId) {
    address stakeToken = RewardsDistributionStorage.layout().staking.stakeToken;
    try
      IERC20Permit(stakeToken).permit(
        msg.sender,
        address(this),
        amount,
        deadline,
        v,
        r,
        s
      )
    {} catch {}

    depositId = _stake(amount, delegatee, beneficiary, msg.sender);
  }

  function stakeOnBehalf(
    uint96 amount,
    address delegatee,
    address beneficiary,
    address owner,
    uint256 deadline,
    bytes calldata signature
  ) external returns (uint256 depositId) {
    _revertIfPastDeadline(deadline);

    bytes32 structHash = keccak256(
      abi.encode(
        STAKE_TYPEHASH,
        amount,
        delegatee,
        beneficiary,
        owner,
        _useNonce(owner),
        deadline
      )
    );
    _revertIfSignatureIsNotValidNow(
      owner,
      _hashTypedDataV4(structHash),
      signature
    );

    depositId = _stake(amount, delegatee, beneficiary, owner);
  }

  function increaseStake(uint256 depositId, uint96 amount) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    address owner = deposit.owner;
    _revertIfNotDepositOwner(owner);

    address delegatee = deposit.delegatee;
    _revertIfNotOperatorOrSpace(delegatee);

    ds.staking.increaseStake(
      deposit,
      owner,
      amount,
      delegatee,
      deposit.beneficiary,
      _getCommissionRate(delegatee)
    );

    if (owner != address(this)) {
      address proxy = ds.proxyById[depositId];
      ds.staking.stakeToken.safeTransferFrom(msg.sender, proxy, amount);
    }
  }

  function redelegate(uint256 depositId, address delegatee) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    address owner = deposit.owner;

    _revertIfNotDepositOwner(owner);
    _revertIfNotOperatorOrSpace(delegatee);

    uint96 pendingWithdrawal = deposit.pendingWithdrawal;
    uint256 commissionRate = _getCommissionRate(delegatee);

    if (pendingWithdrawal == 0) {
      ds.staking.redelegate(deposit, delegatee, commissionRate);
    } else {
      ds.staking.increaseStake(
        deposit,
        owner,
        pendingWithdrawal,
        delegatee,
        deposit.beneficiary,
        commissionRate
      );
      deposit.delegatee = delegatee;
      deposit.pendingWithdrawal = 0;
    }

    if (owner != address(this)) {
      address proxy = ds.proxyById[depositId];
      DelegationProxy(proxy).redelegate(delegatee);
    }
  }

  function changeBeneficiary(
    uint256 depositId,
    address newBeneficiary
  ) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    _revertIfNotDepositOwner(deposit.owner);

    address delegatee = deposit.delegatee;
    _revertIfNotOperatorOrSpace(delegatee);

    ds.staking.changeBeneficiary(
      deposit,
      newBeneficiary,
      _getCommissionRate(delegatee)
    );
  }

  function initiateWithdraw(
    uint256 depositId
  ) external returns (uint96 amount) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    address owner = deposit.owner;
    _revertIfNotDepositOwner(owner);

    amount = ds.staking.withdraw(deposit);

    if (owner != address(this)) {
      address proxy = ds.proxyById[depositId];
      DelegationProxy(proxy).redelegate(address(0));
    } else {
      deposit.pendingWithdrawal = 0;
    }
  }

  function withdraw(uint256 depositId) external returns (uint96 amount) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    address owner = deposit.owner;
    _revertIfNotDepositOwner(owner);

    if (owner == address(this)) {
      CustomRevert.revertWith(
        RewardsDistribution__CannotWithdrawFromSelf.selector
      );
    }

    amount = deposit.pendingWithdrawal;
    if (amount == 0) {
      CustomRevert.revertWith(
        RewardsDistribution__NoPendingWithdrawal.selector
      );
    } else {
      deposit.pendingWithdrawal = 0;
      address proxy = ds.proxyById[depositId];
      ds.staking.stakeToken.safeTransferFrom(proxy, owner, amount);
    }
  }

  // TODO: transfer rewards when a space redelegates
  function claimReward(
    address beneficiary,
    address recipient
  ) external returns (uint256 reward) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    // If the beneficiary is the caller (user or operator), they can claim the reward
    if (msg.sender != beneficiary) {
      // If the beneficiary is a space, only the operator can claim the reward
      if (_isSpace(beneficiary)) {
        // the operator may not be active but is still allowed to claim the reward
        address operator = _getOperatorBySpace(beneficiary);
        _revertIfNotClaimer(operator);
      }
      // If the beneficiary is an operator, only the claimer can claim the reward
      else if (_isOperator(beneficiary)) {
        _revertIfNotClaimer(beneficiary);
      } else {
        CustomRevert.revertWith(RewardsDistribution__NotBeneficiary.selector);
      }
    }
    reward = ds.staking.claimReward(beneficiary);
    if (reward != 0) {
      ds.staking.rewardToken.safeTransfer(recipient, reward);
    }
  }

  function notifyRewardAmount(uint256 reward) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    if (!ds.isRewardNotifier[msg.sender]) {
      CustomRevert.revertWith(RewardsDistribution__NotRewardNotifier.selector);
    }

    ds.staking.notifyRewardAmount(reward);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                          VIEWERS                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @inheritdoc IRewardsDistribution
  function stakingState() external view returns (StakingState memory state) {
    StakingRewards.Layout storage staking = RewardsDistributionStorage
      .layout()
      .staking;
    assembly ("memory-safe") {
      // By default, memory has been implicitly allocated for `state`.
      // But we don't need this implicitly allocated memory.
      // So we just set the free memory pointer to what it was before `state` has been allocated.
      mstore(0x40, state)
    }
    state = StakingState(
      staking.stakeToken,
      staking.totalStaked,
      staking.rewardDuration,
      staking.rewardEndTime,
      staking.lastUpdateTime,
      staking.rewardRate,
      staking.rewardPerTokenAccumulated,
      staking.nextDepositId
    );
  }

  /// @inheritdoc IRewardsDistribution
  function stakedByDepositor(
    address depositor
  ) external view returns (uint256 amount) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    amount = ds.staking.stakedByDepositor[depositor];
  }

  /// @inheritdoc IRewardsDistribution
  function getDepositsByDepositor(
    address depositor
  ) external view returns (uint256[] memory) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.depositsByDepositor[depositor].values();
  }

  /// @inheritdoc IRewardsDistribution
  function treasureByBeneficiary(
    address beneficiary
  ) external view returns (StakingRewards.Treasure memory treasure) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    assembly ("memory-safe") {
      mstore(0x40, treasure)
    }
    treasure = ds.staking.treasureByBeneficiary[beneficiary];
  }

  /// @inheritdoc IRewardsDistribution
  function depositById(
    uint256 depositId
  ) external view returns (StakingRewards.Deposit memory deposit) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    assembly ("memory-safe") {
      mstore(0x40, deposit)
    }
    deposit = ds.staking.depositById[depositId];
  }

  /// @inheritdoc IRewardsDistribution
  function delegationProxyById(
    uint256 depositId
  ) external view returns (address) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.proxyById[depositId];
  }

  /// @inheritdoc IRewardsDistribution
  function isRewardNotifier(address notifier) external view returns (bool) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.isRewardNotifier[notifier];
  }

  /// @inheritdoc IRewardsDistribution
  function lastTimeRewardDistributed() external view returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.staking.lastTimeRewardDistributed();
  }

  /// @inheritdoc IRewardsDistribution
  function currentRewardPerTokenAccumulated() external view returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.staking.currentRewardPerTokenAccumulated();
  }

  /// @inheritdoc IRewardsDistribution
  function currentReward(address beneficiary) external view returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return
      ds.staking.currentReward(ds.staking.treasureByBeneficiary[beneficiary]);
  }

  /// @inheritdoc IRewardsDistribution
  function currentSpaceDelegationReward(
    address operator
  ) external view returns (uint256) {
    return _currentSpaceDelegationReward(operator);
  }

  /// @inheritdoc IRewardsDistribution
  function beacon() external view returns (address) {
    return RewardsDistributionStorage.layout().beacon;
  }
}
