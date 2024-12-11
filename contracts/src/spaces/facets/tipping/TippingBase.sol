// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";
// contracts

library TippingBase {
  using EnumerableSet for EnumerableSet.AddressSet;

  // keccak256(abi.encode(uint256(keccak256("spaces.facets.tipping.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xb6cb334a9eea0cca2581db4520b45ac6f03de8e3927292302206bb82168be300;

  struct Layout {
    EnumerableSet.AddressSet currencies;
    mapping(uint256 tokenId => mapping(address currency => uint256 amount)) tipsByCurrencyByTokenId;
    mapping(address currency => uint256 amount) totalTipAmountByCurrency;
    mapping(address currency => uint256 count) totalTipCountByCurrency;
    mapping(address user => mapping(address currency => uint256 amount)) tipsReceivedByCurrency;
    mapping(address user => mapping(address currency => uint256 amount)) tipsSentByCurrency;
    mapping(address user => mapping(address currency => uint256 count)) tipsReceivedCountByCurrency;
    mapping(address user => mapping(address currency => uint256 count)) tipsSentCountByCurrency;
  }

  function layout() internal pure returns (Layout storage l) {
    assembly {
      l.slot := STORAGE_SLOT
    }
  }

  function tip(
    address sender,
    address receiver,
    uint256 tokenId,
    address currency,
    uint256 amount
  ) internal {
    Layout storage ds = layout();

    ds.currencies.add(currency);
    ds.tipsByCurrencyByTokenId[tokenId][currency] += amount;
    ds.totalTipAmountByCurrency[currency] += amount;
    ds.totalTipCountByCurrency[currency] += 1;
    ds.tipsReceivedByCurrency[receiver][currency] += amount;
    ds.tipsSentByCurrency[sender][currency] += amount;
    ds.tipsReceivedCountByCurrency[receiver][currency] += 1;
    ds.tipsSentCountByCurrency[sender][currency] += 1;

    CurrencyTransfer.transferCurrency(currency, sender, receiver, amount);
  }

  function tipsByCurrencyByTokenId(
    uint256 tokenId,
    address currency
  ) internal view returns (uint256) {
    return layout().tipsByCurrencyByTokenId[tokenId][currency];
  }

  function tippingCurrencies() internal view returns (address[] memory) {
    return layout().currencies.values();
  }

  function getTotalTipAmountByCurrency(
    address currency
  ) internal view returns (uint256) {
    return layout().totalTipAmountByCurrency[currency];
  }

  function getTotalTipCountByCurrency(
    address currency
  ) internal view returns (uint256) {
    return layout().totalTipCountByCurrency[currency];
  }

  function getTipsReceivedByCurrency(
    address user,
    address currency
  ) internal view returns (uint256) {
    return layout().tipsReceivedByCurrency[user][currency];
  }

  function getTipsSentByCurrency(
    address user,
    address currency
  ) internal view returns (uint256) {
    return layout().tipsSentByCurrency[user][currency];
  }

  function getTipsReceivedCountByCurrency(
    address user,
    address currency
  ) internal view returns (uint256) {
    return layout().tipsReceivedCountByCurrency[user][currency];
  }

  function getTipsSentCountByCurrency(
    address user,
    address currency
  ) internal view returns (uint256) {
    return layout().tipsSentCountByCurrency[user][currency];
  }
}
