// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITipping} from "./ITipping.sol";

// libraries
import {TippingBase} from "./TippingBase.sol";

// contracts
import {ERC721ABase} from "contracts/src/diamond/facets/token/ERC721A/ERC721ABase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract Tipping is ITipping, ERC721ABase, Facet {
  function __Tipping_init() external onlyInitializing {
    _addInterface(type(ITipping).interfaceId);
  }

  function tip(TipRequest calldata tipRequest) external payable {
    address receiver = _ownerOf(tipRequest.tokenId);
    address sender = msg.sender;

    _validateTipRequest(sender, receiver, tipRequest.amount);

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

  function tipCurrencies() external view returns (address[] memory) {
    return TippingBase.currencies();
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                         Internal                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function _validateTipRequest(
    address sender,
    address receiver,
    uint256 amount
  ) internal view {
    if (receiver == address(0)) revert TokenDoesNotExist();
    if (_balanceOf(sender) == 0) revert SenderIsNotMember();
    if (sender == receiver) revert SenderIsOwner();
    if (amount == 0) revert AmountIsZero();
  }
}
