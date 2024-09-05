// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract DelegationProxy {
  constructor(address stakeToken, address delegatee) {
    ERC20Votes(stakeToken).delegate(delegatee);
    ERC20Votes(stakeToken).approve(msg.sender, type(uint256).max);
  }

  // TODO: handle space delegation
}
