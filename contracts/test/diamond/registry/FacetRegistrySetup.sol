// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamond, Diamond} from "contracts/src/diamond/Diamond.sol";
import {DiamondFactory} from "contracts/src/diamond/facets/factory/DiamondFactory.sol";
import {FacetRegistry} from "contracts/src/diamond/facets/registry/FacetRegistry.sol";

// libraries

// contracts
import {FacetTest} from "contracts/test/diamond/Facet.t.sol";
import {DeployDiamondFactory} from "contracts/scripts/deployments/facets/DeployDiamondFactory.s.sol";
import {DeployFacetRegistry} from "contracts/scripts/deployments/facets/DeployFacetRegistry.s.sol";
import {DeployOwnable} from "contracts/scripts/deployments/facets/DeployOwnable.s.sol";

// helpers
import {MultiInit} from "contracts/src/diamond/initializers/MultiInit.sol";

contract FacetRegistrySetup is FacetTest {
  DeployDiamondFactory factoryHelper = new DeployDiamondFactory();
  DeployFacetRegistry registryHelper = new DeployFacetRegistry();
  DeployOwnable ownableHelper = new DeployOwnable();

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
    MultiInit multiInit = new MultiInit();

    address diamondFactory = factoryHelper.deploy();
    address facetRegistry = registryHelper.deploy();
    address ownablePendingFacet = ownableHelper.deploy();

    addFacet(
      ownableHelper.makeCut(ownablePendingFacet, IDiamond.FacetCutAction.Add),
      ownablePendingFacet,
      ownableHelper.makeInitData(deployer)
    );

    addFacet(
      factoryHelper.makeCut(diamondFactory, IDiamond.FacetCutAction.Add),
      diamondFactory,
      factoryHelper.makeInitData(address(multiInit))
    );

    addFacet(
      registryHelper.makeCut(facetRegistry, IDiamond.FacetCutAction.Add),
      facetRegistry,
      registryHelper.makeInitData("")
    );

    return
      Diamond.InitParams({
        baseFacets: baseFacets(),
        init: address(multiInit),
        initData: abi.encodeWithSelector(
          MultiInit.multiInit.selector,
          _initAddresses,
          _initDatas
        )
      });
  }
}
