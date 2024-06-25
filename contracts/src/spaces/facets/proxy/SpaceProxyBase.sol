// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

// interfaces
import {IManagedProxyBase} from "contracts/src/diamond/proxy/managed/IManagedProxy.sol";
import {ITokenOwnableBase} from "contracts/src/diamond/facets/ownable/token/ITokenOwnable.sol";
import {IEntitlementChecker} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";
import {IMembershipBase} from "contracts/src/spaces/facets/membership/IMembership.sol";

// libraries
import {ManagedProxyStorage} from "contracts/src/diamond/proxy/managed/ManagedProxyStorage.sol";
import {TokenOwnableStorage} from "contracts/src/diamond/facets/ownable/token/TokenOwnableStorage.sol";
import {EntitlementGatedStorage} from "contracts/src/spaces/facets/gated/EntitlementGatedStorage.sol";
import {MembershipStorage} from "contracts/src/spaces/facets/membership/MembershipStorage.sol";

// contracts

abstract contract SpaceProxyBase is
  IManagedProxyBase,
  ITokenOwnableBase,
  IMembershipBase
{
  function __ManagedProxyBase__init(ManagedProxy memory proxy) internal {
    ManagedProxyStorage.Layout storage ds = ManagedProxyStorage.layout();
    ds.managerSelector = proxy.managerSelector;
    ds.manager = proxy.manager;
  }

  function __TokenOwnableBase_init(TokenOwnable memory tokenOwnable) internal {
    TokenOwnableStorage.Layout storage ds = TokenOwnableStorage.layout();
    ds.collection = tokenOwnable.collection;
    ds.tokenId = tokenOwnable.tokenId;
  }

  function __EntitlementChecker_init(address entitlementChecker) internal {
    EntitlementGatedStorage.Layout storage ds = EntitlementGatedStorage
      .layout();
    ds.entitlementChecker = IEntitlementChecker(entitlementChecker);
  }

  function __MembershipBase_init(
    Membership memory info,
    address spaceFactory
  ) internal {
    MembershipStorage.Layout storage ds = MembershipStorage.layout();

    ds.spaceFactory = spaceFactory;
    ds.pricingModule = info.pricingModule;
    ds.membershipCurrency = CurrencyTransfer.NATIVE_TOKEN;
    ds.membershipMaxSupply = info.maxSupply;
    ds.freeAllocation = info.freeAllocation;

    if (info.freeAllocation > 0) {
      _verifyFreeAllocation(info.freeAllocation);
    }

    _verifyPricingModule(info.pricingModule);

    if (info.price > 0) {
      _verifyPrice(info.price);
      IMembershipPricing(ds.pricingModule).setPrice(info.price);
    }
  }
}
