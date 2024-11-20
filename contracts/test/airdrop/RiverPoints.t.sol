// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {DeployRiverAirdrop} from "contracts/scripts/deployments/diamonds/DeployRiverAirdrop.s.sol";

//interfaces
import {IDiamond} from "contracts/src/diamond/Diamond.sol";
import {IOwnableBase} from "contracts/src/diamond/facets/ownable/IERC173.sol";

//libraries

// contracts
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";
import {River} from "contracts/src/tokens/river/base/River.sol";
import {RiverPoints} from "contracts/src/tokens/points/RiverPoints.sol";

contract RiverPointsTest is BaseSetup, IOwnableBase, IDiamond {
  DeployRiverAirdrop internal dropHelper = new DeployRiverAirdrop();

  River internal river;
  RiverPoints internal pointsFacet;

  function setUp() public override {
    super.setUp();

    // Add the Drop facet to its own diamond
    dropHelper.setSpaceFactory(spaceFactory);
    dropHelper.setStakingContract(baseRegistry);
    address diamond = dropHelper.deploy(deployer);

    pointsFacet = RiverPoints(diamond);
    river = River(riverToken);
  }

  function test_approve_reverts() public {
    vm.expectRevert(IDiamond.Diamond_UnsupportedFunction.selector);
    pointsFacet.approve(_randomAddress(), 1 ether);
  }

  function test_transfer_reverts() public {
    vm.expectRevert(IDiamond.Diamond_UnsupportedFunction.selector);
    pointsFacet.transfer(_randomAddress(), 1 ether);
  }

  function test_transferFrom_reverts() public {
    vm.expectRevert(IDiamond.Diamond_UnsupportedFunction.selector);
    pointsFacet.transferFrom(_randomAddress(), address(this), 1 ether);
  }

  function test_mint_revertIf_invalidSpace() public {
    vm.expectRevert(RiverPoints.RiverPoints__InvalidSpace.selector);
    pointsFacet.mint(_randomAddress(), 1 ether);
  }

  function test_fuzz_mint(address to, uint256 value) public {
    vm.assume(to != address(0));
    vm.prank(space);
    pointsFacet.mint(to, value);
  }

  function test_batchMintPoints_revertIf_invalidArrayLength() public {
    vm.prank(deployer);
    vm.expectRevert(RiverPoints.RiverPoints__InvalidArrayLength.selector);
    pointsFacet.batchMintPoints(new address[](1), new uint256[](2));
  }

  function test_batchMintPoints_revertIf_notOwner() public {
    vm.expectRevert(
      abi.encodeWithSelector(Ownable__NotOwner.selector, address(this))
    );
    pointsFacet.batchMintPoints(new address[](1), new uint256[](1));
  }

  //  function test_fuzz_batchMintPoints(
  //    address[32] calldata accounts,
  //    uint256[32] calldata values
  //  ) public {
  //    vm.prank(deployer);
  //    pointsFacet.batchMintPoints(toDyn(accounts), values);
  //  }
}
