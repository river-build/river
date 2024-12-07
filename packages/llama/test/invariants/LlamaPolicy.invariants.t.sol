// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {CommonBase} from "forge-std/Base.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {StdUtils} from "forge-std/StdUtils.sol";

import {BaseHandler} from "@llama/test/invariants/BaseHandler.sol";
import {LlamaCoreTest} from "@llama/test/LlamaCore.t.sol";

import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaFactory} from "@llama/src/LlamaFactory.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

contract LlamaPolicyHandler is BaseHandler {
  // =============================
  // ======== Constructor ========
  // =============================

  constructor(
    LlamaFactory _llamaFactory,
    LlamaCore _llamaCore
  ) BaseHandler(_llamaFactory, _llamaCore) {
    // TODO Set some initial permissions, each actor is a policyholder.
  }

  // =========================
  // ======== Helpers ========
  // =========================

  function callSummary() public view override {
    BaseHandler.callSummary();
    console2.log(
      "llamaPolicyNFT_batchGrantPolicies      ",
      calls["llamaPolicyNFT_batchGrantPolicies"]
    );
    console2.log(
      "llamaPolicyNFT_batchUpdatePermissions  ",
      calls["llamaPolicyNFT_batchUpdatePermissions"]
    );
    console2.log(
      "llamaPolicyNFT_batchRevokePolicies     ",
      calls["llamaPolicyNFT_batchRevokePolicies"]
    );
    console2.log("-----------------------------------------------");
    console2.log(
      "policyholdersHadBalanceOf_0      ",
      calls["policyholdersHadBalanceOf_0"]
    );
    console2.log(
      "policyholdersHadBalanceOf_1      ",
      calls["policyholdersHadBalanceOf_1"]
    );
  }

  // ====================================
  // ======== Methods for Fuzzer ========
  // ====================================

  function llamaPolicyNFT_batchGrantPolicies()
    public
    recordCall("llamaPolicyNFT_batchGrantPolicies")
  {
    vm.prank(address(POLICY.llamaExecutor()));
    // TODO Implement this call, record all permissionIds seen with `recordPermissionId(bytes8)`
  }

  function llamaPolicyNFT_batchUpdatePermissions()
    public
    recordCall("llamaPolicyNFT_batchUpdatePermissions")
  {
    vm.prank(address(POLICY.llamaExecutor()));
    // TODO Implement this call, record all permissionIds seen with `recordPermissionId(bytes8)`
  }

  function llamaPolicyNFT_batchRevokePolicies()
    public
    recordCall("llamaPolicyNFT_batchRevokePolicies")
  {
    vm.prank(address(POLICY.llamaExecutor()));
    // TODO Implement this call, record all permissionIds seen with `recordPermissionId(bytes8)`
  }
}

contract LlamaFactoryInvariants is LlamaCoreTest {
  // TODO Remove inheritance on LlamaCoreTest once https://github.com/llamaxyz/llama/issues/38 is
  // completed. Inheriting from it now just to simplify the test setup, but ideally our invariant
  // tests would not be coupled to our unit tests in this way.

  LlamaPolicyHandler public handler;

  function setUp() public override {
    LlamaCoreTest.setUp();
    handler = new LlamaPolicyHandler(factory, mpCore);

    // TODO Set this up and write tests.
    targetSender(makeAddr("invariantSender")); // TODO why does removing this result in failure due to clone being
    // deployed to a sender's address?
    targetContract(address(handler));
  }

  // ======================================
  // ======== Invariant Assertions ========
  // ======================================

  // For a given permission ID and timestamp, the sum of that permission's quantity over all policyholders
  // with that permission should equal the total supply of that permission ID.
  function assertInvariant_ForEachPermissionId_SumOfPermissionsOverAllPolicyholdersEqualsTotalSupply()
    public
    view
  {
    // TODO Update this for the new permissions scheme.
    // bytes32[] memory allPermissionIds = handler.getPermissionIds();
    // for (uint256 i = 0; i < allPermissionIds.length; i++) {
    //   PermissionIdCheckpoint[] memory checkpoints =
    // mpPolicy.getTokenPermissionSupplyCheckpoints(allPermissionIds[i]);
    //   for (uint256 j = 0; j < checkpoints.length; j++) {
    //     uint256 sumOfPermissionsOverAllPolicyholders = 0;
    //     address[] memory policyholders = handler.getActors();
    //     for (uint256 k = 0; k < policyholders.length; k++) {
    //       bool hasPermission =
    //         mpPolicy.holderQuantityAt(policyholders[k], allPermissionIds[i], checkpoints[j].timestamp) > 0;
    //       sumOfPermissionsOverAllPolicyholders += hasPermission ? 1 : 0;
    //     }
    //     require(
    //       sumOfPermissionsOverAllPolicyholders == checkpoints[j].quantity,
    //       string.concat(
    //         "sum of permissions over all policyholders should equal total supply: ",
    //         "(permissionId, timestamp) =",
    //         "(",
    //         vm.toString(allPermissionIds[i]),
    //         ", ",
    //         vm.toString(checkpoints[j].timestamp),
    //         ")"
    //       )
    //     );
    //   }
    // }
  }

  // For a given permission ID,the tokenPermissionCheckpoints array should always be sorted by
  // timestamp in ascending order, with no duplicate timestamps.
  function assertInvariant_TokenPermissionSupplyCheckpointsAreAlwaysSortedByUniqueTimestamp()
    public
    view
  {
    // TODO Update this for the new permissions scheme.
    // uint256[] memory allPolicyIds = handler.getPolicyIds();
    // bytes32[] memory allPermissionIds = handler.getPermissionIds();
    // for (uint256 i = 0; i < allPolicyIds.length; i++) {
    //   // The use of `<` here instead of `<=` is intentional and disallows two checkpoints
    //   // with the same timestamp.
    //   for (uint256 j = 0; j < allPermissionIds.length; j++) {
    //     PermissionIdCheckpoint[] memory checkpoints =
    //       mpPolicy.getTokenPermissionCheckpoints(allPolicyIds[i], allPermissionIds[j]);
    //     for (uint256 k = 1; k < checkpoints.length; k++) {
    //       require(
    //         checkpoints[k - 1].timestamp < checkpoints[k].timestamp,
    //         string.concat(
    //           "tokenPermissionCheckpoints should be sorted by timestamp: ",
    //           "(policyId, permissionId) =",
    //           "(",
    //           vm.toString(allPolicyIds[i]),
    //           ", ",
    //           vm.toString(allPermissionIds[j]),
    //           ")"
    //         )
    //       );
    //     }
    //   }
    // }
  }

  // The policyId, i.e. the token ID, held by a given policyholder should always match that policyholder's address.
  function assertInvariant_DeterministicPolicyIds() public view {
    address[] memory policyholders = handler.getActors();
    for (uint256 i = 0; i < policyholders.length; i++) {
      if (mpPolicy.balanceOf(policyholders[i]) == 0) continue;
      uint256 expectedTokenId = uint256(uint160(policyholders[i]));
      require(
        mpPolicy.ownerOf(expectedTokenId) == policyholders[i],
        "policyId should match policyholder address"
      );
    }
  }

  // A policyholder should never have more than one policy NFT.
  function assertInvariant_PolicyholdersShouldNeverHaveMoreThanOneNFT()
    public
    view
  {
    address[] memory policyholders = handler.getActors();
    for (uint256 i = 0; i < policyholders.length; i++) {
      require(
        mpPolicy.balanceOf(policyholders[i]) <= 1,
        "policyholders should never have more than one NFT"
      );
    }
  }

  // =================================
  // ======== Invariant Tests ========
  // =================================

  function invariant_AllPolicyInvariants() public view {
    assertInvariant_ForEachPermissionId_SumOfPermissionsOverAllPolicyholdersEqualsTotalSupply();
    assertInvariant_TokenPermissionSupplyCheckpointsAreAlwaysSortedByUniqueTimestamp();
    assertInvariant_DeterministicPolicyIds();
    assertInvariant_PolicyholdersShouldNeverHaveMoreThanOneNFT();
  }

  function invariant_CallSummary() public view {
    // address[] memory policyholders = handler.getActors();
    // for (uint256 i = 0; i < policyholders.length; i++) {
    // uint256 balance = mpPolicy.balanceOf(policyholders[i]);
    // if (balance == 0) handler.recordMetric("policyholdersHadBalanceOf_0");
    // else if (balance == 1) handler.recordMetric("policyholdersHadBalanceOf_1");
    // else handler.recordMetric("policyholdersHadBalanceOf_2+");
    // }

    handler.callSummary();
  }
}
