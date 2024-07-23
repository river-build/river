// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IArchitectV2} from "contracts/src/factory/facets/architect/IArchitectV2.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";
import {ISpaceOwner} from "contracts/src/spaces/facets/owner/ISpaceOwner.sol";
import {IUserEntitlement} from "contracts/src/spaces/entitlements/user/IUserEntitlement.sol";

// libraries

// contracts
import {Architect} from "./Architect.sol";
import {ArchitectBaseV2} from "./ArchitectBaseV2.sol";
import {OwnableBase} from "contracts/src/diamond/facets/ownable/OwnableBase.sol";
import {ReentrancyGuard} from "contracts/src/diamond/facets/reentrancy/ReentrancyGuard.sol";
import {PausableBase} from "contracts/src/diamond/facets/pausable/PausableBase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract ArchitectV2 is Architect, IArchitectV2, ArchitectBaseV2 {
  // =============================================================
  //                            Space
  // =============================================================
  function createSpaceV2(
    SpaceInfoV2 memory spaceInfo
  ) external nonReentrant whenNotPaused returns (address) {
    return _createSpace(spaceInfo);
  }
}
