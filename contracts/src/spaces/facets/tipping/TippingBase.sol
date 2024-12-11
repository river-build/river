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

  struct CurrencyStat {
    uint128 amount;
    uint128 count;
  }

  struct UserStat {
    uint128 receivedAmount;
    uint128 receivedCount;
    uint128 sentAmount;
    uint128 sentCount;
  }

  struct Layout {
    EnumerableSet.AddressSet currencies;
    mapping(uint256 tokenId => mapping(address currency => uint256 amount)) tipsByCurrencyByTokenId;
    mapping(address currency => CurrencyStat) statByCurrency;
    mapping(address user => mapping(address currency => UserStat)) statByUserAndCurrency;
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

    CurrencyStat storage currencyStat = ds.statByCurrency[currency];
    currencyStat.amount += uint128(amount);
    currencyStat.count += 1;

    UserStat storage receiverStat = ds.statByUserAndCurrency[receiver][
      currency
    ];
    receiverStat.receivedAmount += uint128(amount);
    receiverStat.receivedCount += 1;

    UserStat storage senderStat = ds.statByUserAndCurrency[sender][currency];
    senderStat.sentAmount += uint128(amount);
    senderStat.sentCount += 1;

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

  function getTotalTipAmount(address currency) internal view returns (uint256) {
    return layout().statByCurrency[currency].amount;
  }

  function getTotalTipCount(address currency) internal view returns (uint256) {
    return layout().statByCurrency[currency].count;
  }

  function getTipsReceived(
    address user,
    address currency
  ) internal view returns (uint256) {
    return layout().statByUserAndCurrency[user][currency].receivedAmount;
  }

  function getTipsSent(
    address user,
    address currency
  ) internal view returns (uint256) {
    return layout().statByUserAndCurrency[user][currency].sentAmount;
  }

  function getTipsReceivedCount(
    address user,
    address currency
  ) internal view returns (uint256) {
    return layout().statByUserAndCurrency[user][currency].receivedCount;
  }

  function getTipsSentCount(
    address user,
    address currency
  ) internal view returns (uint256) {
    return layout().statByUserAndCurrency[user][currency].sentCount;
  }
}
