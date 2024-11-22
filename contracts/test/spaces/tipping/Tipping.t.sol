// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ITipping, ITippingBase} from "contracts/src/spaces/facets/tipping/ITipping.sol";
import {IERC721AQueryable} from "contracts/src/diamond/facets/token/ERC721A/extensions/IERC721AQueryable.sol";

// libraries
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";

// contracts
import {Tipping} from "contracts/src/spaces/facets/tipping/Tipping.sol";
import {IntrospectionFacet} from "contracts/src/diamond/facets/introspection/IntrospectionFacet.sol";
import {MembershipFacet} from "contracts/src/spaces/facets/membership/MembershipFacet.sol";

// helpers
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";

contract TippingTest is BaseSetup, ITippingBase {
  Tipping internal tipping;
  IntrospectionFacet internal introspection;
  MembershipFacet internal membership;
  IERC721AQueryable internal token;

  function setUp() public override {
    super.setUp();
    tipping = Tipping(everyoneSpace);
    introspection = IntrospectionFacet(everyoneSpace);
    membership = MembershipFacet(everyoneSpace);
    token = IERC721AQueryable(everyoneSpace);
  }

  function test_supportsInterface() external view {
    assertTrue(introspection.supportsInterface(type(ITipping).interfaceId));
  }

  modifier givenUserIsMember(address user) {
    vm.startPrank(user);
    membership.joinSpace(user);
    vm.stopPrank();
    _;
  }

  function test_tip(
    address sender,
    address receiver
  ) external assumeEOA(sender) givenUserIsMember(sender) {
    vm.assume(sender != receiver);
    vm.assume(sender != address(0));
    vm.assume(receiver != address(0));

    uint256[] memory tokens = token.tokensOfOwner(sender);
    uint256 tokenId = tokens[0];

    vm.deal(sender, 1 ether);
    tipping.tip(
      TipRequest({
        tokenId: tokenId,
        currency: address(0),
        amount: 1 ether,
        messageId: bytes32(0),
        channelId: bytes32(0)
      })
    );
  }
}
