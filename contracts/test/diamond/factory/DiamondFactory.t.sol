// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {DiamondFactorySetup} from "contracts/test/diamond/factory/DiamondFactorySetup.sol";

//interfaces
import {IDiamondFactoryBase} from "contracts/src/diamond/facets/factory/IDiamondFactory.sol";
import {IDiamond} from "contracts/src/diamond/Diamond.sol";
import {IDiamondLoupe} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";
import {IERC165} from "contracts/src/diamond/facets/introspection/IERC165.sol";

//libraries

//contracts
import {Diamond} from "contracts/src/diamond/Diamond.sol";

// helpers
import {DeployIntrospection} from "contracts/scripts/deployments/facets/DeployIntrospection.s.sol";
import {DeployDiamondLoupe} from "contracts/scripts/deployments/facets/DeployDiamondLoupe.s.sol";
import {MultiInit} from "contracts/src/diamond/initializers/MultiInit.sol";

contract DiamondFactoryTest is
  IDiamondFactoryBase,
  IDiamond,
  DiamondFactorySetup
{
  DeployIntrospection introspectionHelper = new DeployIntrospection();
  DeployDiamondLoupe loupeHelper = new DeployDiamondLoupe();

  address loupe;
  address introspection;
  address multiInit;

  function setUp() public override {
    super.setUp();

    loupe = loupeHelper.deploy();
    introspection = introspectionHelper.deploy();
    multiInit = address(new MultiInit());
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
    address expectedAddress = _calculateDeploymentAddress(
      abi.encodePacked(type(Diamond).creationCode, abi.encode(params)),
      keccak256(abi.encodePacked(caller, block.timestamp))
    );

    vm.prank(caller);
    vm.expectEmit(address(factory));
    emit DiamondCreated(expectedAddress, caller);
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

  // =============================================================
  //                          HELPERS
  // =============================================================
  function _calculateDeploymentAddress(
    bytes memory initCode,
    bytes32 salt
  ) internal view returns (address) {
    return
      address(
        uint160(
          uint256(
            keccak256(
              abi.encodePacked(
                hex"ff",
                address(factory),
                salt,
                keccak256(initCode)
              )
            )
          )
        )
      );
  }
}
