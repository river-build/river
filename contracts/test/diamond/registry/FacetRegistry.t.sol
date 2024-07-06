// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {FacetRegistrySetup} from "contracts/test/diamond/registry/FacetRegistrySetup.sol";

//interfaces
import {Diamond} from "contracts/src/diamond/Diamond.sol";
import {IFacetRegistryBase} from "contracts/src/diamond/facets/registry/IFacetRegistry.sol";
import {IDiamondLoupe} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";
import {IERC165} from "contracts/src/diamond/facets/introspection/IERC165.sol";

//libraries

//contracts
import {DeployDiamondCut} from "contracts/scripts/deployments/facets/DeployDiamondCut.s.sol";
import {DeployIntrospection} from "contracts/scripts/deployments/facets/DeployIntrospection.s.sol";
import {DeployDiamondLoupe} from "contracts/scripts/deployments/facets/DeployDiamondLoupe.s.sol";
import {MultiInit} from "contracts/src/diamond/initializers/MultiInit.sol";

contract FacetRegistryTest is IFacetRegistryBase, FacetRegistrySetup {
  DeployDiamondCut cutHelper = new DeployDiamondCut();
  DeployIntrospection introspectionHelper = new DeployIntrospection();
  DeployDiamondLoupe loupeHelper = new DeployDiamondLoupe();

  address cut;
  address loupe;
  address introspection;
  address multiInit;

  function setUp() public override {
    super.setUp();

    cut = cutHelper.deploy();
    loupe = loupeHelper.deploy();
    introspection = introspectionHelper.deploy();
    multiInit = address(new MultiInit());
  }

  modifier givenFacetIsAdded(address facet, bytes4[] memory selectors) {
    vm.prank(deployer);
    vm.expectEmit(diamond);
    emit FacetRegistered(facet, selectors);
    registry.addFacet(facet, selectors);
    _;
  }

  function test_addFacet()
    external
    givenFacetIsAdded(cut, cutHelper.selectors())
  {
    assertTrue(registry.hasFacet(cut));
    assertTrue(registry.facets().length == 1);
    assertTrue(
      registry.facetSelectors(cut).length == cutHelper.selectors().length
    );
  }

  function test_removeFacet()
    external
    givenFacetIsAdded(cut, cutHelper.selectors())
  {
    vm.prank(deployer);
    vm.expectEmit(diamond);
    emit FacetUnregistered(cut);
    registry.removeFacet(cut);
    assertTrue(!registry.hasFacet(cut));
    assertTrue(registry.facets().length == 0);
  }

  function test_createFacet() external {
    bytes32 salt = _randomBytes32();
    bytes memory creationCode = introspectionHelper.creationCode();
    bytes4[] memory selectors = introspectionHelper.selectors();

    vm.prank(deployer);
    address facet = registry.createFacet(salt, creationCode, selectors);

    assertTrue(registry.hasFacet(facet));
    assertTrue(registry.facets().length == 1);
    assertTrue(
      registry.facetSelectors(facet).length == cutHelper.selectors().length
    );
  }

  function test_deployDiamond()
    external
    givenFacetIsAdded(cut, cutHelper.selectors())
    givenFacetIsAdded(loupe, loupeHelper.selectors())
    givenFacetIsAdded(introspection, introspectionHelper.selectors())
  {
    FacetCut[] memory cuts = new FacetCut[](3);

    cuts[0] = registry.createFacetCut(cut, FacetCutAction.Add);
    cuts[1] = registry.createFacetCut(loupe, FacetCutAction.Add);
    cuts[2] = registry.createFacetCut(introspection, FacetCutAction.Add);

    // initialization can be deployed as a separate contract
    address[] memory addresses = new address[](3);
    bytes[] memory datas = new bytes[](3);
    addresses[0] = cut;
    addresses[1] = loupe;
    addresses[2] = introspection;

    datas[0] = cutHelper.makeInitData("");
    datas[1] = loupeHelper.makeInitData("");
    datas[2] = introspectionHelper.makeInitData("");

    Diamond.InitParams memory params = Diamond.InitParams({
      baseFacets: cuts,
      init: address(multiInit),
      initData: abi.encodeWithSelector(
        MultiInit.multiInit.selector,
        addresses,
        datas
      )
    });

    vm.prank(deployer);
    address newDiamond = factory.createDiamond(params);

    assertTrue(
      IERC165(newDiamond).supportsInterface(type(IDiamondLoupe).interfaceId)
    );
  }
}
