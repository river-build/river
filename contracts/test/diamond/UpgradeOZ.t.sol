// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces
import {IDiamondCut} from "@river-build/diamond/src/facets/cut/IDiamondCut.sol";
import {IDiamond} from "@river-build/diamond/src/Diamond.sol";

//libraries

//contracts
import {DeployDiamond} from "contracts/scripts/deployments/utils/DeployDiamond.s.sol";
import {DeployMockFacet} from "contracts/test/mocks/MockFacet.sol";
import {DiamondHelper} from "contracts/test/diamond/Diamond.t.sol";
import {DiamondCutFacet} from "contracts/src/diamond/facets/cut/DiamondCutFacet.sol";

// deployments
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {DiamondHelper} from "contracts/test/diamond/Diamond.t.sol";
import {FacetHelper} from "@river-build/diamond/scripts/common/helpers/FacetHelper.s.sol";

contract UpgradeOZTest is TestUtils, IDiamond {
  DeployDiamond diamondHelper = new DeployDiamond();
  DeployMockFacet mockFacetHelper = new DeployMockFacet();
  DeployDiamondCut diamondCutHelper = new DeployDiamondCut();

  address deployer;

  address diamond;
  address mockFacet;

  function setUp() external {
    deployer = getDeployer();
    diamond = diamondHelper.deploy(deployer);
    mockFacet = mockFacetHelper.deploy(deployer);
  }

  function test_upgradeDiamondCutFacet() public {
    diamondHelper = new DeployDiamond();

    address diamondCut = diamondCutHelper.deploy(deployer);

    FacetCut[] memory _cuts = new FacetCut[](1);
    _cuts[0] = diamondCutHelper.makeCut(
      diamondCut,
      IDiamond.FacetCutAction.Replace
    );

    vm.broadcast(deployer);
    IDiamondCut(diamond).diamondCut(_cuts, address(0), "");

    _cuts = new FacetCut[](1);
    _cuts[0] = mockFacetHelper.makeCut(mockFacet, IDiamond.FacetCutAction.Add);

    vm.broadcast(deployer);
    IDiamondCut(diamond).diamondCut(_cuts, address(0), "");

    mockFacetHelper = new DeployMockFacet();
    mockFacet = mockFacetHelper.deploy(deployer);
  }
}

// ------- deploys v2 of diamond cut facet -------
contract DeployDiamondCut is FacetHelper, Deployer {
  constructor() {
    addSelector(DiamondCutFacet.diamondCut.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return DiamondCutFacet.__DiamondCut_init.selector;
  }

  function versionName() public pure override returns (string memory) {
    return "diamondCutFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    DiamondCutFacet diamondCut = new DiamondCutFacet();
    vm.stopBroadcast();
    return address(diamondCut);
  }
}
