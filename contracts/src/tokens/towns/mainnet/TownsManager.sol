// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {AccessManager} from "@openzeppelin/contracts/access/manager/AccessManager.sol";

contract TownsManager is AccessManager {
  uint64 public constant CREATE_INFLATION_ROLE = 1;
  uint64 public constant OVERRIDE_INFLATION_ROLE = 2;
  uint64 public constant SET_TOKEN_RECIPIENT_ROLE = 3;

  constructor(
    address createInflationAdmin,
    address overrideInflationAdmin,
    address setTokenRecipientAdmin
  ) AccessManager(msg.sender) {
    _grantRole(CREATE_INFLATION_ROLE, createInflationAdmin, 0, 0);
    _grantRole(OVERRIDE_INFLATION_ROLE, overrideInflationAdmin, 0, 0);
    _grantRole(SET_TOKEN_RECIPIENT_ROLE, setTokenRecipientAdmin, 0, 0);
  }
}
