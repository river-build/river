// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {Interaction} from "contracts/scripts/common/Interaction.s.sol";
import {MockERC721A} from "contracts/test/mocks/MockERC721A.sol";

contract InteractMockERC721A is Interaction {
  function __interact(address deployer) public override {
    address nft = getDeployment("mockERC721A");

    vm.startBroadcast(deployer);
    MockERC721A(nft).mintTo(0xCF7f9A80aC35d04d57d369Ae1e085b58e6eb54e0);
    vm.stopBroadcast();
  }
}
