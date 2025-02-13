// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IReview} from "./IReview.sol";

// libraries
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {ReviewStorage} from "./ReviewStorage.sol";

// contracts
import {Facet} from "@river-build/diamond/src/facets/Facet.sol";
import {Entitled} from "contracts/src/spaces/facets/Entitled.sol";

contract ReviewFacet is IReview, Entitled, Facet {
  using EnumerableSetLib for EnumerableSetLib.AddressSet;

  function __Review_init(
    uint16 minCommentLength,
    uint16 maxCommentLength
  ) external onlyInitializing {
    ReviewStorage.Layout storage self = ReviewStorage.layout();
    (self.minCommentLength, self.maxCommentLength) = (
      minCommentLength,
      maxCommentLength
    );

    _addInterface(type(IReview).interfaceId);
  }

  function setReview(Action action, bytes calldata data) external {
    _validateMembership(msg.sender);

    ReviewStorage.Layout storage self = ReviewStorage.layout();

    if (action == Action.Add) {
      ReviewStorage.Meta memory newReview = abi.decode(
        data,
        (ReviewStorage.Meta)
      );
      _validateReview(newReview);
      self.reviewByUser[msg.sender] = newReview;

      emit ReviewAdded(msg.sender, newReview);
    } else if (action == Action.Update) {
      ReviewStorage.Meta memory newReview = abi.decode(
        data,
        (ReviewStorage.Meta)
      );
      _validateReview(newReview);
      self.reviewByUser[msg.sender] = newReview;

      emit ReviewUpdated(msg.sender, newReview);
    } else if (action == Action.Delete) {
      delete self.reviewByUser[msg.sender];

      emit ReviewDeleted(msg.sender);
    }
  }

  function getReview(
    address user
  ) external view returns (ReviewStorage.Meta memory review) {
    assembly ("memory-safe") {
      mstore(0x40, review)
    }
    review = ReviewStorage.layout().reviewByUser[user];
  }

  function getAllReviews()
    external
    view
    returns (address[] memory users, ReviewStorage.Meta[] memory reviews)
  {
    ReviewStorage.Layout storage self = ReviewStorage.layout();
    users = self.usersReviewed.values();
    reviews = new ReviewStorage.Meta[](users.length);
    for (uint256 i; i < users.length; ++i) {
      reviews[i] = self.reviewByUser[users[i]];
    }
  }

  function _validateReview(ReviewStorage.Meta memory review) internal view {
    ReviewStorage.Layout storage self = ReviewStorage.layout();

    uint256 length = bytes(review.comment).length;
    if (
      length < FixedPointMathLib.max(10, self.minCommentLength) ||
      length >=
      (self.maxCommentLength == 0 ? type(uint16).max : self.maxCommentLength)
    ) {
      CustomRevert.revertWith(ReviewFacet__InvalidCommentLength.selector);
    }
    if (review.rating > 5) {
      CustomRevert.revertWith(ReviewFacet__InvalidRating.selector);
    }
  }
}
