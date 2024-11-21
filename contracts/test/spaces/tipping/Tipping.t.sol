// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITipping} from "contracts/src/spaces/facets/tipping/ITipping.sol";
// libraries

// contracts
import {Tipping} from "contracts/src/spaces/facets/tipping/Tipping.sol";
import {IntrospectionFacet} from "contracts/src/diamond/facets/introspection/IntrospectionFacet.sol";

// helpers
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";

contract TippingTest is BaseSetup {
  Tipping internal tipping;
  IntrospectionFacet internal introspection;

  function setUp() public override {
    super.setUp();
    tipping = Tipping(everyoneSpace);
    introspection = IntrospectionFacet(everyoneSpace);
  }

  function test_supportsInterface() external view {
    assertTrue(introspection.supportsInterface(type(ITipping).interfaceId));
  }

  function test_tip() external {}
}
