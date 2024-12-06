// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {ERC721NonTransferableMinimalProxy} from "@llama/src/lib/ERC721NonTransferableMinimalProxy.sol";

/// @notice A generic interface for a contract which properly accepts ERC721 tokens.
/// @author Solmate (https://github.com/transmissions11/solmate/blob/main/src/tokens/ERC721.sol)
abstract contract ERC721TokenReceiver {
  function onERC721Received(
    address,
    address,
    uint256,
    bytes calldata
  ) external virtual returns (bytes4) {
    return ERC721TokenReceiver.onERC721Received.selector;
  }
}

contract MockERC721 is ERC721NonTransferableMinimalProxy {
  function initialize(
    string memory _name,
    string memory _symbol
  ) external initializer {
    __initializeERC721MinimalProxy(_name, _symbol);
  }

  function tokenURI(
    uint256
  ) public pure virtual override returns (string memory) {}

  function mint(address to, uint256 tokenId) public virtual {
    _mint(to, tokenId);
  }

  function burn(uint256 tokenId) public virtual {
    _burn(tokenId);
  }

  function safeMint(address to, uint256 tokenId) public virtual {
    _safeMint(to, tokenId);
  }

  function safeMint(
    address to,
    uint256 tokenId,
    bytes memory data
  ) public virtual {
    _safeMint(to, tokenId, data);
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 id
  ) public override {
    {
      transferFrom(from, to, id);

      require(
        to.code.length == 0 ||
          ERC721TokenReceiver(to).onERC721Received(msg.sender, from, id, "") ==
          ERC721TokenReceiver.onERC721Received.selector,
        "UNSAFE_RECIPIENT"
      );
    }
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 id,
    bytes calldata data
  ) public override {
    transferFrom(from, to, id);

    require(
      to.code.length == 0 ||
        ERC721TokenReceiver(to).onERC721Received(msg.sender, from, id, data) ==
        ERC721TokenReceiver.onERC721Received.selector,
      "UNSAFE_RECIPIENT"
    );
  }

  function transferFrom(address from, address to, uint256 id) public override {
    require(from == _ownerOf[id], "WRONG_FROM");

    require(to != address(0), "INVALID_RECIPIENT");

    require(
      msg.sender == from ||
        isApprovedForAll[from][msg.sender] ||
        msg.sender == getApproved[id],
      "NOT_AUTHORIZED"
    );

    // Underflow of the sender's balance is impossible because we check for
    // ownership above and the recipient's balance can't realistically overflow.
    unchecked {
      _balanceOf[from]--;

      _balanceOf[to]++;
    }

    _ownerOf[id] = to;

    delete getApproved[id];

    emit Transfer(from, to, id);
  }
}
