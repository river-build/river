/**
 * @group main
 */

import { makeTestClient } from '../testUtils'
import { Client } from '../../client'
import { PlainMessage } from '@bufbuild/protobuf'
import { MemberPayload_Mls } from '@river-build/proto'
import {
    ExportedTree,
    ExternalClient,
    ExternalSnapshot,
    Client as MlsClient,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import { randomBytes } from 'crypto'
import { dlog } from '@river-build/dlog'

const log = dlog('encryption:mls')

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

    async function createGroup(
        mlsClient: MlsClient,
    ): Promise<{ groupInfoMessage: Uint8Array; externalGroupSnapshot: Uint8Array }> {
        const group = await mlsClient.createGroup()
        const groupInfoMessage = await group.groupInfoMessageAllowingExtCommit(false)
        const groupInfoBytes = groupInfoMessage.toBytes()
        const tree = group.exportTree()
        const treeBytes = tree.toBytes()
        const externalClient = new ExternalClient()
        const externalGroup = await externalClient.observeGroup(groupInfoBytes, treeBytes)
        const snapshot = externalGroup.snapshot()
        const snapshotBytes = snapshot.toBytes()
        return { groupInfoMessage: groupInfoBytes, externalGroupSnapshot: snapshotBytes }
    }

    async function externalJoin(
        mlsClient: MlsClient,
        externalGroupSnapshot: Uint8Array,
        commits: Uint8Array[],
        groupInfoMessage: Uint8Array,
    ): Promise<{ groupInfoMessage: Uint8Array; commit: Uint8Array }> {
        const externalClient = new ExternalClient()
        const snapshot = ExternalSnapshot.fromBytes(externalGroupSnapshot)
        const externalGroup = await externalClient.loadGroup(snapshot)
        for (const commit of commits) {
            try {
                await externalGroup.processIncomingMessage(MlsMessage.fromBytes(commit))
            } catch (e) {
                // allow commits to fail application
                log('Error processing commit', e)
            }
        }
        const tree = externalGroup.exportTree()
        const exportedTree = ExportedTree.fromBytes(tree)
        const groupInfoMessageMls = MlsMessage.fromBytes(groupInfoMessage)
        const { group: aliceGroup, commit: aliceCommit } = await mlsClient.commitExternal(
            groupInfoMessageMls,
            exportedTree,
        )
        const aliceGroupInfoMessage = await aliceGroup.groupInfoMessageAllowingExtCommit(false)
        return { groupInfoMessage: aliceGroupInfoMessage.toBytes(), commit: aliceCommit.toBytes() }
    }

    test('clientCanCreateMlsGroup', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const mlsClient = await MlsClient.create(deviceKey)
        const groupParams = await createGroup(mlsClient)

        const mlsPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'initializeGroup',
                value: {
                    deviceKey: deviceKey,
                    externalGroupSnapshot: groupParams.externalGroupSnapshot,
                    groupInfoMessage: groupParams.groupInfoMessage,
                },
            },
        }
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).resolves.not.toThrow()
    })

    test('clientCanCreateMlsGroup - invalid', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const mlsClient = await MlsClient.create(deviceKey)
        const groupParams1 = await createGroup(mlsClient)
        const groupParams2 = await createGroup(mlsClient)

        const mlsPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'initializeGroup',
                value: {
                    deviceKey: deviceKey,
                    externalGroupSnapshot: groupParams1.externalGroupSnapshot,
                    groupInfoMessage: groupParams2.groupInfoMessage,
                },
            },
        }
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).rejects.toThrow(
            'INVALID_GROUP_INFO',
        )
    })

    test('clientCanExternalJoin - valid', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const bobDeviceKey = new Uint8Array(randomBytes(32))
        const bobMlsClient = await MlsClient.create(bobDeviceKey)
        const groupParams = await createGroup(bobMlsClient)

        const mlsPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'initializeGroup',
                value: {
                    deviceKey: bobDeviceKey,
                    externalGroupSnapshot: groupParams.externalGroupSnapshot,
                    groupInfoMessage: groupParams.groupInfoMessage,
                },
            },
        }
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).resolves.not.toThrow()

        const aliceDeviceKey = new Uint8Array(randomBytes(32))
        const aliceMlsClient = await MlsClient.create(aliceDeviceKey)
        const { groupInfoMessage: aliceGroupInfoMessage, commit: aliceCommit } = await externalJoin(
            aliceMlsClient,
            groupParams.externalGroupSnapshot,
            [], // commits and group info messages need to be combined
            groupParams.groupInfoMessage,
        )

        const mlsPayload2: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'externalJoin',
                value: {
                    deviceKey: aliceDeviceKey,
                    groupInfoMessage: aliceGroupInfoMessage,
                    commit: aliceCommit,
                    epoch: 0n, // figure out if it helps to tag commits with epoch for accessibility from go
                },
            },
        }

        await expect(alicesClient._debugSendMls(streamId, mlsPayload2)).resolves.not.toThrow()
    })
})
