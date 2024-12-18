// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

// interfaces
import {ICrossDomainMessenger} from "./ICrossDomainMessenger.sol";
import {IMainnetDelegation} from "contracts/src/tokens/river/base/delegation/IMainnetDelegation.sol";
import {IProxyBatchDelegation} from "./IProxyBatchDelegation.sol";

// libraries
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";

// contracts
import {River} from "contracts/src/tokens/river/mainnet/River.sol";
import {AuthorizedClaimers} from "contracts/src/tokens/river/mainnet/claimer/AuthorizedClaimers.sol";

contract ProxyBatchDelegation is IProxyBatchDelegation {
  address public immutable MESSENGER;
  address public immutable TARGET;

  River internal immutable rvr;
  AuthorizedClaimers internal immutable claimers;

  constructor(
    address _rvr,
    address _claimers,
    address _messenger,
    address _target
  ) {
    rvr = River(_rvr);
    claimers = AuthorizedClaimers(_claimers);

    MESSENGER = _messenger;
    TARGET = _target;
  }

  function sendAuthorizedClaimers(uint32 minGasLimit) external {
    address[] memory delegators = rvr.getDelegators();
    uint256 length = delegators.length;
    address[] memory authorizedClaimers = new address[](length);

    for (uint256 i; i < length; ++i) {
      authorizedClaimers[i] = claimers.getAuthorizedClaimer(delegators[i]);
    }

    ICrossDomainMessenger(MESSENGER).sendMessage(
      TARGET,
      abi.encodeWithSelector(
        IMainnetDelegation.setBatchAuthorizedClaimers.selector,
        delegators,
        authorizedClaimers
      ),
      minGasLimit
    );
  }

  function sendDelegatorsFirst(uint32 minGasLimit) external {
    address[] memory allDelegators = rvr.getDelegators();
    uint256 length = allDelegators.length;

    uint256 halfLength = length / 2;
    address[] memory delegators = new address[](halfLength);
    address[] memory delegates = new address[](halfLength);
    address[] memory authorizedClaimers = new address[](halfLength);
    uint256[] memory quantities = new uint256[](halfLength);

    for (uint256 i; i < halfLength; ++i) {
      address delegator = allDelegators[i];
      delegators[i] = delegator;
      authorizedClaimers[i] = claimers.getAuthorizedClaimer(delegator);
      delegates[i] = _delegates(address(rvr), delegator);
      quantities[i] = SafeTransferLib.balanceOf(address(rvr), delegator);
    }

    ICrossDomainMessenger(MESSENGER).sendMessage(
      TARGET,
      abi.encodeWithSelector(
        IMainnetDelegation.setBatchDelegation.selector,
        delegators,
        delegates,
        authorizedClaimers,
        quantities
      ),
      minGasLimit
    );
  }

  function sendDelegatorsSecond(uint32 minGasLimit) external {
    address[] memory allDelegators = rvr.getDelegators();
    uint256 length = allDelegators.length;

    uint256 halfLength = length / 2;
    address[] memory delegators = new address[](halfLength);
    address[] memory delegates = new address[](halfLength);
    address[] memory authorizedClaimers = new address[](halfLength);
    uint256[] memory quantities = new uint256[](halfLength);

    uint256 j;
    for (uint256 i = halfLength; i < length; ++i) {
      address delegator = delegators[i];
      delegators[j] = delegator;
      authorizedClaimers[j] = claimers.getAuthorizedClaimer(delegator);
      delegates[j] = _delegates(address(rvr), delegator);
      quantities[j] = SafeTransferLib.balanceOf(address(rvr), delegator);
      ++j;
    }

    ICrossDomainMessenger(MESSENGER).sendMessage(
      TARGET,
      abi.encodeWithSelector(
        IMainnetDelegation.setBatchDelegation.selector,
        delegators,
        delegates,
        authorizedClaimers,
        quantities
      ),
      minGasLimit
    );
  }

  /// @dev Returns the delegate that `account` has chosen.
  /// Returns zero if the `token` does not exist.
  function _delegates(
    address token,
    address account
  ) internal view returns (address delegatee) {
    /// @solidity memory-safe-assembly
    assembly {
      mstore(0x14, account) // Store the `account` argument.
      mstore(0x00, 0x587cde1e000000000000000000000000) // `delegates(address)`.
      delegatee := mul(
        // The arguments of `mul` are evaluated from right to left.
        mload(0x20),
        and(
          // The arguments of `and` are evaluated from right to left.
          gt(returndatasize(), 0x1f), // At least 32 bytes returned.
          staticcall(gas(), token, 0x10, 0x24, 0x20, 0x20)
        )
      )
    }
  }
}
