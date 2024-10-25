// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {IRewardsDistribution} from "./IRewardsDistribution.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {LibClone} from "solady/utils/LibClone.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {SignatureCheckerLib} from "solady/utils/SignatureCheckerLib.sol";
import {UpgradeableBeacon} from "solady/utils/UpgradeableBeacon.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {NodeOperatorStorage} from "contracts/src/base/registry/facets/operator/NodeOperatorStorage.sol";
import {SpaceDelegationStorage} from "contracts/src/base/registry/facets/delegation/SpaceDelegationStorage.sol";
import {StakingRewards} from "./StakingRewards.sol";
import {RewardsDistributionStorage} from "./RewardsDistributionStorage.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {OwnableBase} from "contracts/src/diamond/facets/ownable/OwnableBase.sol";
import {Nonces} from "contracts/src/diamond/utils/Nonces.sol";
import {EIP712Base} from "contracts/src/diamond/utils/cryptography/signature/EIP712Base.sol";
import {DelegationProxy} from "./DelegationProxy.sol";

contract RewardsDistribution is
  IRewardsDistribution,
  OwnableBase,
  EIP712Base,
  Nonces,
  Facet
{
  using EnumerableSet for EnumerableSet.AddressSet;
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

  modifier onlyOperatorOrSpace(address delegatee) {
    _onlyOperatorOrSpace(delegatee);
    _;
  }

  function stake(
    uint96 amount,
    address delegatee,
    address beneficiary
  ) external onlyOperatorOrSpace(delegatee) returns (uint256 depositId) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    depositId = ds.staking.stake(
      msg.sender,
      amount,
      delegatee,
      beneficiary,
      _getCommissionRate(delegatee)
    );

    address proxy = _deployDelegationProxy(depositId, delegatee);
    ds.staking.stakeToken.safeTransferFrom(msg.sender, proxy, amount);
  }

  function permitAndStake(
    uint96 amount,
    address delegatee,
    address beneficiary,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external onlyOperatorOrSpace(delegatee) returns (uint256 depositId) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    try
      IERC20Permit(ds.staking.stakeToken).permit(
        msg.sender,
        address(this),
        amount,
        deadline,
        v,
        r,
        s
      )
    {} catch {}
    depositId = ds.staking.stake(
      msg.sender,
      amount,
      delegatee,
      beneficiary,
      _getCommissionRate(delegatee)
    );

    address proxy = _deployDelegationProxy(depositId, delegatee);
    ds.staking.stakeToken.safeTransferFrom(msg.sender, proxy, amount);
  }

  function stakeOnBehalf(
    uint96 amount,
    address delegatee,
    address beneficiary,
    address owner,
    uint256 deadline,
    bytes calldata signature
  ) external onlyOperatorOrSpace(delegatee) returns (uint256 depositId) {
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
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    depositId = ds.staking.stake(
      owner,
      amount,
      delegatee,
      beneficiary,
      _getCommissionRate(delegatee)
    );

    address proxy = _deployDelegationProxy(depositId, delegatee);
    ds.staking.stakeToken.safeTransferFrom(msg.sender, proxy, amount);
  }

  function increaseStake(uint256 depositId, uint96 amount) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    _revertIfNotDepositOwner(deposit.owner);

    ds.staking.increaseStake(
      deposit,
      amount,
      _getCommissionRate(deposit.delegatee)
    );

    address proxy = ds.proxyById[depositId];
    ds.staking.stakeToken.safeTransferFrom(msg.sender, proxy, amount);
  }

  function redelegate(
    uint256 depositId,
    address delegatee
  ) external onlyOperatorOrSpace(delegatee) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    _revertIfNotDepositOwner(deposit.owner);

    ds.staking.redelegate(deposit, delegatee, _getCommissionRate(delegatee));

    address proxy = ds.proxyById[depositId];
    DelegationProxy(proxy).redelegate(delegatee);
  }

  function changeBeneficiary(
    uint256 depositId,
    address newBeneficiary
  ) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    _revertIfNotDepositOwner(deposit.owner);

    ds.staking.changeBeneficiary(deposit, newBeneficiary);
  }

  // TODO: state changes after initiateWithdraw
  function initiateWithdraw(
    uint256 depositId
  ) external returns (uint96 amount) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    _revertIfNotDepositOwner(deposit.owner);

    amount = ds.staking.withdraw(deposit);

    address proxy = ds.proxyById[depositId];
    DelegationProxy(proxy).redelegate(address(0));
  }

  function withdraw(uint256 depositId) external returns (uint96 amount) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    address owner = deposit.owner;
    _revertIfNotDepositOwner(owner);

    address proxy = ds.proxyById[depositId];
    amount = deposit.pendingWithdrawal;
    ds.staking.stakeToken.safeTransferFrom(proxy, owner, amount);
  }

  // TODO: transfer rewards when a space redelegates
  function claimReward(
    address beneficiary,
    address recipient
  ) external returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    // If the beneficiary is a space, only the operator can claim the reward
    if (_isSpace(beneficiary)) {
      SpaceDelegationStorage.Layout storage sd = SpaceDelegationStorage
        .layout();
      address operator = sd.operatorBySpace[beneficiary];
      _checkClaimer(operator);
    }
    // If the beneficiary is an operator, only the claimer can claim the reward
    else if (_isOperator(beneficiary)) {
      _checkClaimer(beneficiary);
    }
    // If the beneficiary is not an operator or space, only the beneficiary can claim the reward
    else if (msg.sender != beneficiary) {
      CustomRevert.revertWith(RewardsDistribution__NotBeneficiary.selector);
    }
    return ds.staking.claimReward(beneficiary, recipient);
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
  function stakingState() external view returns (StakingState memory) {
    StakingRewards.Layout storage staking = RewardsDistributionStorage
      .layout()
      .staking;
    return
      StakingState(
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
  function treasureByBeneficiary(
    address beneficiary
  ) external view returns (StakingRewards.Treasure memory) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.staking.treasureByBeneficiary[beneficiary];
  }

  /// @inheritdoc IRewardsDistribution
  function depositById(
    uint256 depositId
  ) external view returns (StakingRewards.Deposit memory) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.staking.depositById[depositId];
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
    // TODO: implement
  }

  /// @inheritdoc IRewardsDistribution
  function beacon() external view returns (address) {
    return RewardsDistributionStorage.layout().beacon;
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                          INTERNAL                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @dev Checks if the caller is the claimer of the operator
  function _checkClaimer(address operator) internal view {
    NodeOperatorStorage.Layout storage nos = NodeOperatorStorage.layout();
    address claimer = nos.claimerByOperator[operator];
    if (msg.sender != claimer) {
      CustomRevert.revertWith(RewardsDistribution__NotClaimer.selector);
    }
  }

  /// @dev Returns the commission rate of the operator or space
  function _getCommissionRate(
    address delegatee
  ) internal view returns (uint256) {
    // If the delegatee is a space, get the operator
    if (_isSpace(delegatee)) {
      SpaceDelegationStorage.Layout storage sd = SpaceDelegationStorage
        .layout();
      delegatee = sd.operatorBySpace[delegatee];
    }
    NodeOperatorStorage.Layout storage nos = NodeOperatorStorage.layout();
    return nos.commissionByOperator[delegatee];
  }

  /// @dev Checks if the delegatee is an operator
  function _isOperator(address delegatee) internal view returns (bool) {
    NodeOperatorStorage.Layout storage nos = NodeOperatorStorage.layout();
    return nos.operators.contains(delegatee);
  }

  /// @dev Checks if the delegatee is a space
  function _isSpace(address delegatee) internal view returns (bool) {
    SpaceDelegationStorage.Layout storage sd = SpaceDelegationStorage.layout();
    return sd.operatorBySpace[delegatee] != address(0);
  }

  /// @dev Reverts if the delegatee is not an operator or space
  function _onlyOperatorOrSpace(address delegatee) internal view {
    if (!(_isOperator(delegatee) || _isSpace(delegatee))) {
      CustomRevert.revertWith(RewardsDistribution__NotOperatorOrSpace.selector);
    }
  }

  /// @dev Reverts if the caller is not the owner of the deposit
  function _revertIfNotDepositOwner(address owner) internal view {
    if (msg.sender != owner) {
      CustomRevert.revertWith(RewardsDistribution__NotDepositOwner.selector);
    }
  }

  function _revertIfPastDeadline(uint256 deadline) internal view {
    if (block.timestamp > deadline) {
      CustomRevert.revertWith(RewardsDistribution__ExpiredDeadline.selector);
    }
  }

  function _revertIfSignatureIsNotValidNow(
    address signer,
    bytes32 hash,
    bytes calldata signature
  ) internal view {
    bool _isValid = SignatureCheckerLib.isValidSignatureNowCalldata(
      signer,
      hash,
      signature
    );
    if (!_isValid) {
      CustomRevert.revertWith(RewardsDistribution__InvalidSignature.selector);
    }
  }

  function _deployDelegationProxy(
    uint256 depositId,
    address delegatee
  ) internal returns (address proxy) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    proxy = LibClone.deployDeterministicERC1967BeaconProxy(
      ds.beacon,
      bytes32(depositId)
    );
    ds.proxyById[depositId] = proxy;
    DelegationProxy(proxy).initialize(ds.staking.stakeToken, delegatee);

    emit DelegationProxyDeployed(depositId, delegatee, proxy);
  }
}
