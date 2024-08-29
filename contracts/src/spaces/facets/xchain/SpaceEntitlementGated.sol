// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {EntitlementGated} from "contracts/src/spaces/facets/gated/EntitlementGated.sol";
import {MembershipJoin} from "contracts/src/spaces/facets/membership/join/MembershipJoin.sol";
import {ISpaceEntitlementGatedBase} from "contracts/src/spaces/facets/xchain/ISpaceEntitlementGated.sol";

contract SpaceEntitlementGated is
  ISpaceEntitlementGatedBase,
  MembershipJoin,
  EntitlementGated
{
  /// @dev Hook called after a node has posted the result of an entitlement check
  function _onEntitlementCheckResultPosted(
    bytes32 transactionId,
    NodeVoteStatus result
  ) internal override {
    bytes memory data = _getCapturedData(transactionId);

    if (data.length == 0) {
      return;
    }

    (TransactionType transactionType, address sender, address receiver, ) = abi
      .decode(data, (TransactionType, address, address, bytes));

    if (result == NodeVoteStatus.PASSED) {
      bool shouldCharge = _shouldChargeForJoinSpace(sender, transactionId);
      if (shouldCharge) {
        if (transactionType == TransactionType.JOIN_SPACE_WITH_REFERRAL) {
          _chargeForJoinSpaceWithReferral(transactionId);
        } else if (transactionType == TransactionType.JOIN_SPACE_NO_REFERRAL) {
          _chargeForJoinSpace(transactionId);
        }
      }
      _issueToken(receiver);
    } else {
      _captureData(transactionId, "");
      _refundBalance(transactionId, sender);

      emit MembershipTokenRejected(receiver);
    }
  }
}
