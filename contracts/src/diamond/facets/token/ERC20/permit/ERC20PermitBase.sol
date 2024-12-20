// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IERC20PermitBase} from "./IERC20PermitBase.sol";

// libraries
import {ERC20Storage} from "../ERC20Storage.sol";

// contracts
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Nonces} from "@river-build/diamond/src/utils/Nonces.sol";
import {EIP712} from "@river-build/diamond/src/utils/cryptography/EIP712.sol";

abstract contract ERC20PermitBase is IERC20PermitBase, EIP712, Nonces {
  /// @dev `keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")`.
  bytes32 private constant _PERMIT_TYPEHASH =
    0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;

  /// @dev Sets `value` as the allowance of `spender` over the tokens of `owner`,
  /// authorized by a signed approval by `owner`.
  ///
  /// Emits a {Approval} event.
  function _permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal {
    require(block.timestamp <= deadline, "ERC20Permit: expired deadline");
    bytes32 structHash = keccak256(
      abi.encode(
        _PERMIT_TYPEHASH,
        owner,
        spender,
        value,
        _useNonce(owner),
        deadline
      )
    );

    bytes32 hash = _hashTypedDataV4(structHash);

    address signer = ECDSA.recover(hash, v, r, s);
    require(signer == owner, "ERC20Permit: invalid signature");
    ERC20Storage.layout().inner.approve(owner, spender, value);
  }
}
