// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";
import {DropFacet} from "contracts/src/diamond/facets/drop/DropFacet.sol";

contract DeployDropFacet is Deployer, FacetHelper {
  // FacetHelper
  constructor() {
    addSelector(DropFacet.claim.selector);
    addSelector(DropFacet.setClaimConditions.selector);
    addSelector(DropFacet.getActiveClaimConditionId.selector);
    addSelector(DropFacet.getClaimConditionById.selector);
    addSelector(DropFacet.getSupplyClaimedByWallet.selector);
  }

  // Deploying
  function versionName() public pure override returns (string memory) {
    return "dropFacet";
  }

  function initializer() public pure override returns (bytes4) {
    return DropFacet.__DropFacet_init.selector;
  }

  function makeInitData(address claimToken) public pure returns (bytes memory) {
    return abi.encodeWithSelector(initializer(), claimToken);
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    DropFacet dropFacet = new DropFacet();
    vm.stopBroadcast();
    return address(dropFacet);
  }
}
