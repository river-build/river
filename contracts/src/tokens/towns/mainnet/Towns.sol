// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITowns} from "./ITowns.sol";
import {IERC5805} from "@openzeppelin/contracts/interfaces/IERC5805.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// libraries
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {VotesEnumerableLib} from "contracts/src/diamond/facets/governance/votes/enumerable/VotesEnumerableLib.sol";
import {InflationLib} from "./inflation/InflationLib.sol";
import {BasisPoints} from "contracts/src/utils/libraries/BasisPoints.sol";

// contracts
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IntrospectionFacet} from "@river-build/diamond/src/facets/introspection/IntrospectionFacet.sol";

contract Towns is
  ITowns,
  AccessManaged,
  ERC20Permit,
  ERC20Votes,
  IntrospectionFacet
{
  /// @dev initial supply is 10 billion tokens
  uint256 internal constant INITIAL_SUPPLY = 10_000_000_000 ether;

  /// @dev deployment time
  uint256 public immutable deployedAt;

  /// @dev initialInflationRate is the initial inflation rate in basis points (0-10000)
  uint256 public immutable initialInflationRate;

  /// @dev finalInflationRate is the final inflation rate in basis points (0-10000)
  uint256 public immutable finalInflationRate;

  /// @dev inflationDecreaseRate is the rate at which the inflation rate decreases in basis points (0-10000)
  uint256 public immutable inflationDecreaseRate;

  /// @dev inflationDecreaseInterval is the interval at which the inflation rate decreases in years
  uint256 public immutable inflationDecreaseInterval;

  constructor(
    address vault,
    address manager,
    uint256 mintTime,
    InflationConfig memory inflationConfig
  ) ERC20Permit("Towns") AccessManaged(manager) ERC20("Towns", "TOWNS") {
    __IntrospectionBase_init();

    // add interface
    _addInterface(type(ITowns).interfaceId);
    _addInterface(type(IERC5805).interfaceId);
    _addInterface(type(IERC20).interfaceId);
    _addInterface(type(IERC20Metadata).interfaceId);
    _addInterface(type(IERC20Permit).interfaceId);

    // mint to vault
    _mint(vault, INITIAL_SUPPLY);

    // set last mint time for inflation
    InflationLib.layout().lastMintTime = mintTime;

    // backfill deployed at
    deployedAt = mintTime;

    // set inflation values
    initialInflationRate = inflationConfig.initialInflationRate;
    finalInflationRate = inflationConfig.finalInflationRate;
    inflationDecreaseRate = inflationConfig.inflationDecreaseRate;
    inflationDecreaseInterval = inflationConfig.inflationDecreaseInterval;
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Delegation                               */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
  function getDelegators() external view returns (address[] memory) {
    return VotesEnumerableLib.getDelegators();
  }

  function getDelegatorsPaginated(
    uint256 start,
    uint256 count
  ) external view returns (address[] memory) {
    return VotesEnumerableLib.getDelegatorsPaginated(start, count);
  }

  function getDelegatorCount() external view returns (uint256) {
    return VotesEnumerableLib.getDelegatorCount();
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Inflation                               */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
  function lastMintTime() external view returns (uint256) {
    return InflationLib.layout().lastMintTime;
  }

  function setTokenRecipient(address _tokenRecipient) external restricted {
    InflationLib.layout().tokenRecipient = _tokenRecipient;
    emit TokenRecipientSet(_tokenRecipient);
  }

  /// @inheritdoc ITowns
  function createInflation() external restricted {
    InflationLib.Layout storage ds = InflationLib.layout();

    // verify that minting can only happen once per year
    uint256 timeSinceLastMint = block.timestamp - ds.lastMintTime;
    if (timeSinceLastMint < 365 days) revert MintingTooSoon();

    // calculate the amount to mint
    uint256 inflationRateBPS = InflationLib.getCurrentInflationRateBPS(
      deployedAt,
      inflationDecreaseInterval,
      inflationDecreaseRate,
      initialInflationRate,
      finalInflationRate
    );
    uint256 inflationAmount = BasisPoints.calculate(
      totalSupply(),
      inflationRateBPS
    );

    _mint(ds.tokenRecipient, inflationAmount);

    // update last mint time
    ds.lastMintTime = block.timestamp;

    emit InflationCreated(inflationAmount);
  }

  /// @inheritdoc ITowns
  function setOverrideInflation(
    bool overrideInflation,
    uint256 overrideInflationRate
  ) external restricted {
    if (overrideInflationRate > finalInflationRate)
      revert InvalidInflationRate();
    InflationLib.setOverrideInflation(overrideInflation, overrideInflationRate);
  }

  // =============================================================
  //                           Overrides
  // =============================================================
  function _update(
    address from,
    address to,
    uint256 value
  ) internal virtual override(ERC20, ERC20Votes) {
    super._update(from, to, value);
  }

  function _delegate(
    address account,
    address delegatee
  ) internal virtual override {
    address currentDelegatee = delegates(account);

    // revert if the delegatee is the same as the current delegatee
    if (currentDelegatee == delegatee) revert DelegateeSameAsCurrent();

    super._delegate(account, delegatee);

    VotesEnumerableLib.addDelegator(account, delegatee);
  }

  // =============================================================
  //                           Override
  // =============================================================

  /// @notice Clock used for flagging checkpoints, overridden to implement timestamp based
  /// checkpoints (and voting).
  function clock() public view override returns (uint48) {
    return uint48(block.timestamp);
  }

  /// @notice Machine-readable description of the clock as specified in EIP-6372.
  function CLOCK_MODE() public pure override returns (string memory) {
    return "mode=timestamp";
  }

  /// @notice Returns the current nonce for `owner`. This value must be
  /// included whenever a signature is generated for {permit}.
  /// @param owner The account to query the nonce for.
  function nonces(
    address owner
  ) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
    return super.nonces(owner);
  }
}
