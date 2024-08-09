// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondFactory} from "contracts/src/diamond/facets/factory/IDiamondFactory.sol";

// libraries

// contracts
import {IDiamond, Diamond} from "contracts/src/diamond/Diamond.sol";
import {DiamondFactoryBase} from "contracts/src/diamond/facets/factory/DiamondFactoryBase.sol";
import {FacetRegistryBase} from "contracts/src/diamond/facets/registry/FacetRegistryBase.sol";
import {OwnableBase} from "contracts/src/diamond/facets/ownable/OwnableBase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {MultiInit} from "contracts/src/diamond/initializers/MultiInit.sol";

contract DiamondFactory is
  IDiamondFactory,
  DiamondFactoryBase,
  FacetRegistryBase,
  OwnableBase,
  Facet
{
  function __DiamondFactory_init(address multiInit) external initializer {
    _addInterface(type(IDiamondFactory).interfaceId);
    _setMultiInit(multiInit);
  }

  function createDiamond(
    Diamond.InitParams memory initParams
  ) external returns (address diamond) {
    diamond = _createDiamond(initParams);
  }

  function createOfficialDiamond(
    FacetDeployment[] memory facets
  ) external returns (address diamond) {
    // validate facets being passed are registered
    uint256 facetLength = facets.length;
    if (facetLength == 0) revert DiamondFactory_FacetsEmpty();

    for (uint256 i = 0; i < facetLength; i++) {
      if (facets[i].facet == address(0)) revert DiamondFactory_ZeroAddress();
      if (!_hasFacet(facets[i].facet))
        revert DiamondFactory_FacetNotRegistered(facets[i].facet);
    }

    address[] memory defaultFacets = _defaultFacets();
    uint256 defaultFacetsLength = defaultFacets.length;

    // verify defaultFacets are not empty
    if (defaultFacetsLength == 0) revert DiamondFactory_DefaultFacetsEmpty();

    // verify default facets are not being overridden
    for (uint256 i = 0; i < facetLength; i++) {
      if (_hasDefaultFacet(facets[i].facet))
        revert DiamondFactory_FacetAlreadyAdded(facets[i].facet);
    }

    address[] memory deployments = new address[](facetLength);

    for (uint256 i = 0; i < facetLength; i++) {
      deployments[i] = facets[i].facet;
    }
    address[] memory allFacets = _mergeArrays(defaultFacets, deployments);

    uint256 totalFacetsLength = defaultFacetsLength + facetLength;
    Diamond.FacetCut[] memory _cuts = new Diamond.FacetCut[](totalFacetsLength);
    address[] memory _initAddresses = new address[](totalFacetsLength);
    bytes[] memory _initDatas = new bytes[](totalFacetsLength);

    for (uint256 i = 0; i < totalFacetsLength; i++) {
      _cuts[i] = _createFacetCut(allFacets[i], IDiamond.FacetCutAction.Add);
    }

    for (uint256 i = 0; i < defaultFacetsLength; i++) {
      _initAddresses[i] = defaultFacets[i];
      _initDatas[i] = abi.encode(_facetInitializer(allFacets[i]));
      if (_initDatas[i].length == 0)
        revert DiamondFactory_InitializerNotRegistered(allFacets[i]);
    }

    for (uint256 i = 0; i < facetLength; i++) {
      _initAddresses[defaultFacetsLength + i] = facets[i].facet;
      _initDatas[defaultFacetsLength + i] = facets[i].data;
    }

    address multiInit = _multiInit();
    if (multiInit == address(0)) revert DiamondFactory_MultiInitNotSet();

    Diamond.InitParams memory initParams = Diamond.InitParams({
      baseFacets: _cuts,
      init: multiInit,
      initData: abi.encodeWithSelector(
        MultiInit.multiInit.selector,
        _initAddresses,
        _initDatas
      )
    });

    diamond = _createDiamond(initParams);
  }

  function addDefaultFacet(address facet) external onlyOwner {
    if (!_hasFacet(facet)) revert DiamondFactory_FacetNotRegistered(facet);
    _addDefaultFacet(facet);
  }

  function removeDefaultFacet(address facet) external onlyOwner {
    _removeDefaultFacet(facet);
  }

  function setMultiInit(address multiInit) external onlyOwner {
    _setMultiInit(multiInit);
  }
}
