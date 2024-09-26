// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {IERC721A} from "contracts/src/diamond/facets/token/ERC721A/IERC721A.sol";

// libraries
import {TokenOwnableStorage} from "contracts/src/diamond/facets/ownable/token/TokenOwnableStorage.sol";
import {LibString} from "solady/utils/LibString.sol";

// contracts
import {ERC721ABase} from "contracts/src/diamond/facets/token/ERC721A/ERC721ABase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract MembershipMetadata is ERC721ABase, Facet {
  /// @dev This event emits when the metadata of a token is changed.
  /// So that the third-party platforms such as NFT market could
  /// timely update the images and related attributes of the NFT.
  event MetadataUpdate(uint256 _tokenId);

  /// @notice Emits an event to trigger metadata refresh when the space info is updated
  function refreshMetadata() external {
    emit MetadataUpdate(type(uint256).max);
  }

  function tokenURI(uint256 tokenId) public view returns (string memory) {
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
    TokenOwnableStorage.Layout storage ds = TokenOwnableStorage.layout();
    string memory baseURI = IERC721A(ds.collection).tokenURI(ds.tokenId);
    string memory tokenIdStr = LibString.toString(tokenId);
    return string.concat(baseURI, "/token/", tokenIdStr);
  }
}
