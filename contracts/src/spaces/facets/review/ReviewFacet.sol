// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IReview} from "./IReview.sol";

// libraries
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {ReviewStorage} from "./ReviewStorage.sol";

// contracts
import {Facet} from "@river-build/diamond/src/facets/Facet.sol";

contract ReviewFacet is IReview, Facet {
  using EnumerableSetLib for EnumerableSetLib.AddressSet;

  //  function setReviewRequirements() external;

  function setReview(Action action, bytes calldata data) external {
    // access control
    ReviewStorage.Layout storage self = ReviewStorage.layout();
    ReviewStorage.Meta memory newReview = abi.decode(
      data,
      (ReviewStorage.Meta)
    );
    if (action == Action.Add) {
      self.reviewByUser[msg.sender] = newReview;

      emit ReviewAdded(msg.sender, newReview);
    } else if (action == Action.Update) {
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
}
