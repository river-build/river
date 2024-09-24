// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {Vm} from "forge-std/Test.sol";
import {TestUtils} from "contracts/test/utils/TestUtils.sol";
import {DeployDiamond} from "contracts/scripts/deployments/utils/DeployDiamond.s.sol";
import {DeployMerkleAirdrop} from "contracts/scripts/deployments/facets/DeployMerkleAirdrop.s.sol";
import {DeployMockERC20} from "contracts/scripts/deployments/utils/DeployMockERC20.s.sol";
import {DeployEIP712Facet} from "contracts/scripts/deployments/facets/DeployEIP712Facet.s.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

//interfaces
import {IDiamond} from "contracts/src/diamond/Diamond.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//libraries
import {MerkleTree} from "contracts/test/utils/MerkleTree.sol";

//contracts
import {MerkleAirdrop} from "contracts/src/utils/airdrop/merkle/MerkleAirdrop.sol";
import {MockERC20} from "contracts/test/mocks/MockERC20.sol";
import {EIP712Facet} from "contracts/src/diamond/utils/cryptography/signature/EIP712Facet.sol";
contract MerkleAirdropTest is TestUtils {
  uint256 internal constant TOTAL_TOKEN_AMOUNT = 1000;

  DeployDiamond diamondHelper = new DeployDiamond();
  DeployMerkleAirdrop airdropHelper = new DeployMerkleAirdrop();
  DeployMockERC20 tokenHelper = new DeployMockERC20();
  DeployEIP712Facet eip712Helper = new DeployEIP712Facet();

  MerkleAirdrop internal merkleAirdrop;
  MockERC20 internal token;
  MerkleTree internal merkleTree;
  EIP712Facet internal eip712Facet;

  mapping(address => uint256) internal treeIndex;
  address[] internal accounts;
  uint256[] internal amounts;

  bytes32[][] internal tree;
  bytes32 internal root;

  Vm.Wallet internal bob = vm.createWallet("bob");
  Vm.Wallet internal alice = vm.createWallet("alice");

  function setUp() public {
    // Create the Merkle tree with accounts and amounts
    _createTree();

    // Get the deployer address
    address deployer = getDeployer();

    // Deploy the mock ERC20 token
    address tokenAddress = tokenHelper.deploy(deployer);

    // Deploy the MerkleAirdrop contract
    address airdropAddress = airdropHelper.deploy(deployer);

    // Deploy the EIP712 facet
    address eip712Address = eip712Helper.deploy(deployer);

    // Add the EIP712 facet to the diamond
    diamondHelper.addFacet(
      eip712Helper.makeCut(eip712Address, IDiamond.FacetCutAction.Add),
      eip712Address,
      eip712Helper.makeInitData("MerkleAirdrop", "1.0.0")
    );

    // Add the MerkleAirdrop facet to the diamond
    diamondHelper.addFacet(
      airdropHelper.makeCut(airdropAddress, IDiamond.FacetCutAction.Add),
      airdropAddress,
      airdropHelper.makeInitData(root, tokenAddress)
    );

    // Deploy the diamond contract with the MerkleAirdrop facet
    address diamond = diamondHelper.deploy(deployer);

    // Initialize the MerkleAirdrop and token contracts
    merkleAirdrop = MerkleAirdrop(diamond);
    eip712Facet = EIP712Facet(diamond);
    token = MockERC20(tokenAddress);

    token.mint(diamond, TOTAL_TOKEN_AMOUNT);
  }

  function test_getToken() external view {
    IERC20 _token = merkleAirdrop.getToken();
    assertEq(address(_token), address(token));
  }

  function test_getMerkleRoot() external view {
    bytes32 _root = merkleAirdrop.getMerkleRoot();
    assertEq(_root, root);
  }

  function test_claim() external {
    bytes memory signature = _signClaim(bob, bob.addr, 100);

    vm.prank(_randomAddress());
    merkleAirdrop.claim(
      bob.addr,
      100,
      merkleTree.getProof(tree, treeIndex[bob.addr]),
      signature
    );

    assertEq(token.balanceOf(bob.addr), 100);
  }

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

    merkleTree = new MerkleTree();
    (root, tree) = merkleTree.constructTree(accounts, amounts);
  }

  function _signClaim(
    Vm.Wallet memory _wallet,
    address _account,
    uint256 _amount
  ) internal view returns (bytes memory) {
    bytes32 typeDataHash = merkleAirdrop.getMessageHash(_account, _amount);

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(_wallet.privateKey, typeDataHash);

    return abi.encodePacked(r, s, v);
  }
}
