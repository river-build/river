// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {CommonBase} from "forge-std/Base.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {StdUtils} from "forge-std/StdUtils.sol";

import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaFactory} from "@llama/src/LlamaFactory.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

contract BaseHandler is CommonBase, StdCheats, StdUtils {
  // =========================
  // ======== Storage ========
  // =========================

  // Protocol contracts.
  LlamaFactory public immutable LLAMA_FACTORY;
  LlamaCore public immutable LLAMA_CORE;
  LlamaPolicy public immutable POLICY;

  // Handler state.
  address[] internal actors;
  uint256[] internal timestamps;
  uint256 currentTimestamp;

  bytes32[] internal seenPermissionIds; // All Permission IDs seen.
  mapping(bytes8 => bool) internal havePermissionId; // Whether a Permission ID has been seen.

  // Metrics.
  mapping(string => uint256) public calls;

  // =============================
  // ======== Constructor ========
  // =============================

  constructor(LlamaFactory _llamaFactory, LlamaCore _llamaCore) {
    LLAMA_FACTORY = _llamaFactory;
    LLAMA_CORE = _llamaCore;
    POLICY = LLAMA_CORE.policy();

    // Set initial timestamp to current timestamp.
    _handler_increaseTimestampBy(block.timestamp);
  }

  // =========================================================
  // ======== Methods and Modifiers for Policyholders ========
  // =========================================================

  // -------- Metrics --------
  // Used to record the number of times each method on a handler contract is called.
  modifier recordCall(string memory name) {
    calls[name]++;
    _;
  }

  // Used to record code paths hit within invariant tests, but for simplicity it uses the same mapping.
  function recordMetric(string memory name) internal {
    calls[name]++;
  }

  function callSummary() public view virtual {
    // In the most-derived handler contract, implement your own `callSummary` method that
    // overrides this and calls `super.callSummary()`. Then in the invariant test contract add
    // add a test like this:
    //   function invariant_CallSummary() public view {
    //     handler.callSummary();
    //    }
    console2.log("\n  \u001b[01mCall Summary\u001b[0m");
    console2.log("-----------------------------------------------");
    console2.log(
      "handler_addActor                 ",
      calls["handler_addActor"]
    );
    console2.log(
      "handler_increaseTimestampBy      ",
      calls["handler_increaseTimestampBy"]
    );
  }

  // -------- Actor Management --------
  modifier useActor(uint256 seed) {
    if (actors.length == 0) handler_addActor();
    vm.startPrank(actors[seed % actors.length]);
    _;
    vm.stopPrank();
  }

  function handler_addActor() public recordCall("handler_addActor") {
    string memory actorName = string(
      abi.encodePacked("actor", vm.toString(actors.length))
    );
    actors.push(makeAddr(actorName));
  }

  function getActors() public view returns (address[] memory) {
    return actors;
  }

  // -------- Timestamp Management --------
  modifier useCurrentTimestamp() {
    vm.warp(currentTimestamp);
    _;
    _handler_increaseTimestampBy(1);
  }

  function handler_increaseTimestampBy(
    uint256 timeToIncrease
  ) public recordCall("handler_increaseTimestampBy") {
    _handler_increaseTimestampBy(timeToIncrease);
  }

  function _handler_increaseTimestampBy(uint256 timeToIncrease) internal {
    timeToIncrease = bound(timeToIncrease, 0, 8 weeks);
    uint256 newTimestamp = currentTimestamp + timeToIncrease;
    timestamps.push(newTimestamp);
    currentTimestamp = newTimestamp;
  }

  // -------- Generic Helpers --------
  function recordPermissionId(bytes8 permissionId) internal {
    if (!havePermissionId[permissionId]) {
      seenPermissionIds.push(permissionId);
      havePermissionId[permissionId] = true;
    }
  }

  function getSeenPermissionIds() public view returns (bytes32[] memory) {
    return seenPermissionIds;
  }

  function getPolicyIds() public view returns (uint256[] memory) {
    uint256[] memory policyIds = new uint256[](actors.length);
    for (uint256 i = 0; i < actors.length; i++) {
      uint256 policyId = uint256(uint160(actors[i]));
      policyIds[i] = policyId;
    }
    return policyIds;
  }
}
