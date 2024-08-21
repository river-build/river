// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondCut} from "contracts/src/diamond/facets/cut/IDiamondCut.sol";
import {IDiamondLoupe, IDiamondLoupeBase} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";
import {EntitlementGated} from "contracts/src/spaces/facets/gated/EntitlementGated.sol";

// libraries
// debuggging
import {console} from "forge-std/console.sol";

// contracts
import {Interaction} from "contracts/scripts/common/Interaction.s.sol";
import {DiamondHelper} from "contracts/test/diamond/Diamond.t.sol";

import {DeployEntitlementGated} from "contracts/scripts/deployments/facets/DeployEntitlementGated.s.sol";

contract InteractSpace is Interaction, DiamondHelper, IDiamondLoupeBase {
  DeployEntitlementGated deployEntitlementGated = new DeployEntitlementGated();

  function __interact(address deployer) internal override {
    address space = getDeployment("space");

    Facet[] memory facets = IDiamondLoupe(space).facets();

    for (uint256 i = 0; i < facets.length; i++) {
      console.log("facet", facets[i].facet);
    }

    // address facet = IDiamondLoupe(space).facetAddress(
    //   EntitlementGated.postEntitlementCheckResult.selector
    // );

    // console.log("facet", facet);

    // address entitlementGated = deployEntitlementGated.deploy(deployer);

    // addCut(
    //   FacetCut({
    //     facetAddress: entitlementGated,
    //     action: FacetCutAction.Add,
    //     functionSelectors: deployEntitlementGated.selectors()
    //   })
    // );

    // vm.broadcast(deployer);
    // IDiamondCut(space).diamondCut(baseFacets(), address(0), "");
  }
}
