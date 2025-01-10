// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITowns} from "./ITowns.sol";
import {IVotesEnumerable} from "contracts/src/diamond/facets/governance/votes/enumerable/IVotesEnumerable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IERC6372} from "@openzeppelin/contracts/interfaces/IERC6372.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/interfaces/IERC20Metadata.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

// libraries
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";
import {BasisPoints} from "contracts/src/utils/libraries/BasisPoints.sol";
import {TokenInflationLib} from "./libs/TokenInflationLib.sol";
import {VotesEnumerableLib} from "./libs/VotesEnumerableLib.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";

// contracts
import {IntrospectionBase} from "@river-build/diamond/src/facets/introspection/IntrospectionBase.sol";
import {ERC20Votes} from "solady/tokens/ERC20Votes.sol";

contract Towns is
  OwnableRoles,
  ERC20Votes,
  IntrospectionBase,
  ITowns,
  IVotesEnumerable,
  IERC165
{
  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                  Constants & Immutables                    */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @dev initial supply is 10 billion tokens
  uint256 internal constant INITIAL_SUPPLY = 10_000_000_000 ether;

  /// @dev the role for the inflation caller
  uint256 public constant ROLE_INFLATION_MANAGER = 1;

  /// @dev the role for the inflation rate manager
  uint256 public constant ROLE_INFLATION_RATE_MANAGER = 2;

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Constructor                      */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  constructor(address vault, address manager, InflationConfig memory config) {
    if (vault == address(0) || manager == address(0)) {
      CustomRevert.revertWith(InvalidAddress.selector);
    }

    if (config.inflationReceiver == address(0)) {
      CustomRevert.revertWith(InvalidAddress.selector);
    }

    _initializeOwner(vault);

    _grantRoles(vault, ROLE_INFLATION_MANAGER);
    _grantRoles(manager, ROLE_INFLATION_RATE_MANAGER);

    _addInterface(type(ITowns).interfaceId);
    _addInterface(type(IVotesEnumerable).interfaceId);
    _addInterface(type(IERC165).interfaceId);
    _addInterface(type(IVotes).interfaceId);
    _addInterface(type(IERC6372).interfaceId);
    _addInterface(type(IERC20).interfaceId);
    _addInterface(type(IERC20Metadata).interfaceId);
    _addInterface(type(IERC20Permit).interfaceId);

    TokenInflationLib.initialize(config);

    _mint(vault, INITIAL_SUPPLY);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Inflation                        */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
  function inflationReceiver() external view returns (address) {
    return TokenInflationLib.inflationReceiver();
  }

  function currentInflationRate() external view returns (uint256) {
    return TokenInflationLib.getCurrentInflationRateBPS();
  }

  function lastMintTime() external view returns (uint256) {
    return TokenInflationLib.lastMintTime();
  }

  /// @inheritdoc ITowns
  function setOverrideInflation(
    bool overrideInflation,
    uint256 overrideInflationRate
  ) external onlyRoles(ROLE_INFLATION_RATE_MANAGER) {
    if (overrideInflationRate > TokenInflationLib.finalInflationRate()) {
      CustomRevert.revertWith(InvalidInflationRate.selector);
    }

    TokenInflationLib.setOverrideInflation(
      overrideInflation,
      overrideInflationRate
    );
  }

  /// @inheritdoc ITowns
  function setInflationReceiver(
    address receiver
  ) external onlyRoles(ROLE_INFLATION_MANAGER) {
    if (receiver == address(0)) {
      CustomRevert.revertWith(InvalidAddress.selector);
    }

    TokenInflationLib.setInflationReceiver(receiver);
  }

  /// @inheritdoc ITowns
  function createInflation() external onlyRoles(ROLE_INFLATION_MANAGER) {
    // verify that minting can only happen once per year
    uint256 timeSinceLastMint = block.timestamp -
      TokenInflationLib.lastMintTime();

    if (timeSinceLastMint < 365 days) {
      CustomRevert.revertWith(MintingTooSoon.selector);
    }

    uint256 inflationRateBPS = TokenInflationLib.getCurrentInflationRateBPS();
    uint256 inflationAmount = BasisPoints.calculate(
      totalSupply(),
      inflationRateBPS
    );

    address receiver = TokenInflationLib.inflationReceiver();
    _mint(receiver, inflationAmount);

    TokenInflationLib.updateLastMintTime();
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                        Delegators                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @inheritdoc IVotesEnumerable
  function getDelegators() external view returns (address[] memory) {
    return VotesEnumerableLib.getDelegators();
  }

  /// @inheritdoc IVotesEnumerable
  function getDelegatorsByDelegatee(
    address delegatee
  ) external view returns (address[] memory) {
    return VotesEnumerableLib.getDelegatorsByDelegatee(delegatee);
  }

  /// @inheritdoc IVotesEnumerable
  function getDelegationTimeForDelegator(
    address delegator
  ) external view returns (uint256) {
    return VotesEnumerableLib.getDelegationTimeForDelegator(delegator);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                     Introspection                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override returns (bool) {
    return _supportsInterface(interfaceId);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                         Overrides                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function name() public pure override returns (string memory) {
    return "Towns";
  }

  function symbol() public pure override returns (string memory) {
    return "TOWNS";
  }

  /// @notice Clock used for flagging checkpoints, overridden to implement timestamp based
  /// checkpoints (and voting).
  function clock() public view override returns (uint48) {
    return uint48(block.timestamp);
  }

  /// @notice Machine-readable description of the clock as specified in EIP-6372.
  function CLOCK_MODE() public pure override returns (string memory) {
    return "mode=timestamp";
  }

  /// @dev Override the delegate function to update the delegators and delegation time
  function _delegate(address account, address delegatee) internal override {
    address currentDelegatee = delegates(account);

    super._delegate(account, delegatee);

    VotesEnumerableLib.setDelegators(account, delegatee, currentDelegatee);
  }
}