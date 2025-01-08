// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//interfaces
import {ITownsBase} from "contracts/src/tokens/towns/mainnet/ITowns.sol";

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {Towns} from "contracts/src/tokens/towns/mainnet/Towns.sol";

contract DeployTownsMainnet is Deployer, ITownsBase {
  address public constant vault =
    address(0x23b168657744124360d3553F3bc257f3E28cBaf9);
  address public constant manager =
    address(0x18038ee5692FCE1cc0B0b3F2D63e09639A597F94);

  function versionName() public pure override returns (string memory) {
    return "townsMainnet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.broadcast(deployer);
    return
      address(
        new Towns({
          vault: vault,
          manager: manager,
          config: InflationConfig({
            lastMintTime: 1_709_667_671, // Tuesday, March 5, 2024 7:41:11 PM
            initialInflationRate: 800,
            finalInflationRate: 200,
            inflationDecayRate: 600,
            inflationDecayInterval: 20,
            inflationReceiver: vault
          })
        })
      );
  }
}
