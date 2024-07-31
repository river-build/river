// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ISpaceOwnerBase} from "contracts/src/spaces/facets/owner/ISpaceOwner.sol";

// libraries
import {Base64} from "base64/base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Validator} from "contracts/src/utils/Validator.sol";

// contracts
import {SpaceOwnerStorage} from "contracts/src/spaces/facets/owner/SpaceOwnerStorage.sol";

abstract contract SpaceOwnerUriBase is ISpaceOwnerBase {
  function _setDefaultUri(string memory uri) internal {
    Validator.checkLength(uri, 1);

    SpaceOwnerStorage.layout().defaultUri = uri;
    emit SpaceOwner__SetDefaultUri(uri);
  }

  function _getDefaultUri() internal view returns (string memory) {
    return SpaceOwnerStorage.layout().defaultUri;
  }

  /// @notice Returns `${space.uri}/${spaceAddress}`
  /// @dev Use default URI if space URI is not set
  function _render(
    uint256 tokenId
  ) internal view virtual returns (string memory) {
    SpaceOwnerStorage.Layout storage ds = SpaceOwnerStorage.layout();
    address spaceAddress = ds.spaceByTokenId[tokenId];

    if (spaceAddress == address(0)) revert SpaceOwner__SpaceNotFound();

    SpaceOwnerStorage.Space storage space = ds.spaceByAddress[spaceAddress];
    string memory uri = bytes(space.uri).length == 0
      ? ds.defaultUri
      : space.uri;

    uint256 length = bytes(uri).length;
    if (length == 0) revert SpaceOwner__DefaultUriNotSet();

    unchecked {
      // the ASCII code for "/" is 0x2f
      if (bytes(uri)[length - 1] != 0x2f) {
        return string.concat(uri, "/", Strings.toHexString(spaceAddress));
      } else {
        return string.concat(uri, Strings.toHexString(spaceAddress));
      }
    }
  }
}
