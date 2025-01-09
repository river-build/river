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
import { bin_equal, check } from '@river-build/dlog'
import { addressFromUserId } from '../../id'
import { bytesToHex } from 'ethereum-cryptography/utils'
import { isDefined } from '../../check'

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
    let bobMlsGroup: MlsGroup
    let aliceClient: Client
    let bobMlsClient: MlsClient
    let aliceMlsClient: MlsClient
    let aliceMlsClient2: MlsClient

    // state data to retain between tests
    let streamId: string
    let latestGroupInfoMessage: Uint8Array
    let latestExternalGroupSnapshot: Uint8Array
    let latestAliceMlsKeyPackage: Uint8Array
    const commits: Uint8Array[] = []

    beforeAll(async () => {
        bobClient = await makeInitAndStartClient()
        aliceClient = await makeInitAndStartClient()
        bobMlsClient = await MlsClient.create(new Uint8Array(randomBytes(32)))
        aliceMlsClient = await MlsClient.create(new Uint8Array(randomBytes(32)))
        aliceMlsClient2 = await MlsClient.create(new Uint8Array(randomBytes(32)))
        bobMlsGroup = await bobMlsClient.createGroup()
        const { streamId: dmStreamId } = await bobClient.createDMChannel(aliceClient.userId)
        await bobClient.waitForStream(dmStreamId)
        await aliceClient.waitForStream(dmStreamId)
        streamId = dmStreamId
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

    function makeMlsPayloadKeyPackage(
        userAddress: Uint8Array,
        signaturePublicKey: Uint8Array,
        keyPackage: Uint8Array,
    ): PlainMessage<MemberPayload_Mls> {
        return {
            content: {
                case: 'keyPackage',
                value: {
                    userAddress,
                    signaturePublicKey,
                    keyPackage,
                },
            },
        }
    }

    function makeMlsPayloadWelcomeMessage(
        commit: Uint8Array,
        signaturePublicKeys: Uint8Array[],
        groupInfoMessage: Uint8Array,
        welcomeMessages: Uint8Array[],
    ): PlainMessage<MemberPayload_Mls> {
        return {
            content: {
                case: 'welcomeMessage',
                value: {
                    commit,
                    signaturePublicKeys,
                    groupInfoMessage,
                    welcomeMessages,
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
        const group = await bobMlsClient.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)

        const mlsPayload = makeMlsPayloadInitializeGroup(
            (await bobMlsClient.signaturePublicKey()).slice(1), // slice 1 byte to make it invalid
            externalGroupSnapshot,
            groupInfoMessage,
        )
        await expect(bobClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'INVALID_PUBLIC_SIGNATURE_KEY',
        )
    })

    test('invalid external MLS group is not accepted', async () => {
        const mlsPayload = makeMlsPayloadInitializeGroup(
            await bobMlsClient.signaturePublicKey(),
            new Uint8Array([]),
            new Uint8Array([]),
        )
        await expect(bobClient._debugSendMls(streamId, mlsPayload)).rejects.to.toThrow(
            'INVALID_EXTERNAL_GROUP',
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
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(bobMlsGroup)
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

    test('clients can publish key packages', async () => {
        const keyPackage = await aliceMlsClient2.generateKeyPackageMessage()
        const alicePayload = makeMlsPayloadKeyPackage(
            addressFromUserId(aliceClient.userId),
            await aliceMlsClient2.signaturePublicKey(),
            keyPackage.toBytes(),
        )

        await expect(aliceClient._debugSendMls(streamId, alicePayload)).resolves.not.toThrow()
        latestAliceMlsKeyPackage = keyPackage.toBytes()
    })

    test('key packages are broadcasted to all members', async () => {
        const aliceMlsClient2SignaturePublicKey = await aliceMlsClient2.signaturePublicKey()
        await waitFor(() => {
            const stream = bobClient.streams.get(streamId)
            check(Object.values(stream!.view.membershipContent.mls.pendingKeyPackages).length > 0)
            const kp =
                stream!.view.membershipContent.mls.pendingKeyPackages[
                    bytesToHex(aliceMlsClient2SignaturePublicKey)
                ].keyPackage
            check(bin_equal(kp, latestAliceMlsKeyPackage))
        })
    })

    test("clients can publish key packages twice (but it isn't encouraged)", async () => {
        const alicePayload = makeMlsPayloadKeyPackage(
            addressFromUserId(aliceClient.userId),
            await aliceMlsClient2.signaturePublicKey(),
            latestAliceMlsKeyPackage,
        )
        await expect(aliceClient._debugSendMls(streamId, alicePayload)).resolves.not.toThrow()
    })

    test('key packages are snapshotted', async () => {
        // force snapshot
        await expect(
            bobClient.debugForceMakeMiniblock(streamId, { forceSnapshot: true }),
        ).resolves.not.toThrow()

        // verify that the key package is picked up in the snapshot
        const streamAfterSnapshot = await bobClient.getStream(streamId)
        const mls = streamAfterSnapshot.membershipContent.mls
        expect(Object.values(mls.pendingKeyPackages).length).toBe(1)
        const key = bytesToHex(await aliceMlsClient2.signaturePublicKey())
        expect(bin_equal(mls.pendingKeyPackages[key].keyPackage, latestAliceMlsKeyPackage)).toBe(
            true,
        )
    })

    // TODO: Add more tests once we have support for clearing commits in mls-rs-wasm
    test('invalid group infos are not accepted', async () => {
        const payload = makeMlsPayloadWelcomeMessage(
            new Uint8Array(),
            [new Uint8Array([1, 2, 3])],
            latestGroupInfoMessage, // bogus, no longer valid
            [new Uint8Array([4, 5, 6])],
        )
        await expect(bobClient._debugSendMls(streamId, payload)).rejects.to.toThrow(
            'INVALID_GROUP_INFO_EPOCH',
        )
    })

    test('clients can add other members from key packages', async () => {
        const mls = bobClient.streams.get(streamId)!.view.membershipContent.mls
        const keyPackage = Object.values(mls.pendingKeyPackages)[0]
        const kp = MlsMessage.fromBytes(keyPackage.keyPackage)
        const commitOutput = await bobMlsGroup.addMember(kp)
        await bobMlsGroup.applyPendingCommit()

        const commit = commitOutput.commitMessage.toBytes()
        const welcomeMessages = commitOutput.welcomeMessages.map((wm) => wm.toBytes())
        const groupInfoMessage = await bobMlsGroup.groupInfoMessageAllowingExtCommit(false)
        const payload = makeMlsPayloadWelcomeMessage(
            commit,
            [keyPackage.signaturePublicKey],
            groupInfoMessage.toBytes(),
            welcomeMessages,
        )
        await expect(aliceClient._debugSendMls(streamId, payload)).resolves.not.toThrow()
    })

    test('key packages are cleared after being applied', async () => {
        const aliceMlsClient2SignaturePublicKey = await aliceMlsClient2.signaturePublicKey()
        await waitFor(() => {
            const stream = bobClient.streams.get(streamId)
            check(Object.values(stream!.view.membershipContent.mls.pendingKeyPackages).length === 0)
            const key = bytesToHex(aliceMlsClient2SignaturePublicKey)
            const kp = stream!.view.membershipContent.mls.pendingKeyPackages[key]
            check(!isDefined(kp))
        })
    })
})
