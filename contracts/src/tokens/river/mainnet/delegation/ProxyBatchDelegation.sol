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

  function sendDelegators(uint32 minGasLimit, uint8 half) external {
    address[] memory allDelegators = rvr.getDelegators();
    uint256 length = allDelegators.length;
    uint256 halfLength = length / 2;

    uint256 start;
    uint256 end;
    uint256 sliceLength;

    if (half == 0) {
      start = 0;
      end = halfLength;
      sliceLength = halfLength;
    } else {
      start = halfLength;
      end = length;
      sliceLength = length - halfLength;
    }

    address[] memory delegators = new address[](sliceLength);
    address[] memory delegates = new address[](sliceLength);
    address[] memory authorizedClaimers = new address[](sliceLength);
    uint256[] memory quantities = new uint256[](sliceLength);

    // Use a separate array index to avoid out-of-range issues
    uint256 arrayIndex = 0;
    for (uint256 i = start; i < end; ++i) {
      address delegator = allDelegators[i];
      delegators[arrayIndex] = delegator;
      authorizedClaimers[arrayIndex] = claimers.getAuthorizedClaimer(delegator);
      delegates[arrayIndex] = _delegates(address(rvr), delegator);
      quantities[arrayIndex] = SafeTransferLib.balanceOf(
        address(rvr),
        delegator
      );
      arrayIndex++;
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
