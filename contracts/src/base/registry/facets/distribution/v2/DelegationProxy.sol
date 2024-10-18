// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract DelegationProxy {
  address internal immutable factory;
  address internal immutable stakeToken;

  constructor(address stakeToken_, address delegatee) {
    factory = msg.sender;
    stakeToken = stakeToken_;
    ERC20Votes(stakeToken_).delegate(delegatee);
    ERC20Votes(stakeToken_).approve(msg.sender, type(uint256).max);
  }

  function redelegate(address delegatee) external {
    require(msg.sender == factory);
    ERC20Votes(stakeToken).delegate(delegatee);
  }
}
