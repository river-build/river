// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IStreamRegistry} from "./IStreamRegistry.sol";
import {Stream, StreamWithId, SetMiniblock} from "contracts/src/river/registry/libraries/RegistryStorage.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {RiverRegistryErrors} from "contracts/src/river/registry/libraries/RegistryErrors.sol";

// contracts
import {RegistryModifiers} from "contracts/src/river/registry/libraries/RegistryStorage.sol";

library StreamFlags {
  uint64 constant SEALED = 1;
}

contract StreamRegistry is IStreamRegistry, RegistryModifiers {
  using EnumerableSet for EnumerableSet.Bytes32Set;
  using EnumerableSet for EnumerableSet.AddressSet;

  function allocateStream(
    bytes32 streamId,
    address[] memory nodes,
    bytes32 genesisMiniblockHash,
    bytes memory genesisMiniblock
  ) external onlyNode(msg.sender) {
    // verify that the streamId is not already in the registry
    if (ds.streams.contains(streamId))
      revert(RiverRegistryErrors.ALREADY_EXISTS);

    // verify that the nodes stream is placed on are in the registry
    uint256 nodeCount = nodes.length;
    for (uint256 i = 0; i < nodeCount; ++i) {
      if (!ds.nodes.contains(nodes[i]))
        revert(RiverRegistryErrors.NODE_NOT_FOUND);
    }

    // Add the stream to the registry
    Stream memory stream = Stream({
      lastMiniblockHash: genesisMiniblockHash,
      lastMiniblockNum: 0,
      flags: 0,
      reserved0: 0,
      nodes: nodes
    });

    ds.streams.add(streamId);
    ds.streamById[streamId] = stream;
    ds.genesisMiniblockByStreamId[streamId] = genesisMiniblock;
    ds.genesisMiniblockHashByStreamId[streamId] = genesisMiniblockHash;

    emit StreamAllocated(
      streamId,
      nodes,
      genesisMiniblockHash,
      genesisMiniblock
    );
  }

  function getStream(bytes32 streamId) external view returns (Stream memory) {
    if (!ds.streams.contains(streamId)) revert(RiverRegistryErrors.NOT_FOUND);
    return ds.streamById[streamId];
  }

  function getStreamByIndex(
    uint256 i
  ) external view returns (StreamWithId memory) {
    uint256 streamCount = ds.streams.length();

    if (i >= streamCount) {
      revert(RiverRegistryErrors.NOT_FOUND);
    }

    bytes32 streamId = ds.streams.at(i);
    return StreamWithId({id: streamId, stream: ds.streamById[streamId]});
  }

  /// @return stream, genesisMiniblockHash, genesisMiniblock
  function getStreamWithGenesis(
    bytes32 streamId
  ) external view returns (Stream memory, bytes32, bytes memory) {
    if (!ds.streams.contains(streamId)) revert(RiverRegistryErrors.NOT_FOUND);

    return (
      ds.streamById[streamId],
      ds.genesisMiniblockHashByStreamId[streamId],
      ds.genesisMiniblockByStreamId[streamId]
    );
  }

  function setStreamLastMiniblock(
    bytes32 streamId,
    bytes32 prevMiniBlockHash,
    bytes32 lastMiniblockHash,
    uint64 lastMiniblockNum,
    bool isSealed
  ) external onlyNode(msg.sender) {
    // Validate that the streamId is in the registry
    if (!ds.streams.contains(streamId)) {
      revert(RiverRegistryErrors.NOT_FOUND);
    }

    Stream storage stream = ds.streamById[streamId];

    // Check if the stream is already sealed using bitwise AND
    if ((stream.flags & StreamFlags.SEALED) != 0) {
      revert(RiverRegistryErrors.STREAM_SEALED);
    }

    // Ensure that the lastMiniblockNum is newer than the current head.
    if (stream.lastMiniblockNum >= lastMiniblockNum) {
      revert(RiverRegistryErrors.BAD_ARG);
    }

    // Delete genesis miniblock if `stream` still contains the genesis block after `stream` has advanced since genesis.
    if (stream.lastMiniblockNum == 0) {
      delete ds.genesisMiniblockByStreamId[streamId];
    }

    // Update the stream information
    stream.lastMiniblockHash = lastMiniblockHash;
    stream.lastMiniblockNum = lastMiniblockNum;

    // Set the sealed flag if requested
    if (isSealed) {
      stream.flags |= StreamFlags.SEALED;
    }

    emit StreamLastMiniblockUpdated(
      streamId,
      lastMiniblockHash,
      lastMiniblockNum,
      isSealed
    );
  }

  function setStreamLastMiniblockBatch(
    SetMiniblock[] calldata miniblocks
  ) external onlyNode(msg.sender) {
    uint256 miniblockCount = miniblocks.length;

    for (uint256 i = 0; i < miniblockCount; ++i) {
      SetMiniblock calldata miniblock = miniblocks[i];

      if (!ds.streams.contains(miniblock.streamId)) {
        emit StreamLastMiniblockUpdateFailed(
          miniblock.streamId,
          miniblock.lastMiniblockHash,
          miniblock.lastMiniblockNum,
          RiverRegistryErrors.NOT_FOUND
        );
        continue;
      }

      Stream storage stream = ds.streamById[miniblock.streamId];

      // Check if the stream is already sealed using bitwise AND
      if ((stream.flags & StreamFlags.SEALED) != 0) {
        emit StreamLastMiniblockUpdateFailed(
          miniblock.streamId,
          miniblock.lastMiniblockHash,
          miniblock.lastMiniblockNum,
          RiverRegistryErrors.STREAM_SEALED
        );
        continue;
      }

      // Check if the lastMiniblockNum is the next expected miniblock and
      // the prevMiniblockHash is correct
      if (
        stream.lastMiniblockNum + 1 != miniblock.lastMiniblockNum ||
        stream.lastMiniblockHash != miniblock.prevMiniBlockHash
      ) {
        emit StreamLastMiniblockUpdateFailed(
          miniblock.streamId,
          miniblock.lastMiniblockHash,
          miniblock.lastMiniblockNum,
          RiverRegistryErrors.BAD_ARG
        );
        continue;
      }

      // Update the stream information
      stream.lastMiniblockHash = miniblock.lastMiniblockHash;
      stream.lastMiniblockNum = miniblock.lastMiniblockNum;

      // Set the sealed flag if requested
      if (miniblock.isSealed) {
        stream.flags |= StreamFlags.SEALED;
      }

      // Delete genesis miniblock bytes if the stream is moving beyond genesis
      if (miniblock.lastMiniblockNum == 1) {
        delete ds.genesisMiniblockByStreamId[miniblock.streamId];
      }

      emit StreamLastMiniblockUpdated(
        miniblock.streamId,
        miniblock.lastMiniblockHash,
        miniblock.lastMiniblockNum,
        miniblock.isSealed
      );
    }
  }

  function placeStreamOnNode(
    bytes32 streamId,
    address nodeAddress
  ) external onlyStream(streamId) onlyNode(msg.sender) {
    Stream storage stream = ds.streamById[streamId];

    // validate that the node is not already on the stream
    uint256 nodeCount = stream.nodes.length;

    for (uint256 i = 0; i < nodeCount; ++i) {
      if (stream.nodes[i] == nodeAddress)
        revert(RiverRegistryErrors.ALREADY_EXISTS);
    }

    stream.nodes.push(nodeAddress);

    emit StreamPlacementUpdated(streamId, nodeAddress, true);
  }

  function removeStreamFromNode(
    bytes32 streamId,
    address nodeAddress
  ) external onlyStream(streamId) onlyNode(msg.sender) {
    Stream storage stream = ds.streamById[streamId];

    bool found = false;
    uint256 nodeCount = stream.nodes.length;

    for (uint256 i = 0; i < nodeCount; ++i) {
      if (stream.nodes[i] == nodeAddress) {
        stream.nodes[i] = stream.nodes[nodeCount - 1];
        stream.nodes.pop();
        found = true;
        break;
      }
    }
    if (!found) revert(RiverRegistryErrors.NODE_NOT_FOUND);

    emit StreamPlacementUpdated(streamId, nodeAddress, false);
  }

  function getStreamCount() external view returns (uint256) {
    return ds.streams.length();
  }

  function getAllStreamIds() external view returns (bytes32[] memory) {
    return ds.streams.values();
  }

  function getAllStreams() external view returns (StreamWithId[] memory) {
    uint256 streamCount = ds.streams.length();
    StreamWithId[] memory streams = new StreamWithId[](streamCount);

    for (uint256 i = 0; i < streamCount; ++i) {
      bytes32 id = ds.streams.at(i);
      streams[i] = StreamWithId({id: id, stream: ds.streamById[id]});
    }

    return streams;
  }

  function getPaginatedStreams(
    uint256 start,
    uint256 stop
  ) external view returns (StreamWithId[] memory, bool) {
    if (start >= stop) revert(RiverRegistryErrors.BAD_ARG);

    uint256 streamCount = ds.streams.length();
    uint256 maxStreamIndex = stop > streamCount ? streamCount : stop;
    uint256 count = maxStreamIndex > start ? maxStreamIndex - start : 0;

    StreamWithId[] memory streams = new StreamWithId[](count);

    for (uint256 i = 0; i < count; ++i) {
      bytes32 id = ds.streams.at(start + i);
      streams[i] = StreamWithId({id: id, stream: ds.streamById[id]});
    }

    return (streams, stop >= streamCount);
  }

  function getStreams(
    bytes32[] calldata streamIds
  ) external view returns (uint256 foundCount, StreamWithId[] memory) {
    uint256 streamCount = streamIds.length;
    StreamWithId[] memory streams = new StreamWithId[](streamCount);
    for (uint256 i = 0; i < streamCount; ++i) {
      bytes32 streamId = streamIds[i];
      Stream storage stream = ds.streamById[streamId];
      if (stream.nodes.length == 0) continue;
      streams[foundCount++] = StreamWithId({id: streamId, stream: stream});
    }
    return (foundCount, streams);
  }

  function getStreamsOnNode(
    address nodeAddress
  ) external view returns (StreamWithId[] memory) {
    // TODO: very naive implementation, can be optimized
    uint256 streamLength = ds.streams.length();

    bytes32[] memory allStreamIds = new bytes32[](streamLength);
    uint32 streamCount;

    for (uint256 i = 0; i < streamLength; ++i) {
      bytes32 id = ds.streams.at(i);
      Stream storage stream = ds.streamById[id];
      uint256 nodeCount = stream.nodes.length;

      for (uint256 j = 0; j < nodeCount; ++j) {
        if (stream.nodes[j] == nodeAddress) {
          allStreamIds[streamCount++] = id;
          break;
        }
      }
    }

    StreamWithId[] memory streams = new StreamWithId[](streamCount);
    for (uint256 i = 0; i < streamCount; ++i) {
      streams[i] = StreamWithId({
        id: allStreamIds[i],
        stream: ds.streamById[allStreamIds[i]]
      });
    }

    return streams;
  }

  function getStreamCountOnNode(
    address nodeAddress
  ) external view returns (uint256) {
    uint256 count = 0;
    uint256 streamLength = ds.streams.length();
    for (uint256 i = 0; i < streamLength; ++i) {
      bytes32 id = ds.streams.at(i);
      Stream storage stream = ds.streamById[id];
      for (uint256 j = 0; j < stream.nodes.length; ++j) {
        if (stream.nodes[j] == nodeAddress) {
          count++;
          break;
        }
      }
    }

    return count;
  }
}
