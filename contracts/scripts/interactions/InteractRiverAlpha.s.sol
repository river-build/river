// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondCut} from "contracts/src/diamond/facets/cut/IDiamondCut.sol";

// libraries

// contracts
import {AlphaHelper} from "contracts/scripts/interactions/helpers/AlphaHelper.sol";

import {DeployRiverRegistry} from "contracts/scripts/deployments/diamonds/DeployRiverRegistry.s.sol";

contract InteractRiverAlpha is AlphaHelper {
  DeployRiverRegistry deployRiverRegistry = new DeployRiverRegistry();

  function __interact(address deployer) internal override {
    vm.setEnv("OVERRIDE_DEPLOYMENTS", "1");
    address riverRegistry = getDeployment("riverRegistry");

    removeRemoteFacets(deployer, riverRegistry);

    FacetCut[] memory newCuts;

    deployRiverRegistry.diamondInitParams(deployer);
    newCuts = deployRiverRegistry.getCuts();
    vm.broadcast(deployer);
    IDiamondCut(riverRegistry).diamondCut(newCuts, address(0), "");
  }
}
