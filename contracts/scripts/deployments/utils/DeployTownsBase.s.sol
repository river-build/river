// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {Towns} from "contracts/src/tokens/towns/base/Towns.sol";
import {TownsDeployer} from "contracts/src/tokens/towns/base/TownsDeployer.sol";

contract DeployTownsBase is Deployer {
  address public l1Token;

  function versionName() public pure override returns (string memory) {
    return "towns";
  }

  function __deploy(address deployer) public override returns (address) {
    l1Token = _getToken();

    vm.startBroadcast(deployer);
    address implementation = address(new Towns());
    TownsDeployer tokenDeployer = new TownsDeployer();
    address proxy = tokenDeployer.deploy(
      implementation,
      l1Token,
      keccak256(abi.encodePacked(deployer, implementation, tokenDeployer))
    );
    vm.stopBroadcast();

    return proxy;
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
