// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @dev Tests in this contract mirror those in OpenZeppelin's Checkpoints.test.js, which is why
/// the tests are written in a different style than the rest of the tests in this repo (i.e. they
/// do not follow the "one contract per method" pattern).
/// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/d00acef4059807535af0bd0dd0ddf619747a044b/@llama/test/utils/Checkpoints.test.js
import {Test, console2} from "forge-std/Test.sol";

import {SupplyCheckpoints} from "@llama/src/lib/SupplyCheckpoints.sol";

/// @dev The SupplyCheckpointsMock harness contract has its external functions written according to
/// https://github.com/foundry-rs/foundry/pull/3128#issuecomment-1241245086
/// so that test coverage is captured for the SupplyCheckpoints library.
contract SupplyCheckpointsMock {
  SupplyCheckpoints.History private _totalCheckpoints;

  function printCheckpoints() public view {
    for (uint256 i = 0; i < length(); i++) {
      SupplyCheckpoints.Checkpoint memory ckpt = _totalCheckpoints._checkpoints[
        i
      ];
      console2.log(ckpt.timestamp, ckpt.numberOfHolders, ckpt.totalQuantity);
    }
  }

  function latest()
    external
    view
    returns (uint256 numberOfHolders, uint256 totalQuantity)
  {
    (numberOfHolders, totalQuantity) = SupplyCheckpoints.latest(
      _totalCheckpoints
    );
    return (numberOfHolders, totalQuantity);
  }

  function latestCheckpoint()
    public
    view
    returns (
      bool exists,
      uint256 timestamp,
      uint256 numberOfHolders,
      uint256 totalQuantity
    )
  {
    (exists, timestamp, numberOfHolders, totalQuantity) = SupplyCheckpoints
      .latestCheckpoint(_totalCheckpoints);
    return (exists, timestamp, numberOfHolders, totalQuantity);
  }

  function length() public view returns (uint256) {
    uint256 numCkpts = SupplyCheckpoints.length(_totalCheckpoints);
    return numCkpts;
  }

  function push(uint256 numberOfHolders, uint256 totalQuantity) public {
    SupplyCheckpoints.push(_totalCheckpoints, numberOfHolders, totalQuantity);
  }

  function getAtProbablyRecentTimestamp(
    uint256 timestamp
  ) public view returns (uint256 numberOfHolders, uint256 totalQuantity) {
    (numberOfHolders, totalQuantity) = SupplyCheckpoints
      .getAtProbablyRecentTimestamp(_totalCheckpoints, timestamp);
    return (numberOfHolders, totalQuantity);
  }
}

contract CheckpointsTest is Test {
  SupplyCheckpointsMock checkpoints;

  function setUp() public virtual {
    checkpoints = new SupplyCheckpointsMock();
  }

  function assertEqLatest(
    uint256 expectedNumberOfHolders,
    uint256 expectedTotalQuantity
  ) internal {
    (uint256 actualNumberOfHolders, uint256 actualTotalQuantity) = checkpoints
      .latest();
    assertEq(
      actualNumberOfHolders,
      expectedNumberOfHolders,
      "numberOfHolders mismatch"
    );
    assertEq(
      actualTotalQuantity,
      expectedTotalQuantity,
      "totalQuantity mismatch"
    );
  }

  function assertEqLatestCheckpoint(
    bool expectedExists,
    uint256 expectedTimestamp,
    uint256 expectedNumberOfHolders,
    uint256 expectedTotalQuantity
  ) internal {
    (
      bool exists,
      uint256 timestamp,
      uint256 numberOfHolders,
      uint256 totalQuantity
    ) = checkpoints.latestCheckpoint();
    assertEq(exists, expectedExists, "exists mismatch");
    assertEq(timestamp, expectedTimestamp, "timestamp mismatch");
    assertEq(
      numberOfHolders,
      expectedNumberOfHolders,
      "numberOfHolders mismatch"
    );
    assertEq(totalQuantity, expectedTotalQuantity, "totalQuantity mismatch");
  }

  function assertEqGetAtProbablyRecentTimestamp(
    uint256 timestamp,
    uint256 expectedNumberOfHolders,
    uint256 expectedTotalQuantity
  ) internal {
    (uint256 actualNumberOfHolders, uint256 actualTotalQuantity) = checkpoints
      .getAtProbablyRecentTimestamp(timestamp);
    assertEq(
      actualNumberOfHolders,
      expectedNumberOfHolders,
      "numberOfHolders mismatch"
    );
    assertEq(
      actualTotalQuantity,
      expectedTotalQuantity,
      "totalQuantity mismatch"
    );
  }
}

// ====================================
// ======== OpenZeppelin Tests ========
// ====================================
// All tests within this section mirror the tests in OpenZeppelin's Checkpoints.test.js.

contract WithoutCheckpoints is CheckpointsTest {
  error UnsafeCast(uint256 n);

  function test_ReturnsZeroAsLatestValue() public {
    assertEqLatest(0, 0);
    assertEqLatestCheckpoint(false, 0, 0, 0);
  }

  function testFuzz_PushesCorrectDataTypes(
    uint64 timestamp,
    uint96 numberOfHolders,
    uint96 totalQuantity
  ) public {
    // This test should never revert if we cast data types correctly when pushing.
    vm.warp(timestamp);
    checkpoints.push(numberOfHolders, totalQuantity);
  }

  function testFuzz_RevertIf_InputsAreTooLarge(
    uint256 timestamp,
    uint256 numberOfHolders,
    uint256 totalQuantity
  ) public {
    if (timestamp > type(uint64).max) {
      vm.expectRevert(abi.encodeWithSelector(UnsafeCast.selector, timestamp));
    } else if (numberOfHolders > type(uint96).max) {
      vm.expectRevert(
        abi.encodeWithSelector(UnsafeCast.selector, numberOfHolders)
      );
    } else {
      totalQuantity = bound(
        totalQuantity,
        uint256(type(uint96).max) + 1,
        type(uint256).max
      );
      vm.expectRevert(
        abi.encodeWithSelector(UnsafeCast.selector, totalQuantity)
      );
    }
    vm.warp(timestamp);
    checkpoints.push(numberOfHolders, totalQuantity);
  }
}

contract WithCheckpoints is CheckpointsTest {
  uint256 t0;
  uint256 t1;
  uint256 t2;

  function setUp() public override {
    CheckpointsTest.setUp();

    vm.warp(block.timestamp + 1);
    t0 = block.timestamp;
    checkpoints.push(1, 1);

    vm.warp(block.timestamp + 1);
    t1 = block.timestamp;
    checkpoints.push(2, 5);

    vm.warp(block.timestamp + 2);
    t2 = block.timestamp;
    checkpoints.push(3, 7);

    vm.warp(block.timestamp + 3);
  }

  function test_ReturnsLatestValue() public {
    assertEqLatest(3, 7);
    assertEqLatestCheckpoint(true, t2, 3, 7);
  }

  function test_Lookup_ProbablyRecentTimestamp_ReturnsPastValues() public {
    assertEqGetAtProbablyRecentTimestamp(t0 - 1, 0, 0);
    assertEqGetAtProbablyRecentTimestamp(t0, 1, 1);
    assertEqGetAtProbablyRecentTimestamp(t1, 2, 5);

    assertEqGetAtProbablyRecentTimestamp(t1 + 1, 2, 5);
    assertEqGetAtProbablyRecentTimestamp(t2, 3, 7);
    assertEqGetAtProbablyRecentTimestamp(t2 + 1, 3, 7);
  }

  function test_Lookup_ProbablyRecentTimestamp_RevertIf_BlockTimestampEqualsCurrentTimestamp()
    public
  {
    vm.expectRevert("SupplyCheckpoints: timestamp is not in the past");
    checkpoints.getAtProbablyRecentTimestamp(block.timestamp);
  }

  function test_Lookup_ProbablyRecentTimestamp_RevertIf_BlockTimestampGreaterThanCurrentTimestamp()
    public
  {
    vm.expectRevert("SupplyCheckpoints: timestamp is not in the past");
    checkpoints.getAtProbablyRecentTimestamp(block.timestamp + 1);
  }

  function test_MultipleCheckpointsAtTheSameTimestamp() public {
    uint256 lengthBefore = checkpoints.length();

    checkpoints.push(8, 10);
    checkpoints.push(9, 15);
    checkpoints.push(10, 22);

    vm.warp(block.timestamp + 1);

    assertEq(checkpoints.length(), lengthBefore + 1);
    assertEqLatest(10, 22);
    assertEqLatestCheckpoint(true, block.timestamp - 1, 10, 22);
    assertEqGetAtProbablyRecentTimestamp(block.timestamp - 1, 10, 22);
  }
}
