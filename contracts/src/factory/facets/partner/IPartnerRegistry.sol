// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface IPartnerRegistryBase {
  struct Partner {
    address account;
    address recipient;
    uint256 fee;
    bool active;
  }

  // Errors
  error PartnerRegistry__PartnerAlreadyRegistered(address account);
  error PartnerRegistry__RegistryFeeNotPaid(uint256 fee);
  error PartnerRegistry__PartnerNotRegistered(address account);
  error PartnerRegistry__NotPartnerAccount(address account);
  error PartnerRegistry__PartnerNotActive(address account);
  error PartnerRegistry__InvalidPartnerFee(uint256 fee);
  error PartnerRegistry__InvalidRecipient();

  // Events
  event PartnerRegistered(address indexed account);
  event PartnerUpdated(address indexed account);
  event PartnerRemoved(address indexed account);
  event MaxPartnerFeeSet(uint256 fee);
  event RegistryFeeSet(uint256 fee);
}

interface IPartnerRegistry is IPartnerRegistryBase {
  function registerPartner(Partner memory partner) external payable;

  function partnerInfo(address account) external view returns (Partner memory);

  function partnerFee(address account) external view returns (uint256 fee);

  function updatePartner(Partner memory partner) external;

  function removePartner(address account) external;

  // =============================================================
  //                           Admin
  // =============================================================
  function maxPartnerFee() external view returns (uint256 fee);

  function setMaxPartnerFee(uint256 fee) external;

  function registryFee() external view returns (uint256 fee);

  function setRegistryFee(uint256 fee) external;
}
