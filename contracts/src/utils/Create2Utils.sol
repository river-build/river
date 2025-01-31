// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

library Create2Utils {
  address public constant CREATE2_FACTORY =
    0x4e59b44847b379578588920cA78FbF26c0B4956C;

  function create2Deploy(
    bytes32 salt,
    bytes memory bytecode
  ) internal returns (address) {
    if (isContractDeployed(CREATE2_FACTORY) == false) {
      revert("MISSING_CREATE2_FACTORY");
    }
    address computed = computeCreate2Address(salt, bytecode);

    if (isContractDeployed(computed)) {
      return computed;
    } else {
      bytes memory creationBytecode = abi.encodePacked(salt, bytecode);
      bytes memory returnData;
      (, returnData) = CREATE2_FACTORY.call(creationBytecode);
      address deployedAt = address(uint160(bytes20(returnData)));
      require(deployedAt == computed, "failure at create2 address derivation");
      return deployedAt;
    }
  }

  function isContractDeployed(
    address _addr
  ) internal view returns (bool isContract) {
    return (_addr.code.length > 0);
  }

  function computeCreate2Address(
    bytes32 salt,
    bytes32 initcodeHash
  ) internal pure returns (address) {
    return
      addressFromLast20Bytes(
        keccak256(
          abi.encodePacked(bytes1(0xff), CREATE2_FACTORY, salt, initcodeHash)
        )
      );
  }

  function computeCreate2Address(
    bytes32 salt,
    bytes memory bytecode
  ) internal pure returns (address) {
    return computeCreate2Address(salt, keccak256(abi.encodePacked(bytecode)));
  }

  function addressFromLast20Bytes(
    bytes32 bytesValue
  ) internal pure returns (address) {
    return address(uint160(uint256(bytesValue)));
  }
}
