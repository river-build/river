// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";
import {MockERC721A} from "contracts/test/mocks/MockERC721A.sol";

contract DeployMockERC721A is Deployer, FacetHelper {
  function versionName() public pure override returns (string memory) {
    return "mockERC721A";
  }

  constructor() {
    addSelector(MockERC721A.mintTo.selector);
    addSelector(MockERC721A.mint.selector);
    addSelector(MockERC721A.burn.selector);
  }

  function __deploy(address deployer) public override returns (address) {
    bytes32 salt = bytes32(uint256(uint160(deployer))); // create a salt from address

    bytes32 initCodeHash = hashInitCode(type(MockERC721A).creationCode);
    address predeterminedAddress = vm.computeCreate2Address(salt, initCodeHash);

    vm.startBroadcast(deployer);
    MockERC721A deployment = new MockERC721A{salt: salt}();
    vm.stopBroadcast();

    require(predeterminedAddress == address(deployment));

    return address(deployment);
  }
}
