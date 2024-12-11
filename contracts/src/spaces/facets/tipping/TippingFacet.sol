// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITipping} from "./ITipping.sol";

// libraries
import {TippingBase} from "./TippingBase.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";

// contracts
import {ERC721ABase} from "contracts/src/diamond/facets/token/ERC721A/ERC721ABase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract TippingFacet is ITipping, ERC721ABase, Facet {
  function __Tipping_init() external onlyInitializing {
    _addInterface(type(ITipping).interfaceId);
  }

  /// @inheritdoc ITipping
  function tip(TipRequest calldata tipRequest) external payable {
    address receiver = _ownerOf(tipRequest.tokenId);

    _validateTipRequest(
      msg.sender,
      receiver,
      tipRequest.currency,
      tipRequest.amount
    );

    TippingBase.tip(
      msg.sender,
      receiver,
      tipRequest.tokenId,
      tipRequest.currency,
      tipRequest.amount
    );

    emit Tip(
      tipRequest.tokenId,
      tipRequest.currency,
      msg.sender,
      receiver,
      tipRequest.amount
    );

    emit TipMessage(tipRequest.messageId, tipRequest.channelId);
  }

  /// @inheritdoc ITipping
  function tippingCurrencies() external view returns (address[] memory) {
    return TippingBase.tippingCurrencies();
  }

  /// @inheritdoc ITipping
  function tipsByCurrencyAndTokenId(
    uint256 tokenId,
    address currency
  ) external view returns (uint256) {
    return TippingBase.tipsByCurrencyByTokenId(tokenId, currency);
  }

  /// @inheritdoc ITipping
  function getTotalTipAmountByCurrency(
    address currency
  ) external view returns (uint256) {
    return TippingBase.getTotalTipAmountByCurrency(currency);
  }

  /// @inheritdoc ITipping
  function getTotalTipCountByCurrency(
    address currency
  ) external view returns (uint256) {
    return TippingBase.getTotalTipCountByCurrency(currency);
  }

  /// @inheritdoc ITipping
  function getTipsReceivedByCurrency(
    address user,
    address currency
  ) external view returns (uint256) {
    return TippingBase.getTipsReceivedByCurrency(user, currency);
  }

  /// @inheritdoc ITipping
  function getTipsSentByCurrency(
    address user,
    address currency
  ) external view returns (uint256) {
    return TippingBase.getTipsSentByCurrency(user, currency);
  }

  /// @inheritdoc ITipping
  function getTipsReceivedCountByCurrency(
    address user,
    address currency
  ) external view returns (uint256) {
    return TippingBase.getTipsReceivedCountByCurrency(user, currency);
  }

  /// @inheritdoc ITipping
  function getTipsSentCountByCurrency(
    address user,
    address currency
  ) external view returns (uint256) {
    return TippingBase.getTipsSentCountByCurrency(user, currency);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                         Internal                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function _validateTipRequest(
    address sender,
    address receiver,
    address currency,
    uint256 amount
  ) internal view {
    if (currency == address(0))
      CustomRevert.revertWith(CurrencyIsZero.selector);
    if (sender == receiver) CustomRevert.revertWith(CannotTipSelf.selector);
    if (amount == 0) CustomRevert.revertWith(AmountIsZero.selector);
    if (_balanceOf(sender) == 0)
      CustomRevert.revertWith(SenderIsNotMember.selector);
  }
}
