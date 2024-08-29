// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces

//libraries

//contracts
import {EntitlementRegistry} from "contracts/src/entitlements/EntitlementRegistry.sol";
import {EntitlementProxy} from "contracts/src/entitlements/proxy/EntitlementProxy.sol";
import {SimpleEntitlement} from "contracts/src/entitlements/modules/SimpleEntitlement.sol";

contract EntitlementRegistryTest is TestUtils {
  EntitlementRegistry registry;
  SimpleEntitlement simpleEntitlement;
  EntitlementProxy entitlementProxy;

  bytes4 constant SIMPLE_ENTITLEMENT_ID =
    bytes4(keccak256("SimpleEntitlement"));

  function setUp() external {
    registry = new EntitlementRegistry();
    simpleEntitlement = new SimpleEntitlement();
  }

  modifier givenEntitlementModuleIsRegistered() {
    vm.prank(_randomAddress());
    registry.registerEntitlementModule(
      SIMPLE_ENTITLEMENT_ID,
      address(simpleEntitlement)
    );
    _;
  }

  function test_registerEntitlementModule()
    external
    givenEntitlementModuleIsRegistered
  {
    assertEq(
      registry.getEntitlementModule(SIMPLE_ENTITLEMENT_ID),
      address(simpleEntitlement)
    );
  }

  function test_deployEntitlementProxy()
    external
    givenEntitlementModuleIsRegistered
  {
    // Deploy a new EntitlementProxy, pointing to the registry and the SimpleEntitlement module
    EntitlementProxy simpleEntitlementProxy = new EntitlementProxy(
      address(registry),
      EntitlementRegistry.getEntitlementModule.selector,
      SIMPLE_ENTITLEMENT_ID
    );

    // Generate a random address to use for testing
    address randomAddress = _randomAddress();

    // Set the random address as entitled using the proxy
    SimpleEntitlement(address(simpleEntitlementProxy)).setEntitled(
      randomAddress,
      true
    );

    // Create an array with the random address for the isEntitled check
    address[] memory users = new address[](1);
    users[0] = randomAddress;

    // Verify that the address is entitled through the proxy
    assertTrue(
      SimpleEntitlement(address(simpleEntitlementProxy)).isEntitled(users)
    );

    // Verify that the address is NOT entitled in the original SimpleEntitlement contract
    // This proves that the proxy is working independently
    assertFalse(simpleEntitlement.isEntitled(users));
  }
}
