// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IWETH {
  function balanceOf(address) external view returns (uint256);

  function allowance(address, address) external view returns (uint256);

  function deposit() external payable;

  function withdraw(uint256 wad) external;

  function approve(address guy, uint256 wad) external returns (bool);

  function transfer(address dst, uint256 wad) external returns (bool);

  function transferFrom(
    address src,
    address dst,
    uint256 wad
  ) external returns (bool);
}
