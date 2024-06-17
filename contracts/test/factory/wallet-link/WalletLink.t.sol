// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IWalletLinkBase} from "contracts/src/factory/facets/wallet-link/IWalletLink.sol";
import {WalletLink} from "contracts/src/factory/facets/wallet-link/WalletLink.sol";

// libraries
import {Vm} from "forge-std/Test.sol";

// contracts
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";

import {Nonces} from "contracts/src/diamond/utils/Nonces.sol";

contract WalletLinkTest is IWalletLinkBase, BaseSetup {
  Vm.Wallet rootWallet;
  Vm.Wallet wallet;
  Vm.Wallet smartAccount;

  function setUp() public override {
    super.setUp();

    rootWallet = vm.createWallet("rootKey");
    wallet = vm.createWallet("wallet");
    smartAccount = vm.createWallet("smartAccount");
  }

  // =============================================================
  //                   linkCallerToRootKey
  // =============================================================
  modifier givenCallerIsLinked() {
    uint256 nonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);

    bytes memory signature = _signWalletLink(
      rootWallet.privateKey,
      wallet.addr,
      nonce
    );

    // as a wallet, delegate to root wallet
    vm.startPrank(wallet.addr);
    vm.expectEmit(address(walletLink));
    emit LinkWalletToRootKey(wallet.addr, rootWallet.addr);
    walletLink.linkCallerToRootKey(
      LinkedWallet(rootWallet.addr, signature),
      nonce
    );
    vm.stopPrank();
    _;
  }

  function test_linkCallerToRootKey() external givenCallerIsLinked {
    assertTrue(walletLink.checkIfLinked(rootWallet.addr, wallet.addr));
  }

  function test_revertWhen_linkCallerToRootKeyAddressIsZero() external {
    uint256 nonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);

    bytes memory signature = _signWalletLink(
      rootWallet.privateKey,
      wallet.addr,
      nonce
    );

    vm.prank(wallet.addr);
    vm.expectRevert(WalletLink__InvalidAddress.selector);
    walletLink.linkCallerToRootKey(LinkedWallet(address(0), signature), nonce);
  }

  function test_revertWhen_linkCallerToRootKeyLinkToSelf()
    external
    givenCallerIsLinked
  {
    uint256 nonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);
    bytes memory signature = "0x00";

    vm.prank(rootWallet.addr);
    vm.expectRevert(WalletLink__CannotLinkToSelf.selector);
    walletLink.linkCallerToRootKey(
      LinkedWallet(rootWallet.addr, signature),
      nonce
    );
  }

  function test_revertWhen_linkCallerToRootKeyAlreadyLinked()
    external
    givenCallerIsLinked
  {
    uint256 nonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);

    bytes memory signature = _signWalletLink(
      rootWallet.privateKey,
      wallet.addr,
      nonce
    );

    vm.startPrank(wallet.addr);
    vm.expectRevert(
      abi.encodeWithSelector(
        WalletLink__LinkAlreadyExists.selector,
        wallet.addr,
        rootWallet.addr
      )
    );
    walletLink.linkCallerToRootKey(
      LinkedWallet(rootWallet.addr, signature),
      nonce
    );
    vm.stopPrank();
  }

  function test_revertWhen_linkCallerToRootKeyRootLinkAlreadyExists()
    external
    givenCallerIsLinked
  {
    uint256 nonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);
    address caller = vm.createWallet("wallet3").addr;

    vm.prank(caller);
    vm.expectRevert(
      abi.encodeWithSelector(
        WalletLink__LinkedToAnotherRootKey.selector,
        caller,
        rootWallet.addr
      )
    );
    walletLink.linkCallerToRootKey(LinkedWallet(wallet.addr, ""), nonce);
  }

  function test_revertWhen_linkCallerToRootKeyLinkingToAnotherRootWallet()
    external
    givenCallerIsLinked
  {
    address root = vm.createWallet("rootKey2").addr;

    uint256 nonce2 = walletLink.getLatestNonceForRootKey(root);
    bytes memory signature = "";

    vm.prank(rootWallet.addr);
    vm.expectRevert(
      abi.encodeWithSelector(
        WalletLink__CannotLinkToRootWallet.selector,
        rootWallet.addr,
        root
      )
    );
    walletLink.linkCallerToRootKey(LinkedWallet(root, signature), nonce2);
  }

  function test_revertWhen_linkCallerToRootKeyInvalidSignature() external {
    uint256 nonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);

    bytes memory signature = _signWalletLink(
      wallet.privateKey,
      wallet.addr,
      nonce
    );

    vm.prank(wallet.addr);
    vm.expectRevert(WalletLink__InvalidSignature.selector);
    walletLink.linkCallerToRootKey(
      LinkedWallet(rootWallet.addr, signature),
      nonce
    );
  }

  function test_revertWhen_linkCallerToRootKeyInvalidNonce()
    external
    givenCallerIsLinked
  {
    uint256 nonce = 0;
    address anotherWallet = vm.createWallet("wallet2").addr;

    bytes memory signature = _signWalletLink(
      rootWallet.privateKey,
      anotherWallet,
      nonce
    );

    vm.prank(anotherWallet);
    vm.expectRevert(
      abi.encodeWithSelector(
        Nonces.InvalidAccountNonce.selector,
        rootWallet.addr,
        1
      )
    );
    walletLink.linkCallerToRootKey(
      LinkedWallet(rootWallet.addr, signature),
      nonce
    );
  }

  // =============================================================
  //                   linkWalletToRootKey
  // =============================================================
  modifier givenWalletIsLinked() {
    uint256 rootNonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);

    bytes memory rootSignature = _signWalletLink(
      rootWallet.privateKey,
      wallet.addr,
      rootNonce
    );

    uint256 walletNonce = walletLink.getLatestNonceForRootKey(wallet.addr);

    bytes memory walletSignature = _signWalletLink(
      wallet.privateKey,
      rootWallet.addr,
      walletNonce
    );

    // as a smart wallet, delegate another wallet to a root wallet
    vm.startPrank(smartAccount.addr);
    vm.expectEmit(address(walletLink));
    emit LinkWalletToRootKey(wallet.addr, rootWallet.addr);
    walletLink.linkWalletToRootKey(
      LinkedWallet(wallet.addr, walletSignature),
      LinkedWallet(rootWallet.addr, rootSignature),
      rootNonce
    );
    vm.stopPrank();
    _;
  }

  function test_linkWalletToRootKey() external givenWalletIsLinked {
    assertTrue(walletLink.checkIfLinked(rootWallet.addr, wallet.addr));
  }

  function test_revertWhen_linkWalletToRootKeyAddressIsZero() external {
    vm.prank(smartAccount.addr);
    vm.expectRevert(WalletLink__InvalidAddress.selector);
    walletLink.linkWalletToRootKey(
      LinkedWallet(address(0), ""),
      LinkedWallet(address(0), ""),
      0
    );
  }

  function test_revertWhen_linkWalletToRootKeyCannotSelfLink() external {
    vm.prank(smartAccount.addr);
    vm.expectRevert(WalletLink__CannotLinkToSelf.selector);
    walletLink.linkWalletToRootKey(
      LinkedWallet(wallet.addr, ""),
      LinkedWallet(wallet.addr, ""),
      0
    );
  }

  function test_revertWhen_linkWalletToRootKeyAlreadyLinked()
    external
    givenWalletIsLinked
  {
    vm.startPrank(smartAccount.addr);
    vm.expectRevert(
      abi.encodeWithSelector(
        WalletLink__LinkAlreadyExists.selector,
        wallet.addr,
        rootWallet.addr
      )
    );
    walletLink.linkWalletToRootKey(
      LinkedWallet(wallet.addr, ""),
      LinkedWallet(rootWallet.addr, ""),
      0
    );
    vm.stopPrank();
  }

  function test_revertWhen_linkWalletToRootKeyRootLinkAlreadyExists()
    external
    givenWalletIsLinked
  {
    uint256 nonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);
    address anotherWallet = vm.createWallet("wallet3").addr;

    vm.expectRevert(
      abi.encodeWithSelector(
        WalletLink__LinkedToAnotherRootKey.selector,
        anotherWallet,
        rootWallet.addr
      )
    );
    walletLink.linkWalletToRootKey(
      LinkedWallet(anotherWallet, ""),
      LinkedWallet(wallet.addr, ""),
      nonce
    );
  }

  function test_revertWhen_linkWalletToRootKeyLinkingToAnotherRootWallet()
    external
    givenWalletIsLinked
  {
    address root = vm.createWallet("rootKey2").addr;
    uint256 nonce2 = walletLink.getLatestNonceForRootKey(root);

    vm.prank(smartAccount.addr);
    vm.expectRevert(
      abi.encodeWithSelector(
        WalletLink__CannotLinkToRootWallet.selector,
        rootWallet.addr,
        root
      )
    );
    walletLink.linkWalletToRootKey(
      LinkedWallet(rootWallet.addr, ""),
      LinkedWallet(root, ""),
      nonce2
    );
  }

  function test_revertWhen_linkWalletToRootKeyInvalidRootSignature() external {
    address wrongWallet = vm.createWallet("wallet2").addr;

    uint256 nonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);

    bytes memory signature = _signWalletLink(
      rootWallet.privateKey,
      wrongWallet,
      nonce
    );

    vm.prank(smartAccount.addr);
    vm.expectRevert(WalletLink__InvalidSignature.selector);
    walletLink.linkWalletToRootKey(
      LinkedWallet(wallet.addr, ""),
      LinkedWallet(rootWallet.addr, signature),
      nonce
    );
  }

  function test_revertWhen_linkWalletToRootKeyInvalidWalletSignature()
    external
  {
    address wrongWallet = vm.createWallet("wallet2").addr;

    uint256 nonce = walletLink.getLatestNonceForRootKey(rootWallet.addr);

    bytes memory rootSignature = _signWalletLink(
      rootWallet.privateKey,
      wallet.addr,
      nonce
    );

    bytes memory walletSignature = _signWalletLink(
      wallet.privateKey,
      wrongWallet,
      nonce
    );

    vm.prank(smartAccount.addr);
    vm.expectRevert(WalletLink__InvalidSignature.selector);
    walletLink.linkWalletToRootKey(
      LinkedWallet(wallet.addr, walletSignature),
      LinkedWallet(rootWallet.addr, rootSignature),
      nonce
    );
  }

  function test_revertWhen_linkWalletToRootKeyInvalidNonce()
    external
    givenWalletIsLinked
  {
    uint256 nonce = 0;
    Vm.Wallet memory anotherWallet = vm.createWallet("wallet2");

    bytes memory rootSignature = _signWalletLink(
      rootWallet.privateKey,
      anotherWallet.addr,
      nonce
    );

    bytes memory walletSignature = _signWalletLink(
      anotherWallet.privateKey,
      rootWallet.addr,
      nonce
    );

    vm.prank(smartAccount.addr);
    vm.expectRevert(
      abi.encodeWithSelector(
        Nonces.InvalidAccountNonce.selector,
        rootWallet.addr,
        walletLink.getLatestNonceForRootKey(rootWallet.addr)
      )
    );
    walletLink.linkWalletToRootKey(
      LinkedWallet(anotherWallet.addr, walletSignature),
      LinkedWallet(rootWallet.addr, rootSignature),
      nonce
    );
  }
}
