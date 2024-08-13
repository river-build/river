// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import "@prb/test/Helpers.sol" as Helpers;
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";

library DevOpsTools {
  using stdJson for string;

  Vm public constant vm =
    Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

  string public constant RELATIVE_BROADCAST_PATH = "./broadcast";

  function get_most_recent_deployment(
    string memory contractName,
    uint256 chainId
  ) internal view returns (address) {
    return
      get_most_recent_deployment(
        contractName,
        chainId,
        RELATIVE_BROADCAST_PATH
      );
  }

  function get_most_recent_deployment(
    string memory contractName,
    uint256 chainId,
    string memory relativeBroadcastPath
  ) internal view returns (address) {
    address latestAddress = address(0);
    uint256 lastTimestamp;

    bool runProcessed;
    Vm.DirEntry[] memory entries = vm.readDir(relativeBroadcastPath, 3);
    for (uint256 i = 0; i < entries.length; i++) {
      Vm.DirEntry memory entry = entries[i];

      if (
        contains(entry.path, string.concat("/", vm.toString(chainId), "/")) &&
        contains(entry.path, ".json") &&
        !contains(entry.path, "dry-run")
      ) {
        runProcessed = true;
        string memory json = vm.readFile(entry.path);

        uint256 timestamp = vm.parseJsonUint(json, ".timestamp");

        if (timestamp > lastTimestamp) {
          latestAddress = processRun(json, contractName, latestAddress);

          // If we have found some deployed contract, update the timestamp
          // Otherwise, the earliest deployment may have been before `lastTimestamp` and we should not update
          if (latestAddress != address(0)) {
            lastTimestamp = timestamp;
          }
        }
      }
    }

    return latestAddress;
  }

  function processRun(
    string memory json,
    string memory contractName,
    address latestAddress
  ) internal view returns (address) {
    for (
      uint256 i = 0;
      vm.keyExistsJson(
        json,
        string.concat("$.transactions[", vm.toString(i), "]")
      );
      i++
    ) {
      string memory contractNamePath = string.concat(
        "$.transactions[",
        vm.toString(i),
        "].contractName"
      );
      if (vm.keyExistsJson(json, contractNamePath)) {
        string memory deployedContractName = json.readString(contractNamePath);
        if (Helpers.eq(deployedContractName, contractName)) {
          latestAddress = json.readAddress(
            string.concat(
              "$.transactions[",
              vm.toString(i),
              "].contractAddress"
            )
          );
        }
      }
    }

    return latestAddress;
  }

  function contains(
    string memory str,
    string memory substr
  ) internal pure returns (bool) {
    bytes memory strBytes = bytes(str);
    bytes memory substrBytes = bytes(substr);
    if (strBytes.length < substrBytes.length || strBytes.length == 0)
      return false;

    for (uint i = 0; i <= strBytes.length - substrBytes.length; i++) {
      bool isEqual = true;
      for (uint j = 0; j < substrBytes.length; j++) {
        if (strBytes[i + j] != substrBytes[j]) {
          isEqual = false;
          break;
        }
      }
      if (isEqual) return true;
    }
    return false;
  }
}
