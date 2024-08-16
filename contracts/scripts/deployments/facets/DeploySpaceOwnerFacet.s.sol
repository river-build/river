// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";

import {SpaceOwner} from "contracts/src/spaces/facets/owner/SpaceOwner.sol";
import {ERC721AHelper} from "contracts/test/diamond/erc721a/ERC721ASetup.sol";
import {VotesHelper} from "contracts/test/governance/votes/VotesSetup.sol";

contract DeploySpaceOwnerFacet is FacetHelper, Deployer {
  ERC721AHelper erc721aHelper = new ERC721AHelper();
  VotesHelper votesHelper = new VotesHelper();

  constructor() {
    addSelector(SpaceOwner.setFactory.selector);
    addSelector(SpaceOwner.getFactory.selector);
    addSelector(SpaceOwner.setDefaultUri.selector);
    addSelector(SpaceOwner.getDefaultUri.selector);
    addSelector(SpaceOwner.nextTokenId.selector);
    addSelector(SpaceOwner.mintSpace.selector);
    addSelector(SpaceOwner.getSpaceInfo.selector);
    addSelector(SpaceOwner.updateSpaceInfo.selector);
    addSelectors(erc721aHelper.selectors());
    addSelectors(votesHelper.selectors());
  }

  function initializer() public pure override returns (bytes4) {
    return SpaceOwner.__SpaceOwner_init.selector;
  }

  function makeInitData(
    string memory name,
    string memory symbol,
    string memory version
  ) public pure returns (bytes memory) {
    return abi.encodeWithSelector(initializer(), name, symbol, version);
  }

  function versionName() public pure override returns (string memory) {
    return "SpaceOwner";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    SpaceOwner facet = new SpaceOwner();
    vm.stopBroadcast();
    return address(facet);
  }
}
