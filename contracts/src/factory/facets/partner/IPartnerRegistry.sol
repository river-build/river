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

  // Events
  event PartnerRegistered(address indexed account);
}

interface IPartnerRegistry is IPartnerRegistryBase {
  function registerPartner(Partner memory partner) external payable;

  function partnerInfo(address account) external view returns (Partner memory);

  function partnerFee(address account) external view returns (uint256 fee);

  function updatePartner(Partner memory partner) external;

  function removePartner(address account) external;
}
