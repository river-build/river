// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ICrossChainEntitlement} from "contracts/src/spaces/entitlements/ICrossChainEntitlement.sol";

// libraries

// contracts
import {Ownable} from "solady/auth/Ownable.sol";
import {ERC1155} from "solady/tokens/ERC1155.sol";
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";

contract BotRegistry is ERC1155, Ownable, ICrossChainEntitlement {
  using EnumerableSetLib for EnumerableSetLib.AddressSet;

  event BotRegistered(address space, address bot, uint256 expiration);
  event RegistrationRenewed(address space, address bot, uint256 expiration);

  struct Registration {
    uint256 id;
    uint256 expiration;
    bool isRegistered;
    string metadata; // metadata could be a json object with username, slash command, etc.
    string[] permissions;
    address owner;
    uint256 fee;
  }

  struct Instance {
    uint256 expiration;
  }

  uint256 public botId;

  uint256 public registrationFee;
  mapping(address => Registration) public registrations;
  mapping(uint256 => string) public uris;

  mapping(address => EnumerableSetLib.AddressSet) public botsBySpace;
  mapping(address => mapping(uint256 => Instance)) public instances;

  constructor(address owner, uint256 fee_) {
    _initializeOwner(owner);
    registrationFee = fee_;
  }

  function uri(uint256 id) public view override returns (string memory) {
    return uris[id];
  }

  // developer can register a bot
  function registerBot(
    address bot,
    uint256 fee,
    string[] memory permissions,
    string memory metadata
  ) external payable {
    require(msg.value == registrationFee, "Incorrect fee amount");
    require(bot != address(0), "Invalid addresses");

    Registration storage reg = registrations[bot];

    require(
      reg.expiration < block.timestamp,
      "Bot already registered and active"
    );

    // Update registration details
    reg.id = botId;
    reg.expiration = block.timestamp + 365 days;
    reg.isRegistered = true;
    reg.metadata = metadata;
    reg.permissions = permissions;
    reg.owner = msg.sender;
    reg.fee = fee;
    uris[botId] = metadata;

    botId++;

    emit BotRegistered(msg.sender, bot, reg.expiration);
  }

  // space owner adds a bot to their space
  function addBot(address space, address bot) external payable onlyOwner {
    Registration storage reg = registrations[bot];

    // is bot registered?
    require(reg.isRegistered, "Bot is not registered");

    if (msg.value != reg.fee) revert("Incorrect fee amount");

    // mint 1155 collection of the bot to the space
    _mint(space, reg.id, 1, "");
    instances[space][reg.id] = Instance({
      expiration: block.timestamp + 365 days
    });

    botsBySpace[space].add(bot);

    // Send fee to the bot owner
    (bool success, ) = reg.owner.call{value: msg.value}("");
    require(success, "Fee transfer failed");
  }

  function renewBot(address space, address bot) external payable {
    require(msg.value == registrationFee, "Incorrect fee amount");
    require(bot != address(0), "Invalid addresses");

    uint256 id = registrations[bot].id;

    Instance storage instance = instances[space][id];
    require(instance.expiration > block.timestamp, "Bot is not active");

    instance.expiration = block.timestamp + 365 days;

    emit RegistrationRenewed(space, bot, instance.expiration);
  }

  function isEntitled(
    address[] calldata users,
    bytes calldata data
  ) external view returns (bool) {
    return true;
    // (address space, string[] memory permissions) = abi.decode(
    //   data,
    //   (address, string[])
    // );
    // for (uint256 i = 0; i < bots.length; i++) {
    //   address bot = bots[i];
    //   Registration memory reg = registrations[bot];
    //   if (
    //     reg.isRegistered &&
    //     reg.expiration > block.timestamp &&
    //     botsBySpace[space].contains(bot)
    //   ) {
    //     return true;
    //   }
    // }
    // return false;
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
    registrationFee = fee_;
  }
}
