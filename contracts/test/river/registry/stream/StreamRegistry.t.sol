// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;
// interfaces
import {IOwnableBase} from "@river-build/diamond/src/facets/ownable/IERC173.sol";
// structs
// libraries
import {Stream, StreamWithId, SetMiniblock} from "contracts/src/river/registry/libraries/RegistryStorage.sol";
import {RiverRegistryErrors} from "contracts/src/river/registry/libraries/RegistryErrors.sol";
import {IStreamRegistryBase} from "contracts/src/river/registry/facets/stream/IStreamRegistry.sol";
// contracts
// deployments
import {RiverRegistryBaseSetup} from "contracts/test/river/registry/RiverRegistryBaseSetup.t.sol";

contract StreamRegistryTest is
  RiverRegistryBaseSetup,
  IOwnableBase,
  IStreamRegistryBase
{
  // =============================================================
  //                        allocateStream
  // =============================================================
  function test_fuzz_allocateStream(
    address nodeOperator,
    TestNode[] memory nodes,
    TestStream memory testStream
  )
    external
    givenNodeOperatorIsApproved(nodeOperator)
    givenNodesAreRegistered(nodeOperator, nodes)
  {
    vm.assume(nodes.length > 0 && nodes.length <= 100);

    address[] memory nodeAddresses = new address[](nodes.length);
    uint256 nodesLength = nodes.length;
    for (uint256 i; i < nodesLength; ++i) {
      nodeAddresses[i] = nodes[i].node;
    }

    vm.prank(nodes[0].node);
    vm.expectEmit(address(streamRegistry));
    emit StreamAllocated(
      testStream.streamId,
      nodeAddresses,
      testStream.genesisMiniblockHash,
      testStream.genesisMiniblock
    );
    streamRegistry.allocateStream(
      testStream.streamId,
      nodeAddresses,
      testStream.genesisMiniblockHash,
      testStream.genesisMiniblock
    );

    assertEq(streamRegistry.getStreamCount(), 1);
    assertTrue(streamRegistry.isStream(testStream.streamId));

    Stream memory stream = streamRegistry.getStream(testStream.streamId);
    assertEq(stream.lastMiniblockHash, testStream.genesisMiniblockHash);
    assertEq(stream.nodes.length, nodesLength);
    assertContains(stream.nodes, nodes[0].node);
  }

  function test_revertWhen_allocateStream_streamIdAlreadyExists(
    address nodeOperator,
    TestNode memory node,
    TestStream memory testStream
  )
    external
    givenNodeOperatorIsApproved(nodeOperator)
    givenNodeIsRegistered(nodeOperator, node.node, node.url)
  {
    address[] memory nodes = new address[](1);
    nodes[0] = node.node;

    vm.prank(node.node);
    streamRegistry.allocateStream(
      testStream.streamId,
      nodes,
      testStream.genesisMiniblockHash,
      testStream.genesisMiniblock
    );

    vm.prank(node.node);
    vm.expectRevert(bytes(RiverRegistryErrors.ALREADY_EXISTS));
    streamRegistry.allocateStream(
      testStream.streamId,
      nodes,
      testStream.genesisMiniblockHash,
      testStream.genesisMiniblock
    );
  }

  /// @notice This test is to ensure that the node who is calling the allocateStream function is registered.
  function test_revertWhen_allocateStream_nodeNotRegistered(
    address nodeOperator,
    TestNode memory node,
    TestStream memory testStream
  ) external givenNodeOperatorIsApproved(nodeOperator) {
    address[] memory nodes = new address[](1);
    nodes[0] = node.node;

    vm.prank(node.node);
    vm.expectRevert(bytes(RiverRegistryErrors.NODE_NOT_FOUND));
    streamRegistry.allocateStream(
      testStream.streamId,
      nodes,
      testStream.genesisMiniblockHash,
      testStream.genesisMiniblock
    );
  }

  /// @notice This test is to ensure that the nodes being passed in are registered before allocating a stream.
  function test_revertWhen_allocateStream_nodesNotRegistered(
    address nodeOperator,
    address randomNode,
    TestNode memory node,
    TestStream memory testStream
  )
    external
    givenNodeOperatorIsApproved(nodeOperator)
    givenNodeIsRegistered(nodeOperator, node.node, node.url)
  {
    address[] memory nodes = new address[](2);
    nodes[0] = node.node;
    nodes[1] = randomNode;

    vm.prank(node.node);
    vm.expectRevert(bytes(RiverRegistryErrors.NODE_NOT_FOUND));
    streamRegistry.allocateStream(
      testStream.streamId,
      nodes,
      testStream.genesisMiniblockHash,
      testStream.genesisMiniblock
    );
  }

  // function test_streamCount(
  //   address nodeOperator,
  //   TestNode memory firstNode,
  // )
  //   external
  //   givenNodeOperatorIsApproved(nodeOperator)
  //   givenNodeIsRegistered(nodeOperator, firstNode, url1)
  //   givenNodeIsRegistered(nodeOperator, secondNode, url2)
  // {
  //   address[] memory nodes = new address[](1);
  //   nodes[0] = firstNode;
  //   bytes memory genesisMiniblock = abi.encodePacked("genesisMiniblock");
  //   bytes32 streamIdOne = 0x0000000000000000000000000000000000000000000000000000000000000001;
  //   bytes32 streamIdTwo = 0x0000000000000000000000000000000000000000000000000000000000000002;
  //   bytes32 genesisMiniblockHash = 0;

  //   assertEq(streamRegistry.getStreamCount(), 0);

  //   vm.prank(node1);
  //   streamRegistry.allocateStream(
  //     streamIdOne,
  //     nodes,
  //     genesisMiniblockHash,
  //     genesisMiniblock
  //   );

  //   assertEq(streamRegistry.getStreamCount(), 1);

  //   nodes[0] = node2;

  //   vm.prank(node2);
  //   streamRegistry.allocateStream(
  //     streamIdTwo,
  //     nodes,
  //     genesisMiniblockHash,
  //     genesisMiniblock
  //   );

  //   assertEq(streamRegistry.getStreamCount(), 2);
  // }

  // function test_getStreams(
  //   address nodeOperator
  // )
  //   external
  //   givenNodeOperatorIsApproved(nodeOperator)
  //   givenNodeIsRegistered(nodeOperator, node1, url1)
  //   givenNodeIsRegistered(nodeOperator, node2, url2)
  // {
  //   address[] memory nodes = new address[](1);
  //   nodes[0] = node1;
  //   bytes memory genesisMiniblock = abi.encodePacked("genesisMiniblock");
  //   bytes32 streamIdOne = 0x0000000000000000000000000000000000000000000000000000000000000001;
  //   bytes32 genesisMiniblockHash = 0;

  //   assertEq(streamRegistry.getStreamCount(), 0);

  //   vm.prank(node1);
  //   streamRegistry.allocateStream(
  //     streamIdOne,
  //     nodes,
  //     genesisMiniblockHash,
  //     genesisMiniblock
  //   );

  //   assertEq(streamRegistry.getStreamCount(), 1);

  //   nodes[0] = node2;
  //   bytes32 streamIdTwo = 0x0000000000000000000000000000000000000000000000000000000000000002;

  //   vm.prank(node2);
  //   streamRegistry.allocateStream(
  //     streamIdTwo,
  //     nodes,
  //     genesisMiniblockHash,
  //     genesisMiniblock
  //   );

  //   bytes32 streamIdThree = 0x0000000000000000000000000000000000000000000000000000000000000003;

  //   bytes32[] memory dynamicStreamIds = new bytes32[](
  //     [streamIdOne, streamIdTwo, streamIdThree].length
  //   );
  //   for (
  //     uint256 i = 0;
  //     i < [streamIdOne, streamIdTwo, streamIdThree].length;
  //     i++
  //   ) {
  //     dynamicStreamIds[i] = [streamIdOne, streamIdTwo, streamIdThree][i];
  //   }
  //   assertEq(streamRegistry.getStreamCount(), 2);
  // }

  // function allocateStream(
  //   address node,
  //   bytes32 streamId,
  //   uint256 expectedCount
  // ) private {
  //   address[] memory nodes = new address[](1);
  //   nodes[0] = node;
  //   bytes memory genesisMiniblock = abi.encodePacked("genesisMiniblock");
  //   bytes32 genesisMiniblockHash = 0;
  //   vm.prank(node);
  //   streamRegistry.allocateStream(
  //     streamId,
  //     nodes,
  //     genesisMiniblockHash,
  //     genesisMiniblock
  //   );
  //   assertEq(streamRegistry.getStreamCount(), expectedCount);
  // }

  // function assertStreamsEqual(
  //   StreamWithId[] memory result,
  //   bytes32[] memory expectedIds
  // ) private pure {
  //   assertEq(result.length, expectedIds.length);
  //   for (uint256 i = 0; i < result.length; i++) {
  //     assertEq(result[i].id, expectedIds[i]);
  //   }
  // }

  // function test_getPaginatedStreams(
  //   address nodeOperator
  // )
  //   external
  //   givenNodeOperatorIsApproved(nodeOperator)
  //   givenNodeIsRegistered(nodeOperator, node1, url1)
  //   givenNodeIsRegistered(nodeOperator, node2, url2)
  // {
  //   assertEq(streamRegistry.getStreamCount(), 0);

  //   // Allocate 4 streams.
  //   allocateStream(
  //     node1,
  //     0x0000000000000000000000000000000000000000000000000000000000000001,
  //     1
  //   );

  //   allocateStream(
  //     node2,
  //     0x0000000000000000000000000000000000000000000000000000000000000002,
  //     2
  //   );

  //   allocateStream(
  //     node1,
  //     0x0000000000000000000000000000000000000000000000000000000000000003,
  //     3
  //   );

  //   allocateStream(
  //     node2,
  //     0x0000000000000000000000000000000000000000000000000000000000000004,
  //     4
  //   );

  //   StreamWithId[] memory streams;
  //   bool lastPage;

  //   // Fetch a single stream.
  //   (streams, lastPage) = streamRegistry.getPaginatedStreams(0, 1);
  //   bytes32[] memory expectedIds = new bytes32[](1);
  //   expectedIds[
  //     0
  //   ] = 0x0000000000000000000000000000000000000000000000000000000000000001;
  //   assertStreamsEqual(streams, expectedIds);
  //   assertEq(lastPage, false);

  //   // Fetch the rest of thte streams.
  //   (streams, lastPage) = streamRegistry.getPaginatedStreams(1, 4);
  //   expectedIds = new bytes32[](3);
  //   expectedIds[
  //     0
  //   ] = 0x0000000000000000000000000000000000000000000000000000000000000002;
  //   expectedIds[
  //     1
  //   ] = 0x0000000000000000000000000000000000000000000000000000000000000003;
  //   expectedIds[
  //     2
  //   ] = 0x0000000000000000000000000000000000000000000000000000000000000004;
  //   assertStreamsEqual(streams, expectedIds);
  //   assertEq(lastPage, true);

  //   // Fetch past the end of the set of streams and expect an appropriately sized return value.
  //   (streams, lastPage) = streamRegistry.getPaginatedStreams(2, 6);
  //   expectedIds = new bytes32[](2);
  //   expectedIds[
  //     0
  //   ] = 0x0000000000000000000000000000000000000000000000000000000000000003;
  //   expectedIds[
  //     1
  //   ] = 0x0000000000000000000000000000000000000000000000000000000000000004;
  //   assertStreamsEqual(streams, expectedIds);
  //   assertEq(lastPage, true);

  //   // Invalid fetch params (start >= stop) should revert.
  //   vm.expectRevert(bytes(RiverRegistryErrors.BAD_ARG));
  //   streamRegistry.getPaginatedStreams(1, 1);
  // }

  // function test_streamCountOnNode(
  //   address nodeOperator,
  //   address node
  // )
  //   external
  //   givenNodeOperatorIsApproved(nodeOperator)
  //   givenNodeIsRegistered(nodeOperator, node, url1)
  // {
  //   address[] memory nodes = new address[](1);
  //   nodes[0] = node;
  //   bytes memory genesisMiniblock = abi.encodePacked("genesisMiniblock");
  //   bytes32 streamIdOne = 0x0000000000000000000000000000000000000000000000000000000000000001;
  //   bytes32 streamIdTwo = 0x0000000000000000000000000000000000000000000000000000000000000002;
  //   bytes32 genesisMiniblockHash = 0;

  //   vm.prank(node);
  //   streamRegistry.allocateStream(
  //     streamIdOne,
  //     nodes,
  //     genesisMiniblockHash,
  //     genesisMiniblock
  //   );

  //   vm.prank(node);
  //   streamRegistry.allocateStream(
  //     streamIdTwo,
  //     nodes,
  //     genesisMiniblockHash,
  //     genesisMiniblock
  //   );
  // }

  function test_setStreamLastMiniblockBatch(
    address nodeOperator,
    bytes32 genesisMiniblockHash,
    bytes memory genesisMiniblock,
    SetMiniblock[] memory miniblocks,
    TestNode memory node
  )
    external
    givenNodeOperatorIsApproved(nodeOperator)
    givenNodeIsRegistered(nodeOperator, node.node, node.url)
  {
    vm.assume(miniblocks.length < 500);
    vm.assume(miniblocks.length > 0);

    address[] memory nodes = new address[](1);
    nodes[0] = node.node;

    for (uint256 i = 0; i < miniblocks.length; i++) {
      vm.assume(streamRegistry.isStream(miniblocks[i].streamId) == false);

      vm.prank(node.node);
      streamRegistry.allocateStream(
        miniblocks[i].streamId,
        nodes,
        genesisMiniblockHash,
        genesisMiniblock
      );
    }

    vm.prank(node.node);
    streamRegistry.setStreamLastMiniblockBatch(miniblocks);
  }
}
