// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITippingBase} from "contracts/src/spaces/facets/tipping/ITipping.sol";

// libraries
import {TippingStorage} from "contracts/src/spaces/facets/tipping/TippingStorage.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";
// contracts

library TippingBase {
  using EnumerableSet for EnumerableSet.AddressSet;

  function tip(
    address sender,
    address receiver,
    ITippingBase.TipRequest calldata tipRequest
  ) internal {
    TippingStorage.Layout storage ds = TippingStorage.layout();

    (uint256 tokenId, address currency, uint256 amount) = (
      tipRequest.tokenId,
      tipRequest.currency,
      tipRequest.amount
    );

    ds.currencies.add(currency);
    ds.tipsByCurrencyByTokenId[tokenId][currency] += amount;

    CurrencyTransfer.transferCurrency(currency, sender, receiver, amount);
  }
}
