// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {Vm} from "forge-std/Test.sol";
import {TestUtils} from "contracts/test/utils/TestUtils.sol";
import {DeployDiamond} from "contracts/scripts/deployments/utils/DeployDiamond.s.sol";
import {DeployMockERC20} from "contracts/scripts/deployments/utils/DeployMockERC20.s.sol";
import {DeployDropFacet} from "contracts/scripts/deployments/facets/DeployDropFacet.s.sol";

//interfaces
import {IDiamond} from "contracts/src/diamond/Diamond.sol";
import {IDropFacetBase} from "contracts/src/tokens/drop/IDropFacet.sol";
import {IOwnableBase} from "contracts/src/diamond/facets/ownable/IERC173.sol";
//libraries
import {MerkleTree} from "contracts/test/utils/MerkleTree.sol";
import {DropFacet} from "contracts/src/tokens/drop/DropFacet.sol";
import {MockERC20} from "contracts/test/mocks/MockERC20.sol";
import {BasisPoints} from "contracts/src/utils/libraries/BasisPoints.sol";
import {DropStorage} from "contracts/src/tokens/drop/DropStorage.sol";

contract DropFacetTest is TestUtils, IDropFacetBase, IOwnableBase {
  uint256 internal constant TOTAL_TOKEN_AMOUNT = 1000;

  DeployDiamond internal diamondHelper = new DeployDiamond();
  DeployMockERC20 internal tokenHelper = new DeployMockERC20();
  DeployDropFacet internal dropHelper = new DeployDropFacet();
  MerkleTree internal merkleTree = new MerkleTree();

  MockERC20 internal token;
  DropFacet internal dropFacet;
  address internal stakingAddress;

  mapping(address => uint256) internal treeIndex;
  address[] internal accounts;
  uint256[] internal amounts;

  bytes32[][] internal tree;
  bytes32 internal root;

  Vm.Wallet internal bob = vm.createWallet("bob");
  Vm.Wallet internal alice = vm.createWallet("alice");
  address internal deployer;

  function setUp() public {
    // Create the Merkle tree with accounts and amounts
    _createTree();

    // Get the deployer address
    deployer = getDeployer();

    // Deploy the staking contract
    stakingAddress = _randomAddress();

    // Deploy the mock ERC20 token
    address tokenAddress = tokenHelper.deploy(deployer);

    // Deploy the Drop facet
    address dropAddress = dropHelper.deploy(deployer);

    // Add the Drop facet to the diamond
    diamondHelper.addFacet(
      dropHelper.makeCut(dropAddress, IDiamond.FacetCutAction.Add),
      dropAddress,
      dropHelper.makeInitData(stakingAddress)
    );

    // Deploy the diamond contract with the MerkleAirdrop facet
    address diamond = diamondHelper.deploy(deployer);

    // Initialize the Drop facet
    dropFacet = DropFacet(diamond);

    // Mint tokens to the diamond
    token = MockERC20(tokenAddress);
    token.mint(diamond, TOTAL_TOKEN_AMOUNT);
  }

  modifier givenClaimConditionSet() {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root);
    conditions[0].penaltyBps = 5000;

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);
    _;
  }

  modifier givenWalletHasClaimedWithPenalty(
    Vm.Wallet memory _wallet,
    address caller
  ) {
    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    ClaimCondition memory condition = dropFacet.getClaimConditionById(
      conditionId
    );
    uint256 penaltyBps = condition.penaltyBps;
    uint256 merkleAmount = amounts[treeIndex[_wallet.addr]];
    uint256 penaltyAmount = BasisPoints.calculate(merkleAmount, penaltyBps);
    uint256 expectedAmount = merkleAmount - penaltyAmount;
    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[_wallet.addr]);

    vm.prank(caller);
    vm.expectEmit(address(dropFacet));
    emit DropFacet_Claimed_WithPenalty(
      conditionId,
      caller,
      _wallet.addr,
      expectedAmount
    );
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: _wallet.addr,
        quantity: merkleAmount,
        proof: proof
      })
    );
    _;
  }

  // getActiveClaimConditionId
  function test_getActiveClaimConditionId() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](3);
    conditions[0] = _createClaimCondition(block.timestamp - 100, root); // expired
    conditions[1] = _createClaimCondition(block.timestamp, root); // active
    conditions[2] = _createClaimCondition(block.timestamp + 100, root); // future

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 id = dropFacet.getActiveClaimConditionId();
    assertEq(id, 1);

    vm.warp(block.timestamp + 100);
    id = dropFacet.getActiveClaimConditionId();
    assertEq(id, 2);
  }

  function test_revertWhen_noActiveClaimCondition() external {
    vm.expectRevert(DropFacet__NoActiveClaimCondition.selector);
    dropFacet.getActiveClaimConditionId();
  }

  // getClaimConditionById
  function test_getClaimConditionById() external givenClaimConditionSet {
    ClaimCondition memory condition = dropFacet.getClaimConditionById(
      dropFacet.getActiveClaimConditionId()
    );
    assertEq(condition.startTimestamp, block.timestamp);
    assertEq(condition.maxClaimableSupply, TOTAL_TOKEN_AMOUNT);
    assertEq(condition.supplyClaimed, 0);
    assertEq(condition.merkleRoot, root);
    assertEq(condition.currency, address(token));
    assertEq(condition.penaltyBps, 5000);
  }

  // claimWithPenalty
  function test_claimWithPenalty_fuzz(
    Vm.Wallet[] memory wallets,
    uint256[] memory amounts
  ) external {
    address[] memory accounts = new address[](wallets.length);
    for (uint256 i = 0; i < wallets.length; i++) {
      accounts[i] = wallets[i].addr;
    }

    (root, tree) = merkleTree.constructTree(accounts, amounts);
  }

  function test_claimWithPenalty()
    external
    givenClaimConditionSet
    givenWalletHasClaimedWithPenalty(bob, bob.addr)
  {
    uint256 expectedAmount = _calculateExpectedAmount(bob.addr);
    assertEq(token.balanceOf(bob.addr), expectedAmount);
  }

  function test_revertWhen_merkleRootNotSet() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, bytes32(0));

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__MerkleRootNotSet.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: 100,
        proof: new bytes32[](0)
      })
    );
  }

  function test_revertWhen_quantityIsZero() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root);

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__QuantityMustBeGreaterThanZero.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: 0,
        proof: new bytes32[](0)
      })
    );
  }

  function test_revertWhen_exceedsMaxClaimableSupply() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root);
    conditions[0].maxClaimableSupply = 100; // 100 tokens in total for this condition

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__ExceedsMaxClaimableSupply.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: 101,
        proof: new bytes32[](0)
      })
    );
  }

  function test_revertWhen_claimHasNotStarted() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root);

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob.addr]);

    vm.warp(block.timestamp - 100);

    vm.prank(bob.addr);
    vm.expectRevert(DropFacet__ClaimHasNotStarted.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: amounts[treeIndex[bob.addr]],
        proof: proof
      })
    );
  }

  function test_revertWhen_claimHasEnded() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root);
    conditions[0].endTimestamp = uint40(block.timestamp + 100);

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob.addr]);

    vm.warp(conditions[0].endTimestamp);

    vm.expectRevert(DropFacet__ClaimHasEnded.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: amounts[treeIndex[bob.addr]],
        proof: proof
      })
    );
  }

  function test_revertWhen_alreadyClaimed() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root);

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob.addr]);

    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: amounts[treeIndex[bob.addr]],
        proof: proof
      })
    );

    vm.expectRevert(DropFacet__AlreadyClaimed.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: amounts[treeIndex[bob.addr]],
        proof: proof
      })
    );
  }

  function test_revertWhen_invalidProof() external givenClaimConditionSet {
    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__InvalidProof.selector);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: amounts[treeIndex[bob.addr]],
        proof: new bytes32[](0)
      })
    );
  }

  // setClaimConditions
  function test_setClaimConditions() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root);

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();
    assertEq(conditionId, 0);
  }

  function test_setClaimConditions_resetEligibility()
    external
    givenClaimConditionSet
    givenWalletHasClaimedWithPenalty(bob, bob.addr)
  {
    uint256 conditionId = dropFacet.getActiveClaimConditionId();
    uint256 expectedAmount = _calculateExpectedAmount(bob.addr);

    assertEq(
      dropFacet.getSupplyClaimedByWallet(bob.addr, conditionId),
      expectedAmount
    );

    vm.warp(block.timestamp + 100);

    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root);

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, true);

    uint256 newConditionId = dropFacet.getActiveClaimConditionId();
    assertEq(newConditionId, 1);

    assertEq(dropFacet.getSupplyClaimedByWallet(bob.addr, newConditionId), 0);
  }

  function test_revertWhen_setClaimConditions_onlyOwner() external {
    address caller = _randomAddress();

    vm.prank(caller);
    vm.expectRevert(abi.encodeWithSelector(Ownable__NotOwner.selector, caller));
    dropFacet.setClaimConditions(new ClaimCondition[](0), false);
  }

  function test_revertWhen_setClaimConditions_notInAscendingOrder() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](2);
    conditions[0] = _createClaimCondition(block.timestamp, root);
    conditions[1] = _createClaimCondition(block.timestamp - 100, root);

    vm.expectRevert(DropFacet__ClaimConditionsNotInAscendingOrder.selector);
    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);
  }

  function test_revertWhen_setClaimConditions_exceedsMaxClaimableSupply()
    external
  {
    // Create a single claim condition
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createClaimCondition(block.timestamp, root);
    conditions[0].maxClaimableSupply = 100; // Set max claimable supply to 100 tokens

    // Set the claim conditions as the deployer
    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    // Get the active condition ID
    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    // Generate Merkle proof for Bob
    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob.addr]);

    // Simulate Bob claiming tokens
    vm.prank(bob.addr);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: amounts[treeIndex[bob.addr]],
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
  function test_endToEnd_claimWithPenalty() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](2);
    conditions[0] = _createClaimCondition(block.timestamp, root); // endless claim condition

    conditions[1] = _createClaimCondition(block.timestamp + 100, root);
    conditions[1].endTimestamp = uint40(block.timestamp + 200); // ends at block.timestamp + 200

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    // bob claims from the first condition
    uint256 bobIndex = treeIndex[bob.addr];
    bytes32[] memory proof = merkleTree.getProof(tree, bobIndex);
    vm.prank(bob.addr);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: amounts[bobIndex],
        proof: proof
      })
    );
    assertEq(token.balanceOf(bob.addr), _calculateExpectedAmount(bob.addr));

    // activate the second condition
    vm.warp(block.timestamp + 100);

    // alice claims from the second condition
    conditionId = dropFacet.getActiveClaimConditionId();
    uint256 aliceIndex = treeIndex[alice.addr];
    proof = merkleTree.getProof(tree, aliceIndex);
    vm.prank(alice.addr);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: alice.addr,
        quantity: amounts[aliceIndex],
        proof: proof
      })
    );
    assertEq(
      dropFacet.getSupplyClaimedByWallet(alice.addr, conditionId),
      _calculateExpectedAmount(alice.addr)
    );

    // finalize the second condition
    vm.warp(block.timestamp + 100);

    // bob tries to claim from the second condition, this should fail
    vm.expectRevert(DropFacet__ClaimHasEnded.selector);
    vm.prank(bob.addr);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: bob.addr,
        quantity: amounts[bobIndex],
        proof: proof
      })
    );

    // alice is still able to claim from the first condition
    conditionId = dropFacet.getActiveClaimConditionId();
    vm.prank(alice.addr);
    dropFacet.claimWithPenalty(
      Claim({
        conditionId: conditionId,
        account: alice.addr,
        quantity: amounts[aliceIndex],
        proof: proof
      })
    );
    assertEq(
      dropFacet.getSupplyClaimedByWallet(alice.addr, conditionId),
      _calculateExpectedAmount(alice.addr)
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
    bytes32 _merkleRoot
  ) internal view returns (ClaimCondition memory) {
    return
      ClaimCondition({
        startTimestamp: uint40(_startTime),
        endTimestamp: 0,
        maxClaimableSupply: TOTAL_TOKEN_AMOUNT,
        supplyClaimed: 0,
        merkleRoot: _merkleRoot,
        currency: address(token),
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
    uint256 bobAmount = amounts[treeIndex[_account]];
    uint256 penaltyAmount = BasisPoints.calculate(bobAmount, penaltyBps);
    uint256 expectedAmount = bobAmount - penaltyAmount;

    return expectedAmount;
  }

  function _createTree() internal {
    treeIndex[bob.addr] = 0;
    accounts.push(bob.addr);
    amounts.push(100);

    treeIndex[alice.addr] = 1;
    accounts.push(alice.addr);
    amounts.push(200);

    (root, tree) = merkleTree.constructTree(accounts, amounts);
  }
}
