// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {Vm} from "forge-std/Test.sol";
import {DeployDiamond} from "contracts/scripts/deployments/utils/DeployDiamond.s.sol";
import {DeployMockERC20} from "contracts/scripts/deployments/utils/DeployMockERC20.s.sol";
import {DeployDropFacet} from "contracts/scripts/deployments/facets/DeployDropFacet.s.sol";
import {DeployRewardsDistributionV2} from "contracts/scripts/deployments/facets/DeployRewardsDistributionV2.s.sol";

//interfaces
import {IDiamond} from "contracts/src/diamond/Diamond.sol";
import {IDropFacetBase} from "contracts/src/tokens/drop/IDropFacet.sol";
import {IOwnableBase} from "contracts/src/diamond/facets/ownable/IERC173.sol";

//libraries
import {MerkleTree} from "contracts/test/utils/MerkleTree.sol";
import {DropFacet} from "contracts/src/tokens/drop/DropFacet.sol";
import {RewardsDistribution} from "contracts/src/base/registry/facets/distribution/v2/RewardsDistribution.sol";
import {BasisPoints} from "contracts/src/utils/libraries/BasisPoints.sol";
import {DropStorage} from "contracts/src/tokens/drop/DropStorage.sol";
import {EIP712Utils} from "contracts/test/utils/EIP712Utils.sol";
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";
import {River} from "contracts/src/tokens/river/base/River.sol";
import {NodeOperatorFacet} from "contracts/src/base/registry/facets/operator/NodeOperatorFacet.sol";
import {EIP712Facet} from "contracts/src/diamond/utils/cryptography/signature/EIP712Facet.sol";

contract DropFacetTest is BaseSetup, EIP712Utils, IDropFacetBase, IOwnableBase {
  bytes32 internal constant STAKE_TYPEHASH =
    keccak256(
      "Stake(uint96 amount,address delegatee,address beneficiary,address owner,uint256 nonce,uint256 deadline)"
    );
  struct ClaimData {
    address claimer;
    uint16 amount;
  }

  uint256 internal constant TOTAL_TOKEN_AMOUNT = 1000;

  DeployDiamond internal rewardsDistributionDiamondHelper = new DeployDiamond();
  DeployDiamond internal aidropDiamondHelper = new DeployDiamond();
  DeployMockERC20 internal tokenHelper = new DeployMockERC20();
  DeployDropFacet internal dropHelper = new DeployDropFacet();
  DeployRewardsDistributionV2 internal rewardsDistributionHelper =
    new DeployRewardsDistributionV2();
  MerkleTree internal merkleTree = new MerkleTree();

  River internal river;
  DropFacet internal dropFacet;
  RewardsDistribution internal rewardsDistribution;
  NodeOperatorFacet internal operatorFacet;

  mapping(address => uint256) internal treeIndex;
  address[] internal accounts;
  uint256[] internal amounts;

  bytes32[][] internal tree;
  bytes32 internal root;

  address internal bob;
  uint256 internal bobKey;
  address internal alice;
  uint256 internal aliceKey;

  function setUp() public override {
    super.setUp();

    (bob, bobKey) = makeAddrAndKey("bob");
    (alice, aliceKey) = makeAddrAndKey("alice");

    // Create the Merkle tree with accounts and amounts
    _createTree();

    // Add the Drop facet to its own diamond
    address dropAddress = dropHelper.deploy(deployer);
    aidropDiamondHelper.addFacet(
      dropHelper.makeCut(dropAddress, IDiamond.FacetCutAction.Add),
      dropAddress,
      dropHelper.makeInitData(baseRegistry)
    );

    // Deploy the diamond contract with the MerkleAirdrop facet
    address diamond = aidropDiamondHelper.deploy(deployer);

    // Initialize the Drop facet
    dropFacet = DropFacet(diamond);

    // Initialize the River river
    river = River(riverToken);

    // Operator
    operatorFacet = NodeOperatorFacet(baseRegistry);

    // EIP712
    eip712Facet = EIP712Facet(baseRegistry);

    // RewardsDistribution
    rewardsDistribution = RewardsDistribution(baseRegistry);
  }

  modifier givenTokensMinted(uint256 amount) {
    vm.prank(bridge);
    river.mint(address(dropFacet), amount);
    _;
  }

  modifier givenClaimConditionSet(uint16 penaltyBps) {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    );
    conditions[0].penaltyBps = penaltyBps;

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);
    _;
  }

  modifier givenWalletHasClaimedWithPenalty(address wallet, address caller) {
    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    ClaimCondition memory condition = dropFacet.getClaimConditionById(
      conditionId
    );
    uint256 penaltyBps = condition.penaltyBps;
    uint256 merkleAmount = amounts[treeIndex[wallet]];
    uint256 penaltyAmount = BasisPoints.calculate(merkleAmount, penaltyBps);
    uint256 expectedAmount = merkleAmount - penaltyAmount;
    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[wallet]);

    vm.prank(caller);
    vm.expectEmit(address(dropFacet));
    emit DropFacet_Claimed_WithPenalty(
      conditionId,
      caller,
      wallet,
      expectedAmount
    );
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: wallet,
        quantity: merkleAmount,
        proof: proof
      })
    );
    _;
  }

  // getActiveClaimConditionId
  function test_getActiveClaimConditionId() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](3);
    conditions[0] = _createClaimCondition(
      block.timestamp - 100,
      root,
      TOTAL_TOKEN_AMOUNT
    ); // expired
    conditions[1] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    ); // active
    conditions[2] = _createClaimCondition(
      block.timestamp + 100,
      root,
      TOTAL_TOKEN_AMOUNT
    ); // future

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 id = dropFacet.getActiveClaimConditionId();
    assertEq(id, 1);

    vm.warp(block.timestamp + 100);
    id = dropFacet.getActiveClaimConditionId();
    assertEq(id, 2);
  }

  function test_getActiveClaimConditionId_revertWhen_noActiveClaimCondition()
    external
  {
    vm.expectRevert(DropFacet__NoActiveClaimCondition.selector);
    dropFacet.getActiveClaimConditionId();
  }

  // getClaimConditionById
  function test_getClaimConditionById(
    uint16 penaltyBps
  ) external givenClaimConditionSet(penaltyBps) {
    ClaimCondition memory condition = dropFacet.getClaimConditionById(
      dropFacet.getActiveClaimConditionId()
    );
    assertEq(condition.startTimestamp, block.timestamp);
    assertEq(condition.maxClaimableSupply, TOTAL_TOKEN_AMOUNT);
    assertEq(condition.supplyClaimed, 0);
    assertEq(condition.merkleRoot, root);
    assertEq(condition.currency, address(river));
    assertEq(condition.penaltyBps, penaltyBps);
  }

  // claimWithPenalty
  function test_claimWithPenalty_fuzz(ClaimData[] memory claimData) external {
    vm.assume(claimData.length > 0 && claimData.length <= 1000);

    uint256 totalAmount;
    address[] memory claimers = new address[](claimData.length);
    uint256[] memory claimAmounts = new uint256[](claimData.length);

    for (uint256 i = 0; i < claimData.length; i++) {
      claimData[i].claimer = claimData[i].claimer == address(0)
        ? _randomAddress()
        : claimData[i].claimer;
      claimers[i] = claimData[i].claimer;
      claimAmounts[i] = claimData[i].amount == 0 ? 1 : claimData[i].amount;
      claimData[i].amount = uint16(claimAmounts[i]);
      totalAmount += claimAmounts[i];
    }

    vm.prank(bridge);
    river.mint(address(dropFacet), totalAmount);

    (root, tree) = merkleTree.constructTree(claimers, claimAmounts);

    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = ClaimCondition({
      startTimestamp: uint40(block.timestamp),
      endTimestamp: 0,
      maxClaimableSupply: totalAmount,
      supplyClaimed: 0,
      merkleRoot: root,
      currency: address(river),
      penaltyBps: 5000
    });

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();
    ClaimCondition memory condition = dropFacet.getClaimConditionById(
      conditionId
    );

    for (uint256 i = 0; i < claimData.length; i++) {
      address claimer = claimData[i].claimer;
      uint16 amount = claimData[i].amount;

      uint256 penaltyBps = condition.penaltyBps;
      uint256 penaltyAmount = BasisPoints.calculate(amount, penaltyBps);
      uint256 expectedAmount = amount - penaltyAmount;

      if (dropFacet.getSupplyClaimedByWallet(claimer, conditionId) > 0) {
        continue;
      }

      bytes32[] memory proof = merkleTree.getProof(tree, i);

      vm.prank(claimer);
      vm.expectEmit(address(dropFacet));
      emit DropFacet_Claimed_WithPenalty(
        conditionId,
        claimer,
        claimer,
        expectedAmount
      );
      dropFacet.claimWithPenalty(
        Claim({
          conditionId: conditionId,
          account: claimer,
          quantity: amount,
          proof: proof
        })
      );

      assertEq(
        dropFacet.getSupplyClaimedByWallet(claimer, conditionId),
        expectedAmount
      );
    }
  }

  function test_claimWithPenalty()
    external
    givenTokensMinted(TOTAL_TOKEN_AMOUNT)
    givenClaimConditionSet(5000)
    givenWalletHasClaimedWithPenalty(bob, bob)
  {
    uint256 expectedAmount = _calculateExpectedAmount(bob);
    assertEq(river.balanceOf(bob), expectedAmount);
  }

  function test_revertWhen_merkleRootNotSet() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      bytes32(0),
      TOTAL_TOKEN_AMOUNT
    );

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__MerkleRootNotSet.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: 100,
        proof: new bytes32[](0)
      })
    );
  }

  function test_revertWhen_quantityIsZero() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    );

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__QuantityMustBeGreaterThanZero.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: 0,
        proof: new bytes32[](0)
      })
    );
  }

  function test_revertWhen_exceedsMaxClaimableSupply() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    );
    conditions[0].maxClaimableSupply = 100; // 100 tokens in total for this condition

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__ExceedsMaxClaimableSupply.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: 101,
        proof: new bytes32[](0)
      })
    );
  }

  function test_revertWhen_claimHasNotStarted() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    );

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob]);

    vm.warp(block.timestamp - 100);

    vm.prank(bob);
    vm.expectRevert(DropFacet__ClaimHasNotStarted.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: amounts[treeIndex[bob]],
        proof: proof
      })
    );
  }

  function test_revertWhen_claimHasEnded() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    );
    conditions[0].endTimestamp = uint40(block.timestamp + 100);

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob]);

    vm.warp(conditions[0].endTimestamp);

    vm.expectRevert(DropFacet__ClaimHasEnded.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: amounts[treeIndex[bob]],
        proof: proof
      })
    );
  }

  function test_revertWhen_alreadyClaimed()
    external
    givenTokensMinted(TOTAL_TOKEN_AMOUNT)
  {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    );

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob]);

    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: amounts[treeIndex[bob]],
        proof: proof
      })
    );

    vm.expectRevert(DropFacet__AlreadyClaimed.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: amounts[treeIndex[bob]],
        proof: proof
      })
    );
  }

  function test_revertWhen_invalidProof()
    external
    givenClaimConditionSet(5000)
  {
    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__InvalidProof.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: amounts[treeIndex[bob]],
        proof: new bytes32[](0)
      })
    );
  }

  // claimAndStake
  function test_claimAndStake(
    address caller,
    address operator,
    uint256 commissionRate
  )
    external
    givenTokensMinted(TOTAL_TOKEN_AMOUNT)
    givenClaimConditionSet(5000)
  {
    vm.assume(caller != address(0));
    vm.assume(operator != address(0));
    vm.assume(commissionRate > 0);
    commissionRate = bound(commissionRate, 0, 10000);

    vm.startPrank(operator);
    operatorFacet.registerOperator(operator);
    operatorFacet.setCommissionRate(commissionRate);
    vm.stopPrank();

    uint256 conditionId = dropFacet.getActiveClaimConditionId();
    uint256 amount = amounts[treeIndex[bob]];

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob]);

    uint256 deadline = block.timestamp + 100;
    bytes memory signature = _signStake(operator, bob, deadline);

    vm.prank(caller);
    vm.expectEmit(address(dropFacet));
    emit DropFacet_Claimed_And_Staked(conditionId, caller, bob, amount);
    dropFacet.claimAndStake(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: amounts[treeIndex[bob]],
        proof: proof
      }),
      operator,
      deadline,
      signature
    );

    assertEq(
      rewardsDistribution.stakedByDepositor(bob),
      amount,
      "stakedByDepositor"
    );
  }

  // setClaimConditions
  function test_setClaimConditions() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    );

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();
    assertEq(conditionId, 0);
  }

  function test_setClaimConditions_resetEligibility()
    external
    givenTokensMinted(TOTAL_TOKEN_AMOUNT)
    givenClaimConditionSet(5000)
    givenWalletHasClaimedWithPenalty(bob, bob)
  {
    uint256 conditionId = dropFacet.getActiveClaimConditionId();
    uint256 expectedAmount = _calculateExpectedAmount(bob);

    assertEq(
      dropFacet.getSupplyClaimedByWallet(bob, conditionId),
      expectedAmount
    );

    vm.warp(block.timestamp + 100);

    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    );

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, true);

    uint256 newConditionId = dropFacet.getActiveClaimConditionId();
    assertEq(newConditionId, 1);

    assertEq(dropFacet.getSupplyClaimedByWallet(bob, newConditionId), 0);
  }

  function test_fuzz_setClaimConditions_revertWhen_notOwner(
    address caller
  ) external {
    vm.assume(caller != deployer);

    vm.prank(caller);
    vm.expectRevert(abi.encodeWithSelector(Ownable__NotOwner.selector, caller));
    dropFacet.setClaimConditions(new ClaimCondition[](0), false);
  }

  function test_revertWhen_setClaimConditions_notInAscendingOrder() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](2);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    );
    conditions[1] = _createClaimCondition(
      block.timestamp - 100,
      root,
      TOTAL_TOKEN_AMOUNT
    );

    vm.expectRevert(DropFacet__ClaimConditionsNotInAscendingOrder.selector);
    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);
  }

  function test_revertWhen_setClaimConditions_exceedsMaxClaimableSupply()
    external
    givenTokensMinted(TOTAL_TOKEN_AMOUNT)
  {
    // Create a single claim condition
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root, 100);

    // Set the claim conditions as the deployer
    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    // Get the active condition ID
    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    // Generate Merkle proof for Bob
    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob]);

    // Simulate Bob claiming tokens
    vm.prank(bob);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: amounts[treeIndex[bob]],
        proof: proof
      })
    );

    // Move time forward
    vm.warp(block.timestamp + 100);

    // Attempt to set a new max claimable supply lower than what's already been claimed
    conditions[0].maxClaimableSupply = 99; // Try to set max supply to 99 tokens

    // Expect the transaction to revert when trying to set new claim conditions
    vm.expectRevert(DropFacet__CannotSetClaimConditions.selector);
    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);
  }

  // =============================================================
  // End-to-end tests
  // =============================================================

  // we create 2 claim conditions, one with no end time, one with an end time 100 blocks from now
  // we claim some tokens from the first condition, and then activate the second condition
  // we claim some more tokens from the second condition
  // we try to claim from the first condition by alice, this should pass
  // we reach the end of the second condition, and try to claim from it, this should fail
  function test_endToEnd_claimWithPenalty()
    external
    givenTokensMinted(TOTAL_TOKEN_AMOUNT)
  {
    ClaimCondition[] memory conditions = new ClaimCondition[](2);
    conditions[0] = _createClaimCondition(
      block.timestamp,
      root,
      TOTAL_TOKEN_AMOUNT
    ); // endless claim condition

    conditions[1] = _createClaimCondition(
      block.timestamp + 100,
      root,
      TOTAL_TOKEN_AMOUNT
    );
    conditions[1].endTimestamp = uint40(block.timestamp + 200); // ends at block.timestamp + 200

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    // bob claims from the first condition
    uint256 bobIndex = treeIndex[bob];
    bytes32[] memory proof = merkleTree.getProof(tree, bobIndex);
    vm.prank(bob);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: amounts[bobIndex],
        proof: proof
      })
    );
    assertEq(
      dropFacet.getSupplyClaimedByWallet(bob, conditionId),
      _calculateExpectedAmount(bob)
    );

    // activate the second condition
    vm.warp(block.timestamp + 100);

    // alice claims from the second condition
    conditionId = dropFacet.getActiveClaimConditionId();
    uint256 aliceIndex = treeIndex[alice];
    proof = merkleTree.getProof(tree, aliceIndex);
    vm.prank(alice);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: alice,
        quantity: amounts[aliceIndex],
        proof: proof
      })
    );
    assertEq(
      dropFacet.getSupplyClaimedByWallet(alice, conditionId),
      _calculateExpectedAmount(alice)
    );

    // finalize the second condition
    vm.warp(block.timestamp + 100);

    // bob tries to claim from the second condition, this should fail
    vm.expectRevert(DropFacet__ClaimHasEnded.selector);
    vm.prank(bob);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob,
        quantity: amounts[bobIndex],
        proof: proof
      })
    );

    // alice is still able to claim from the first condition
    conditionId = dropFacet.getActiveClaimConditionId();
    vm.prank(alice);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: alice,
        quantity: amounts[aliceIndex],
        proof: proof
      })
    );
    assertEq(
      dropFacet.getSupplyClaimedByWallet(alice, conditionId),
      _calculateExpectedAmount(alice)
    );
  }

  function test_storage_slot() external pure {
    bytes32 slot = keccak256(
      abi.encode(uint256(keccak256("diamond.facets.drop.storage")) - 1)
    ) & ~bytes32(uint256(0xff));
    assertEq(slot, DropStorage.STORAGE_SLOT, "slot");
  }

  // =============================================================
  //                           Internal
  // =============================================================

  function _createClaimCondition(
    uint256 _startTime,
    bytes32 _merkleRoot,
    uint256 _maxClaimableSupply
  ) internal view returns (ClaimCondition memory) {
    return
      ClaimCondition({
        startTimestamp: uint40(_startTime),
        endTimestamp: 0,
        maxClaimableSupply: _maxClaimableSupply,
        supplyClaimed: 0,
        merkleRoot: _merkleRoot,
        currency: address(river),
        penaltyBps: 0
      });
  }

  function _calculateExpectedAmount(
    address _account
  ) internal view returns (uint256) {
    ClaimCondition memory condition = dropFacet.getClaimConditionById(
      dropFacet.getActiveClaimConditionId()
    );
    uint256 penaltyBps = condition.penaltyBps;
    uint256 amount = amounts[treeIndex[_account]];
    uint256 penaltyAmount = BasisPoints.calculate(amount, penaltyBps);
    uint256 expectedAmount = amount - penaltyAmount;
    return expectedAmount;
  }

  function _createTree() internal {
    // Create the Merkle tree with accounts and amounts
    accounts.push(bob);
    amounts.push(100);
    accounts.push(alice);
    amounts.push(200);

    treeIndex[bob] = 0;
    treeIndex[alice] = 1;
    (root, tree) = merkleTree.constructTree(accounts, amounts);
  }

  function _signStake(
    address operator,
    address beneficiary,
    uint256 deadline
  ) internal view returns (bytes memory) {
    bytes32 structHash = keccak256(
      abi.encode(
        STAKE_TYPEHASH,
        amounts[treeIndex[beneficiary]],
        operator,
        beneficiary,
        beneficiary,
        eip712Facet.nonces(beneficiary),
        deadline
      )
    );
    (uint8 v, bytes32 r, bytes32 s) = signIntent(
      bobKey,
      address(eip712Facet),
      structHash
    );
    return abi.encodePacked(r, s, v);
  }
}
