// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementProxyBase} from "contracts/src/entitlements/proxy/IEntitlementProxyBase.sol";

// libraries
import {EntitlementProxyStorage} from "contracts/src/entitlements/proxy/EntitlementProxyStorage.sol";

// contracts
import {Proxy} from "contracts/src/diamond/proxy/Proxy.sol";

/**
 * @title Proxy with externally controlled implementation
 * @dev implementation fetched using immutable function selector
 */
abstract contract EntitlementProxyBase is Proxy, IEntitlementProxyBase {
  function __EntitlementProxyBase_init(
    address manager,
    bytes4 managerSelector,
    bytes4 entitlementId
  ) internal {
    EntitlementProxyStorage.Layout storage ds = EntitlementProxyStorage
      .layout();
    ds.managerSelector = managerSelector;
    ds.manager = manager;
    ds.entitlementId = entitlementId;
  }

  /**
   * @inheritdoc Proxy
   */
  function _getImplementation()
    internal
    view
    virtual
    override
    returns (address)
  {
    EntitlementProxyStorage.Layout storage ds = EntitlementProxyStorage
      .layout();

    (bool success, bytes memory data) = _getManager().staticcall(
      abi.encodeWithSelector(ds.managerSelector, ds.entitlementId)
    );

    if (!success) revert EntitlementProxy__FetchImplementationFailed();
    return abi.decode(data, (address));
  }

  /**
   * @notice get manager of proxy implementation
   * @return manager address
   */
  function _getManager() internal view virtual returns (address) {
    return EntitlementProxyStorage.layout().manager;
  }

  /**
   * @notice set manager of proxy implementation
   * @param manager address
   */
  function _setManager(address manager) internal virtual {
    if (manager == address(0)) revert EntitlementProxy__InvalidManager();
    EntitlementProxyStorage.layout().manager = manager;
  }

  /**
   * @notice set manager selector of proxy implementation
   * @param managerSelector function selector used to fetch implementation from manager
   */
  function _setManagerSelector(bytes4 managerSelector) internal virtual {
    if (managerSelector == bytes4(0))
      revert EntitlementProxy__InvalidManagerSelector();
    EntitlementProxyStorage.layout().managerSelector = managerSelector;
  }

  /**
   * @notice set entitlement id of proxy implementation
   * @param entitlementId bytes4 identifier of entitlement
   */
  function _setEntitlementId(bytes4 entitlementId) internal virtual {
    EntitlementProxyStorage.layout().entitlementId = entitlementId;
  }
}
