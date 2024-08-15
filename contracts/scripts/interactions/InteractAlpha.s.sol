// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondLoupe, IDiamondLoupeBase} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";
import {IDiamondCut} from "contracts/src/diamond/facets/cut/IDiamondCut.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {Diamond} from "contracts/src/diamond/Diamond.sol";
import {DiamondHelper} from "contracts/test/diamond/Diamond.t.sol";

// libraries

// contracts
import {Interaction} from "contracts/scripts/common/Interaction.s.sol";

import {DeploySpace} from "contracts/scripts/deployments/diamonds/DeploySpace.s.sol";
import {DeploySpaceFactory} from "contracts/scripts/deployments/diamonds/DeploySpaceFactory.s.sol";

contract InteractAlpha is Interaction, DiamondHelper, IDiamondLoupeBase {
  DeploySpace deploySpace = new DeploySpace();
  DeploySpaceFactory deploySpaceFactory = new DeploySpaceFactory();

  function __interact(address deployer) internal override {
    address space = getDeployment("space");
    address spaceFactory = getDeployment("spaceFactory");

    removeRemoteFacets(deployer, space);
    removeRemoteFacets(deployer, spaceFactory);

    // Deploy Space
    deploySpace.diamondInitParams(deployer);
    FacetCut[] memory newCuts = deploySpace.getCuts();
    vm.broadcast(deployer);
    IDiamondCut(space).diamondCut(newCuts, address(0), "");

    // Deploy Space Factory
    deploySpaceFactory.diamondInitParams(deployer);
    newCuts = deploySpaceFactory.getCuts();
    vm.broadcast(deployer);
    IDiamondCut(spaceFactory).diamondCut(newCuts, address(0), "");
  }

  function removeRemoteFacets(address deployer, address diamond) internal {
    Facet[] memory facets = IDiamondLoupe(diamond).facets();

    address diamondCut = IDiamondLoupe(diamond).facetAddress(
      IDiamondCut.diamondCut.selector
    );
    address diamondLoupe = IDiamondLoupe(diamond).facetAddress(
      IDiamondLoupe.facets.selector
    );
    address introspection = IDiamondLoupe(diamond).facetAddress(
      IERC165.supportsInterface.selector
    );

    for (uint256 i; i < facets.length; i++) {
      if (
        facets[i].facet == diamondCut ||
        facets[i].facet == diamondLoupe ||
        facets[i].facet == introspection
      ) {
        info("Skipping facet: %s", facets[i].facet);
        continue;
      }

      addCut(
        FacetCut({
          facetAddress: facets[i].facet,
          action: FacetCutAction.Remove,
          functionSelectors: facets[i].selectors
        })
      );
    }

    vm.broadcast(deployer);
    IDiamondCut(diamond).diamondCut(baseFacets(), address(0), "");

    clearCuts();
  }
}
