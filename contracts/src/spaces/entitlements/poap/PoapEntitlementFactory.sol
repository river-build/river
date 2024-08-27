// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Factory} from "contracts/src/utils/Factory.sol";
import {PoapEntitlement} from "./PoapEntitlement.sol";

contract PoapEntitlementFactory is Factory {
  function deployEntitlement(uint256 eventId) public {
    bytes32 salt = getSalt(eventId);
    address predictedAddress = predictEntitlementAddress(eventId);

    // Check if the contract is already deployed
    uint32 size;
    assembly {
      size := extcodesize(predictedAddress)
    }
    require(size == 0, "Entitlement already deployed for this event");

    bytes memory initCode = abi.encodePacked(
      type(PoapEntitlement).creationCode,
      abi.encode(eventId)
    );

    address deployment = _deploy(initCode, salt);
    if (deployment != predictedAddress) {
      revert("Deployment failed");
    }
  }

  function getEntitlementAddress(
    uint256 eventId
  ) public view returns (address) {
    return predictEntitlementAddress(eventId);
  }

  function getSalt(uint256 eventId) public pure returns (bytes32) {
    return keccak256(abi.encodePacked("POAP", eventId));
  }

  function predictEntitlementAddress(
    uint256 eventId
  ) public view returns (address) {
    bytes32 initCodeHash = keccak256(
      abi.encodePacked(type(PoapEntitlement).creationCode, abi.encode(eventId))
    );
    return _calculateDeploymentAddress(initCodeHash, getSalt(eventId));
  }
}
