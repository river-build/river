// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";
import {Executor} from "contracts/src/spaces/facets/executor/Executor.sol";

contract DeployExecutor is Deployer, FacetHelper {
  constructor() {
    addSelector(Executor.grantAccess.selector);
    addSelector(Executor.hasAccess.selector);
    addSelector(Executor.revokeAccess.selector);
    addSelector(Executor.renounceAccess.selector);
    addSelector(Executor.setGuardian.selector);
    addSelector(Executor.setGroupDelay.selector);
    addSelector(Executor.getGroupDelay.selector);
    addSelector(Executor.getAccess.selector);
    addSelector(Executor.setTargetFunctionGroup.selector);
    addSelector(Executor.setTargetFunctionDisabled.selector);
    addSelector(Executor.getSchedule.selector);
    addSelector(Executor.scheduleOperation.selector);
    addSelector(Executor.hashOperation.selector);
    addSelector(Executor.execute.selector);
    addSelector(Executor.cancel.selector);
  }

  // Deploying
  function versionName() public pure override returns (string memory) {
    return "executorFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    Executor executor = new Executor();
    vm.stopBroadcast();
    return address(executor);
  }
}
