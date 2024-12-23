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

    async function createGroup(
        mlsClient: MlsClient,
    ): Promise<{ groupInfoMessage: Uint8Array; externalGroupSnapshot: Uint8Array }> {
        const bobGroup = await mlsClient.createGroup()
        const groupInfoMessage = await bobGroup.groupInfoMessageAllowingExtCommit(true) // this is wrong, should be false, needs support in mls-rs-wasm
        const groupInfoBytes = groupInfoMessage.toBytes()
        const externalClient = new ExternalClient()
        const externalGroup = await externalClient.observeGroup(groupInfoBytes)
        const snapshot = externalGroup.snapshot()
        const snapshotBytes = snapshot.toBytes()
        return { groupInfoMessage: groupInfoBytes, externalGroupSnapshot: snapshotBytes }
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

    test('clientCanExternalJoin - invalid', async () => {
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
})
