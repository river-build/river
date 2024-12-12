// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";

import {StreamRegistry} from "contracts/src/river/registry/facets/stream/StreamRegistry.sol";

contract DeployStreamRegistry is FacetHelper, Deployer {
  constructor() {
    // addSelector(StreamRegistry.getStreams.selector);
    // addSelector(StreamRegistry.getStreamByIndex.selector);

    addSelector(StreamRegistry.allocateStream.selector);
    addSelector(StreamRegistry.getStream.selector);
    addSelector(StreamRegistry.getStreamWithGenesis.selector);
    addSelector(StreamRegistry.setStreamLastMiniblock.selector);
    addSelector(StreamRegistry.setStreamLastMiniblockBatch.selector); // reduce to only this
    addSelector(StreamRegistry.placeStreamOnNode.selector); // future
    addSelector(StreamRegistry.removeStreamFromNode.selector);
    addSelector(StreamRegistry.getStreamCount.selector); // monitoring
    addSelector(StreamRegistry.getPaginatedStreams.selector); // only interested for stream on a single node
    // addSelector(StreamRegistry.getAllStreamIds.selector);
    // addSelector(StreamRegistry.getAllStreams.selector);
    // addSelector(StreamRegistry.getStreamsOnNode.selector);
    // addSelector(StreamRegistry.getStreamCountOnNode.selector);
  }

  function versionName() public pure override returns (string memory) {
    return "streamRegistryFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    StreamRegistry facet = new StreamRegistry();
    vm.stopBroadcast();
    return address(facet);
  }
}
