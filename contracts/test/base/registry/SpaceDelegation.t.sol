// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IOwnableBase} from "contracts/src/diamond/facets/ownable/IERC173.sol";
import {ISpaceDelegationBase} from "contracts/src/base/registry/facets/delegation/ISpaceDelegation.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contracts
import {SpaceDelegationFacet} from "contracts/src/base/registry/facets/delegation/SpaceDelegationFacet.sol";
import {BaseRegistryTest} from "./BaseRegistry.t.sol";

contract SpaceDelegationTest is
  BaseRegistryTest,
  IOwnableBase,
  ISpaceDelegationBase
{
  using EnumerableSet for EnumerableSet.AddressSet;

  SpaceDelegationFacet internal spaceDelegation;
  EnumerableSet.AddressSet internal spaceSet;
  EnumerableSet.AddressSet internal operatorSet;

  function setUp() public override {
    super.setUp();
    spaceDelegation = SpaceDelegationFacet(baseRegistry);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       ADD DELEGATION                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_addSpaceDelegation_revertIf_invalidSpace() public {
    vm.expectRevert(SpaceDelegation__InvalidSpace.selector);
    spaceDelegation.addSpaceDelegation(address(this), address(0));
  }

  function test_fuzz_addSpaceDelegation(
    address operator
  ) public givenOperator(operator, 0) returns (address space) {
    space = deploySpace(deployer);

    vm.prank(deployer);
    spaceDelegation.addSpaceDelegation(space, operator);

    address assignedOperator = spaceDelegation.getSpaceDelegation(space);
    assertEq(assignedOperator, operator, "Space delegation failed");
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                      REMOVE DELEGATION                     */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_removeSpaceDelegation_revertIf_invalidSpace() public {
    vm.expectRevert(SpaceDelegation__InvalidSpace.selector);
    spaceDelegation.removeSpaceDelegation(address(0));
  }

  function test_fuzz_removeSpaceDelegation(
    address operator
  ) public givenOperator(operator, 0) {
    address space = test_fuzz_addSpaceDelegation(operator);

    vm.prank(deployer);
    spaceDelegation.removeSpaceDelegation(space);

    address afterRemovalOperator = spaceDelegation.getSpaceDelegation(space);
    assertEq(afterRemovalOperator, address(0), "Space removal failed");
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           GETTERS                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_fuzz_getSpaceDelegationsByOperator(address operator) public {
    address space1 = test_fuzz_addSpaceDelegation(operator);
    address space2 = test_fuzz_addSpaceDelegation(operator);

    address[] memory spaces = spaceDelegation.getSpaceDelegationsByOperator(
      operator
    );

    assertEq(spaces.length, 2);
    assertEq(spaces[0], space1);
    assertEq(spaces[1], space2);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           SETTERS                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_setRiverToken_revertIf_notOwner() public {
    vm.expectRevert(
      abi.encodeWithSelector(Ownable__NotOwner.selector, address(this))
    );
    spaceDelegation.setRiverToken(address(0));
  }

  function test_fuzz_setRiverToken(address newToken) public {
    vm.assume(newToken != address(0));

    vm.expectEmit(address(spaceDelegation));
    emit RiverTokenChanged(newToken);

    vm.prank(deployer);
    spaceDelegation.setRiverToken(newToken);

    address retrievedToken = spaceDelegation.riverToken();
    assertEq(retrievedToken, newToken);
  }

  function test_fuzz_setSpaceFactory_revertIf_notOwner() public {
    vm.expectRevert(
      abi.encodeWithSelector(Ownable__NotOwner.selector, address(this))
    );
    spaceDelegation.setSpaceFactory(address(0));
  }

  function test_fuzz_setSpaceFactory(address newSpaceFactory) public {
    vm.assume(newSpaceFactory != address(0));

    vm.prank(deployer);
    spaceDelegation.setSpaceFactory(newSpaceFactory);

    address retrievedFactory = spaceDelegation.getSpaceFactory();
    assertEq(retrievedFactory, newSpaceFactory);
  }
}
