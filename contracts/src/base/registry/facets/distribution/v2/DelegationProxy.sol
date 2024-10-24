// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Initializable} from "contracts/src/diamond/facets/initializable/Initializable.sol";

contract DelegationProxy is Initializable {
  address public factory;
  address public stakeToken;

  constructor() payable {
    _disableInitializers();
  }

  modifier onlyFactory() {
    require(msg.sender == factory);
    _;
  }

  function initialize(
    address stakeToken_,
    address delegatee
  ) external initializer {
    factory = msg.sender;
    stakeToken = stakeToken_;
    ERC20Votes(stakeToken_).delegate(delegatee);
    ERC20Votes(stakeToken_).approve(msg.sender, type(uint256).max);
  }

  function redelegate(address delegatee) external onlyFactory {
    ERC20Votes(stakeToken).delegate(delegatee);
  }
}
