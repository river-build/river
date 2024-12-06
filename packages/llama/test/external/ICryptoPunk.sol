// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ICryptoPunk {
  function name() external view returns (string memory);

  function punksOfferedForSale(
    uint256
  )
    external
    view
    returns (
      bool isForSale,
      uint256 punkIndex,
      address seller,
      uint256 minValue,
      address onlySellTo
    );

  function enterBidForPunk(uint256 punkIndex) external payable;

  function totalSupply() external view returns (uint256);

  function acceptBidForPunk(uint256 punkIndex, uint256 minPrice) external;

  function decimals() external view returns (uint8);

  function setInitialOwners(
    address[] memory addresses,
    uint256[] memory indices
  ) external;

  function withdraw() external;

  function imageHash() external view returns (string memory);

  function nextPunkIndexToAssign() external view returns (uint256);

  function punkIndexToAddress(uint256) external view returns (address);

  function standard() external view returns (string memory);

  function punkBids(
    uint256
  )
    external
    view
    returns (bool hasBid, uint256 punkIndex, address bidder, uint256 value);

  function balanceOf(address) external view returns (uint256);

  function allInitialOwnersAssigned() external;

  function allPunksAssigned() external view returns (bool);

  function buyPunk(uint256 punkIndex) external payable;

  function transferPunk(address to, uint256 punkIndex) external;

  function symbol() external view returns (string memory);

  function withdrawBidForPunk(uint256 punkIndex) external;

  function setInitialOwner(address to, uint256 punkIndex) external;

  function offerPunkForSaleToAddress(
    uint256 punkIndex,
    uint256 minSalePriceInWei,
    address toAddress
  ) external;

  function punksRemainingToAssign() external view returns (uint256);

  function offerPunkForSale(
    uint256 punkIndex,
    uint256 minSalePriceInWei
  ) external;

  function getPunk(uint256 punkIndex) external;

  function pendingWithdrawals(address) external view returns (uint256);

  function punkNoLongerForSale(uint256 punkIndex) external;

  event Assign(address indexed to, uint256 punkIndex);
  event Transfer(address indexed from, address indexed to, uint256 value);
  event PunkTransfer(
    address indexed from,
    address indexed to,
    uint256 punkIndex
  );
  event PunkOffered(
    uint256 indexed punkIndex,
    uint256 minValue,
    address indexed toAddress
  );
  event PunkBidEntered(
    uint256 indexed punkIndex,
    uint256 value,
    address indexed fromAddress
  );
  event PunkBidWithdrawn(
    uint256 indexed punkIndex,
    uint256 value,
    address indexed fromAddress
  );
  event PunkBought(
    uint256 indexed punkIndex,
    uint256 value,
    address indexed fromAddress,
    address indexed toAddress
  );
  event PunkNoLongerForSale(uint256 indexed punkIndex);
}
