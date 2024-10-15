// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ICreateSpace} from "contracts/src/factory/facets/create/ICreateSpace.sol";

// libraries

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {ArchitectBase} from "contracts/src/factory/facets/architect/ArchitectBase.sol";
import {PausableBase} from "contracts/src/diamond/facets/pausable/PausableBase.sol";
import {ReentrancyGuard} from "contracts/src/diamond/facets/reentrancy/ReentrancyGuard.sol";

contract CreateSpaceFacet is
  ICreateSpace,
  ArchitectBase,
  PausableBase,
  ReentrancyGuard,
  Facet
{
  function __CreateSpace_init() external onlyInitializing {
    _addInterface(type(ICreateSpace).interfaceId);
  }

  function createSpace(
    SpaceInfo memory spaceInfo
  ) external nonReentrant whenNotPaused returns (address) {
    return _createSpace(spaceInfo);
  }

  function createSpaceWithPrepay(
    CreateSpace memory spaceInfo
  ) external payable nonReentrant whenNotPaused returns (address) {
    return _createSpaceWithPrepay(spaceInfo);
  }
}
