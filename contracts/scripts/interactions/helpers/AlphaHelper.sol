// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondLoupe, IDiamondLoupeBase} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";
import {IDiamondCut} from "contracts/src/diamond/facets/cut/IDiamondCut.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC173} from "contracts/src/diamond/facets/ownable/IERC173.sol";
import {IOwnablePending} from "contracts/src/diamond/facets/ownable/pending/IOwnablePending.sol";

import {Diamond} from "contracts/src/diamond/Diamond.sol";
import {DiamondHelper} from "contracts/test/diamond/Diamond.t.sol";

// libraries

// contracts
import {Interaction} from "contracts/scripts/common/Interaction.s.sol";

abstract contract AlphaHelper is Interaction, DiamondHelper, IDiamondLoupeBase {
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
    address ownable = IDiamondLoupe(diamond).facetAddress(
      IERC173.owner.selector
    );
    address ownablePending = IDiamondLoupe(diamond).facetAddress(
      IOwnablePending.currentOwner.selector
    );

    for (uint256 i; i < facets.length; i++) {
      if (
        facets[i].facet == diamondCut ||
        facets[i].facet == diamondLoupe ||
        facets[i].facet == introspection ||
        facets[i].facet == ownable ||
        facets[i].facet == ownablePending
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
