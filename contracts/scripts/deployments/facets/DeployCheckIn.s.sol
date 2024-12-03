// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {CheckInFacet} from "contracts/src/tokens/checkin/CheckInFacet.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";

contract DeployCheckIn is FacetHelper, Deployer {
  constructor() {
    addSelector(CheckInFacet.checkIn.selector);
    addSelector(CheckInFacet.getStreak.selector);
    addSelector(CheckInFacet.getLastCheckIn.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return CheckInFacet.__CheckIn_init.selector;
  }

  function versionName() public pure override returns (string memory) {
    return "checkInFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    CheckInFacet checkIn = new CheckInFacet();
    vm.stopBroadcast();
    return address(checkIn);
  }
}
