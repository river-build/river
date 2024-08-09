// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {DiamondFactorySetup} from "contracts/test/diamond/factory/DiamondFactorySetup.sol";

//interfaces
import {IDiamondFactoryBase} from "contracts/src/diamond/facets/factory/IDiamondFactory.sol";
import {IDiamond} from "contracts/src/diamond/Diamond.sol";
import {IDiamondLoupe} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";
import {IERC165} from "contracts/src/diamond/facets/introspection/IERC165.sol";
import {IERC173} from "contracts/src/diamond/facets/ownable/IERC173.sol";

//libraries

//contracts
import {Diamond} from "contracts/src/diamond/Diamond.sol";

// helpers
import {DeployIntrospection} from "contracts/scripts/deployments/facets/DeployIntrospection.s.sol";
import {DeployDiamondLoupe} from "contracts/scripts/deployments/facets/DeployDiamondLoupe.s.sol";
import {DeployDiamondCut} from "contracts/scripts/deployments/facets/DeployDiamondCut.s.sol";
import {DeployWalletLink} from "contracts/scripts/deployments/facets/DeployWalletLink.s.sol";

import {MultiInit} from "contracts/src/diamond/initializers/MultiInit.sol";

contract DiamondFactoryTest is
  IDiamondFactoryBase,
  IDiamond,
  DiamondFactorySetup
{
  DeployDiamondCut cutHelper = new DeployDiamondCut();
  DeployDiamondLoupe loupeHelper = new DeployDiamondLoupe();
  DeployIntrospection introspectionHelper = new DeployIntrospection();

  // helpers
  DeployWalletLink walletLinkHelper = new DeployWalletLink();

  address cut;
  address loupe;
  address introspection;
  address ownable;
  address walletLink;

  function setUp() public override {
    super.setUp();

    loupe = loupeHelper.deploy();
    cut = cutHelper.deploy();
    introspection = introspectionHelper.deploy();
    ownable = ownableHelper.deploy();
    walletLink = walletLinkHelper.deploy();
  }

  modifier givenFacetIsRegistered(
    address facet,
    bytes4[] memory selectors,
    bytes4 initializer
  ) {
    vm.prank(deployer);
    registry.addFacet(facet, selectors, initializer);
    _;
  }

  modifier givenFacetIsRegisteredAndDefault(
    address facet,
    bytes4[] memory selectors,
    bytes4 initializer
  ) {
    vm.startPrank(deployer);
    registry.addFacet(facet, selectors, initializer);
    factory.addDefaultFacet(facet);
    vm.stopPrank();
    _;
  }

  function test_createOfficialDiamond()
    external
    givenFacetIsRegisteredAndDefault(
      cut,
      cutHelper.selectors(),
      cutHelper.initializer()
    )
    givenFacetIsRegisteredAndDefault(
      introspection,
      introspectionHelper.selectors(),
      introspectionHelper.initializer()
    )
    givenFacetIsRegisteredAndDefault(
      loupe,
      loupeHelper.selectors(),
      loupeHelper.initializer()
    )
    givenFacetIsRegistered(
      ownable,
      ownableHelper.selectors(),
      ownableHelper.initializer()
    )
    givenFacetIsRegistered(
      walletLink,
      walletLinkHelper.selectors(),
      walletLinkHelper.initializer()
    )
  {
    uint256 index;

    address[] memory facets = new address[](2);
    facets[index++] = ownable;
    facets[index++] = walletLink;

    index = 0;
    address caller = _randomAddress();
    FacetDeployment[] memory deployments = new FacetDeployment[](2);

    deployments[index++] = FacetDeployment({
      facet: ownable,
      data: abi.encodeWithSelector(registry.facetInitializer(ownable), caller)
    });
    deployments[index++] = FacetDeployment({
      facet: walletLink,
      data: abi.encode(registry.facetInitializer(walletLink))
    });

    vm.prank(deployer);
    address newDiamond = factory.createOfficialDiamond(deployments);

    assertTrue(newDiamond.code.length > 0);
    assertTrue(
      IERC165(newDiamond).supportsInterface(type(IDiamondLoupe).interfaceId)
    );
    assertEq(IERC173(newDiamond).owner(), caller);
  }

  function test_createDiamond() external {
    FacetCut[] memory cuts = new FacetCut[](2);
    address[] memory addresses = new address[](2);
    bytes[] memory datas = new bytes[](2);

    cuts[0] = introspectionHelper.makeCut(introspection, FacetCutAction.Add);
    cuts[1] = loupeHelper.makeCut(loupe, FacetCutAction.Add);

    addresses[0] = introspection;
    addresses[1] = loupe;

    datas[0] = introspectionHelper.makeInitData("");
    datas[1] = loupeHelper.makeInitData("");

    address multiInit = address(new MultiInit());

    Diamond.InitParams memory params = Diamond.InitParams({
      baseFacets: cuts,
      init: address(multiInit),
      initData: abi.encodeWithSelector(
        MultiInit.multiInit.selector,
        addresses,
        datas
      )
    });

    address caller = _randomAddress();

    vm.prank(caller);
    address newDiamond = factory.createDiamond(params);

    assertTrue(
      IERC165(newDiamond).supportsInterface(type(IDiamondLoupe).interfaceId)
    );
  }

  function test_revertWhenLoupeFacetNotSupported() external {
    FacetCut[] memory cuts = new FacetCut[](1);
    cuts[0] = introspectionHelper.makeCut(introspection, FacetCutAction.Add);

    Diamond.InitParams memory params = Diamond.InitParams({
      baseFacets: cuts,
      init: introspection,
      initData: introspectionHelper.makeInitData("")
    });

    address caller = _randomAddress();

    vm.prank(caller);
    vm.expectRevert(DiamondFactory_LoupeNotSupported.selector);
    factory.createDiamond(params);
  }
}
