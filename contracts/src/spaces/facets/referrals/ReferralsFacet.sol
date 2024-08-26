// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";

// contracts
import {Entitled} from "contracts/src/spaces/facets/Entitled.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {IReferrals} from "./IReferrals.sol";
import {ReferralsBase} from "./ReferralsBase.sol";

contract ReferralsFacet is IReferrals, ReferralsBase, Entitled, Facet {
  function __ReferralsFacet_init() external onlyInitializing {
    _addInterface(type(IReferrals).interfaceId);
  }

  function registerReferral(Referral memory referral) external {
    _validatePermission(Permissions.ModifyRoles);
    _registerReferral(referral);
  }

  function referralInfo(
    string memory referralCode
  ) external view returns (Referral memory) {
    return _referralInfo(referralCode);
  }

  function updateReferral(Referral memory referral) external {
    _validatePermission(Permissions.ModifyRoles);
    _updateReferral(referral);
  }

  function removeReferral(string memory referralCode) external {
    _validatePermission(Permissions.ModifyRoles);
    _removeReferral(referralCode);
  }

  // admin
  function setMaxBpsFee(uint256 bps) external {
    _validatePermission(Permissions.ModifyRoles);
    _setMaxBpsFee(bps);
  }

  function maxBpsFee() external view returns (uint256) {
    return _maxBpsFee();
  }
}
