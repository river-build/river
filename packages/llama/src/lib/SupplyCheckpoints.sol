// SPDX-License-Identifier: MIT
// forgefmt: disable-start
pragma solidity ^0.8.0;

import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";

/**
 * @dev This library defines the `History` struct, for checkpointing values as they change at different points in
 * time, and later looking up past values by block timestamp.
 *
 * To create a history of checkpoints define a variable type `SupplyCheckpoints.History` in your contract, and store a
 * new checkpoint for the current transaction timestamp using the {push} function.
 *
 * @dev This was created by modifying then running the OpenZeppelin `Checkpoints.js` script, which generated a version
 * of this library that uses a 64 bit `timestamp` and 96 bit `quantity` field in the `Checkpoint` struct. The struct
 * was then modified to work with the below `Checkpoint` struct. For simplicity, safe cast and math methods were inlined
 * from the OpenZeppelin versions at the same commit. We disable forge-fmt for this file to simplify diffing against the
 * original OpenZeppelin version: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/d00acef4059807535af0bd0dd0ddf619747a044b/contracts/utils/Checkpoints.sol
 */
library SupplyCheckpoints {
  struct History {
    Checkpoint[] _checkpoints;
  }

  struct Checkpoint {
    uint64 timestamp;
    uint96 numberOfHolders;
    uint96 totalQuantity;
  }

  /**
   * @dev Returns the supply quantities at a given block timestamp. If a checkpoint is not available at that time, the closest
   * one before it is returned, or zero otherwise. Similar to {upperLookup} but optimized for the case when the
   * searched checkpoint is probably "recent", defined as being among the last sqrt(N) checkpoints where N is the
   * timestamp of checkpoints.
   */
  function getAtProbablyRecentTimestamp(
    History storage self,
    uint256 timestamp
  ) internal view returns (uint96 numberOfHolders, uint96 totalQuantity) {
    require(
      timestamp < block.timestamp,
      "SupplyCheckpoints: timestamp is not in the past"
    );
    uint64 _timestamp = LlamaUtils.toUint64(timestamp);

    uint256 len = self._checkpoints.length;

    uint256 low = 0;
    uint256 high = len;

    if (len > 5) {
      uint256 mid = len - sqrt(len);
      if (_timestamp < _unsafeAccess(self._checkpoints, mid).timestamp) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }

    uint256 pos = _upperBinaryLookup(self._checkpoints, _timestamp, low, high);

    return pos == 0 ? (0, 0) : _unsafeSupplyAccess(self._checkpoints, pos - 1);
  }

  /**
   * @dev Pushes the `numberOfHolders` and `totalQuantity` supplies onto a History so that it is stored as the
   * checkpoint for the current `timestamp`.
   *
   * For simplicity, this method does not return anything, since the return values are not needed by Llama.
   */
  function push(
    History storage self,
    uint256 numberOfHolders,
    uint256 totalQuantity
  ) internal {
    _insert(
      self._checkpoints,
      LlamaUtils.toUint64(block.timestamp),
      LlamaUtils.toUint96(numberOfHolders),
      LlamaUtils.toUint96(totalQuantity)
    );
  }

  /**
   * @dev Returns the supplies in the most recent checkpoint, or zeros if there are no checkpoints.
   */
  function latest(
    History storage self
  ) internal view returns (uint96 numberOfHolders, uint96 totalQuantity) {
    uint256 pos = self._checkpoints.length;
    return pos == 0 ? (0, 0) : _unsafeSupplyAccess(self._checkpoints, pos - 1);
  }

  /**
   * @dev Returns whether there is a checkpoint in the structure (i.e. it is not empty), and if so the timestamp and
   * supplies in the most recent checkpoint.
   */
  function latestCheckpoint(
    History storage self
  )
    internal
    view
    returns (
      bool exists,
      uint64 timestamp,
      uint96 numberOfHolders,
      uint96 totalQuantity
    )
  {
    uint256 pos = self._checkpoints.length;
    if (pos == 0) {
      return (false, 0, 0, 0);
    } else {
      Checkpoint memory ckpt = _unsafeAccess(self._checkpoints, pos - 1);
      return (true, ckpt.timestamp, ckpt.numberOfHolders, ckpt.totalQuantity);
    }
  }

  /**
   * @dev Returns the number of checkpoints.
   */
  function length(History storage self) internal view returns (uint256) {
    return self._checkpoints.length;
  }

  /**
   * @dev Pushes a (`timestamp`, `numberOfHolders`, `totalQuantity`) pair into an ordered list of checkpoints, either
   * by inserting a new checkpoint, or by updating the last one.
   *
   * For simplicity, this method does not return anything, since the return values are not needed by Llama.
   */
  function _insert(
    Checkpoint[] storage self,
    uint64 timestamp,
    uint96 numberOfHolders,
    uint96 totalQuantity
  ) private {
    uint256 pos = self.length;

    if (pos > 0) {
      // Copying to memory is important here.
      Checkpoint memory last = _unsafeAccess(self, pos - 1);

      // Checkpoints timestamps must be increasing.
      require(
        last.timestamp <= timestamp,
        "Supply Checkpoint: invalid timestamp"
      );

      // Update or push new checkpoint
      if (last.timestamp == timestamp) {
        Checkpoint storage ckpt = _unsafeAccess(self, pos - 1);
        ckpt.numberOfHolders = numberOfHolders;
        ckpt.totalQuantity = totalQuantity;
      } else {
        self.push(
          Checkpoint({
            timestamp: timestamp,
            numberOfHolders: numberOfHolders,
            totalQuantity: totalQuantity
          })
        );
      }
    } else {
      self.push(
        Checkpoint({
          timestamp: timestamp,
          numberOfHolders: numberOfHolders,
          totalQuantity: totalQuantity
        })
      );
    }
  }

  /**
   * @dev Return the index of the oldest checkpoint whose timestamp is greater than the search timestamp, or `high`
   * if there is none. `low` and `high` define a section where to do the search, with inclusive `low` and exclusive
   * `high`.
   *
   * WARNING: `high` should not be greater than the array's length.
   */
  function _upperBinaryLookup(
    Checkpoint[] storage self,
    uint64 timestamp,
    uint256 low,
    uint256 high
  ) private view returns (uint256) {
    while (low < high) {
      uint256 mid = average(low, high);
      if (_unsafeAccess(self, mid).timestamp > timestamp) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    return high;
  }

  /**
   * @dev Return the index of the oldest checkpoint whose timestamp is greater or equal than the search timestamp, or
   * `high` if there is none. `low` and `high` define a section where to do the search, with inclusive `low` and
   * exclusive `high`.
   *
   * WARNING: `high` should not be greater than the array's length.
   */
  function _lowerBinaryLookup(
    Checkpoint[] storage self,
    uint64 timestamp,
    uint256 low,
    uint256 high
  ) private view returns (uint256) {
    while (low < high) {
      uint256 mid = average(low, high);
      if (_unsafeAccess(self, mid).timestamp < timestamp) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return high;
  }

  function _unsafeAccess(
    Checkpoint[] storage self,
    uint256 pos
  ) private pure returns (Checkpoint storage result) {
    assembly {
      mstore(0, self.slot)
      result.slot := add(keccak256(0, 0x20), pos)
    }
  }

  function _unsafeSupplyAccess(
    Checkpoint[] storage self,
    uint256 pos
  ) private view returns (uint96 numberOfHolders, uint96 totalQuantity) {
    Checkpoint storage result;
    assembly {
      mstore(0, self.slot)
      result.slot := add(keccak256(0, 0x20), pos)
    }
    numberOfHolders = result.numberOfHolders;
    totalQuantity = result.totalQuantity;
  }

  /**
   * @dev Returns the average of two numbers. The result is rounded towards
   * zero.
   */
  function average(uint256 a, uint256 b) private pure returns (uint256) {
    return (a & b) + (a ^ b) / 2; // (a + b) / 2 can overflow.
  }

  /**
   * @dev This was copied from Solmate v7 https://github.com/transmissions11/solmate/blob/e8f96f25d48fe702117ce76c79228ca4f20206cb/@llama/src/utils/FixedPointMathLib.sol
   * @notice The math utils in solmate v7 were reviewed/audited by spearbit as part of the art gobblers audit, and are more efficient than the v6 versions.
   */
  function sqrt(uint256 x) internal pure returns (uint256 z) {
    assembly {
      let y := x // We start y at x, which will help us make our initial estimate.

      z := 181 // The "correct" value is 1, but this saves a multiplication later.

      // This segment is to get a reasonable initial estimate for the Babylonian method. With a bad
      // start, the correct # of bits increases ~linearly each iteration instead of ~quadratically.

      // We check y >= 2^(k + 8) but shift right by k bits
      // each branch to ensure that if x >= 256, then y >= 256.
      if iszero(lt(y, 0x10000000000000000000000000000000000)) {
        y := shr(128, y)
        z := shl(64, z)
      }
      if iszero(lt(y, 0x1000000000000000000)) {
        y := shr(64, y)
        z := shl(32, z)
      }
      if iszero(lt(y, 0x10000000000)) {
        y := shr(32, y)
        z := shl(16, z)
      }
      if iszero(lt(y, 0x1000000)) {
        y := shr(16, y)
        z := shl(8, z)
      }

      // Goal was to get z*z*y within a small factor of x. More iterations could
      // get y in a tighter range. Currently, we will have y in [256, 256*2^16).
      // We ensured y >= 256 so that the relative difference between y and y+1 is small.
      // That's not possible if x < 256 but we can just verify those cases exhaustively.

      // Now, z*z*y <= x < z*z*(y+1), and y <= 2^(16+8), and either y >= 256, or x < 256.
      // Correctness can be checked exhaustively for x < 256, so we assume y >= 256.
      // Then z*sqrt(y) is within sqrt(257)/sqrt(256) of sqrt(x), or about 20bps.

      // For s in the range [1/256, 256], the estimate f(s) = (181/1024) * (s+1) is in the range
      // (1/2.84 * sqrt(s), 2.84 * sqrt(s)), with largest error when s = 1 and when s = 256 or 1/256.

      // Since y is in [256, 256*2^16), let a = y/65536, so that a is in [1/256, 256). Then we can estimate
      // sqrt(y) using sqrt(65536) * 181/1024 * (a + 1) = 181/4 * (y + 65536)/65536 = 181 * (y + 65536)/2^18.

      // There is no overflow risk here since y < 2^136 after the first branch above.
      z := shr(18, mul(z, add(y, 65536))) // A mul() is saved from starting z at 181.

      // Given the worst case multiplicative error of 2.84 above, 7 iterations should be enough.
      z := shr(1, add(z, div(x, z)))
      z := shr(1, add(z, div(x, z)))
      z := shr(1, add(z, div(x, z)))
      z := shr(1, add(z, div(x, z)))
      z := shr(1, add(z, div(x, z)))
      z := shr(1, add(z, div(x, z)))
      z := shr(1, add(z, div(x, z)))

      // If x+1 is a perfect square, the Babylonian method cycles between
      // floor(sqrt(x)) and ceil(sqrt(x)). This statement ensures we return floor.
      // See: https://en.wikipedia.org/wiki/Integer_square_root#Using_only_integer_division
      // Since the ceil is rare, we save gas on the assignment and repeat division in the rare case.
      // If you don't care whether the floor or ceil square root is returned, you can remove this statement.
      z := sub(z, lt(div(x, z), z))
    }
  }
}
