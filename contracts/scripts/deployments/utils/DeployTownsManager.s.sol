// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//interfaces
import {ITownsBase} from "contracts/src/tokens/towns/mainnet/ITowns.sol";

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {TownsManager} from "contracts/src/tokens/towns/mainnet/TownsManager.sol";

contract DeployTownsManager is Deployer {
  address public constant association =
    address(0x6C373dB26926a0575f70369aAE2cBfC0E88218DC);

  function versionName() public pure override returns (string memory) {
    return "townsManager";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.broadcast(deployer);
    return address(new TownsManager(association, association));
  }
}
