/**
 * @group main
 */

import { makeTestClient } from '../testUtils'
import { Client } from '../../client'
import { PlainMessage } from '@bufbuild/protobuf'
import { MemberPayload_Mls } from '@river-build/proto'
import { ExternalClient, Client as MlsClient } from '@river-build/mls-rs-wasm'
import { randomBytes } from 'crypto'

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

    // helper function to create a group + external snapshot
    async function createGroupInfoAndExternalSnapshot(client: MlsClient): Promise<{
        groupInfoMessage: Uint8Array
        externalGroupSnapshot: Uint8Array
    }> {
        // this is still a little clunky — will be addressed in Rust
        const group = await client.createGroup()
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

    test('invalidMlsGroupThrowsError', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        const stream = await bobsClient.waitForStream(streamId)

        expect(stream.view.getMembers().membership.joinedUsers).toEqual(
            new Set([bobsClient.userId, alicesClient.userId]),
        )

        const deviceKey = new Uint8Array(randomBytes(32))
        const mlsPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'initializeGroup',
                value: {
                    deviceKey: deviceKey,
                    externalGroupSnapshot: new Uint8Array([]),
                    groupInfoMessage: new Uint8Array([]),
                },
            },
        }
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).rejects.to.toThrow(
            'INVALID_GROUP_INFO',
        )
    })

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
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(client)

        const mlsPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'initializeGroup',
                value: {
                    deviceKey: deviceKey,
                    externalGroupSnapshot: externalGroupSnapshot,
                    groupInfoMessage: groupInfoMessage,
                },
            },
        }
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).resolves.not.toThrow()
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
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(client)

        const mlsPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'initializeGroup',
                value: {
                    deviceKey: deviceKey,
                    externalGroupSnapshot: externalGroupSnapshot,
                    groupInfoMessage: groupInfoMessage,
                },
            },
        }
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
        const { externalGroupSnapshot: externalGroupSnapshot1 } =
            await createGroupInfoAndExternalSnapshot(client)
        const { groupInfoMessage: groupInfoMessage2 } = await createGroupInfoAndExternalSnapshot(
            client,
        )

        const mlsPayload: PlainMessage<MemberPayload_Mls> = {
            content: {
                case: 'initializeGroup',
                value: {
                    deviceKey: deviceKey,
                    externalGroupSnapshot: externalGroupSnapshot1,
                    groupInfoMessage: groupInfoMessage2,
                },
            },
        }
        await expect(bobsClient._debugSendMls(streamId, mlsPayload)).resolves.toThrow(
            'INVALID_GROUP_INFO_GROUP_ID_MISMATCH',
        )
    })
})
