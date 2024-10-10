// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {DeployRiverBase} from "contracts/scripts/deployments/utils/DeployRiverBase.s.sol";
import {DelegationProxy} from "contracts/src/base/registry/facets/distribution/v2/DelegationProxy.sol";

contract DelegationProxyTest is Test {
  DeployRiverBase internal deployRiverTokenBase = new DeployRiverBase();
  address internal river;

  function setUp() public {
    river = deployRiverTokenBase.deploy(address(this));
  }

  function test_fuzz_delegationProxy(address delegatee) public {
    DelegationProxy proxy = new DelegationProxy(river, delegatee);
    assertEq(ERC20Votes(river).delegates(address(proxy)), delegatee);
    assertEq(
      ERC20Votes(river).allowance(address(proxy), address(this)),
      type(uint256).max
    );
  }

  function test_fuzz_redelegate_revertIf_notFactory(address caller) public {
    vm.assume(caller != address(this));
    DelegationProxy proxy = new DelegationProxy(river, address(this));
    vm.prank(caller);
    vm.expectRevert();
    proxy.redelegate(address(this));
  }

  function test_fuzz_redelegate(
    address delegatee,
    address newDelegatee
  ) public {
    vm.assume(delegatee != newDelegatee);
    DelegationProxy proxy = new DelegationProxy(river, delegatee);
    proxy.redelegate(newDelegatee);
    assertEq(ERC20Votes(river).delegates(address(proxy)), newDelegatee);
  }
}
