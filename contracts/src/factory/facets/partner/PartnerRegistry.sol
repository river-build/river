// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IPartnerRegistry} from "./IPartnerRegistry.sol";

// libraries

// contracts
import {PartnerRegistryBase} from "./PartnerRegistryBase.sol";
import {OwnableBase} from "contracts/src/diamond/facets/ownable/OwnableBase.sol";

contract PartnerRegistry is PartnerRegistryBase, OwnableBase, IPartnerRegistry {
  function registerPartner(Partner calldata partner) external payable {
    _registerPartner(partner);
  }

  function partnerInfo(address account) external view returns (Partner memory) {
    return _partner(account);
  }

  function partnerFee(address account) external view returns (uint256 fee) {
    return _partnerFee(account);
  }

  function updatePartner(Partner calldata partner) external {
    _updatePartner(partner);
  }

  function removePartner(address account) external onlyOwner {
    _removePartner(account);
  }
}
