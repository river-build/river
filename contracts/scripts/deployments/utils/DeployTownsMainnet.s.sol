// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//interfaces
import {ITownsBase} from "contracts/src/tokens/towns/mainnet/ITowns.sol";

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {Towns} from "contracts/src/tokens/towns/mainnet/Towns.sol";

import {DeployTownsManager} from "./DeployTownsManager.s.sol";

contract DeployTownsMainnet is Deployer, ITownsBase {
  DeployTownsManager internal townsManager = new DeployTownsManager();

  address public constant vault =
    address(0xD6ab6aA22D7cD09e18A923192a20F9c82331d1CB);

  function inflationConfig() public pure returns (InflationConfig memory) {
    return
      InflationConfig({
        /// @dev initialInflationRate is the initial inflation rate in basis points (0-10000)
        initialInflationRate: 800,
        /// @dev finalInflationRate is the final inflation rate in basis points (0-10000)
        finalInflationRate: 200,
        /// @dev inflationDecreaseRate is the rate at which the inflation rate decreases in basis points (0-10000)
        inflationDecreaseRate: 600,
        /// @dev inflationDecreaseInterval is the interval at which the inflation rate decreases in years
        inflationDecreaseInterval: 20
      });
  }

  function versionName() public pure override returns (string memory) {
    return "townsMainnet";
  }

  function __deploy(address deployer) public override returns (address) {
    address manager = townsManager.deploy(deployer);

    vm.startBroadcast(deployer);
    address towns = address(
      new Towns({
        vault: vault,
        manager: manager,
        mintTime: 1709667671, // 2024-03-01
        inflationConfig: inflationConfig()
      })
    );
    vm.stopBroadcast();

    return towns;
  }
}
