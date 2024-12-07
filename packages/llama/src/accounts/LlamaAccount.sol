// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";

/// @title Llama Account
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice This contract can be used to hold assets for a Llama instance.
contract LlamaAccount is
  ILlamaAccount,
  ERC721Holder,
  ERC1155Holder,
  Initializable
{
  using SafeERC20 for IERC20;
  using Address for address payable;

  // =========================
  // ======== Structs ========
  // =========================

  /// @dev Llama account initialization configuration.
  struct Config {
    string name; // Name of the Llama account.
  }

  /// @dev Data for sending native tokens to recipients.
  struct NativeTokenData {
    address payable recipient; // Recipient of the native tokens.
    uint256 amount; // Amount of native tokens to send.
  }

  /// @dev Data for sending ERC20 tokens to recipients.
  struct ERC20Data {
    IERC20 token; // The ERC20 token to transfer.
    address recipient; // The address to transfer the token to.
    uint256 amount; // The amount of tokens to transfer.
  }

  /// @dev Data for sending ERC721 tokens to recipients.
  struct ERC721Data {
    IERC721 token; // The ERC721 token to transfer.
    address recipient; // The address to transfer the token to.
    uint256 tokenId; // The tokenId of the token to transfer.
  }

  /// @dev Data for operator allowance for ERC721 transfers.
  struct ERC721OperatorData {
    IERC721 token; // The ERC721 token to transfer.
    address recipient; // The address to transfer the token to.
    bool approved; // Whether to approve or revoke allowance.
  }

  /// @dev Data for sending ERC1155 tokens to recipients.
  struct ERC1155Data {
    IERC1155 token; // The ERC1155 token to transfer.
    address recipient; // The address to transfer the token to.
    uint256 tokenId; // The tokenId of the token to transfer.
    uint256 amount; // The amount of tokens to transfer.
    bytes data; // The data to pass to the ERC1155 token.
  }

  /// @dev Data for batch sending ERC1155 tokens to recipients.
  struct ERC1155BatchData {
    IERC1155 token; // The ERC1155 token to transfer.
    address recipient; // The address to transfer the token to.
    uint256[] tokenIds; // The tokenId of the token to transfer.
    uint256[] amounts; // The amount of tokens to transfer.
    bytes data; // The data to pass to the ERC1155 token.
  }

  /// @dev Data for operator allowance for ERC1155 transfers.
  struct ERC1155OperatorData {
    IERC1155 token; // The ERC1155 token to transfer.
    address recipient; // The address to transfer the token to.
    bool approved; // Whether to approve or revoke allowance.
  }

  // ======================================
  // ======== Errors and Modifiers ========
  // ======================================

  /// @dev Only callable by a Llama instance's executor.
  error OnlyLlama();

  /// @dev Recipient cannot be the 0 address.
  error ZeroAddressNotAllowed();

  /// @dev External call failed.
  /// @param result Data returned by the called function.
  error FailedExecution(bytes result);

  /// @dev Slot 0 cannot be changed as a result of delegatecalls.
  error Slot0Changed();

  /// @dev Value cannot be sent with delegatecalls.
  error CannotDelegatecallWithValue();

  /// @dev Checks that the caller is the Llama executor and reverts if not.
  modifier onlyLlama() {
    if (msg.sender != llamaExecutor) revert OnlyLlama();
    _;
  }

  // ===================================
  // ======== Storage Variables ========
  // ===================================

  /// @notice The Llama instance's executor.
  /// @dev We intentionally put this before the `name` so it's packed with the `Initializable`
  /// storage variables, that way we can only check one slot before and after a delegatecall.
  address public llamaExecutor;

  /// @notice Name of the Llama account.
  string public name;

  // ======================================================
  // ======== Contract Creation and Initialization ========
  // ======================================================

  /// @dev This contract is deployed as a minimal proxy from the core's `_deployAccounts` function. The
  /// `_disableInitializers` locks the implementation (logic) contract, preventing any future initialization of it.
  constructor() {
    _disableInitializers();
  }

  /// @inheritdoc ILlamaAccount
  function initialize(bytes memory config) external initializer returns (bool) {
    llamaExecutor = address(LlamaCore(msg.sender).executor());
    Config memory accountConfig = abi.decode(config, (Config));
    name = accountConfig.name;

    return true;
  }

  // ===========================================
  // ======== External and Public Logic ========
  // ===========================================

  // -------- Native Token --------

  /// @notice Enables the Llama account to receive native tokens.
  receive() external payable {}

  /// @notice Transfer native tokens to a recipient.
  /// @param nativeTokenData The `amount` and `recipient` of the native token transfer.
  function transferNativeToken(
    NativeTokenData calldata nativeTokenData
  ) public onlyLlama {
    if (nativeTokenData.recipient == address(0)) revert ZeroAddressNotAllowed();
    nativeTokenData.recipient.sendValue(nativeTokenData.amount);
  }

  /// @notice Batch transfer native tokens to a recipient.
  /// @param nativeTokenData The `amounts` and `recipients` for the native token transfers.
  function batchTransferNativeToken(
    NativeTokenData[] calldata nativeTokenData
  ) external onlyLlama {
    uint256 length = nativeTokenData.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      transferNativeToken(nativeTokenData[i]);
    }
  }

  // -------- ERC20 Token --------

  /// @notice Transfer ERC20 tokens to a recipient.
  /// @param erc20Data The `token`, `recipient`, and `amount` for the ERC20 transfer.
  function transferERC20(ERC20Data calldata erc20Data) public onlyLlama {
    if (erc20Data.recipient == address(0)) revert ZeroAddressNotAllowed();
    erc20Data.token.safeTransfer(erc20Data.recipient, erc20Data.amount);
  }

  /// @notice Batch transfer ERC20 tokens to recipients.
  /// @param erc20Data The `token`, `recipient`, and `amount` for the ERC20 transfers.
  function batchTransferERC20(
    ERC20Data[] calldata erc20Data
  ) external onlyLlama {
    uint256 length = erc20Data.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      transferERC20(erc20Data[i]);
    }
  }

  /// @notice Approve an ERC20 allowance for a recipient.
  /// @param erc20Data The `token`, `recipient`, and `amount` for the ERC20 approval.
  function approveERC20(ERC20Data calldata erc20Data) public onlyLlama {
    erc20Data.token.forceApprove(erc20Data.recipient, erc20Data.amount);
  }

  /// @notice Batch approve ERC20 allowances for recipients.
  /// @param erc20Data The `token`, `recipient`, and `amount` for the ERC20 approvals.
  function batchApproveERC20(
    ERC20Data[] calldata erc20Data
  ) external onlyLlama {
    uint256 length = erc20Data.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      approveERC20(erc20Data[i]);
    }
  }

  // -------- ERC721 Token --------

  /// @notice Transfer an ERC721 token to a recipient.
  /// @param erc721Data The `token`, `recipient`, and `tokenId` of the ERC721 transfer.
  function transferERC721(ERC721Data calldata erc721Data) public onlyLlama {
    if (erc721Data.recipient == address(0)) revert ZeroAddressNotAllowed();
    erc721Data.token.transferFrom(
      address(this),
      erc721Data.recipient,
      erc721Data.tokenId
    );
  }

  /// @notice Batch transfer ERC721 tokens to recipients.
  /// @param erc721Data The `token`, `recipient`, and `tokenId` of the ERC721 transfers.
  function batchTransferERC721(
    ERC721Data[] calldata erc721Data
  ) external onlyLlama {
    uint256 length = erc721Data.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      transferERC721(erc721Data[i]);
    }
  }

  /// @notice Approve a recipient to transfer an ERC721.
  /// @param erc721Data The `token`, `recipient`, and `tokenId` of the ERC721 approval.
  function approveERC721(ERC721Data calldata erc721Data) public onlyLlama {
    erc721Data.token.approve(erc721Data.recipient, erc721Data.tokenId);
  }

  /// @notice Batch approve recipients to transfer ERC721s.
  /// @param erc721Data The `token`, `recipient`, and `tokenId` for the ERC721 approvals.
  function batchApproveERC721(
    ERC721Data[] calldata erc721Data
  ) external onlyLlama {
    uint256 length = erc721Data.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      approveERC721(erc721Data[i]);
    }
  }

  /// @notice Approve an operator for ERC721 transfers.
  /// @param erc721OperatorData The `token`, `recipient`, and `approved` boolean for the ERC721 operator approval.
  function approveOperatorERC721(
    ERC721OperatorData calldata erc721OperatorData
  ) public onlyLlama {
    erc721OperatorData.token.setApprovalForAll(
      erc721OperatorData.recipient,
      erc721OperatorData.approved
    );
  }

  /// @notice Batch approve operators for ERC721 transfers.
  /// @param erc721OperatorData The `token`, `recipient`, and `approved` booleans for the ERC721 operator approvals.
  function batchApproveOperatorERC721(
    ERC721OperatorData[] calldata erc721OperatorData
  ) external onlyLlama {
    uint256 length = erc721OperatorData.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      approveOperatorERC721(erc721OperatorData[i]);
    }
  }

  // -------- ERC1155 Token --------

  /// @notice Transfer ERC1155 tokens to a recipient.
  /// @param erc1155Data The data of the ERC1155 transfer.
  function transferERC1155(
    ERC1155Data calldata erc1155Data
  ) external onlyLlama {
    if (erc1155Data.recipient == address(0)) revert ZeroAddressNotAllowed();
    erc1155Data.token.safeTransferFrom(
      address(this),
      erc1155Data.recipient,
      erc1155Data.tokenId,
      erc1155Data.amount,
      erc1155Data.data
    );
  }

  /// @notice Batch transfer ERC1155 tokens of a single ERC1155 collection to recipients.
  /// @param erc1155BatchData The data of the ERC1155 batch transfer.
  function batchTransferSingleERC1155(
    ERC1155BatchData calldata erc1155BatchData
  ) public onlyLlama {
    if (erc1155BatchData.recipient == address(0))
      revert ZeroAddressNotAllowed();
    erc1155BatchData.token.safeBatchTransferFrom(
      address(this),
      erc1155BatchData.recipient,
      erc1155BatchData.tokenIds,
      erc1155BatchData.amounts,
      erc1155BatchData.data
    );
  }

  /// @notice Batch transfer ERC1155 tokens of multiple ERC1155 collections to recipients.
  /// @param erc1155BatchData The data of the ERC1155 batch transfers.
  function batchTransferMultipleERC1155(
    ERC1155BatchData[] calldata erc1155BatchData
  ) external onlyLlama {
    uint256 length = erc1155BatchData.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      batchTransferSingleERC1155(erc1155BatchData[i]);
    }
  }

  /// @notice Grant an ERC1155 operator allowance to recipients.
  /// @param erc1155OperatorData The data of the ERC1155 operator allowance.
  function approveOperatorERC1155(
    ERC1155OperatorData calldata erc1155OperatorData
  ) public onlyLlama {
    erc1155OperatorData.token.setApprovalForAll(
      erc1155OperatorData.recipient,
      erc1155OperatorData.approved
    );
  }

  /// @notice Batch approve ERC1155 operator allowances to recipients.
  /// @param erc1155OperatorData The data of the ERC1155 operator allowances.
  function batchApproveOperatorERC1155(
    ERC1155OperatorData[] calldata erc1155OperatorData
  ) external onlyLlama {
    uint256 length = erc1155OperatorData.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      approveOperatorERC1155(erc1155OperatorData[i]);
    }
  }

  // -------- Generic Execution --------

  /// @notice Execute arbitrary calls from the Llama Account.
  /// @dev Be careful and intentional while assigning permissions to a policyholder that can create an action to call
  /// this function, especially while using the delegatecall functionality as it can lead to arbitrary code execution in
  /// the context of this Llama account.
  /// @param target The address of the contract to call.
  /// @param withDelegatecall Whether to use delegatecall or call.
  /// @param value The amount of ETH to send with the call, taken from the Llama Account.
  /// @param callData The calldata to pass to the contract.
  /// @return The result of the call.
  function execute(
    address target,
    bool withDelegatecall,
    uint256 value,
    bytes calldata callData
  ) external onlyLlama returns (bytes memory) {
    bool success;
    bytes memory result;

    if (withDelegatecall) {
      if (value > 0) revert CannotDelegatecallWithValue();

      // Whenever we're executing arbitrary code in the context of this account, we want to ensure
      // that none of the storage in this contract changes, as this could let someone who sneaks in
      // a malicious (or buggy) target to take ownership of this contract. Slot 0 contains all
      // relevant storage variables for security, so we check the value before and after execution
      // to make sure it's unchanged. The contract name starts in slot 1, but it's not as important
      // if that's changed (and it can be changed back), so to save gas we don't check the name.
      // The storage layout of this contract is below:
      //
      // | Variable Name | Type    | Slot | Offset | Bytes |
      // |---------------|---------|------|--------|-------|
      // | _initialized  | uint8   | 0    | 0      | 1     |
      // | _initializing | bool    | 0    | 1      | 1     |
      // | llamaExecutor | address | 0    | 2      | 20    |
      // | name          | string  | 1    | 0      | 32    |

      bytes32 originalStorage = _readSlot0();
      (success, result) = target.delegatecall(callData);
      if (originalStorage != _readSlot0()) revert Slot0Changed();
    } else {
      (success, result) = target.call{value: value}(callData);
    }

    if (!success) revert FailedExecution(result);
    return result;
  }

  // ================================
  // ======== Internal Logic ========
  // ================================

  /// @dev Reads slot 0 from storage, used to check that storage hasn't changed after delegatecall.
  function _readSlot0() internal view returns (bytes32 slot0) {
    assembly {
      slot0 := sload(0)
    }
  }
}
