// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {AccessManager} from "@openzeppelin/contracts/access/manager/AccessManager.sol";

contract TownsManager is AccessManager {
  uint64 public constant SET_TOKEN_RECIPIENT_ROLE = 1;

  constructor(
    address association,
    address setTokenRecipientAdmin
  ) AccessManager(association) {
    _grantRole(SET_TOKEN_RECIPIENT_ROLE, setTokenRecipientAdmin, 0, 0);
  }
}
