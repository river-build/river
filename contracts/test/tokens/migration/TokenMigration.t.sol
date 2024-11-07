// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces
import {IPausableBase} from "contracts/src/diamond/facets/pausable/IPausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//libraries

//contracts
import {DeployRiverMigration} from "contracts/scripts/deployments/diamonds/DeployRiverMigration.s.sol";
import {MockERC20} from "contracts/test/mocks/MockERC20.sol";

import {TokenMigrationFacet} from "contracts/src/tokens/migration/TokenMigration.sol";
import {PausableFacet} from "contracts/src/diamond/facets/pausable/PausableFacet.sol";

contract TokenMigrationTest is TestUtils, IPausableBase {
  DeployRiverMigration internal riverMigrationHelper;
  MockERC20 internal oldToken;
  MockERC20 internal newToken;

  TokenMigrationFacet internal tokenMigration;
  PausableFacet internal pausable;

  address internal deployer;
  address internal diamond;

  function setUp() external {
    deployer = getDeployer();

    riverMigrationHelper = new DeployRiverMigration();
    oldToken = new MockERC20("Old Token", "OLD");
    newToken = new MockERC20("New Token", "NEW");

    riverMigrationHelper.setTokens(address(oldToken), address(newToken));
    diamond = riverMigrationHelper.deploy(deployer);

    tokenMigration = TokenMigrationFacet(diamond);
    pausable = PausableFacet(diamond);
  }

  // modifiers

  modifier givenAccountHasOldTokens(address account, uint256 amount) {
    vm.prank(deployer);
    oldToken.mint(account, amount);
    _;
  }

  modifier givenContractHasNewTokens(uint256 amount) {
    vm.prank(deployer);
    newToken.mint(address(tokenMigration), amount);
    _;
  }

  modifier givenContractIsUnpaused() {
    vm.prank(deployer);
    pausable.unpause();
    _;
  }

  modifier givenAllowanceIsSet(address account, uint256 amount) {
    vm.prank(account);
    oldToken.approve(address(tokenMigration), amount);
    _;
  }

  // tests
  function test_migrate(
    address account,
    uint256 amount
  )
    external
    givenAccountHasOldTokens(account, amount)
    givenAllowanceIsSet(account, amount)
    givenContractHasNewTokens(amount)
    givenContractIsUnpaused
  {
    vm.assume(account != address(0));
    vm.assume(amount > 0);

    vm.prank(account);
    tokenMigration.migrate(account);

    assertEq(oldToken.balanceOf(account), 0);
    assertEq(newToken.balanceOf(account), amount);
  }

  function test_revertWhen_migratePaused() external {
    vm.prank(deployer);
    vm.expectRevert(Pausable__Paused.selector);
    tokenMigration.migrate(address(0));
  }
}
