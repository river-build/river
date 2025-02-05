// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//interfaces

//libraries
import {Create2Utils} from "contracts/src/utils/Create2Utils.sol";

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {TownsDeployer} from "contracts/src/tokens/towns/base/TownsDeployer.sol";
import {MockTownsDeployer} from "contracts/test/mocks/MockTownsDeployer.sol";
import {TownsDeployer} from "contracts/src/tokens/towns/base/TownsDeployer.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {Towns} from "contracts/src/tokens/towns/base/Towns.sol";
import {MockTowns} from "contracts/test/mocks/MockTowns.sol";

contract DeployTownsBase is Deployer {
  address public l1Token;
  bytes32 public implSalt;
  bytes32 public proxySalt;

  function versionName() public pure override returns (string memory) {
    return "towns";
  }

  function __deploy(address deployer) public override returns (address) {
    l1Token = _getToken();

    (implSalt, proxySalt) = _getSalts();
    address proxy = _proxyAddress(
      _implAddress(implSalt),
      proxySalt,
      l1Token,
      deployer
    );

    vm.startBroadcast(deployer);
    if (isAnvil()) {
      new MockTownsDeployer(l1Token, deployer, implSalt, proxySalt);
    } else {
      new TownsDeployer(l1Token, deployer, implSalt, proxySalt);
    }
    vm.stopBroadcast();

    return proxy;
  }

  function _implAddress(bytes32 salt) internal view returns (address impl) {
    if (isAnvil()) {
      impl = Create2Utils.computeCreate2Address(
        salt,
        type(MockTowns).creationCode
      );
    } else {
      impl = Create2Utils.computeCreate2Address(salt, type(Towns).creationCode);
    }
  }

  function _proxyAddress(
    address impl,
    bytes32 salt,
    address remoteToken,
    address owner
  ) internal pure returns (address proxy) {
    bytes memory byteCode = abi.encodePacked(
      type(ERC1967Proxy).creationCode,
      abi.encode(
        impl,
        abi.encodePacked(
          Towns.initialize.selector,
          abi.encode(remoteToken, owner)
        )
      )
    );

    proxy = Create2Utils.computeCreate2Address(salt, byteCode);
  }

  function setSalts(bytes32 impl, bytes32 proxy) public {
    implSalt = impl;
    proxySalt = proxy;
  }

  function _getSalts() internal view returns (bytes32 impl, bytes32 proxy) {
    if (implSalt != bytes32(0) && proxySalt != bytes32(0)) {
      return (implSalt, proxySalt);
    }

    if (isAnvil()) {
      impl = 0x4e59b44847b379578588920ca78fbf26c0b4956c346fdfc0a289d4a53c0000c0;
      proxy = 0x4e59b44847b379578588920ca78fbf26c0b4956c83c2f2967966f90700000000;
    } else {
      impl = 0x4e59b44847b379578588920ca78fbf26c0b4956c8ea716a80f934b1756000020;
      proxy = 0x4e59b44847b379578588920ca78fbf26c0b4956c88261569475dfec4cfa80080;
    }
  }

  function _getToken() internal view returns (address) {
    if (block.chainid == 8453) {
      // if deploying to base use mainnet token
      return 0x000000Fa00b200406de700041CFc6b19BbFB4d13;
    } else if (block.chainid == 84532) {
      // if deploying to base-sepolia use sepolia token
      return 0xfc85ff424F1b55fB3f9e920A47EC7255488C3bA3;
    } else if (isAnvil()) {
      // if deploying locally use base-sepolia token
      return 0xfc85ff424F1b55fB3f9e920A47EC7255488C3bA3;
    } else {
      revert("Invalid chain");
    }
  }
}
