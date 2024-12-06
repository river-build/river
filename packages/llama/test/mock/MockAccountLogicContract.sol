// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";

/// @dev A mock account implementation (logic) contract that doesn't have `name` or other functions. To be used for
/// testing.
contract MockAccountLogicContract is ILlamaAccount, Initializable {
  struct Config {
    uint256 creationTime; // This is just a placeholder config to see if we can pass in anything other than `name`.
  }

  address public llamaExecutor;
  uint256 public creationTime;

  function initialize(bytes memory config) external initializer returns (bool) {
    llamaExecutor = address(LlamaCore(msg.sender).executor());
    Config memory accountConfig = abi.decode(config, (Config));
    creationTime = accountConfig.creationTime;

    return true;
  }
}
