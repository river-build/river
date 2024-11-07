// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ITokenMigration} from "./ITokenMigration.sol";

// libraries
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {TokenMigrationStorage} from "./TokenMigrationStorage.sol";
import {Validator} from "contracts/src/utils/Validator.sol";

// contracts
import {PausableBase} from "contracts/src/diamond/facets/pausable/PausableBase.sol";
import {OwnableBase} from "contracts/src/diamond/facets/ownable/OwnableBase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {ReentrancyGuard} from "contracts/src/diamond/facets/reentrancy/ReentrancyGuard.sol";

contract TokenMigrationFacet is
  OwnableBase,
  PausableBase,
  ReentrancyGuard,
  Facet,
  ITokenMigration
{
  using SafeTransferLib for address;

  function __TokenMigrationFacet_init(
    IERC20 oldToken,
    IERC20 newToken
  ) external onlyInitializing {
    TokenMigrationStorage.Layout storage ds = TokenMigrationStorage.layout();
    (ds.oldToken, ds.newToken) = (oldToken, newToken);
    _pause();
  }

  function migrate(address account) external whenNotPaused nonReentrant {
    Validator.checkAddress(account);

    TokenMigrationStorage.Layout storage ds = TokenMigrationStorage.layout();

    uint256 currentBalance = ds.oldToken.balanceOf(account);

    if (currentBalance == 0)
      CustomRevert.revertWith(TokenMigration__InvalidBalance.selector);

    if (ds.oldToken.allowance(account, address(this)) < currentBalance)
      CustomRevert.revertWith(TokenMigration__InvalidAllowance.selector);

    address(ds.oldToken).safeTransferFrom(
      account,
      address(this),
      currentBalance
    );
    address(ds.newToken).safeTransfer(account, currentBalance);

    emit TokensMigrated(account, currentBalance);
  }

  function withdrawTokens() external onlyOwner {
    TokenMigrationStorage.Layout storage ds = TokenMigrationStorage.layout();

    uint256 oldTokenBalance = ds.oldToken.balanceOf(address(this));
    if (oldTokenBalance > 0) ds.oldToken.transfer(_owner(), oldTokenBalance);

    uint256 newTokenBalance = ds.newToken.balanceOf(address(this));
    if (newTokenBalance > 0) ds.newToken.transfer(_owner(), newTokenBalance);
  }

  function pauseMigration() external onlyOwner {
    _pause();
  }

  function resumeMigration() external onlyOwner {
    _unpause();
  }
}
