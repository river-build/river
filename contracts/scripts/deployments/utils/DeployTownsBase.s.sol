// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//interfaces
import {ITownsDeployer} from "contracts/src/tokens/towns/base/ITownsDeployer.sol";

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {TownsDeployer} from "contracts/src/tokens/towns/base/TownsDeployer.sol";
import {MockTownsDeployer} from "contracts/test/mocks/MockTownsDeployer.sol";
import {TownsDeployer} from "contracts/src/tokens/towns/base/TownsDeployer.sol";

contract DeployTownsBase is Deployer {
  address public l1Token;

  function versionName() public pure override returns (string memory) {
    return "towns";
  }

  function __deploy(address deployer) public override returns (address) {
    l1Token = _getToken();

    address deployerImplementation = _getImplementation(deployer);
    ITownsDeployer tokenDeployer = ITownsDeployer(deployerImplementation);

    vm.startBroadcast(deployer);
    address proxy = tokenDeployer.deploy(
      l1Token,
      deployer,
      keccak256(
        abi.encodePacked(
          deployer,
          deployerImplementation,
          "TownsImplementation"
        )
      ),
      keccak256(
        abi.encodePacked(deployer, deployerImplementation, "TownsDeployerProxy")
      )
    );
    vm.stopBroadcast();

    return proxy;
  }

  function _getImplementation(
    address deployer
  ) internal returns (address implementation) {
    vm.startBroadcast(deployer);
    if (block.chainid == 31337 || block.chainid == 31338) {
      implementation = address(new MockTownsDeployer());
    } else {
      implementation = address(new TownsDeployer());
    }
    vm.stopBroadcast();
  }

  function _getToken() internal view returns (address) {
    if (block.chainid == 8453) {
      // if deploying to base use mainnet token
      return 0x000000Fa00b200406de700041CFc6b19BbFB4d13;
    } else if (block.chainid == 84532) {
      // if deploying to base-sepolia use sepolia token
      return 0xfc85ff424F1b55fB3f9e920A47EC7255488C3bA3;
    } else if (block.chainid == 31337 || block.chainid == 31338) {
      // if deploying locally use base-sepolia token
      return 0xfc85ff424F1b55fB3f9e920A47EC7255488C3bA3;
    } else {
      revert("Invalid chain");
    }
  }
}
