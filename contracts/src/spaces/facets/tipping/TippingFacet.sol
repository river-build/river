// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITipping} from "./ITipping.sol";

// libraries
import {TippingBase} from "./TippingBase.sol";

// contracts
import {ERC721ABase} from "contracts/src/diamond/facets/token/ERC721A/ERC721ABase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract TippingFacet is ITipping, ERC721ABase, Facet {
  function __Tipping_init() external onlyInitializing {
    _addInterface(type(ITipping).interfaceId);
  }

  /// @inheritdoc ITipping
  function tip(TipRequest calldata tipRequest) external payable {
    address sender = msg.sender;
    address receiver = _ownerOf(tipRequest.tokenId);

    _validateTipRequest(
      sender,
      receiver,
      tipRequest.currency,
      tipRequest.amount
    );

    TippingBase.tip(
      sender,
      receiver,
      tipRequest.tokenId,
      tipRequest.currency,
      tipRequest.amount
    );

    emit Tip(
      tipRequest.tokenId,
      tipRequest.currency,
      sender,
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
  function tipsByCurrencyByTokenId(
    uint256 tokenId,
    address currency
  ) external view returns (uint256) {
    return TippingBase.tipsByCurrencyByTokenId(tokenId, currency);
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
    if (currency == address(0)) revert CurrencyIsZero();
    if (sender == receiver) revert CannotTipSelf();
    if (amount == 0) revert AmountIsZero();
    if (_balanceOf(sender) == 0) revert SenderIsNotMember();
  }
}
