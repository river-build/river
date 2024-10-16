// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamond} from "contracts/src/diamond/IDiamond.sol";

// helpers
import {DiamondHelper} from "contracts/test/diamond/Diamond.t.sol";
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";

import {Diamond} from "contracts/src/diamond/Diamond.sol";
import {MultiInit} from "contracts/src/diamond/initializers/MultiInit.sol";

// mocks
import {ERC721AMockHelper} from "contracts/test/diamond/erc721a/ERC721ASetup.sol";
import {ERC721AHelper} from "contracts/test/diamond/erc721a/ERC721ASetup.sol";

// contracts
import {DeployDiamondCut} from "contracts/scripts/deployments/facets/DeployDiamondCut.s.sol";
import {DeployDiamondLoupe} from "contracts/scripts/deployments/facets/DeployDiamondLoupe.s.sol";
import {DeployIntrospection} from "contracts/scripts/deployments/facets/DeployIntrospection.s.sol";
import {DeployMultiInit} from "contracts/scripts/deployments/utils/DeployMultiInit.s.sol";
import {MockERC721A} from "contracts/test/mocks/MockERC721A.sol";

contract DeployMockNFT is DiamondHelper, Deployer {
  DeployDiamondCut diamondCutHelper = new DeployDiamondCut();
  DeployDiamondLoupe loupeHelper = new DeployDiamondLoupe();
  DeployIntrospection introspectionHelper = new DeployIntrospection();
  DeployMultiInit multiInitHelper = new DeployMultiInit();

  ERC721AHelper erc721aHelper = new ERC721AHelper();
  ERC721AMockHelper erc721aMockHelper = new ERC721AMockHelper();

  address diamondCut;
  address diamondLoupe;
  address introspection;
  address erc721aMock;

  function versionName() public pure override returns (string memory) {
    return "mockNFT";
  }

  function diamondInitParams(
    address deployer
  ) internal returns (Diamond.InitParams memory) {
    address multiInit = multiInitHelper.deploy(deployer);

    diamondCut = diamondCutHelper.deploy(deployer);
    diamondLoupe = loupeHelper.deploy(deployer);
    introspection = introspectionHelper.deploy(deployer);

    vm.startBroadcast(deployer);
    erc721aMock = address(new MockERC721A());
    vm.stopBroadcast();

    erc721aMockHelper.addSelectors(erc721aHelper.selectors());

    addFacet(
      diamondCutHelper.makeCut(diamondCut, IDiamond.FacetCutAction.Add),
      diamondCut,
      diamondCutHelper.makeInitData("")
    );
    addFacet(
      loupeHelper.makeCut(diamondLoupe, IDiamond.FacetCutAction.Add),
      diamondLoupe,
      loupeHelper.makeInitData("")
    );
    addFacet(
      introspectionHelper.makeCut(diamondCut, IDiamond.FacetCutAction.Add),
      introspection,
      introspectionHelper.makeInitData("")
    );
    addFacet(
      erc721aMockHelper.makeCut(erc721aMock, IDiamond.FacetCutAction.Add),
      erc721aMock,
      erc721aMockHelper.makeInitData("MockERC721A", "MERC721A")
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

  function __deploy(address deployer) public override returns (address) {
    Diamond.InitParams memory initDiamondCut = diamondInitParams(deployer);
    vm.broadcast(deployer);
    Diamond diamond = new Diamond(initDiamondCut);

    return address(diamond);
  }
}
