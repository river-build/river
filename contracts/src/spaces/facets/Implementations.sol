// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IImplementationRegistry} from "contracts/src/factory/facets/registry/IImplementationRegistry.sol";

// libraries

// contracts
import {MembershipStorage} from "contracts/src/spaces/facets/membership/MembershipStorage.sol";

library Implementations {
  bytes32 internal constant APP_REGISTRY = bytes32("AppRegistry");

  function appRegistry() internal view returns (address) {
    return
      IImplementationRegistry(MembershipStorage.layout().spaceFactory)
        .getLatestImplementation(APP_REGISTRY);
  }
}
