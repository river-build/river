// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces
import {IDiamondCut} from "@river-build/diamond/src/facets/cut/IDiamondCut.sol";
import {IDiamond} from "@river-build/diamond/src/Diamond.sol";
//libraries

//contracts
import {Interaction} from "../common/Interaction.s.sol";
import {DiamondHelper} from "contracts/test/diamond/Diamond.t.sol";

// facet
import {DeployTipping} from "contracts/scripts/deployments/facets/DeployTipping.s.sol";

contract InteractDiamondCut is Interaction, DiamondHelper {
  DeployTipping tippingFacetHelper = new DeployTipping();

  function __interact(address deployer) internal override {
    address diamond = getDeployment("space");

    address tippingFacet = tippingFacetHelper.deploy(deployer);

    addCut(
      tippingFacetHelper.makeCut(tippingFacet, IDiamond.FacetCutAction.Replace)
    );

    vm.broadcast(deployer);
    IDiamondCut(diamond).diamondCut(_cuts, address(0), "");
  }
}
