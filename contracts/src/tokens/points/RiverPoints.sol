// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IArchitect} from "contracts/src/factory/facets/architect/IArchitect.sol";

// libraries
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {RiverPointsStorage} from "./RiverPointsStorage.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {IntrospectionFacet} from "contracts/src/diamond/facets/introspection/IntrospectionFacet.sol";
import {OwnableBase} from "contracts/src/diamond/facets/ownable/OwnableBase.sol";

contract RiverPoints is Facet, IntrospectionFacet, OwnableBase, IERC20Metadata {
  error RiverPoints__InvalidSpace();
  error RiverPoints__InvalidArrayLength();

  function __RiverPoints_init(address spaceFactory) external onlyInitializing {
    RiverPointsStorage.Layout storage ds = RiverPointsStorage.layout();
    ds.spaceFactory = spaceFactory;

    _addInterface(type(IERC20).interfaceId);
    _addInterface(type(IERC20Metadata).interfaceId);
  }

  modifier onlySpace() {
    address spaceFactory = RiverPointsStorage.layout().spaceFactory;
    if (IArchitect(spaceFactory).getTokenIdBySpace(msg.sender) == 0) {
      CustomRevert.revertWith(RiverPoints__InvalidSpace.selector);
    }
    _;
  }

  /// @notice Batch mint points to multiple users
  /// @dev Only callable by the owner
  function batchMintPoints(
    address[] calldata accounts,
    uint256[] calldata values
  ) external onlyOwner {
    if (accounts.length != values.length) {
      CustomRevert.revertWith(RiverPoints__InvalidArrayLength.selector);
    }

    RiverPointsStorage.Layout storage self = RiverPointsStorage.layout();
    for (uint256 i; i < accounts.length; ++i) {
      self.inner.mint(accounts[i], values[i]);
    }
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           ERC20                            */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @inheritdoc IERC20
  function approve(address spender, uint256 value) external returns (bool) {
    RiverPointsStorage.layout().inner.approve(spender, value);
    return true;
  }

  /// @notice Mint points to a user
  /// @dev Only spaces can mint points
  function mint(address to, uint256 value) external onlySpace {
    RiverPointsStorage.layout().inner.mint(to, value);
  }

  /// @inheritdoc IERC20
  function transfer(address to, uint256 value) external returns (bool) {
    RiverPointsStorage.layout().inner.transfer(to, value);
    return true;
  }

  /// @inheritdoc IERC20
  function transferFrom(
    address from,
    address to,
    uint256 value
  ) external returns (bool) {
    RiverPointsStorage.layout().inner.transferFrom(from, to, value);
    return true;
  }

  /// @inheritdoc IERC20
  function allowance(
    address owner,
    address spender
  ) external view returns (uint256) {
    return RiverPointsStorage.layout().inner.allowance(owner, spender);
  }

  /// @inheritdoc IERC20
  function balanceOf(address account) external view returns (uint256) {
    return RiverPointsStorage.layout().inner.balanceOf(account);
  }

  /// @inheritdoc IERC20
  function totalSupply() external view returns (uint256) {
    return RiverPointsStorage.layout().inner.totalSupply;
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       ERC20 METADATA                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @inheritdoc IERC20Metadata
  function name() external pure returns (string memory) {
    return "River Points";
  }

  /// @inheritdoc IERC20Metadata
  function symbol() external pure returns (string memory) {
    return "RP";
  }

  /// @inheritdoc IERC20Metadata
  function decimals() public pure virtual returns (uint8) {
    return 18;
  }
}
