// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {Architect,ArchitectV2} from "contracts/src/factory/facets/architect/Architect.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";

contract DeployArchitect is FacetHelper, Deployer {
  constructor() {
    addSelector(Architect.createSpace.selector);
    addSelector(Architect.getSpaceByTokenId.selector);
    addSelector(Architect.getTokenIdBySpace.selector);
    addSelector(Architect.setSpaceArchitectImplementations.selector);
    addSelector(Architect.getSpaceArchitectImplementations.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return Architect.__Architect_init.selector;
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
    return "architectFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    Architect architect = new Architect();
    vm.stopBroadcast();
    return address(architect);
  }
}

contract DeployArchitectV2 is DeployArchitect {
  constructor() {
    super();
    addSelector(ArchictectV2.createSpaceV2.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return ArchitectV2.__Architect_init.selector;
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
