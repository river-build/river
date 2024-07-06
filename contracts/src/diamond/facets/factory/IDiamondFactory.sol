// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {Diamond} from "contracts/src/diamond/Diamond.sol";

interface IDiamondFactoryBase {
  /// @notice Thrown when the created diamond does not have loupe facet.
  error DiamondFactory_LoupeNotSupported();

  /// @notice Emmited when a diamond is created
  event DiamondCreated(address indexed diamond, address indexed deployer);
}

interface IDiamondFactory is IDiamondFactoryBase {
  /**
   * @notice Deployes a new diamond proxy and applies an initial diamond cut.
   * @param initParams Struct containing the initial diamond cut params.
   */
  function createDiamond(
    Diamond.InitParams memory initParams
  ) external returns (address diamond);
}
