// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibClone} from "solady/utils/LibClone.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";

library Create2Utils {
  address internal constant CREATE2_FACTORY =
    0x4e59b44847b379578588920cA78FbF26c0B4956C;

  error MissingCreate2Factory();
  error Create2AddressDerivationFailed();
  error Create2CallFailed();

  function create2Deploy(
    bytes32 salt,
    bytes memory bytecode
  ) internal returns (address) {
    if (!isContractDeployed(CREATE2_FACTORY)) {
      CustomRevert.revertWith(MissingCreate2Factory.selector);
    }

    address computed = computeCreate2Address(salt, bytecode);

    if (isContractDeployed(computed)) {
      return computed;
    } else {
      bytes memory returnData = performCreate2Call(salt, bytecode);
      address deployedAt = address(uint160(bytes20(returnData)));
      if (deployedAt != computed) {
        CustomRevert.revertWith(Create2AddressDerivationFailed.selector);
      }
      return deployedAt;
    }
  }

  function isContractDeployed(
    address _addr
  ) internal view returns (bool isContract) {
    assembly {
      isContract := gt(extcodesize(_addr), 0)
    }
  }

  function computeCreate2Address(
    bytes32 salt,
    bytes memory bytecode
  ) internal pure returns (address) {
    return
      LibClone.predictDeterministicAddress(
        keccak256(bytecode),
        salt,
        CREATE2_FACTORY
      );
  }

  function performCreate2Call(
    bytes32 salt,
    bytes memory bytecode
  ) internal returns (bytes memory returnData) {
    bytes memory data = abi.encodePacked(salt, bytecode);
    bool success;

    assembly {
      // Allocate memory for the return data (32 bytes)
      returnData := mload(0x40) // Get free memory pointer
      mstore(returnData, 0x20) // Store length of return data (32 bytes)
      mstore(0x40, add(returnData, 0x40)) // Update free memory pointer

      success := call(
        gas(), // Forward all available gas
        CREATE2_FACTORY, // Address of the CREATE2 factory
        0, // No ETH value
        add(data, 0x20), // Pointer to input data (skip length prefix)
        mload(data), // Length of input data
        add(returnData, 0x20), // Pointer to output data
        0x20 // Expecting 32 bytes (address size) as output
      )
    }

    if (!success) {
      CustomRevert.revertWith(Create2CallFailed.selector);
    }
  }
}
