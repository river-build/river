// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IImplementationRegistry} from "contracts/src/factory/facets/registry/IImplementationRegistry.sol";
import {ITownsPoints, ITownsPointsBase} from "contracts/src/airdrop/points/ITownsPoints.sol";

// libraries

// contracts
import {MembershipStorage} from "contracts/src/spaces/facets/membership/MembershipStorage.sol";

/// @title PointsProxyLib
/// @notice Library for interacting with the TownsPoints contract
library PointsProxyLib {
  /// @dev The implementation ID for the TownsPoints contract
  /// @custom:note bytes32("RiverAirdrop")
  bytes32 constant POINTS_DIAMOND =
    0x526976657241697264726f700000000000000000000000000000000000000000;

  // =============================================================
  //                         GETTERS
  // =============================================================

  function airdropDiamond() internal view returns (address) {
    return
      IImplementationRegistry(MembershipStorage.layout().spaceFactory)
        .getLatestImplementation(POINTS_DIAMOND);
  }

  function getPoints(
    ITownsPointsBase.Action action,
    bytes memory data
  ) internal view returns (uint256) {
    return ITownsPoints(airdropDiamond()).getPoints(action, data);
  }

  function mint(address to, uint256 amount) internal {
    ITownsPoints(airdropDiamond()).mint(to, amount);
  }

  // =============================================================
  //                           Tippings
  // =============================================================

  function mintTipping(address to, uint256 amount) internal {
    ITownsPoints(airdropDiamond()).mintTippingPoints(to, amount);
  }

  function getTippingLastResetDay(
    address user
  ) internal view returns (uint256) {
    return ITownsPoints(airdropDiamond()).getTippingLastResetDay(user);
  }

  function getTippingDailyPoints(address user) internal view returns (uint256) {
    return ITownsPoints(airdropDiamond()).getTippingDailyPoints(user);
  }
}
