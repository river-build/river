/**
 * @group main
 */

import { makeTestClient, makeUniqueSpaceStreamId, waitFor } from '../testUtils'
import { Client } from '../../client'
import { PlainMessage } from '@bufbuild/protobuf'
import { MemberPayload_Mls } from '@river-build/proto'
import {
    ExternalClient,
    Group as MlsGroup,
    Client as MlsClient,
    ExternalSnapshot,
    MlsMessage,
    ExportedTree,
} from '@river-build/mls-rs-wasm'
import { randomBytes } from 'crypto'
import { bin_equal } from '@river-build/dlog'
import { hexToBytes } from 'ethereum-cryptography/utils'
import { makeUniqueChannelStreamId } from '../../id'

describe('mlsTests', () => {
    let clients: Client[] = []
    const makeInitAndStartClient = async () => {
        const client = await makeTestClient()
        await client.initializeUser()
        client.startSync()
        clients.push(client)
        return client
    }

    let bobClient: Client
    let aliceClient: Client
    let bobMlsClient: MlsClient
    let aliceMlsClient: MlsClient
    let charlieClient: Client
    let charlieMlsClient: MlsClient

    let bobMlsGroup: MlsGroup
    // state variables
    let streamId: string
    let latestGroupInfoMessage: Uint8Array
    let latestExternalGroupSnapshot: Uint8Array
    const commits: Uint8Array[] = []

    beforeAll(async () => {
        bobClient = await makeInitAndStartClient()
        aliceClient = await makeInitAndStartClient()
        charlieClient = await makeInitAndStartClient()

        bobMlsClient = await MlsClient.create(new Uint8Array(randomBytes(32)))
        aliceMlsClient = await MlsClient.create(new Uint8Array(randomBytes(32)))
        charlieMlsClient = await MlsClient.create(new Uint8Array(randomBytes(32)))

        const spaceId = makeUniqueSpaceStreamId()
        await expect(bobClient.createSpace(spaceId)).resolves.not.toThrow()

        const channelId = makeUniqueChannelStreamId(spaceId)
        await expect(
            bobClient.createChannel(spaceId, 'Channel', '', channelId),
        ).resolves.not.toThrow()

        await bobClient.waitForStream(channelId)
        await aliceClient.joinStream(spaceId)
        await aliceClient.joinStream(channelId)
        await aliceClient.waitForStream(channelId)
        await charlieClient.joinStream(spaceId)
        await charlieClient.joinStream(channelId)
        await charlieClient.waitForStream(channelId)

        bobMlsGroup = await bobMlsClient.createGroup()
        streamId = channelId
    })

    afterAll(async () => {
        for (const client of clients) {
            await client.stop()
        }
        clients = []
    })

    afterEach(async () => {
        for (const commit of commits) {
            try {
                const mlsMessage = MlsMessage.fromBytes(commit)
                await bobMlsGroup.processIncomingMessage(mlsMessage)
            } catch {
                // noop
            }
        }
    })

    function makeMlsPayloadInitializeGroup(
        signaturePublicKey: Uint8Array,
        externalGroupSnapshot: Uint8Array,
        groupInfoMessage: Uint8Array,
    ): PlainMessage<MemberPayload_Mls> {
        return {
            content: {
                case: 'initializeGroup',
                value: {
                    signaturePublicKey: signaturePublicKey,
                    externalGroupSnapshot: externalGroupSnapshot,
                    groupInfoMessage: groupInfoMessage,
                },
            },
        }
    }

    function makeMlsPayloadExternalJoin(
        signaturePublicKey: Uint8Array,
        commit: Uint8Array,
        groupInfoMessage: Uint8Array,
    ): PlainMessage<MemberPayload_Mls> {
        return {
            content: {
                case: 'externalJoin',
                value: {
                    signaturePublicKey: signaturePublicKey,
                    commit: commit,
                    groupInfoMessage: groupInfoMessage,
                },
            },
        }
    }

    function makeMlsPayloadEpochSecrets(
        secrets: { epoch: bigint; secret: Uint8Array }[],
    ): PlainMessage<MemberPayload_Mls> {
        return {
            content: {
                case: 'epochSecrets',
                value: {
                    secrets: secrets,
                },
            },
        }
    }

    // helper function to create a group + external snapshot
    async function createGroupInfoAndExternalSnapshot(group: MlsGroup): Promise<{
        groupInfoMessage: Uint8Array
        externalGroupSnapshot: Uint8Array
    }> {
        const groupInfoMessage = await group.groupInfoMessageAllowingExtCommit(false)
        const tree = group.exportTree()
        const externalClient = new ExternalClient()
        const externalGroup = externalClient.observeGroup(
            groupInfoMessage.toBytes(),
            tree.toBytes(),
        )

        const externalGroupSnapshot = (await externalGroup).snapshot()
        return {
            groupInfoMessage: groupInfoMessage.toBytes(),
            externalGroupSnapshot: externalGroupSnapshot.toBytes(),
        }
    }

    async function commitExternal(
        client: MlsClient,
        groupInfoMessage: Uint8Array,
        externalGroupSnapshot: Uint8Array,
    ): Promise<{ commit: Uint8Array; groupInfoMessage: Uint8Array }> {
        const externalClient = new ExternalClient()
        const externalSnapshot = ExternalSnapshot.fromBytes(externalGroupSnapshot)
        const externalGroup = await externalClient.loadGroup(externalSnapshot)
        const tree = externalGroup.exportTree()
        const exportedTree = ExportedTree.fromBytes(tree)
        const mlsGroupInfoMessage = MlsMessage.fromBytes(groupInfoMessage)
        const commitOutput = await client.commitExternal(mlsGroupInfoMessage, exportedTree)
        const updatedGroupInfoMessage = await commitOutput.group.groupInfoMessageAllowingExtCommit(
            false,
        )
        return {
            commit: commitOutput.commit.toBytes(),
            groupInfoMessage: updatedGroupInfoMessage.toBytes(),
        }
    }

    test('invalid signature public key is not accepted', async () => {
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(bobMlsGroup)

        const mlsPayload = makeMlsPayloadInitializeGroup(
            (await bobMlsClient.signaturePublicKey()).slice(1), // slice 1 byte to make it invalid
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'INVALID_PUBLIC_SIGNATURE_KEY',
        )
    })

    test('invalid MLS group is not accepted', async () => {
        const mlsPayload = makeMlsPayloadInitializeGroup(
            await bobMlsClient.signaturePublicKey(),
            new Uint8Array([]),
            new Uint8Array([]),
        )
        await expect(bobClient._debugSendMls(streamId, mlsPayload)).rejects.to.toThrow(
            'INVALID_GROUP_INFO',
        )
    })

    test('mismatching group ids throws an error', async () => {
        const group1 = await bobMlsClient.createGroup()
        const group2 = await bobMlsClient.createGroup()
        const { externalGroupSnapshot: externalGroupSnapshot1 } =
            await createGroupInfoAndExternalSnapshot(group1)
        const { groupInfoMessage: groupInfoMessage2 } = await createGroupInfoAndExternalSnapshot(
            group2,
        )

        const mlsPayload = makeMlsPayloadInitializeGroup(
            await bobMlsClient.signaturePublicKey(),
            externalGroupSnapshot1,
            groupInfoMessage2,
        )
        await expect(bobClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'INVALID_GROUP_INFO_GROUP_ID_MISMATCH',
        )
    })

    test('epoch not at 0 throws error', async () => {
        const groupAtEpoch0 = await bobMlsClient.createGroup()
        const groupInfoMessageAtEpoch0 = await groupAtEpoch0.groupInfoMessageAllowingExtCommit(true)
        const output = await aliceMlsClient.commitExternal(groupInfoMessageAtEpoch0)
        const groupAtEpoch1 = output.group
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(groupAtEpoch1)

        const mlsPayload = makeMlsPayloadInitializeGroup(
            await aliceMlsClient.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(aliceClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'INVALID_GROUP_INFO_EPOCH',
        )
    })

    test('clients can create MLS Groups in channels', async () => {
        const bobGroup = await bobMlsClient.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(bobGroup)
        const mlsPayload = makeMlsPayloadInitializeGroup(
            await bobMlsClient.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobClient._debugSendMls(streamId, mlsPayload)).resolves.not.toThrow()

        // save for later
        latestExternalGroupSnapshot = externalGroupSnapshot
        latestGroupInfoMessage = groupInfoMessage
    })

    test('initializing MLS groups twice throws an error', async () => {
        const group = await bobMlsClient.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)
        const mlsPayload = makeMlsPayloadInitializeGroup(
            await bobMlsClient.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'group already initialized',
        )
    })

    test('MLS group is snapshotted', async () => {
        // force a snapshot
        await bobClient.debugForceMakeMiniblock(streamId, { forceSnapshot: true })
        // fetch the stream again and check that the MLS group is snapshotted
        const streamAfterSnapshot = await bobClient.getStream(streamId)
        const mls = streamAfterSnapshot.membershipContent.mls
        expect(mls.externalGroupSnapshot).toBeDefined()
        expect(mls.groupInfoMessage).toBeDefined()
        expect(bin_equal(mls.externalGroupSnapshot, latestExternalGroupSnapshot)).toBe(true)
        expect(bin_equal(mls.groupInfoMessage, latestGroupInfoMessage)).toBe(true)
    })

    test('External commits with invalid signature public keys are not accepted', async () => {
        const { commit: aliceCommit, groupInfoMessage: aliceGroupInfoMessage } =
            await commitExternal(
                aliceMlsClient,
                latestGroupInfoMessage,
                latestExternalGroupSnapshot,
            )

        const aliceMlsPayload = makeMlsPayloadExternalJoin(
            new Uint8Array([1, 2, 3]),
            aliceCommit,
            aliceGroupInfoMessage,
        )
        await expect(aliceClient._debugSendMls(streamId, aliceMlsPayload)).rejects.toThrow(
            'INVALID_PUBLIC_SIGNATURE_KEY',
        )
    })

    test('removing stream members from MLS groups is not allowed', async () => {
        const bobPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'commitLeaves',
                value: {
                    userAddresses: [hexToBytes(aliceClient.userId)],
                    commit: new Uint8Array(randomBytes(32)),
                },
            },
        }

        await expect(bobClient._debugSendMls(streamId, bobPayload)).rejects.toThrow(
            'user is a member',
        )
    })

    test('Valid external commits are accepted', async () => {
        const { commit: aliceCommit, groupInfoMessage: aliceGroupInfoMessage } =
            await commitExternal(
                aliceMlsClient,
                latestGroupInfoMessage,
                latestExternalGroupSnapshot,
            )

        const aliceMlsPayload = makeMlsPayloadExternalJoin(
            await aliceMlsClient.signaturePublicKey(),
            aliceCommit,
            aliceGroupInfoMessage,
        )
        await expect(aliceClient._debugSendMls(streamId, aliceMlsPayload)).resolves.not.toThrow()
        latestGroupInfoMessage = aliceGroupInfoMessage
        commits.push(aliceCommit)
    })

    test('MLS group is snapshotted after external commit', async () => {
        // force another snapshot
        await expect(
            bobClient.debugForceMakeMiniblock(streamId, { forceSnapshot: true }),
        ).resolves.not.toThrow()

        // this time, the snapshot should contain the group info message from Alice
        // the only way it can end up in the snapshot is if the external join was successfully snapshotted
        // by the node
        const streamAfterSnapshot = await aliceClient.getStream(streamId)
        const mls = streamAfterSnapshot.membershipContent.mls
        expect(mls.externalGroupSnapshot).toBeDefined()
        expect(mls.groupInfoMessage).toBeDefined()
        expect(bin_equal(mls.groupInfoMessage, latestGroupInfoMessage)).toBe(true)
    })

    test('MLS commits since the last snapshot are snapshotted (Alice)', async () => {
        const stream = await bobClient.getStream(streamId)
        const miniblockNum = stream.miniblockInfo?.min
        expect(miniblockNum).toBeDefined()

        // we expect Alice's commit to be in there
        const mlsSnapshot = await bobClient.getMlsSnapshot(streamId, miniblockNum!)
        expect(mlsSnapshot.mls).toBeDefined()
        expect(mlsSnapshot.mls?.commitsSinceLastSnapshot.length).toBe(1)
        expect(bin_equal(mlsSnapshot.mls?.commitsSinceLastSnapshot[0], commits[0])).toBe(true)
    })

    test('Clients can join an MLS group from a fresh snapshot', async () => {
        // the MLS state has been snapshotted, all commits are now compressed
        // into stream.membershipContent.mls.externalGroupSnapshot
        const stream = await charlieClient.getStream(streamId)

        const { commit: charlieCommit, groupInfoMessage: charlieGroupInfoMessage } =
            await commitExternal(
                charlieMlsClient,
                latestGroupInfoMessage,
                stream.membershipContent.mls.externalGroupSnapshot!,
            )

        const charlieMlsPayload = makeMlsPayloadExternalJoin(
            await charlieMlsClient.signaturePublicKey(),
            charlieCommit,
            charlieGroupInfoMessage,
        )
        await expect(
            charlieClient._debugSendMls(streamId, charlieMlsPayload),
        ).resolves.not.toThrow()
        latestGroupInfoMessage = charlieGroupInfoMessage
        commits.push(charlieCommit)
    })

    test('MLS commits since the last snapshot are snapshotted (Charlie)', async () => {
        // force another snapshot
        await expect(
            bobClient.debugForceMakeMiniblock(streamId, { forceSnapshot: true }),
        ).resolves.not.toThrow()

        const stream = await bobClient.getStream(streamId)
        const miniblockNum = stream.miniblockInfo?.min
        expect(miniblockNum).toBeDefined()

        // this time, we onluy expect Charlie's commit to be in there
        const mlsSnapshot = await bobClient.getMlsSnapshot(streamId, miniblockNum!)
        expect(mlsSnapshot.mls).toBeDefined()
        expect(mlsSnapshot.mls?.commitsSinceLastSnapshot.length).toBe(1)
        expect(
            bin_equal(mlsSnapshot.mls?.commitsSinceLastSnapshot[0], commits[commits.length - 1]),
        ).toBe(true)
    })

    test('Signature public keys are mapped per user in the snapshot', async () => {
        // force snapshot
        await expect(
            bobClient.debugForceMakeMiniblock(streamId, { forceSnapshot: true }),
        ).resolves.not.toThrow()

        const bobSignaturePublicKey = await bobMlsClient.signaturePublicKey()
        const aliceSignaturePublicKey = await aliceMlsClient.signaturePublicKey()
        // verify that the signature public keys are mapped per user
        // and that the signature public keys are correct
        const streamAfterSnapshot = await bobClient.getStream(streamId)
        const mls = streamAfterSnapshot.membershipContent.mls.members
        expect(mls[bobClient.userId].signaturePublicKeys.length).toBe(1)
        expect(mls[aliceClient.userId].signaturePublicKeys.length).toBe(1)
        expect(bin_equal(mls[bobClient.userId].signaturePublicKeys[0], bobSignaturePublicKey)).toBe(
            true,
        )
        expect(
            bin_equal(mls[aliceClient.userId].signaturePublicKeys[0], aliceSignaturePublicKey),
        ).toBe(true)
    })

    test('epoch secrets are accepted', async () => {
        const bobMlsSecretsPayload = makeMlsPayloadEpochSecrets([
            { epoch: 1n, secret: new Uint8Array([1, 2, 3, 4]) },
            { epoch: 2n, secret: new Uint8Array([3, 4, 5, 6]) }, // bogus for now
        ])

        await expect(bobClient._debugSendMls(streamId, bobMlsSecretsPayload)).resolves.not.toThrow()

        // verify that the epoch secrets have been picked up in the stream state view
        await waitFor(() => {
            const mls = bobClient.streams.get(streamId)?.view.membershipContent.mls
            expect(mls).toBeDefined()
            expect(bin_equal(mls!.epochSecrets[1n.toString()], new Uint8Array([1, 2, 3, 4]))).toBe(
                true,
            )
            expect(bin_equal(mls!.epochSecrets[2n.toString()], new Uint8Array([3, 4, 5, 6]))).toBe(
                true,
            )
        })
    })

    test('epoch secrets can only be sent once', async () => {
        // sending the same epoch twice returns an error
        const bobMlsSecretsPayload = makeMlsPayloadEpochSecrets([
            { epoch: 1n, secret: new Uint8Array([1, 2, 3, 4]) },
            { epoch: 2n, secret: new Uint8Array([3, 4, 5, 6]) }, // bogus for now
        ])

        await expect(bobClient._debugSendMls(streamId, bobMlsSecretsPayload)).rejects.toThrow(
            'epoch already exists',
        )
    })

    test('epoch secrets are snapshotted', async () => {
        // force snapshot
        await expect(
            bobClient.debugForceMakeMiniblock(streamId, { forceSnapshot: true }),
        ).resolves.not.toThrow()

        // verify that the epoch secrets are picked up in the snapshot
        const streamAfterSnapshot = await bobClient.getStream(streamId)
        const mls = streamAfterSnapshot.membershipContent.mls
        expect(bin_equal(mls.epochSecrets[1n.toString()], new Uint8Array([1, 2, 3, 4]))).toBe(true)
        expect(bin_equal(mls.epochSecrets[2n.toString()], new Uint8Array([3, 4, 5, 6]))).toBe(true)
    })

    test('removing stream members who are still members is not allowed', async () => {
        const bobPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'commitLeaves',
                value: {
                    userAddresses: [hexToBytes(aliceClient.userId)],
                    commit: new Uint8Array(randomBytes(32)),
                },
            },
        }
        await expect(bobClient._debugSendMls(streamId, bobPayload)).rejects.toThrow(
            'user is a member',
        )
    })

    test('removing stream members with invalid commits is not allowed', async () => {
        await expect(aliceClient.leaveStream(streamId)).resolves.not.toThrow()
        const bobPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'commitLeaves',
                value: {
                    userAddresses: [hexToBytes(aliceClient.userId)],
                    commit: new Uint8Array(randomBytes(32)),
                },
            },
        }

        await expect(bobClient._debugSendMls(streamId, bobPayload)).rejects.toThrow(
            'INVALID_COMMIT',
        )
    })

    test('"Close the gap" — roll up all commits from snapshots, check against list of commits', async () => {
        const stream = await charlieClient.getStream(streamId)
        expect(stream.miniblockInfo?.min).toBeDefined()
        let prevSnapshotMiniblockNum = stream.miniblockInfo!.min
        let snapshottedCommits: Uint8Array[] = []
        while (prevSnapshotMiniblockNum > 0) {
            const snapshot = await charlieClient.getMlsSnapshot(streamId, prevSnapshotMiniblockNum)
            expect(snapshot.mls).toBeDefined()
            if (snapshot.mls!.commitsSinceLastSnapshot.length > 0) {
                snapshottedCommits = [
                    ...snapshot.mls!.commitsSinceLastSnapshot,
                    ...snapshottedCommits,
                ]
            }
            prevSnapshotMiniblockNum = snapshot.prevSnapshotMiniblockNum
        }

        expect(snapshottedCommits.length).toBe(commits.length)
        for (let i = 0; i < snapshottedCommits.length; i++) {
            expect(bin_equal(snapshottedCommits[i], commits[i])).toBe(true)
        }
    })
})
