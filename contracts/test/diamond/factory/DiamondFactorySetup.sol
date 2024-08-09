// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamond, Diamond} from "contracts/src/diamond/Diamond.sol";
import {DiamondFactory} from "contracts/src/diamond/facets/factory/DiamondFactory.sol";

// libraries

// contracts
import {FacetTest} from "contracts/test/diamond/Facet.t.sol";
import {DeployDiamondFactory} from "contracts/scripts/deployments/facets/DeployDiamondFactory.s.sol";
import {DeployFacetRegistry, FacetRegistry} from "contracts/scripts/deployments/facets/DeployFacetRegistry.s.sol";
import {DeployOwnable} from "contracts/scripts/deployments/facets/DeployOwnable.s.sol";
import {DeployMultiInit, MultiInit} from "contracts/scripts/deployments/DeployMultiInit.s.sol";

contract DiamondFactorySetup is FacetTest {
  DeployFacetRegistry internal registryHelper = new DeployFacetRegistry();
  DeployDiamondFactory internal factoryHelper = new DeployDiamondFactory();
  DeployOwnable internal ownableHelper = new DeployOwnable();
  DeployMultiInit internal multiInitHelper = new DeployMultiInit();

  DiamondFactory internal factory;
  FacetRegistry internal registry;

  function setUp() public virtual override {
    super.setUp();

    factory = DiamondFactory(diamond);
    registry = FacetRegistry(diamond);
  }

  function diamondInitParams()
    public
    override
    returns (Diamond.InitParams memory)
  {
    address multiInit = address(new MultiInit());
    address facetRegistry = registryHelper.deploy();
    address diamondFactory = factoryHelper.deploy();
    address ownablePendingFacet = ownableHelper.deploy();

    addFacet(
      registryHelper.makeCut(facetRegistry, IDiamond.FacetCutAction.Add),
      facetRegistry,
      registryHelper.makeInitData("")
    );

    addFacet(
      factoryHelper.makeCut(diamondFactory, IDiamond.FacetCutAction.Add),
      diamondFactory,
      factoryHelper.makeInitData(multiInit)
    );

    addFacet(
      ownableHelper.makeCut(ownablePendingFacet, IDiamond.FacetCutAction.Add),
      ownablePendingFacet,
      ownableHelper.makeInitData(deployer)
    );

    return
      Diamond.InitParams({
        baseFacets: baseFacets(),
        init: multiInit,
        initData: abi.encodeWithSelector(
          MultiInit.multiInit.selector,
          _initAddresses,
          _initDatas
        )
      });
  }
}
