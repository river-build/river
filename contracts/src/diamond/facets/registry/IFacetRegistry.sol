// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {IDiamond} from "contracts/src/diamond/IDiamond.sol";

interface IFacetRegistryBase {
  /// @notice Reverts when facet is already registered.
  error FacetRegistry_FacetAlreadyRegistered();

  /// @notice Reverts when facet address is zero.
  error FacetRegistry_FacetAddressZero();

  /// @notice Reverts when facet does not have any selectors.
  error FacetRegistry_FacetMustHaveSelectors();

  /// @notice Reverts when facet is not a contract.
  error FacetRegistry_FacetNotContract();

  /// @notice Reverts when facet is not registered.
  error FacetRegistry_FacetNotRegistered();

  /// @notice Reverts when facet initializer is already registered.
  error FacetRegistry_InitializerAlreadyRegistered();

  /// @notice Reverts when facet initializer is not registered.
  error FacetRegistry_InitializerNotRegistered();

  /**
   * @notice Emitted when a facet is registered.
   * @param facet Address of the registered facet.
   * @param selectors Function selectors of the registered facet.
   */
  event FacetRegistered(address indexed facet, bytes4[] selectors);

  /**
   * @notice Emitted when a facet is unregistered.
   * @param facet Address of the unregistered facet.
   */
  event FacetUnregistered(address indexed facet);

  /**
   * @notice Emitted when a facet initializer is registered.
   * @param facet Address of the facet.
   * @param initializer Function selector of the initializer.
   */
  event FacetInitializerRegistered(
    address indexed facet,
    bytes4 indexed initializer
  );

  /**
   * @notice Emitted when a facet initializer is unregistered.
   * @param facet Address of the facet.
   */
  event FacetInitializerUnregistered(address indexed facet);
}

interface IFacetRegistry is IFacetRegistryBase {
  /**
   * @notice Adds a new facet to the registry
   * @param facet Address of the facet to add
   * @param selectors Array of function selectors to add
   */
  function addFacet(address facet, bytes4[] calldata selectors) external;

  /**
   * @notice Adds a new facet to the registry with an initializer
   * @param facet Address of the facet to add
   * @param selectors Array of function selectors to add
   * @param initializer Function selector of the initializer
   */
  function addFacet(
    address facet,
    bytes4[] calldata selectors,
    bytes4 initializer
  ) external;

  /**
   * @notice Removes a facet from the registry
   * @param facet Address of the facet to remove
   */
  function removeFacet(address facet) external;

  /**
   * @notice Gets all registered facets
   * @return Array of facet addresses
   */
  function facets() external view returns (address[] memory);

  /**
   * @notice Gets the selectors for a facet
   * @param facet Address of the facet to get selectors for
   * @return Array of function selectors
   */
  function facetSelectors(
    address facet
  ) external view returns (bytes4[] memory);

  /**
   * @notice Checks if a facet is registered
   * @param facet Address of the facet to check
   * @return True if the facet is registered
   */
  function hasFacet(address facet) external view returns (bool);

  /**
   * @notice Deploys a new facet and registers it
   * @param salt Salt to use for deployment
   * @param creationCode Creation code for the facet
   * @param selectors Array of function selectors to register
   * @return facet Address of the deployed facet
   */
  function createFacet(
    bytes32 salt,
    bytes calldata creationCode,
    bytes4[] calldata selectors
  ) external returns (address facet);

  /**
   * @notice Creates a facet cut for a facet
   * @param facet Address of the facet to create a cut for
   * @param action Action to perform on the facet
   * @return Facet cut data
   */
  function createFacetCut(
    address facet,
    IDiamond.FacetCutAction action
  ) external returns (IDiamond.FacetCut memory);

  /**
   * @notice Computes the address of a facet
   * @param salt Salt to use for deployment
   * @param creationCode Creation code for the facet
   * @return facet Address of the computed facet
   */
  function computeFacetAddress(
    bytes32 salt,
    bytes memory creationCode
  ) external view returns (address facet);
}
