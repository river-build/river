// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppInstaller} from "contracts/src/app/interfaces/IAppInstaller.sol";

// libraries
import {LibCall} from "solady/utils/LibCall.sol";
import {Implementations} from "contracts/src/spaces/facets/Implementations.sol";

// contracts

library InstallLib {
  function installApp(uint256 appId, bytes32 channelId) internal {
    address appRegistry = Implementations.appRegistry();
    LibCall.callContract(
      appRegistry,
      0,
      abi.encodeWithSelector(IAppInstaller.install.selector, appId, channelId)
    );
  }
}
