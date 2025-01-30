// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Towns} from "contracts/src/tokens/towns/base/Towns.sol";

contract TownsDeployer {
  /// @notice Emitted when an OptimismSuperchainERC20 is deployed.
  /// @param superchainToken  Address of the OptimismSuperchainERC20 deployment.
  /// @param remoteToken      Address of the corresponding token on the remote chain.
  /// @param deployer         Address of the account that deployed the token.
  event OptimismSuperchainERC20Created(
    address indexed superchainToken,
    address indexed remoteToken,
    address deployer
  );

  function deploy(
    address _implementation,
    address _l1Token,
    bytes32 _salt
  ) external returns (address superchainERC20_) {
    superchainERC20_ = address(
      new ERC1967Proxy{salt: _salt}(
        _implementation,
        abi.encodeCall(Towns.initialize, (_l1Token, msg.sender))
      )
    );
    emit OptimismSuperchainERC20Created(superchainERC20_, _l1Token, msg.sender);
  }

  function getInitCodeHash(
    address _implementation,
    address _l1Token,
    address _owner
  ) external pure returns (bytes32) {
    bytes memory bytecode = abi.encodePacked(
      type(ERC1967Proxy).creationCode,
      abi.encode(
        _implementation,
        abi.encodeCall(Towns.initialize, (_l1Token, _owner))
      )
    );
    return keccak256(bytecode);
  }
}
