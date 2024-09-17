// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// interfaces
import {IRiverConfig} from "contracts/src/river/registry/facets/config/IRiverConfig.sol";

// libraries

// contracts
import {Interaction} from "contracts/scripts/common/Interaction.s.sol";

contract InteractRiverRegistry is Interaction {
  function __interact(address deployer) internal override {
    address riverRegistry = getDeployment("riverRegistry");

    uint64[] memory chains = new uint64[](13);
    chains[0] = 85432;
    chains[1] = 11155111;
    chains[2] = 550;
    chains[3] = 6524490;
    chains[4] = 8453;
    chains[5] = 84532;
    chains[6] = 137;
    chains[7] = 42161;
    chains[8] = 10;
    chains[9] = 31337;
    chains[10] = 31338;
    chains[11] = 100;
    chains[12] = 10200;

    vm.startBroadcast(deployer);
    IRiverConfig(riverRegistry).setConfiguration(
      "xchain.blockchains",
      0,
      abi.encode(chains)
    );
    vm.stopBroadcast();
  }
}
