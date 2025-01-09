// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ICrossChainEntitlement} from "contracts/src/spaces/entitlements/ICrossChainEntitlement.sol";

// libraries

// contracts
import {Ownable} from "solady/auth/Ownable.sol";
import {ERC721} from "solady/tokens/ERC721.sol";
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";

contract BotRegistry is ERC721, Ownable, ICrossChainEntitlement {
  using EnumerableSetLib for EnumerableSetLib.AddressSet;

  event BotRegistered(address space, address bot, uint256 expiration);
  event RegistrationRenewed(address space, address bot, uint256 expiration);

  struct Registration {
    uint256 expiration;
    bool isRegistered;
    string metadata; // metadata could be a json object with username, slash command, etc.
  }

  uint256 public fee;
  address public treasury;
  uint256 public tokenId;
  mapping(address => mapping(address => Registration)) public registrations;
  mapping(uint256 => string) public uris;
  mapping(address => EnumerableSetLib.AddressSet) public botsBySpace;

  constructor(address owner, uint256 fee_, address treasury_) {
    _initializeOwner(owner);
    fee = fee_;
    treasury = treasury_;
  }

  function name() public pure override returns (string memory) {
    return "BotRegistry";
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
    return uris[id];
  }

  function symbol() public pure override returns (string memory) {
    return "BOT";
  }

  // only owner
  function registerBot(
    address space,
    address bot,
    string memory metadata
  ) external payable {
    require(msg.value == fee, "Incorrect fee amount");
    require(space != address(0) && bot != address(0), "Invalid addresses");

    Registration storage reg = registrations[space][bot];

    require(
      reg.expiration < block.timestamp,
      "Bot already registered and active"
    );

    // Update registration details
    reg.expiration = block.timestamp + 365 days;
    reg.isRegistered = true;
    reg.metadata = metadata;

    botsBySpace[space].add(bot);

    // Send fee to the treasury
    payable(treasury).transfer(msg.value);

    // could mint a token to the space so we can track the bots in the space
    _mint(space, tokenId);
    tokenId++;

    emit BotRegistered(space, bot, reg.expiration);
  }

  function renewRegistration(address space, address bot) external payable {
    require(msg.value == fee, "Incorrect fee amount");
    require(space != address(0) && bot != address(0), "Invalid addresses");

    Registration storage reg = registrations[space][bot];
    require(reg.isRegistered, "Bot is not registered");

    // Extend expiration
    reg.expiration += 365 days;

    // Send fee to the treasury
    payable(treasury).transfer(msg.value);

    emit RegistrationRenewed(space, bot, reg.expiration);
  }

  function isEntitled(
    address[] calldata bots,
    bytes calldata data
  ) external view returns (bool) {
    address space = abi.decode(data, (address));

    for (uint256 i = 0; i < bots.length; i++) {
      address bot = bots[i];

      Registration memory reg = registrations[space][bot];
      if (reg.isRegistered && reg.expiration > block.timestamp) {
        return true;
      }
    }

    return false;
  }

  function parameters() external pure returns (Parameter[] memory) {
    Parameter[] memory params = new Parameter[](1);
    params[0] = Parameter({
      name: "space",
      primitive: "address",
      description: "The space to check the bots for"
    });
    return params;
  }

  function getBotsBySpace(
    address space
  ) external view returns (address[] memory) {
    return botsBySpace[space].values();
  }

  function setFee(uint256 fee_) external onlyOwner {
    fee = fee_;
  }

  function setTreasury(address treasury_) external onlyOwner {
    treasury = treasury_;
  }

  function withdraw(uint256 amount) external onlyOwner {
    payable(owner()).transfer(amount);
  }
}
