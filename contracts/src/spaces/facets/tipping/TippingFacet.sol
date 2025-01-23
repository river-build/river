// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITipping} from "./ITipping.sol";
import {ITownsPointsBase} from "contracts/src/airdrop/points/ITownsPoints.sol";
import {IPlatformRequirements} from "contracts/src/factory/facets/platform/requirements/IPlatformRequirements.sol";

// libraries
import {TippingBase} from "./TippingBase.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {PointsProxyLib} from "contracts/src/spaces/facets/points/PointsProxyLib.sol";
import {MembershipStorage} from "contracts/src/spaces/facets/membership/MembershipStorage.sol";
import {BasisPoints} from "contracts/src/utils/libraries/BasisPoints.sol";
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";
// contracts
import {ERC721ABase} from "contracts/src/diamond/facets/token/ERC721A/ERC721ABase.sol";
import {Facet} from "@river-build/diamond/src/facets/Facet.sol";
import {ReentrancyGuard} from "solady/utils/ReentrancyGuard.sol";

contract TippingFacet is ITipping, ERC721ABase, Facet, ReentrancyGuard {
  function __Tipping_init() external onlyInitializing {
    _addInterface(type(ITipping).interfaceId);
  }

  /// @inheritdoc ITipping
  function tip(TipRequest calldata tipRequest) external payable nonReentrant {
    _validateTipRequest(
      msg.sender,
      tipRequest.receiver,
      tipRequest.currency,
      tipRequest.amount
    );

    uint256 tipAmount = tipRequest.amount;

    if (tipRequest.currency == CurrencyTransfer.NATIVE_TOKEN) {
      uint256 protocolFee = _payProtocol(msg.sender, tipRequest.amount);
      tipAmount = tipRequest.amount - protocolFee;
    }

    TippingBase.tip(
      msg.sender,
      tipRequest.receiver,
      tipRequest.tokenId,
      tipRequest.currency,
      tipAmount
    );

    PointsProxyLib.mintTipping(msg.sender, tipRequest.amount);

    emit Tip(
      tipRequest.tokenId,
      tipRequest.currency,
      msg.sender,
      tipRequest.receiver,
      tipRequest.amount,
      tipRequest.messageId,
      tipRequest.channelId
    );
  }

  function tippingPoints(
    address user,
    uint256 tipAmount
  ) external view returns (uint256) {
    uint256 lastResetDay = PointsProxyLib.getTippingLastResetDay(user);
    uint256 dailyPoints = PointsProxyLib.getTippingDailyPoints(user);

    return
      PointsProxyLib.getPoints(
        ITownsPointsBase.Action.Tip,
        abi.encode(
          tipAmount,
          dailyPoints,
          block.timestamp / 1 days,
          lastResetDay
        )
      );
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
  function totalTipsByCurrency(
    address currency
  ) external view returns (uint256) {
    return TippingBase.totalTipsByCurrency(currency);
  }

  /// @inheritdoc ITipping
  function tipAmountByCurrency(
    address currency
  ) external view returns (uint256) {
    return TippingBase.tipAmountByCurrency(currency);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                         Internal                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function _validateTipRequest(
    address sender,
    address receiver,
    address currency,
    uint256 amount
  ) internal pure {
    if (currency == address(0))
      CustomRevert.revertWith(CurrencyIsZero.selector);
    if (sender == receiver) CustomRevert.revertWith(CannotTipSelf.selector);
    if (amount == 0) CustomRevert.revertWith(AmountIsZero.selector);
  }

  function _payProtocol(
    address sender,
    uint256 amount
  ) internal returns (uint256) {
    MembershipStorage.Layout storage ds = MembershipStorage.layout();
    IPlatformRequirements platform = IPlatformRequirements(ds.spaceFactory);

    address platformRecipient = platform.getFeeRecipient();
    uint256 protocolFee = BasisPoints.calculate(amount, 100); // 1%

    CurrencyTransfer.transferCurrency(
      CurrencyTransfer.NATIVE_TOKEN,
      sender,
      platformRecipient,
      protocolFee
    );

    return protocolFee;
  }
}
