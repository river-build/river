/**
 * @group main
 */

import { makeTestClient, waitFor } from '../testUtils'
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

describe('mlsTests', () => {
    let clients: Client[] = []
    const makeInitAndStartClient = async () => {
        const client = await makeTestClient()
        await client.initializeUser()
        client.startSync()
        clients.push(client)
        return client
    }

    beforeEach(async () => {})

    afterEach(async () => {
        for (const client of clients) {
            await client.stop()
        }
        clients = []
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

    test('valid MLS group is accepted', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const client = await MlsClient.create(deviceKey)
        const group = await client.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)

        const mlsPayload = makeMlsPayloadInitializeGroup(
            await client.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).resolves.not.toThrow()
    })

    test('invalid signature public key is not accepted', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const client = await MlsClient.create(deviceKey)
        const group = await client.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)

        const mlsPayload = makeMlsPayloadInitializeGroup(
            (await client.signaturePublicKey()).slice(1), // slice 1 byte to make it invalid
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'INVALID_PUBLIC_SIGNATURE_KEY',
        )
    })

    test('invalid MLS group is not accepted', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const mlsPayload = makeMlsPayloadInitializeGroup(
            deviceKey,
            new Uint8Array([]),
            new Uint8Array([]),
        )
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).rejects.to.toThrow(
            'INVALID_GROUP_INFO',
        )
    })

    test('initializing MLS group twice throws an error', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const client = await MlsClient.create(deviceKey)
        const group = await client.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)

        const mlsPayload = makeMlsPayloadInitializeGroup(
            await client.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).resolves.not.toThrow()
        // trying to initialize the group again throws an error
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'group already initialized',
        )
    })

    test('mismatching group ids throws an error', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const client = await MlsClient.create(deviceKey)
        const group1 = await client.createGroup()
        const group2 = await client.createGroup()
        const { externalGroupSnapshot: externalGroupSnapshot1 } =
            await createGroupInfoAndExternalSnapshot(group1)
        const { groupInfoMessage: groupInfoMessage2 } = await createGroupInfoAndExternalSnapshot(
            group2,
        )

        const mlsPayload = makeMlsPayloadInitializeGroup(
            await client.signaturePublicKey(),
            externalGroupSnapshot1,
            groupInfoMessage2,
        )
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'INVALID_GROUP_INFO_GROUP_ID_MISMATCH',
        )
    })

    test('epoch not at 0 throws error', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey1 = new Uint8Array(randomBytes(32))
        const deviceKey2 = new Uint8Array(randomBytes(32))
        const client = await MlsClient.create(deviceKey1)
        const client2 = await MlsClient.create(deviceKey2)
        const groupAtEpoch0 = await client.createGroup()

        const groupInfoMessageAtEpoch0 = await groupAtEpoch0.groupInfoMessageAllowingExtCommit(true)
        const output = await client2.commitExternal(groupInfoMessageAtEpoch0)
        const groupAtEpoch1 = output.group
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(groupAtEpoch1)

        const mlsPayload = makeMlsPayloadInitializeGroup(
            await client2.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'INVALID_GROUP_INFO_EPOCH',
        )
    })

    test('MLS group is snapshotted', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const client = await MlsClient.create(deviceKey)
        const group = await client.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)

        const mlsPayload = makeMlsPayloadInitializeGroup(
            await client.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).resolves.not.toThrow()
        // force a snapshot
        await bobsClient.debugForceMakeMiniblock(streamId, { forceSnapshot: true })

        // fetch the stream again and check that the MLS group is snapshotted
        const streamAfterSnapshot = await bobsClient.getStream(streamId)
        const mls = streamAfterSnapshot.membershipContent.mls
        expect(mls.externalGroupSnapshot).toBeDefined()
        expect(mls.groupInfoMessage).toBeDefined()
        expect(bin_equal(mls.externalGroupSnapshot, externalGroupSnapshot)).toBe(true)
        expect(bin_equal(mls.groupInfoMessage, groupInfoMessage)).toBe(true)
    })

    test('Valid external commits are accepted', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const bobMlsDeviceKey = new Uint8Array(randomBytes(32))
        const bobMlsClient = await MlsClient.create(bobMlsDeviceKey)
        const group = await bobMlsClient.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)

        const bobMlsPayload = makeMlsPayloadInitializeGroup(
            await bobMlsClient.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobsClient._debugSendMls(streamId, bobMlsPayload)).resolves.not.toThrow()

        const aliceMlsDeviceKey = new Uint8Array(randomBytes(32))
        const aliceMlsClient = await MlsClient.create(aliceMlsDeviceKey)
        const { commit: aliceCommit, groupInfoMessage: aliceGroupInfoMessage } =
            await commitExternal(aliceMlsClient, groupInfoMessage, externalGroupSnapshot)

        const aliceMlsPayload = makeMlsPayloadExternalJoin(
            await aliceMlsClient.signaturePublicKey(),
            aliceCommit,
            aliceGroupInfoMessage,
        )
        await expect(alicesClient._debugSendMls(streamId, aliceMlsPayload)).resolves.not.toThrow()
    })

    test('External commits with invalid signature public keys are not accepted', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const bobMlsDeviceKey = new Uint8Array(randomBytes(32))
        const bobMlsClient = await MlsClient.create(bobMlsDeviceKey)
        const group = await bobMlsClient.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)

        const bobMlsPayload = makeMlsPayloadInitializeGroup(
            await bobMlsClient.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )

        await expect(bobsClient._debugSendMls(streamId, bobMlsPayload)).resolves.not.toThrow()

        const aliceMlsDeviceKey = new Uint8Array(randomBytes(32))
        const aliceMlsClient = await MlsClient.create(aliceMlsDeviceKey)
        const { commit: aliceCommit, groupInfoMessage: aliceGroupInfoMessage } =
            await commitExternal(aliceMlsClient, groupInfoMessage, externalGroupSnapshot)

        const aliceMlsPayload = makeMlsPayloadExternalJoin(
            new Uint8Array([1, 2, 3]),
            aliceCommit,
            aliceGroupInfoMessage,
        )
        await expect(alicesClient._debugSendMls(streamId, aliceMlsPayload)).rejects.toThrow(
            'INVALID_PUBLIC_SIGNATURE_KEY',
        )
    })

    test('Signature public keys are mapped per user in the snapshot', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const bobMlsDeviceKey = new Uint8Array(randomBytes(32))
        const bobMlsClient = await MlsClient.create(bobMlsDeviceKey)
        const group = await bobMlsClient.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)
        const bobSignaturePublicKey = await bobMlsClient.signaturePublicKey()
        const bobMlsPayload = makeMlsPayloadInitializeGroup(
            bobSignaturePublicKey,
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobsClient._debugSendMls(streamId, bobMlsPayload)).resolves.not.toThrow()

        const aliceMlsDeviceKey = new Uint8Array(randomBytes(32))
        const aliceMlsClient = await MlsClient.create(aliceMlsDeviceKey)
        const aliceSignaturePublicKey = await aliceMlsClient.signaturePublicKey()
        const { commit: aliceCommit, groupInfoMessage: aliceGroupInfoMessage } =
            await commitExternal(aliceMlsClient, groupInfoMessage, externalGroupSnapshot)

        const aliceMlsPayload = makeMlsPayloadExternalJoin(
            aliceSignaturePublicKey,
            aliceCommit,
            aliceGroupInfoMessage,
        )
        await expect(alicesClient._debugSendMls(streamId, aliceMlsPayload)).resolves.not.toThrow()

        // force snapshot
        await expect(
            bobsClient.debugForceMakeMiniblock(streamId, { forceSnapshot: true }),
        ).resolves.not.toThrow()

        // verify that the signature public keys are mapped per user
        // and that the signature public keys are correct
        const streamAfterSnapshot = await bobsClient.getStream(streamId)
        const mls = streamAfterSnapshot.membershipContent.mls.members
        expect(mls[bobsClient.userId].signaturePublicKeys.length).toBe(1)
        expect(mls[alicesClient.userId].signaturePublicKeys.length).toBe(1)
        expect(
            bin_equal(mls[bobsClient.userId].signaturePublicKeys[0], bobSignaturePublicKey),
        ).toBe(true)
        expect(
            bin_equal(mls[alicesClient.userId].signaturePublicKeys[0], aliceSignaturePublicKey),
        ).toBe(true)
    })

    test('epoch secrets are accepted', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const client = await MlsClient.create(deviceKey)
        const group = await client.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)

        const mlsPayload = makeMlsPayloadInitializeGroup(
            await client.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).resolves.not.toThrow()

        const aliceMlsDeviceKey = new Uint8Array(randomBytes(32))
        const aliceMlsClient = await MlsClient.create(aliceMlsDeviceKey)
        const { commit: aliceCommit, groupInfoMessage: aliceGroupInfoMessage } =
            await commitExternal(aliceMlsClient, groupInfoMessage, externalGroupSnapshot)

        const aliceMlsPayload = makeMlsPayloadExternalJoin(
            await aliceMlsClient.signaturePublicKey(),
            aliceCommit,
            aliceGroupInfoMessage,
        )
        await expect(alicesClient._debugSendMls(streamId, aliceMlsPayload)).resolves.not.toThrow()

        const bobMlsSecretsPayload = makeMlsPayloadEpochSecrets([
            { epoch: 1n, secret: new Uint8Array([1, 2, 3, 4]) },
            { epoch: 2n, secret: new Uint8Array([3, 4, 5, 6]) }, // bogus for now
        ])

        await expect(
            bobsClient._debugSendMls(streamId, bobMlsSecretsPayload),
        ).resolves.not.toThrow()
        // sending the same epoch twice returns an error
        await expect(bobsClient._debugSendMls(streamId, bobMlsSecretsPayload)).rejects.toThrow(
            'epoch already exists',
        )

        // verify that the epoch secrets have been picked up in the stream state view
        await waitFor(() => {
            const mls = bobsClient.streams.get(streamId)?._view.membershipContent.mls
            expect(bin_equal(mls!.epochSecrets[1n.toString()], new Uint8Array([1, 2, 3, 4]))).toBe(
                true,
            )
            expect(bin_equal(mls!.epochSecrets[2n.toString()], new Uint8Array([3, 4, 5, 6]))).toBe(
                true,
            )
        })

        // force snapshot
        await expect(
            bobsClient.debugForceMakeMiniblock(streamId, { forceSnapshot: true }),
        ).resolves.not.toThrow()

        // verify that the epoch secrets are picked up in the snapshot
        const streamAfterSnapshot = await bobsClient.getStream(streamId)
        const mls = streamAfterSnapshot.membershipContent.mls
        expect(bin_equal(mls.epochSecrets[1n.toString()], new Uint8Array([1, 2, 3, 4]))).toBe(true)
        expect(bin_equal(mls.epochSecrets[2n.toString()], new Uint8Array([3, 4, 5, 6]))).toBe(true)
    })
})
