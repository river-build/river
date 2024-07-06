// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamond, Diamond} from "contracts/src/diamond/Diamond.sol";
import {DiamondFactory} from "contracts/src/diamond/facets/factory/DiamondFactory.sol";

// libraries

// contracts
import {FacetTest} from "contracts/test/diamond/Facet.t.sol";
import {DeployDiamondFactory} from "contracts/scripts/deployments/facets/DeployDiamondFactory.s.sol";

// helpers
import {MultiInit} from "contracts/src/diamond/initializers/MultiInit.sol";

contract DiamondFactorySetup is FacetTest {
  DeployDiamondFactory factoryHelper = new DeployDiamondFactory();

  DiamondFactory internal factory;

  function setUp() public virtual override {
    super.setUp();

    factory = DiamondFactory(diamond);
  }

  function diamondInitParams()
    public
    override
    returns (Diamond.InitParams memory)
  {
    MultiInit multiInit = new MultiInit();

    address diamondFactory = factoryHelper.deploy();

    addFacet(
      factoryHelper.makeCut(diamondFactory, IDiamond.FacetCutAction.Add),
      diamondFactory,
      factoryHelper.makeInitData("")
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
