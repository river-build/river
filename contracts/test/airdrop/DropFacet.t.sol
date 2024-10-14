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

  DeployDiamond diamondHelper = new DeployDiamond();
  DeployMockERC20 tokenHelper = new DeployMockERC20();
  DeployDropFacet dropHelper = new DeployDropFacet();
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

  modifier givenWalletHasClaimedWithPenalty(
    uint256 conditionId,
    Vm.Wallet memory _wallet
  ) {
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
    dropFacet.claimWithPenalty(_wallet.addr, merkleAmount, proof);
    _;
  }

  function test_getActiveClaimConditionId() external givenClaimConditionSet {
    uint256 id = dropFacet.getActiveClaimConditionId();
    assertEq(id, 0);
  }

  function test_getClaimConditionById() external givenClaimConditionSet {
    ClaimCondition memory condition = dropFacet.getClaimConditionById(0);
    assertEq(condition.startTimestamp, block.timestamp);
    assertEq(condition.maxClaimableSupply, TOTAL_TOKEN_AMOUNT);
    assertEq(condition.supplyClaimed, 0);
    assertEq(condition.merkleRoot, root);
    assertEq(condition.currency, address(token));
    assertEq(condition.penaltyBps, 5000);
  }

  function test_claimWithPenalty()
    external
    givenClaimConditionSet
    givenWalletHasClaimedWithPenalty(0, bob)
  {
    ClaimCondition memory condition = dropFacet.getClaimConditionById(0);
    uint256 penaltyBps = condition.penaltyBps;
    uint256 bobAmount = amounts[treeIndex[bob.addr]];
    uint256 penaltyAmount = BasisPoints.calculate(bobAmount, penaltyBps);
    uint256 expectedAmount = bobAmount - penaltyAmount;

    assertEq(token.balanceOf(bob.addr), expectedAmount);
  }

  // function test_getToken() external view {
  //   IERC20 _token = merkleAirdrop.getToken();
  //   assertEq(address(_token), address(token));
  // }

  // function test_getMerkleRoot() external view {
  //   bytes32 _root = merkleAirdrop.getMerkleRoot();
  //   assertEq(_root, root);
  // }

  // function test_claim() external givenWalletHasClaimedWithPenalty(bob, 100) {
  //   assertEq(token.balanceOf(bob.addr), 100);
  // }

  // function test_claimWithReceiver()
  //   external
  //   givenWalletHasClaimedWithReceiver(bob, 100, alice.addr)
  // {
  //   assertEq(token.balanceOf(alice.addr), 100);
  // }

  // function test_revertWhen_alreadyClaimed()
  //   external
  //   givenWalletHasClaimedWithPenalty(bob, 100)
  // {
  //   bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob.addr]);
  //   bytes memory signature = _signClaim(bob, bob.addr, 100, address(0));

  //   vm.prank(bob.addr);
  //   vm.expectRevert(MerkleAirdrop__AlreadyClaimed.selector);
  //   merkleAirdrop.claim(bob.addr, 100, proof, signature, address(0));
  // }

  // function test_revertWhen_invalidSignature() external {
  //   bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[bob.addr]);
  //   bytes memory signature = _signClaim(alice, bob.addr, 100, address(0));

  //   vm.expectRevert(MerkleAirdrop__InvalidSignature.selector);
  //   merkleAirdrop.claim(bob.addr, 100, proof, signature, address(0));
  // }

  // function test_revertWhen_invalidProof() external {
  //   bytes32[] memory proof = merkleTree.getProof(tree, treeIndex[alice.addr]);
  //   bytes memory signature = _signClaim(bob, bob.addr, 100, address(0));

  //   vm.expectRevert(MerkleAirdrop__InvalidProof.selector);
  //   merkleAirdrop.claim(bob.addr, 100, proof, signature, address(0));
  // }

  // =============================================================
  //                           Internal
  // =============================================================
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
