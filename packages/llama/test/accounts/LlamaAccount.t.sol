// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import {ICryptoPunk} from "@llama/test/external/ICryptoPunk.sol";
import {IWETH} from "@llama/test/external/IWETH.sol";
import {MockExtension} from "@llama/test/mock/MockExtension.sol";
import {MockMaliciousExtension} from "@llama/test/mock/MockMaliciousExtension.sol";
import {LlamaTestSetup, Roles} from "@llama/test/utils/LlamaTestSetup.sol";

import {LlamaAccount} from "@llama/src/accounts/LlamaAccount.sol";
import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract LlamaAccountTest is LlamaTestSetup {
  // Testing Parameters
  // Native Token
  address public constant ETH_WHALE =
    0xF977814e90dA44bFA03b6295A0616a897441aceC;
  uint256 public constant ETH_AMOUNT = 1000e18;

  // ERC20 Token
  IERC20 public constant USDC =
    IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
  address public constant USDC_WHALE =
    0x55FE002aefF02F77364de339a1292923A15844B8;
  uint256 public constant USDC_AMOUNT = 1000e6;

  IERC20 public constant USDT =
    IERC20(0xdAC17F958D2ee523a2206206994597C13D831ec7);
  address public constant USDT_WHALE =
    0xA7A93fd0a276fc1C0197a5B5623eD117786eeD06;
  uint256 public constant USDT_AMOUNT = 1000e6;

  IERC20 public constant UNI =
    IERC20(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984);
  address public constant UNI_WHALE =
    0x47173B170C64d16393a52e6C480b3Ad8c302ba1e;
  uint256 public constant UNI_AMOUNT = 1000e18;

  // ERC721 Token
  IERC721 public constant BAYC =
    IERC721(0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D);
  address public constant BAYC_WHALE =
    0x619866736a3a101f65cfF3A8c3d2602fC54Fd749;
  uint256 public constant BAYC_ID = 27;
  uint256 public constant BAYC_ID_2 = 8885;

  IERC721 public constant NOUNS =
    IERC721(0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03);
  address public constant NOUNS_WHALE =
    0x2573C60a6D127755aA2DC85e342F7da2378a0Cc5;
  uint256 public constant NOUNS_ID = 540;
  uint256 public constant NOUNS_ID_2 = 550;

  // Non-standard NFT
  ICryptoPunk public constant PUNK =
    ICryptoPunk(0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB);
  address public constant PUNK_WHALE =
    0xB88F61E6FbdA83fbfffAbE364112137480398018;
  uint256 public constant PUNK_ID = 9313;

  // ERC1155 Token
  IERC1155 public constant RARI =
    IERC1155(0xd07dc4262BCDbf85190C01c996b4C06a461d2430);
  address public constant RARI_WHALE =
    0xEdba5d56d0147aee8a227D284bcAaC03B4a87eD4;
  uint256 public constant RARI_ID_1 = 657_774;
  uint256 public constant RARI_ID_1_AMOUNT = 3;
  uint256 public constant RARI_ID_2 = 74_385;
  uint256 public constant RARI_ID_2_AMOUNT = 1;

  IERC1155 public constant OPENSTORE =
    IERC1155(0x495f947276749Ce646f68AC8c248420045cb7b5e);
  address public constant OPENSTORE_WHALE =
    0xaBA7161A7fb69c88e16ED9f455CE62B791EE4D03;
  uint256 public constant OPENSTORE_ID_1 =
    50_227_944_111_491_829_717_518_767_573_293_673_148_720_215_112_283_513_814_059_266_953_762_918_367_332;
  uint256 public constant OPENSTORE_ID_1_AMOUNT = 20;
  uint256 public constant OPENSTORE_ID_2 =
    25_221_312_271_773_506_578_423_917_291_534_224_130_165_348_289_584_384_465_161_209_685_514_687_348_761;
  uint256 public constant OPENSTORE_ID_2_AMOUNT = 1;

  // WETH
  IWETH public constant WETH =
    IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

  address mpAccount1Addr;
  LlamaAccount mpAccount1LlamaAccount;

  function setUp() public override {
    vm.createSelectFork(vm.rpcUrl("mainnet"), 16_573_464);
    LlamaTestSetup.setUp();
    mpAccount1Addr = address(mpAccount1); // For convenience, to avoid tons of casting to address.
    mpAccount1LlamaAccount = LlamaAccount(payable(mpAccount1Addr)); // Casting to LlamaAccount to access functions
  }

  // =========================
  // ======== Helpers ========
  // =========================

  function transferETHToAccount(uint256 amount) internal {
    deal(mpAccount1Addr, amount);
  }

  function transferUSDCToAccount(uint256 amount) internal {
    deal(address(USDC), mpAccount1Addr, amount);
  }

  function approveUSDCToRecipient(uint256 amount) internal {
    vm.prank(address(mpExecutor));
    mpAccount1LlamaAccount.approveERC20(
      LlamaAccount.ERC20Data(USDC, USDC_WHALE, amount)
    );
    assertEq(USDC.allowance(mpAccount1Addr, USDC_WHALE), amount);
  }

  function approveUSDTToRecipient(uint256 amount) internal {
    vm.prank(address(mpExecutor));
    mpAccount1LlamaAccount.approveERC20(
      LlamaAccount.ERC20Data(USDT, USDT_WHALE, amount)
    );
    assertEq(USDT.allowance(mpAccount1Addr, USDT_WHALE), amount);
  }

  function transferUNIToAccount(uint256 amount) internal {
    deal(address(UNI), mpAccount1Addr, amount);
  }

  function transferBAYCToAccount(uint256 id) public {
    assertEq(BAYC.balanceOf(mpAccount1Addr), 0);
    assertEq(BAYC.ownerOf(id), BAYC_WHALE);

    vm.prank(BAYC_WHALE);
    BAYC.transferFrom(BAYC_WHALE, mpAccount1Addr, id);
    assertEq(BAYC.balanceOf(mpAccount1Addr), 1);
    assertEq(BAYC.ownerOf(id), mpAccount1Addr);
  }

  function approveBAYCToRecipient(uint256 id) internal {
    vm.prank(address(mpExecutor));
    mpAccount1LlamaAccount.approveERC721(
      LlamaAccount.ERC721Data(BAYC, BAYC_WHALE, id)
    );
    assertEq(BAYC.getApproved(id), BAYC_WHALE);
  }

  function approveOperatorBAYCToRecipient(bool approved) internal {
    vm.prank(address(mpExecutor));
    mpAccount1LlamaAccount.approveOperatorERC721(
      LlamaAccount.ERC721OperatorData(BAYC, BAYC_WHALE, approved)
    );
    assertEq(BAYC.isApprovedForAll(mpAccount1Addr, BAYC_WHALE), approved);
  }

  function transferNOUNSToAccount(uint256 id) internal {
    assertEq(NOUNS.balanceOf(mpAccount1Addr), 0);
    assertEq(NOUNS.ownerOf(id), NOUNS_WHALE);

    vm.prank(NOUNS_WHALE);
    NOUNS.transferFrom(NOUNS_WHALE, mpAccount1Addr, id);
    assertEq(NOUNS.balanceOf(mpAccount1Addr), 1);
    assertEq(NOUNS.ownerOf(id), mpAccount1Addr);
  }

  function transferPUNKToAccount(uint256 id) internal {
    assertEq(PUNK.balanceOf(mpAccount1Addr), 0);
    assertEq(PUNK.punkIndexToAddress(id), PUNK_WHALE);

    vm.prank(PUNK_WHALE);
    PUNK.transferPunk(mpAccount1Addr, id);
    assertEq(PUNK.balanceOf(mpAccount1Addr), 1);
    assertEq(PUNK.punkIndexToAddress(id), mpAccount1Addr);
  }

  function transferRARIToAccount(uint256 id, uint256 amount) internal {
    assertEq(RARI.balanceOf(mpAccount1Addr, id), 0);

    vm.prank(RARI_WHALE);
    RARI.safeTransferFrom(RARI_WHALE, mpAccount1Addr, id, amount, "");
    assertEq(RARI.balanceOf(mpAccount1Addr, id), amount);
  }

  function transferOPENSTOREToAccount(uint256 id, uint256 amount) internal {
    assertEq(OPENSTORE.balanceOf(mpAccount1Addr, id), 0);

    vm.prank(OPENSTORE_WHALE);
    OPENSTORE.safeTransferFrom(OPENSTORE_WHALE, mpAccount1Addr, id, amount, "");
    assertEq(OPENSTORE.balanceOf(mpAccount1Addr, id), amount);
  }

  function approveRARIToRecipient(bool approved) internal {
    vm.prank(address(mpExecutor));
    mpAccount1LlamaAccount.approveOperatorERC1155(
      LlamaAccount.ERC1155OperatorData(RARI, RARI_WHALE, approved)
    );
    assertEq(RARI.isApprovedForAll(mpAccount1Addr, RARI_WHALE), approved);
  }
}

contract Constructor is LlamaAccountTest {
  function test_RevertIf_InitializeImplementationContract() public {
    vm.expectRevert(Initializable.InvalidInitialization.selector);
    accountLogic.initialize("MP Treasury");
  }
}

contract Initialize is LlamaAccountTest {
  function test_SetsLlamaExecutor() public {
    assertEq(mpAccount1LlamaAccount.llamaExecutor(), address(mpExecutor));
  }

  function test_SetsAccountName() public {
    assertEq(mpAccount1LlamaAccount.name(), "MP Treasury");
  }

  function test_RevertIf_AlreadyInitialized() public {
    vm.expectRevert(Initializable.InvalidInitialization.selector);
    mpAccount1LlamaAccount.initialize("MP Treasury");
  }
}

contract TransferNativeToken is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);

    vm.prank(caller);
    mpAccount1LlamaAccount.transferNativeToken(
      LlamaAccount.NativeTokenData(payable(ETH_WHALE), ETH_AMOUNT)
    );
  }

  function test_TransferETH() public {
    transferETHToAccount(ETH_AMOUNT);

    uint256 accountETHBalance = mpAccount1Addr.balance;
    uint256 whaleETHBalance = ETH_WHALE.balance;

    // Transfer ETH from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.transferNativeToken(
      LlamaAccount.NativeTokenData(payable(ETH_WHALE), ETH_AMOUNT)
    );
    assertEq(mpAccount1Addr.balance, 0);
    assertEq(mpAccount1Addr.balance, accountETHBalance - ETH_AMOUNT);
    assertEq(ETH_WHALE.balance, whaleETHBalance + ETH_AMOUNT);
    vm.stopPrank();
  }

  function test_RevertIf_ToZeroAddress() public {
    vm.startPrank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.ZeroAddressNotAllowed.selector);
    mpAccount1LlamaAccount.transferNativeToken(
      LlamaAccount.NativeTokenData(payable(address(0)), ETH_AMOUNT)
    );
    vm.stopPrank();
  }
}

contract BatchTransferNativeToken is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);

    LlamaAccount.NativeTokenData[]
      memory data = new LlamaAccount.NativeTokenData[](1);
    data[0] = LlamaAccount.NativeTokenData(payable(ETH_WHALE), ETH_AMOUNT);

    vm.prank(caller);
    mpAccount1LlamaAccount.batchTransferNativeToken(data);
  }

  function test_BatchTransferETH() public {
    transferETHToAccount(ETH_AMOUNT);

    uint256 accountETHBalance = mpAccount1Addr.balance;
    uint256 whaleETHBalance = ETH_WHALE.balance;

    address randomRecipient = makeAddr("randomRecipient");
    uint256 randomRecipientBalance = randomRecipient.balance;

    LlamaAccount.NativeTokenData[]
      memory data = new LlamaAccount.NativeTokenData[](2);
    data[0] = LlamaAccount.NativeTokenData(payable(ETH_WHALE), 0.1 ether);
    data[1] = LlamaAccount.NativeTokenData(
      payable(randomRecipient),
      ETH_AMOUNT - 0.1 ether
    );

    // Transfer ETH from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.batchTransferNativeToken(data);
    assertEq(mpAccount1Addr.balance, 0);
    assertEq(mpAccount1Addr.balance, accountETHBalance - ETH_AMOUNT);
    assertEq(ETH_WHALE.balance, whaleETHBalance + 0.1 ether);
    assertEq(
      randomRecipient.balance,
      randomRecipientBalance + ETH_AMOUNT - 0.1 ether
    );
    vm.stopPrank();
  }

  function test_RevertIf_ToZeroAddress() public {
    LlamaAccount.NativeTokenData[]
      memory data = new LlamaAccount.NativeTokenData[](1);
    data[0] = LlamaAccount.NativeTokenData(payable(address(0)), ETH_AMOUNT);

    vm.startPrank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.ZeroAddressNotAllowed.selector);
    mpAccount1LlamaAccount.batchTransferNativeToken(data);
    vm.stopPrank();
  }
}

contract TransferERC20 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);

    vm.prank(caller);
    mpAccount1LlamaAccount.transferERC20(
      LlamaAccount.ERC20Data(USDC, USDC_WHALE, USDC_AMOUNT)
    );
  }

  function test_TransferUSDC() public {
    transferUSDCToAccount(USDC_AMOUNT);

    uint256 accountUSDCBalance = USDC.balanceOf(mpAccount1Addr);
    uint256 whaleUSDCBalance = USDC.balanceOf(USDC_WHALE);

    // Transfer USDC from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.transferERC20(
      LlamaAccount.ERC20Data(USDC, USDC_WHALE, USDC_AMOUNT)
    );
    assertEq(USDC.balanceOf(mpAccount1Addr), 0);
    assertEq(USDC.balanceOf(mpAccount1Addr), accountUSDCBalance - USDC_AMOUNT);
    assertEq(USDC.balanceOf(USDC_WHALE), whaleUSDCBalance + USDC_AMOUNT);
    vm.stopPrank();
  }

  function test_RevertIf_ToZeroAddress() public {
    vm.startPrank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.ZeroAddressNotAllowed.selector);
    mpAccount1LlamaAccount.transferERC20(
      LlamaAccount.ERC20Data(USDC, address(0), USDC_AMOUNT)
    );
    vm.stopPrank();
  }
}

contract BatchTransferERC20 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);
    LlamaAccount.ERC20Data[] memory erc20Data = new LlamaAccount.ERC20Data[](1);

    vm.prank(caller);
    mpAccount1LlamaAccount.batchTransferERC20(erc20Data);
  }

  function test_TransferUSDCAndUNI() public {
    transferUSDCToAccount(USDC_AMOUNT);
    transferUNIToAccount(UNI_AMOUNT);

    uint256 accountUSDCBalance = USDC.balanceOf(mpAccount1Addr);
    uint256 accountUNIBalance = UNI.balanceOf(mpAccount1Addr);
    uint256 whaleUSDCBalance = USDC.balanceOf(USDC_WHALE);
    uint256 whaleUSDTBalance = UNI.balanceOf(UNI_WHALE);

    LlamaAccount.ERC20Data[] memory erc20Data = new LlamaAccount.ERC20Data[](2);
    erc20Data[0] = LlamaAccount.ERC20Data(USDC, USDC_WHALE, USDC_AMOUNT);
    erc20Data[1] = LlamaAccount.ERC20Data(UNI, UNI_WHALE, UNI_AMOUNT);

    // Transfer USDC and USDT from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.batchTransferERC20(erc20Data);
    assertEq(USDC.balanceOf(mpAccount1Addr), 0);
    assertEq(UNI.balanceOf(mpAccount1Addr), 0);
    assertEq(USDC.balanceOf(mpAccount1Addr), accountUSDCBalance - USDC_AMOUNT);
    assertEq(UNI.balanceOf(mpAccount1Addr), accountUNIBalance - UNI_AMOUNT);
    assertEq(USDC.balanceOf(USDC_WHALE), whaleUSDCBalance + USDC_AMOUNT);
    assertEq(UNI.balanceOf(UNI_WHALE), whaleUSDTBalance + UNI_AMOUNT);
    vm.stopPrank();
  }

  function test_RevertIf_ToZeroAddress() public {
    LlamaAccount.ERC20Data[] memory erc20Data = new LlamaAccount.ERC20Data[](1);
    erc20Data[0] = LlamaAccount.ERC20Data(USDC, address(0), USDC_AMOUNT);

    vm.startPrank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.ZeroAddressNotAllowed.selector);
    mpAccount1LlamaAccount.batchTransferERC20(erc20Data);
    vm.stopPrank();
  }
}

contract ApproveERC20 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);

    vm.prank(caller);
    mpAccount1LlamaAccount.approveERC20(
      LlamaAccount.ERC20Data(USDC, USDC_WHALE, USDC_AMOUNT)
    );
  }

  function test_ApproveUSDC() public {
    approveUSDCToRecipient(USDC_AMOUNT);
  }

  function test_IncreaseUSDCAllowance() public {
    approveUSDCToRecipient(USDC_AMOUNT);
    approveUSDCToRecipient(0);
    approveUSDCToRecipient(USDC_AMOUNT + 1);
  }

  function test_DecreaseUSDCAllowance() public {
    approveUSDCToRecipient(USDC_AMOUNT);
    approveUSDCToRecipient(0);
    approveUSDCToRecipient(USDC_AMOUNT - 1);
  }

  function test_IncreaseUSDTAllowance() public {
    approveUSDTToRecipient(USDT_AMOUNT);
    approveUSDTToRecipient(0);
    approveUSDTToRecipient(USDT_AMOUNT + 1);
  }

  function test_DecreaseUSDTAllowance() public {
    approveUSDTToRecipient(USDT_AMOUNT);
    approveUSDTToRecipient(0);
    approveUSDTToRecipient(USDT_AMOUNT - 1);
  }
}

contract BatchApproveERC20 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);
    LlamaAccount.ERC20Data[] memory erc20Data = new LlamaAccount.ERC20Data[](1);

    vm.prank(caller);
    mpAccount1LlamaAccount.batchApproveERC20(erc20Data);
  }

  function test_ApproveUSDCAndUNI() public {
    LlamaAccount.ERC20Data[] memory erc20Data = new LlamaAccount.ERC20Data[](2);
    erc20Data[0] = LlamaAccount.ERC20Data(USDC, USDC_WHALE, USDC_AMOUNT);
    erc20Data[1] = LlamaAccount.ERC20Data(UNI, UNI_WHALE, UNI_AMOUNT);

    // Approve USDC and UNI to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.batchApproveERC20(erc20Data);
    assertEq(USDC.allowance(mpAccount1Addr, USDC_WHALE), USDC_AMOUNT);
    assertEq(UNI.allowance(mpAccount1Addr, UNI_WHALE), UNI_AMOUNT);
    vm.stopPrank();
  }
}

contract TransferERC721 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);

    vm.prank(caller);
    mpAccount1LlamaAccount.transferERC721(
      LlamaAccount.ERC721Data(BAYC, BAYC_WHALE, BAYC_ID)
    );
  }

  function test_TransferBAYC() public {
    transferBAYCToAccount(BAYC_ID);

    uint256 accountNFTBalance = BAYC.balanceOf(mpAccount1Addr);
    uint256 whaleNFTBalance = BAYC.balanceOf(BAYC_WHALE);

    // Transfer NFT from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.transferERC721(
      LlamaAccount.ERC721Data(BAYC, BAYC_WHALE, BAYC_ID)
    );
    assertEq(BAYC.balanceOf(mpAccount1Addr), 0);
    assertEq(BAYC.balanceOf(mpAccount1Addr), accountNFTBalance - 1);
    assertEq(BAYC.balanceOf(BAYC_WHALE), whaleNFTBalance + 1);
    assertEq(BAYC.ownerOf(BAYC_ID), BAYC_WHALE);
    vm.stopPrank();
  }

  function test_RevertIf_ToZeroAddress() public {
    vm.startPrank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.ZeroAddressNotAllowed.selector);
    mpAccount1LlamaAccount.transferERC721(
      LlamaAccount.ERC721Data(BAYC, address(0), BAYC_ID)
    );
    vm.stopPrank();
  }
}

contract BatchTransferERC721 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);
    LlamaAccount.ERC721Data[] memory erc721Data = new LlamaAccount.ERC721Data[](
      2
    );

    vm.prank(caller);
    mpAccount1LlamaAccount.batchTransferERC721(erc721Data);
  }

  function test_TransferBAYCAndNOUNS() public {
    transferBAYCToAccount(BAYC_ID);
    transferNOUNSToAccount(NOUNS_ID);

    uint256 accountBAYCBalance = BAYC.balanceOf(mpAccount1Addr);
    uint256 whaleBAYCBalance = BAYC.balanceOf(BAYC_WHALE);
    uint256 accountNOUNSBalance = NOUNS.balanceOf(mpAccount1Addr);
    uint256 whaleNOUNSBalance = NOUNS.balanceOf(NOUNS_WHALE);

    LlamaAccount.ERC721Data[] memory erc721Data = new LlamaAccount.ERC721Data[](
      2
    );
    erc721Data[0] = LlamaAccount.ERC721Data(BAYC, BAYC_WHALE, BAYC_ID);
    erc721Data[1] = LlamaAccount.ERC721Data(NOUNS, NOUNS_WHALE, NOUNS_ID);

    // Transfer NFTs from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.batchTransferERC721(erc721Data);
    assertEq(BAYC.balanceOf(mpAccount1Addr), accountBAYCBalance - 1);
    assertEq(BAYC.balanceOf(BAYC_WHALE), whaleBAYCBalance + 1);
    assertEq(BAYC.ownerOf(BAYC_ID), BAYC_WHALE);
    assertEq(NOUNS.balanceOf(mpAccount1Addr), accountNOUNSBalance - 1);
    assertEq(NOUNS.balanceOf(NOUNS_WHALE), whaleNOUNSBalance + 1);
    assertEq(NOUNS.ownerOf(NOUNS_ID), NOUNS_WHALE);
    vm.stopPrank();
  }

  function test_RevertIf_ToZeroAddress() public {
    LlamaAccount.ERC721Data[] memory erc721Data = new LlamaAccount.ERC721Data[](
      1
    );
    erc721Data[0] = LlamaAccount.ERC721Data(BAYC, address(0), BAYC_ID);

    vm.startPrank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.ZeroAddressNotAllowed.selector);
    mpAccount1LlamaAccount.batchTransferERC721(erc721Data);
    vm.stopPrank();
  }
}

contract ApproveERC721 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);

    vm.prank(caller);
    mpAccount1LlamaAccount.approveERC721(
      LlamaAccount.ERC721Data(BAYC, BAYC_WHALE, BAYC_ID)
    );
  }

  function test_ApproveBAYC() public {
    transferBAYCToAccount(BAYC_ID);
    approveBAYCToRecipient(BAYC_ID);
  }
}

contract BatchApproveERC721 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);
    LlamaAccount.ERC721Data[] memory erc721Data = new LlamaAccount.ERC721Data[](
      2
    );

    vm.prank(caller);
    mpAccount1LlamaAccount.batchApproveERC721(erc721Data);
  }

  function test_ApproveBAYCAndNOUNS() public {
    transferBAYCToAccount(BAYC_ID);
    transferNOUNSToAccount(NOUNS_ID);

    LlamaAccount.ERC721Data[] memory erc721Data = new LlamaAccount.ERC721Data[](
      2
    );
    erc721Data[0] = LlamaAccount.ERC721Data(BAYC, BAYC_WHALE, BAYC_ID);
    erc721Data[1] = LlamaAccount.ERC721Data(NOUNS, NOUNS_WHALE, NOUNS_ID);

    // Approve NFTs from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.batchApproveERC721(erc721Data);
    assertEq(BAYC.getApproved(BAYC_ID), BAYC_WHALE);
    assertEq(NOUNS.getApproved(NOUNS_ID), NOUNS_WHALE);
    vm.stopPrank();
  }
}

contract ApproveOperatorERC721 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);

    vm.prank(caller);
    mpAccount1LlamaAccount.approveOperatorERC721(
      LlamaAccount.ERC721OperatorData(BAYC, BAYC_WHALE, true)
    );
  }

  function test_ApproveBAYC() public {
    approveOperatorBAYCToRecipient(true);
  }

  function test_DisapproveBAYC() public {
    approveOperatorBAYCToRecipient(false);
  }
}

contract BatchApproveOperatorERC721 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);
    LlamaAccount.ERC721OperatorData[]
      memory erc721OperatorData = new LlamaAccount.ERC721OperatorData[](2);

    vm.prank(caller);
    mpAccount1LlamaAccount.batchApproveOperatorERC721(erc721OperatorData);
  }

  function test_ApproveBAYCAndNOUNS() public {
    LlamaAccount.ERC721OperatorData[]
      memory erc721OperatorData = new LlamaAccount.ERC721OperatorData[](2);
    erc721OperatorData[0] = LlamaAccount.ERC721OperatorData(
      BAYC,
      BAYC_WHALE,
      true
    );
    erc721OperatorData[1] = LlamaAccount.ERC721OperatorData(
      NOUNS,
      NOUNS_WHALE,
      true
    );

    // Approve NFTs from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.batchApproveOperatorERC721(erc721OperatorData);
    assertEq(BAYC.isApprovedForAll(mpAccount1Addr, BAYC_WHALE), true);
    assertEq(NOUNS.isApprovedForAll(mpAccount1Addr, NOUNS_WHALE), true);
    vm.stopPrank();
  }
}

contract TransferERC1155 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);

    vm.prank(caller);
    mpAccount1LlamaAccount.transferERC1155(
      LlamaAccount.ERC1155Data(
        RARI,
        RARI_WHALE,
        RARI_ID_1,
        RARI_ID_1_AMOUNT,
        ""
      )
    );
  }

  function test_TransferRARI() public {
    transferRARIToAccount(RARI_ID_1, RARI_ID_1_AMOUNT);

    uint256 accountNFTBalance = RARI.balanceOf(mpAccount1Addr, RARI_ID_1);
    uint256 whaleNFTBalance = RARI.balanceOf(RARI_WHALE, RARI_ID_1);

    // Transfer NFT from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.transferERC1155(
      LlamaAccount.ERC1155Data(
        RARI,
        RARI_WHALE,
        RARI_ID_1,
        RARI_ID_1_AMOUNT,
        ""
      )
    );
    assertEq(RARI.balanceOf(mpAccount1Addr, RARI_ID_1), 0);
    assertEq(
      RARI.balanceOf(mpAccount1Addr, RARI_ID_1),
      accountNFTBalance - RARI_ID_1_AMOUNT
    );
    assertEq(
      RARI.balanceOf(RARI_WHALE, RARI_ID_1),
      whaleNFTBalance + RARI_ID_1_AMOUNT
    );
    vm.stopPrank();
  }

  function test_RevertIf_ToZeroAddress() public {
    vm.startPrank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.ZeroAddressNotAllowed.selector);
    mpAccount1LlamaAccount.transferERC1155(
      LlamaAccount.ERC1155Data(
        RARI,
        address(0),
        RARI_ID_1,
        RARI_ID_1_AMOUNT,
        ""
      )
    );
    vm.stopPrank();
  }
}

contract BatchTransferSingleERC1155 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);
    uint256[] memory tokenIDs = new uint256[](2);
    tokenIDs[0] = RARI_ID_1;
    tokenIDs[1] = RARI_ID_2;

    uint256[] memory amounts = new uint256[](2);
    amounts[0] = RARI_ID_1_AMOUNT;
    amounts[1] = RARI_ID_2_AMOUNT;

    vm.prank(caller);
    mpAccount1LlamaAccount.batchTransferSingleERC1155(
      LlamaAccount.ERC1155BatchData(RARI, RARI_WHALE, tokenIDs, amounts, "")
    );
  }

  function test_TransferRARI() public {
    transferRARIToAccount(RARI_ID_1, RARI_ID_1_AMOUNT);
    transferRARIToAccount(RARI_ID_2, RARI_ID_2_AMOUNT);

    uint256 accountNFTBalance1 = RARI.balanceOf(mpAccount1Addr, RARI_ID_1);
    uint256 whaleNFTBalance1 = RARI.balanceOf(RARI_WHALE, RARI_ID_1);
    uint256 accountNFTBalance2 = RARI.balanceOf(mpAccount1Addr, RARI_ID_2);
    uint256 whaleNFTBalance2 = RARI.balanceOf(RARI_WHALE, RARI_ID_2);

    uint256[] memory tokenIDs = new uint256[](2);
    tokenIDs[0] = RARI_ID_1;
    tokenIDs[1] = RARI_ID_2;

    uint256[] memory amounts = new uint256[](2);
    amounts[0] = RARI_ID_1_AMOUNT;
    amounts[1] = RARI_ID_2_AMOUNT;

    // Transfer NFT from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.batchTransferSingleERC1155(
      LlamaAccount.ERC1155BatchData(RARI, RARI_WHALE, tokenIDs, amounts, "")
    );
    assertEq(RARI.balanceOf(mpAccount1Addr, RARI_ID_1), 0);
    assertEq(
      RARI.balanceOf(mpAccount1Addr, RARI_ID_1),
      accountNFTBalance1 - RARI_ID_1_AMOUNT
    );
    assertEq(
      RARI.balanceOf(RARI_WHALE, RARI_ID_1),
      whaleNFTBalance1 + RARI_ID_1_AMOUNT
    );
    assertEq(RARI.balanceOf(mpAccount1Addr, RARI_ID_2), 0);
    assertEq(
      RARI.balanceOf(mpAccount1Addr, RARI_ID_2),
      accountNFTBalance2 - RARI_ID_2_AMOUNT
    );
    assertEq(
      RARI.balanceOf(RARI_WHALE, RARI_ID_2),
      whaleNFTBalance2 + RARI_ID_2_AMOUNT
    );
    vm.stopPrank();
  }

  function test_RevertIf_ToZeroAddress() public {
    uint256[] memory tokenIDs = new uint256[](2);
    tokenIDs[0] = RARI_ID_1;
    tokenIDs[1] = RARI_ID_2;

    uint256[] memory amounts = new uint256[](2);
    amounts[0] = RARI_ID_1_AMOUNT;
    amounts[1] = RARI_ID_2_AMOUNT;

    vm.startPrank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.ZeroAddressNotAllowed.selector);
    mpAccount1LlamaAccount.batchTransferSingleERC1155(
      LlamaAccount.ERC1155BatchData(RARI, address(0), tokenIDs, amounts, "")
    );
    vm.stopPrank();
  }
}

contract BatchTransferMultipleERC1155 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);
    LlamaAccount.ERC1155BatchData[]
      memory erc1155BatchData = new LlamaAccount.ERC1155BatchData[](2);

    vm.prank(caller);
    mpAccount1LlamaAccount.batchTransferMultipleERC1155(erc1155BatchData);
  }

  function test_TransferRARIAndOPENSTORE() public {
    transferRARIToAccount(RARI_ID_1, RARI_ID_1_AMOUNT);
    transferRARIToAccount(RARI_ID_2, RARI_ID_2_AMOUNT);
    transferOPENSTOREToAccount(OPENSTORE_ID_1, OPENSTORE_ID_1_AMOUNT);
    transferOPENSTOREToAccount(OPENSTORE_ID_2, OPENSTORE_ID_2_AMOUNT);

    uint256 whaleRARIBalance1 = RARI.balanceOf(RARI_WHALE, RARI_ID_1);
    uint256 whaleRARIBalance2 = RARI.balanceOf(RARI_WHALE, RARI_ID_2);
    uint256 whaleOPENSTOREBalance1 = OPENSTORE.balanceOf(
      OPENSTORE_WHALE,
      OPENSTORE_ID_1
    );
    uint256 whaleOPENSTOREBalance2 = OPENSTORE.balanceOf(
      OPENSTORE_WHALE,
      OPENSTORE_ID_2
    );

    uint256[] memory tokenIDs1 = new uint256[](2);
    tokenIDs1[0] = RARI_ID_1;
    tokenIDs1[1] = RARI_ID_2;

    uint256[] memory tokenIDs2 = new uint256[](2);
    tokenIDs2[0] = OPENSTORE_ID_1;
    tokenIDs2[1] = OPENSTORE_ID_2;

    uint256[] memory amounts1 = new uint256[](2);
    amounts1[0] = RARI_ID_1_AMOUNT;
    amounts1[1] = RARI_ID_2_AMOUNT;

    uint256[] memory amounts2 = new uint256[](2);
    amounts2[0] = OPENSTORE_ID_1_AMOUNT;
    amounts2[1] = OPENSTORE_ID_2_AMOUNT;

    LlamaAccount.ERC1155BatchData[]
      memory erc1155BatchData = new LlamaAccount.ERC1155BatchData[](2);
    erc1155BatchData[0] = LlamaAccount.ERC1155BatchData(
      RARI,
      RARI_WHALE,
      tokenIDs1,
      amounts1,
      ""
    );
    erc1155BatchData[1] = LlamaAccount.ERC1155BatchData(
      OPENSTORE,
      OPENSTORE_WHALE,
      tokenIDs2,
      amounts2,
      ""
    );

    // Transfer NFT from account to whale
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.batchTransferMultipleERC1155(erc1155BatchData);
    assertEq(RARI.balanceOf(mpAccount1Addr, RARI_ID_1), 0);
    assertEq(
      RARI.balanceOf(RARI_WHALE, RARI_ID_1),
      whaleRARIBalance1 + RARI_ID_1_AMOUNT
    );
    assertEq(RARI.balanceOf(mpAccount1Addr, RARI_ID_2), 0);
    assertEq(
      RARI.balanceOf(RARI_WHALE, RARI_ID_2),
      whaleRARIBalance2 + RARI_ID_2_AMOUNT
    );
    assertEq(OPENSTORE.balanceOf(mpAccount1Addr, OPENSTORE_ID_1), 0);
    assertEq(
      OPENSTORE.balanceOf(OPENSTORE_WHALE, OPENSTORE_ID_1),
      whaleOPENSTOREBalance1 + OPENSTORE_ID_1_AMOUNT
    );
    assertEq(OPENSTORE.balanceOf(mpAccount1Addr, OPENSTORE_ID_2), 0);
    assertEq(
      OPENSTORE.balanceOf(OPENSTORE_WHALE, OPENSTORE_ID_2),
      whaleOPENSTOREBalance2 + OPENSTORE_ID_2_AMOUNT
    );
    vm.stopPrank();
  }

  function test_RevertIf_ToZeroAddress() public {
    uint256[] memory tokenIDs = new uint256[](1);
    uint256[] memory amounts = new uint256[](1);
    LlamaAccount.ERC1155BatchData[]
      memory erc1155BatchData = new LlamaAccount.ERC1155BatchData[](1);
    erc1155BatchData[0] = LlamaAccount.ERC1155BatchData(
      RARI,
      address(0),
      tokenIDs,
      amounts,
      ""
    );

    vm.startPrank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.ZeroAddressNotAllowed.selector);
    mpAccount1LlamaAccount.batchTransferMultipleERC1155(erc1155BatchData);
    vm.stopPrank();
  }
}

contract ApproveOperatorERC1155 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);

    vm.prank(caller);
    mpAccount1LlamaAccount.approveOperatorERC1155(
      LlamaAccount.ERC1155OperatorData(RARI, RARI_WHALE, true)
    );
  }

  function test_ApproveRARI() public {
    approveRARIToRecipient(true);
  }

  function test_DisapproveRARI() public {
    approveRARIToRecipient(false);
  }
}

contract BatchApproveOperatorERC1155 is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    vm.expectRevert(LlamaAccount.OnlyLlama.selector);
    LlamaAccount.ERC1155OperatorData[]
      memory erc1155OperatorData = new LlamaAccount.ERC1155OperatorData[](2);

    vm.prank(caller);
    mpAccount1LlamaAccount.batchApproveOperatorERC1155(erc1155OperatorData);
  }

  function test_ApproveRARIAndOPENSTORE() public {
    LlamaAccount.ERC1155OperatorData[]
      memory erc1155OperatorData = new LlamaAccount.ERC1155OperatorData[](2);
    erc1155OperatorData[0] = LlamaAccount.ERC1155OperatorData(
      RARI,
      RARI_WHALE,
      true
    );
    erc1155OperatorData[1] = LlamaAccount.ERC1155OperatorData(
      OPENSTORE,
      OPENSTORE_WHALE,
      true
    );

    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.batchApproveOperatorERC1155(erc1155OperatorData);
    assertEq(RARI.isApprovedForAll(mpAccount1Addr, RARI_WHALE), true);
    assertEq(OPENSTORE.isApprovedForAll(mpAccount1Addr, OPENSTORE_WHALE), true);
    vm.stopPrank();
  }
}

contract Execute is LlamaAccountTest {
  function testFuzz_RevertIf_CallerIsNotLlama(address caller) public {
    vm.assume(caller != address(mpExecutor));
    MockExtension mockExtension = new MockExtension();

    vm.expectRevert(LlamaAccount.OnlyLlama.selector);
    vm.prank(caller);
    mpAccount1LlamaAccount.execute(
      address(mockExtension),
      true,
      0,
      abi.encodePacked(MockExtension.testFunction.selector, "")
    );
  }

  function test_CallCryptoPunk() public {
    // Transfer Punk to Account to have it stuck in the Llama Account
    transferPUNKToAccount(PUNK_ID);

    uint256 accountNFTBalance = PUNK.balanceOf(mpAccount1Addr);
    uint256 whaleNFTBalance = PUNK.balanceOf(PUNK_WHALE);

    // Rescue Punk by calling execute call
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.execute(
      address(PUNK),
      false,
      0,
      abi.encodeWithSelector(
        ICryptoPunk.transferPunk.selector,
        PUNK_WHALE,
        PUNK_ID
      )
    );
    assertEq(PUNK.balanceOf(mpAccount1Addr), 0);
    assertEq(PUNK.balanceOf(mpAccount1Addr), accountNFTBalance - 1);
    assertEq(PUNK.balanceOf(PUNK_WHALE), whaleNFTBalance + 1);
    assertEq(PUNK.punkIndexToAddress(PUNK_ID), PUNK_WHALE);
    vm.stopPrank();
  }

  function test_CallWithValue() public {
    transferETHToAccount(ETH_AMOUNT);

    uint256 accountETHBalance = mpAccount1Addr.balance;
    assertEq(mpAccount1Addr.balance, ETH_AMOUNT);
    assertEq(WETH.balanceOf(mpAccount1Addr), 0);

    // Deposit ETH into WETH contract from Llama account. This shows that the ETH from the Llama account is used and
    // it's not paid for by the msg.sender.
    vm.startPrank(address(mpExecutor));
    mpAccount1LlamaAccount.execute(
      address(WETH),
      false,
      ETH_AMOUNT,
      abi.encodeWithSelector(IWETH.deposit.selector)
    );
    assertEq(mpAccount1Addr.balance, 0);
    assertEq(mpAccount1Addr.balance, accountETHBalance - ETH_AMOUNT);
    assertEq(WETH.balanceOf(mpAccount1Addr), ETH_AMOUNT);
    vm.stopPrank();
  }

  function test_CallWithValueThroughActionExecution() public {
    transferETHToAccount(ETH_AMOUNT);

    uint256 accountETHBalance = mpAccount1Addr.balance;
    assertEq(mpAccount1Addr.balance, ETH_AMOUNT);
    assertEq(WETH.balanceOf(mpAccount1Addr), 0);

    // Giving Action Creator permission to call `LlamaAccount.execute`.
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      PermissionData(
        mpAccount1Addr,
        LlamaAccount.execute.selector,
        mpStrategy1
      ),
      true
    );

    // Create Action.
    bytes memory data = abi.encodeCall(
      LlamaAccount.execute,
      (
        address(WETH),
        false,
        ETH_AMOUNT,
        abi.encodeWithSelector(IWETH.deposit.selector)
      )
    );
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      mpAccount1Addr,
      0,
      data,
      ""
    );
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      mpAccount1Addr,
      0,
      data
    );

    vm.warp(block.timestamp + 1);

    // Approval process.
    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    vm.prank(approverAlicia);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");

    vm.warp(block.timestamp + 6 days);

    // Queue action.
    mpCore.queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    // Execute action.
    mpCore.executeAction(actionInfo);

    assertEq(mpAccount1Addr.balance, 0);
    assertEq(mpAccount1Addr.balance, accountETHBalance - ETH_AMOUNT);
    assertEq(WETH.balanceOf(mpAccount1Addr), ETH_AMOUNT);
  }

  function test_RevertIf_ActionExecutedWithMsgValue() public {
    transferETHToAccount(ETH_AMOUNT);

    // Giving Action Creator permission to call `LlamaAccount.execute`.
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      PermissionData(
        mpAccount1Addr,
        LlamaAccount.execute.selector,
        mpStrategy1
      ),
      true
    );

    // Create Action with `ETH_AMOUNT` as `action.value`.
    bytes memory data = abi.encodeCall(
      LlamaAccount.execute,
      (
        address(WETH),
        false,
        ETH_AMOUNT,
        abi.encodeWithSelector(IWETH.deposit.selector)
      )
    );
    vm.prank(actionCreatorAaron);
    uint256 actionId = mpCore.createAction(
      uint8(Roles.ActionCreator),
      mpStrategy1,
      mpAccount1Addr,
      ETH_AMOUNT,
      data,
      ""
    );
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      actionCreatorAaron,
      uint8(Roles.ActionCreator),
      mpStrategy1,
      mpAccount1Addr,
      ETH_AMOUNT,
      data
    );

    vm.warp(block.timestamp + 1);

    // Approval process.
    vm.prank(approverAdam);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");
    vm.prank(approverAlicia);
    mpCore.castApproval(uint8(Roles.Approver), actionInfo, "");

    vm.warp(block.timestamp + 6 days);

    // Queue action.
    mpCore.queueAction(actionInfo);

    vm.warp(block.timestamp + 5 days);

    // Giving the caller ETH to execute the action with `action.value`.
    deal(address(this), ETH_AMOUNT);

    // Execute action. This should fail since the `LlamaAccount.execute` function is not `payable` but a `msg.value` is
    // being passed in from `tx.origin`.
    vm.expectRevert(
      abi.encodeWithSelector(LlamaCore.FailedActionExecution.selector, "")
    );
    mpCore.executeAction{value: ETH_AMOUNT}(actionInfo);
  }

  function test_DelegateCallMockExtension() public {
    MockExtension mockExtension = new MockExtension();

    vm.startPrank(address(mpExecutor));
    bytes memory result = mpAccount1LlamaAccount.execute(
      address(mockExtension),
      true,
      0,
      abi.encodePacked(MockExtension.testFunction.selector, "")
    );
    assertEq(10, uint256(bytes32(result)));
    vm.stopPrank();
  }

  function test_RevertIf_DelegatecallWithValue() public {
    MockExtension mockExtension = new MockExtension();

    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.CannotDelegatecallWithValue.selector);
    mpAccount1LlamaAccount.execute(
      address(mockExtension),
      true,
      ETH_AMOUNT,
      abi.encodePacked(MockExtension.testFunction.selector, "")
    );
  }

  function test_RevertIf_NotSuccess() public {
    MockExtension mockExtension = new MockExtension();

    vm.startPrank(address(mpExecutor));
    vm.expectRevert(
      abi.encodeWithSelector(LlamaAccount.FailedExecution.selector, "")
    );
    mpAccount1LlamaAccount.execute(
      address(mockExtension),
      true,
      0,
      abi.encodePacked("", "")
    );
    vm.stopPrank();
  }

  function test_RevertIf_Slot0Changes() public {
    MockMaliciousExtension mockExtension = new MockMaliciousExtension();

    bytes memory data = abi.encodeCall(MockMaliciousExtension.attack1, ());
    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.Slot0Changed.selector);
    mpAccount1LlamaAccount.execute(address(mockExtension), true, 0, data);

    data = abi.encodeCall(MockMaliciousExtension.attack2, ());
    vm.prank(address(mpExecutor));
    vm.expectRevert(LlamaAccount.Slot0Changed.selector);
    mpAccount1LlamaAccount.execute(address(mockExtension), true, 0, data);
  }
}

contract Integration is LlamaAccountTest {
  // Test that LlamaAccount can receive ETH
  function test_ReceiveETH() public {
    assertEq(mpAccount1Addr.balance, 0);

    vm.prank(ETH_WHALE);
    (bool success, ) = mpAccount1Addr.call{value: ETH_AMOUNT}("");
    assertTrue(success);
    assertEq(mpAccount1Addr.balance, ETH_AMOUNT);
  }

  // Test that LlamaAccount can receive ERC20 tokens
  function test_ReceiveERC20() public {
    assertEq(USDC.balanceOf(mpAccount1Addr), 0);

    vm.prank(USDC_WHALE);
    USDC.transfer(mpAccount1Addr, USDC_AMOUNT);
    assertEq(USDC.balanceOf(mpAccount1Addr), USDC_AMOUNT);
  }

  // Test that approved ERC20 tokens can be transferred from LlamaAccount to a recipient
  function test_TransferApprovedERC20() public {
    transferUSDCToAccount(USDC_AMOUNT);
    approveUSDCToRecipient(USDC_AMOUNT);

    uint256 accountUSDCBalance = USDC.balanceOf(mpAccount1Addr);
    uint256 whaleUSDCBalance = USDC.balanceOf(USDC_WHALE);

    // Transfer USDC from account to whale
    vm.startPrank(USDC_WHALE);
    USDC.transferFrom(mpAccount1Addr, USDC_WHALE, USDC_AMOUNT);
    assertEq(USDC.balanceOf(mpAccount1Addr), 0);
    assertEq(USDC.balanceOf(mpAccount1Addr), accountUSDCBalance - USDC_AMOUNT);
    assertEq(USDC.balanceOf(USDC_WHALE), whaleUSDCBalance + USDC_AMOUNT);
    vm.stopPrank();
  }

  // Test that LlamaAccount can receive ERC721 tokens
  function test_ReceiveERC721() public {
    transferBAYCToAccount(BAYC_ID);
  }

  // Test that LlamaAccount can safe receive ERC721 tokens
  function test_SafeReceiveERC721() public {
    assertEq(BAYC.balanceOf(mpAccount1Addr), 0);
    assertEq(BAYC.ownerOf(BAYC_ID), BAYC_WHALE);

    vm.startPrank(BAYC_WHALE);
    BAYC.safeTransferFrom(BAYC_WHALE, mpAccount1Addr, BAYC_ID);
    assertEq(BAYC.balanceOf(mpAccount1Addr), 1);
    assertEq(BAYC.ownerOf(BAYC_ID), mpAccount1Addr);
    vm.stopPrank();
  }

  // Test that approved ERC721 tokens can be transferred from LlamaAccount to a recipient
  function test_TransferApprovedERC721() public {
    transferBAYCToAccount(BAYC_ID);
    approveBAYCToRecipient(BAYC_ID);

    uint256 accountNFTBalance = BAYC.balanceOf(mpAccount1Addr);
    uint256 whaleNFTBalance = BAYC.balanceOf(BAYC_WHALE);

    // Transfer NFT from account to whale
    vm.startPrank(BAYC_WHALE);
    BAYC.transferFrom(mpAccount1Addr, BAYC_WHALE, BAYC_ID);
    assertEq(BAYC.balanceOf(mpAccount1Addr), 0);
    assertEq(BAYC.balanceOf(mpAccount1Addr), accountNFTBalance - 1);
    assertEq(BAYC.balanceOf(BAYC_WHALE), whaleNFTBalance + 1);
    assertEq(BAYC.ownerOf(BAYC_ID), BAYC_WHALE);
    vm.stopPrank();
  }

  // Test that approved Operator ERC721 tokens can be transferred from LlamaAccount to a recipient
  function test_TransferApprovedOperatorERC721() public {
    vm.startPrank(BAYC_WHALE);
    BAYC.transferFrom(BAYC_WHALE, mpAccount1Addr, BAYC_ID);
    BAYC.transferFrom(BAYC_WHALE, mpAccount1Addr, BAYC_ID_2);
    vm.stopPrank();
    approveOperatorBAYCToRecipient(true);

    uint256 accountNFTBalance = BAYC.balanceOf(mpAccount1Addr);
    uint256 whaleNFTBalance = BAYC.balanceOf(BAYC_WHALE);

    // Transfer NFT from account to whale
    vm.startPrank(BAYC_WHALE);
    BAYC.transferFrom(mpAccount1Addr, BAYC_WHALE, BAYC_ID);
    BAYC.transferFrom(mpAccount1Addr, BAYC_WHALE, BAYC_ID_2);
    assertEq(BAYC.balanceOf(mpAccount1Addr), 0);
    assertEq(BAYC.balanceOf(mpAccount1Addr), accountNFTBalance - 2);
    assertEq(BAYC.balanceOf(BAYC_WHALE), whaleNFTBalance + 2);
    assertEq(BAYC.ownerOf(BAYC_ID), BAYC_WHALE);
    assertEq(BAYC.ownerOf(BAYC_ID_2), BAYC_WHALE);
    vm.stopPrank();
  }

  // Test that LlamaAccount can receive ERC1155 tokens
  function test_ReceiveERC1155() public {
    transferRARIToAccount(RARI_ID_1, RARI_ID_1_AMOUNT);
  }

  // Test that approved ERC1155 tokens can be transferred from LlamaAccount to a recipient
  function test_TransferApprovedERC1155() public {
    transferRARIToAccount(RARI_ID_1, RARI_ID_1_AMOUNT);
    transferRARIToAccount(RARI_ID_2, RARI_ID_2_AMOUNT);
    approveRARIToRecipient(true);

    uint256 accountNFTBalance1 = RARI.balanceOf(mpAccount1Addr, RARI_ID_1);
    uint256 whaleNFTBalance1 = RARI.balanceOf(RARI_WHALE, RARI_ID_1);
    uint256 accountNFTBalance2 = RARI.balanceOf(mpAccount1Addr, RARI_ID_2);
    uint256 whaleNFTBalance2 = RARI.balanceOf(RARI_WHALE, RARI_ID_2);

    uint256[] memory tokenIDs = new uint256[](2);
    tokenIDs[0] = RARI_ID_1;
    tokenIDs[1] = RARI_ID_2;

    uint256[] memory amounts = new uint256[](2);
    amounts[0] = RARI_ID_1_AMOUNT;
    amounts[1] = RARI_ID_2_AMOUNT;

    // Transfer NFT from account to whale
    vm.startPrank(address(RARI_WHALE));
    RARI.safeBatchTransferFrom(
      mpAccount1Addr,
      RARI_WHALE,
      tokenIDs,
      amounts,
      ""
    );
    assertEq(RARI.balanceOf(mpAccount1Addr, RARI_ID_1), 0);
    assertEq(
      RARI.balanceOf(mpAccount1Addr, RARI_ID_1),
      accountNFTBalance1 - RARI_ID_1_AMOUNT
    );
    assertEq(
      RARI.balanceOf(RARI_WHALE, RARI_ID_1),
      whaleNFTBalance1 + RARI_ID_1_AMOUNT
    );
    assertEq(RARI.balanceOf(mpAccount1Addr, RARI_ID_2), 0);
    assertEq(
      RARI.balanceOf(mpAccount1Addr, RARI_ID_2),
      accountNFTBalance2 - RARI_ID_2_AMOUNT
    );
    assertEq(
      RARI.balanceOf(RARI_WHALE, RARI_ID_2),
      whaleNFTBalance2 + RARI_ID_2_AMOUNT
    );
    vm.stopPrank();
  }
}
