// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ICheckIn} from "contracts/src/tokens/checkin/ICheckIn.sol";

// libraries
import {CheckIn} from "contracts/src/tokens/checkin/CheckIn.sol";
import {Validator} from "contracts/src/utils/Validator.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract CheckInFacet is ICheckIn, Facet {
  function __CheckIn_init() external onlyInitializing {
    _addInterface(type(ICheckIn).interfaceId);
  }

  function checkIn() external {
    Validator.checkAddress(msg.sender);
    CheckIn.checkIn(msg.sender);
  }

  function getPoints(address user) external view returns (uint256) {
    return CheckIn.getPoints(user);
  }

  function getStreak(address user) external view returns (uint256) {
    return CheckIn.getStreak(user);
  }

  function getLastCheckIn(address user) external view returns (uint256) {
    return CheckIn.getLastCheckIn(user);
  }
}
