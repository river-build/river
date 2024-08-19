// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IERC173} from "contracts/src/diamond/facets/ownable/IERC173.sol";

// libraries

// contracts
import {Interaction} from "../common/Interaction.s.sol";

contract InteractTransferOwnership is Interaction {
  function __interact(address deployer) internal override {
    address registry = getDeployment("riverRegistry");
    address newOwner = 0x92D549e96C470573b2af464F4E4A865C46C6D728;

    vm.startBroadcast(deployer);
    IERC173(registry).transferOwnership(newOwner);
    vm.stopBroadcast();
  }
}
