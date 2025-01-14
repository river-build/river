// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IXChainBase} from "./IXChains.sol";

// libraries

// contracts

library XChainLib {
  // keccak256(abi.encode(uint256(keccak256("xchain.entitlement.transactions.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xf501c51c066c21fd640901535874a71171bb35113f6dc2832fce1b1f9da0cc00;

  struct Layout {
    address nodeRegistry;
    mapping(bytes32 txId => IXChainBase.TransactionV2) transactions;
  }

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}
