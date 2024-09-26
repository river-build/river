// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMembershipMetadata {
  /// @dev This event emits when the metadata of a token is changed.
  /// So that the third-party platforms such as NFT market could
  /// timely update the images and related attributes of the NFT.
  event MetadataUpdate(uint256 _tokenId);

  /// @dev This event emits when the metadata of a range of tokens is changed.
  /// So that the third-party platforms such as NFT market could
  /// timely update the images and related attributes of the NFTs.
  event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);

  /// @notice Emits an event to trigger metadata refresh when the space info is updated
  function refreshMetadata() external;

  function tokenURI(uint256 tokenId) external view returns (string memory);
}
