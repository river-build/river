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
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IDropFacetBase} from "contracts/src/tokens/drop/IDropFacet.sol";

//libraries
import {MerkleTree} from "contracts/test/utils/MerkleTree.sol";
import {DropFacet} from "contracts/src/tokens/drop/DropFacet.sol";
import {MockERC20} from "contracts/test/mocks/MockERC20.sol";
import {BasisPoints} from "contracts/src/utils/libraries/BasisPoints.sol";

contract DropFacetTest is TestUtils, IDropFacetBase {
  uint256 internal constant TOTAL_TOKEN_AMOUNT = 1000;

  DeployDiamond internal diamondHelper = new DeployDiamond();
  DeployMockERC20 internal tokenHelper = new DeployMockERC20();
  DeployDropFacet internal dropHelper = new DeployDropFacet();
  MerkleTree internal merkleTree = new MerkleTree();

  MockERC20 internal token;
  DropFacet internal dropFacet;

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

    // Deploy the mock ERC20 token
    address tokenAddress = tokenHelper.deploy(deployer);

    // Deploy the Drop facet
    address dropAddress = dropHelper.deploy(deployer);

    // Add the Drop facet to the diamond
    diamondHelper.addFacet(
      dropHelper.makeCut(dropAddress, IDiamond.FacetCutAction.Add),
      dropAddress,
      dropHelper.makeInitData("")
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
    conditions[0] = ClaimCondition({
      startTimestamp: block.timestamp, // now
      endTimestamp: 0,
      maxClaimableSupply: TOTAL_TOKEN_AMOUNT,
      supplyClaimed: 0,
      merkleRoot: root,
      currency: address(token),
      penaltyBps: 5000 // 50%
    });

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);
    _;
  }

  modifier givenWalletHasClaimedWithPenalty(Vm.Wallet memory _wallet) {
    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    ClaimCondition memory condition = dropFacet.getClaimConditionById(
      conditionId
    );
    uint256 penaltyBps = condition.penaltyBps;
    uint256 merkleAmount = amounts[treeIndex[_wallet.addr]];
    uint256 penaltyAmount = BasisPoints.calculate(merkleAmount, penaltyBps);
    uint256 expectedAmount = merkleAmount - penaltyAmount;
    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[_wallet.addr]);

    address caller = _randomAddress();

    vm.prank(caller);
    vm.expectEmit(address(dropFacet));
    emit DropFacet_Claimed_WithPenalty(
      conditionId,
      caller,
      _wallet.addr,
      expectedAmount
    );
    dropFacet.claimWithPenalty(conditionId, _wallet.addr, merkleAmount, proof);
    _;
  }

  // getActiveClaimConditionId
  function test_getActiveClaimConditionId() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](3);
    conditions[0] = _createTimedClaimCondition(block.timestamp - 100); // expired
    conditions[1] = _createTimedClaimCondition(block.timestamp); // active
    conditions[2] = _createTimedClaimCondition(block.timestamp + 100); // future

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
  function test_claimWithPenalty()
    external
    givenClaimConditionSet
    givenWalletHasClaimedWithPenalty(bob)
  {
    uint256 expectedAmount = _calculateExpectedAmount(bob.addr);
    assertEq(token.balanceOf(bob.addr), expectedAmount);
  }

  function test_revertWhen_merkleRootNotSet() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createTimedClaimCondition(block.timestamp);

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__MerkleRootNotSet.selector);
    dropFacet.claimWithPenalty(conditionId, bob.addr, 100, new bytes32[](0));
  }

  function test_revertWhen_quantityIsZero() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createTimedClaimCondition(block.timestamp);
    conditions[0].merkleRoot = root;

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__QuantityMustBeGreaterThanZero.selector);
    dropFacet.claimWithPenalty({
      conditionId: conditionId,
      account: bob.addr,
      quantity: 0,
      allowlistProof: new bytes32[](0)
    });
  }

  function test_revertWhen_exceedsMaxClaimableSupply() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createTimedClaimCondition(block.timestamp);
    conditions[0].merkleRoot = root;
    conditions[0].maxClaimableSupply = 100; // 100 tokens in total for this condition

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__ExceedsMaxClaimableSupply.selector);
    dropFacet.claimWithPenalty({
      conditionId: conditionId,
      account: bob.addr,
      quantity: 101,
      allowlistProof: new bytes32[](0)
    });
  }

  function test_revertWhen_claimHasNotStarted() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createTimedClaimCondition(block.timestamp);
    conditions[0].merkleRoot = root;
    conditions[0].maxClaimableSupply = TOTAL_TOKEN_AMOUNT;

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob.addr]);

    vm.warp(block.timestamp - 100);

    vm.prank(bob.addr);
    vm.expectRevert(DropFacet__ClaimHasNotStarted.selector);
    dropFacet.claimWithPenalty({
      conditionId: conditionId,
      account: bob.addr,
      quantity: amounts[treeIndex[bob.addr]],
      allowlistProof: proof
    });
  }

  function test_revertWhen_claimHasEnded() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createTimedClaimCondition(block.timestamp);
    conditions[0].merkleRoot = root;
    conditions[0].maxClaimableSupply = TOTAL_TOKEN_AMOUNT;
    conditions[0].endTimestamp = block.timestamp + 100;

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob.addr]);

    vm.warp(block.timestamp + 101);

    vm.expectRevert(DropFacet__ClaimHasEnded.selector);
    dropFacet.claimWithPenalty({
      conditionId: conditionId,
      account: bob.addr,
      quantity: amounts[treeIndex[bob.addr]],
      allowlistProof: proof
    });
  }

  function test_revertWhen_alreadyClaimed() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createTimedClaimCondition(block.timestamp);
    conditions[0].merkleRoot = root;
    conditions[0].maxClaimableSupply = TOTAL_TOKEN_AMOUNT;

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob.addr]);

    dropFacet.claimWithPenalty({
      conditionId: conditionId,
      account: bob.addr,
      quantity: amounts[treeIndex[bob.addr]],
      allowlistProof: proof
    });

    vm.expectRevert(DropFacet__AlreadyClaimed.selector);
    dropFacet.claimWithPenalty({
      conditionId: conditionId,
      account: bob.addr,
      quantity: amounts[treeIndex[bob.addr]],
      allowlistProof: proof
    });
  }

  function test_revertWhen_invalidProof() external {
    ClaimCondition[] memory conditions = new ClaimCondition[](1);
    conditions[0] = _createTimedClaimCondition(block.timestamp);
    conditions[0].merkleRoot = root;
    conditions[0].maxClaimableSupply = TOTAL_TOKEN_AMOUNT;

    vm.prank(deployer);
    dropFacet.setClaimConditions(conditions, false);

    uint256 conditionId = dropFacet.getActiveClaimConditionId();

    vm.expectRevert(DropFacet__InvalidProof.selector);
    dropFacet.claimWithPenalty({
      conditionId: conditionId,
      account: bob.addr,
      quantity: amounts[treeIndex[bob.addr]],
      allowlistProof: new bytes32[](0)
    });
  }

  // =============================================================
  //                           Internal
  // =============================================================
  function _createTimedClaimCondition(
    uint256 _startTime
  ) internal view returns (ClaimCondition memory) {
    return
      ClaimCondition({
        startTimestamp: _startTime,
        endTimestamp: 0,
        maxClaimableSupply: 0,
        supplyClaimed: 0,
        merkleRoot: bytes32(0),
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
