// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// libraries
import {RiverPointsStorage} from "./RiverPointsStorage.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {IntrospectionFacet} from "contracts/src/diamond/facets/introspection/IntrospectionFacet.sol";

contract RiverPoints is Facet, IntrospectionFacet, IERC20Metadata {
  function __RiverPoints_init(address river) external onlyInitializing {
    RiverPointsStorage.Layout storage ds = RiverPointsStorage.layout();
    ds.river = river;

    _addInterface(type(IERC20).interfaceId);
    _addInterface(type(IERC20Metadata).interfaceId);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           ERC20                            */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function approve(address spender, uint256 value) external returns (bool) {
    RiverPointsStorage.layout().inner.approve(spender, value);
    return true;
  }

  function transfer(address to, uint256 value) external returns (bool) {
    RiverPointsStorage.layout().inner.transfer(to, value);
    return true;
  }

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
