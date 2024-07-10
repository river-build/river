// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {Diamond} from "contracts/src/diamond/Diamond.sol";

interface IDiamondFactoryBase {
  // =============================================================
  //                           Structs
  // =============================================================
  struct FacetDeployment {
    address facet;
    bytes data;
  }

  // =============================================================
  //                           Errors
  // =============================================================

  /// @notice Thrown when the created diamond does not have loupe facet.
  error DiamondFactory_LoupeNotSupported();

  /// @notice Thrown when the facet is already added to the default facets.
  error DiamondFactory_FacetAlreadyAdded(address facet);

  /// @notice Thrown when the facet is not registered as a default facet.
  error DiamondFactory_FacetNotRegistered(address facet);

  /// @notice Thrown when the default facets are empty.
  error DiamondFactory_DefaultFacetsEmpty();

  /// @notice Thrown when the multi init contract is not set.
  error DiamondFactory_MultiInitNotSet();

  /// @notice Thrown when the facets passed to create diamond are empty.
  error DiamondFactory_FacetsEmpty();

  /// @notice Thrown when the facet's initializer is not registered.
  error DiamondFactory_InitializerNotRegistered(address facet);

  /// @notice Thrown when the facet is address(0).
  error DiamondFactory_ZeroAddress();

  // =============================================================
  //                           Events
  // =============================================================

  /// @notice Emmited when a diamond is created
  event DiamondCreated(address indexed diamond, address indexed deployer);

  /// @notice Emmited when a default facet is added
  event DefaultFacetAdded(address indexed facet, address indexed deployer);

  /// @notice Emmited when a default facet is removed
  event DefaultFacetRemoved(address indexed facet, address indexed deployer);

  /// @notice Emitted when multi init contract is set
  event MultiInitSet(address indexed multiInit, address indexed deployer);
}

interface IDiamondFactory is IDiamondFactoryBase {
  /**
   * @notice Deployes a new diamond proxy and applies an initial diamond cut.
   * @param initParams Struct containing the initial diamond cut params.
   */
  function createDiamond(
    Diamond.InitParams memory initParams
  ) external returns (address diamond);

  /**
   * @notice Deployes a new diamond proxy with the default facets and the passed facets.
   * @param facets Array of FacetDeployment structs containing the facet address and data.
   */
  function createOfficialDiamond(
    FacetDeployment[] memory facets
  ) external returns (address diamond);

  /**
   * @notice Sets the multi init contract address.
   * @param multiInit Address of the multi init contract.
   */
  function setMultiInit(address multiInit) external;

  /**
   * @notice Adds a new default facet to the diamond factory.
   * @param facet Address of the facet to add.
   */
  function addDefaultFacet(address facet) external;

  /**
   * @notice Removes a default facet from the diamond factory.
   * @param facet Address of the facet to remove.
   */
  function removeDefaultFacet(address facet) external;
}
