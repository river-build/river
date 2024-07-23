// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {ArchitectV2} from "contracts/src/factory/facets/architect/ArchitectV2.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";

contract DeployArchitect is FacetHelper, Deployer {
  constructor() {
    addSelector(ArchitectV2.createSpace.selector);
    addSelector(ArchitectV2.createSpaceV2.selector);
    addSelector(Architect.getSpaceByTokenId.selector);
    addSelector(Architect.getTokenIdBySpace.selector);
    addSelector(Architect.setSpaceArchitectImplementations.selector);
    addSelector(Architect.getSpaceArchitectImplementations.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return ArchitectV2.__Architect_init.selector;
  }

  function makeInitData(
    address _spaceOwnerToken,
    address _userEntitlement,
    address _ruleEntitlement
  ) public pure returns (bytes memory) {
    return
      abi.encodeWithSelector(
        initializer(),
        _spaceOwnerToken,
        _userEntitlement,
        _ruleEntitlement
      );
  }

  function versionName() public pure override returns (string memory) {
    return "architectFacetV2";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    ArchitectV2 architect = new ArchitectV2();
    vm.stopBroadcast();
    return address(architect);
  }
}
