/**
 * @group main
 */

import { MlsCrypto } from './mls'

async function initializeCrypto(userAddress: string, deviceKey: Uint8Array): Promise<MlsCrypto> {
    const crypto = new MlsCrypto(userAddress, deviceKey)
    await crypto.initialize()
    return crypto
}

describe('CreateGroupHappyPath', () => {
    const streamId = 'stream'
    const userAddress = '0x00'
    const textEncoder = new TextEncoder()
    const deviceKey = textEncoder.encode('deviceKey')

    it('createGroup gets a group in a pending state', async () => {
        const crypto = await initializeCrypto(userAddress, deviceKey)

        expect(crypto.hasGroup(streamId)).toEqual(false)

        const groupInfoWithExternalKey = await crypto.createGroup(streamId)
        expect(groupInfoWithExternalKey).toBeDefined()
        expect(crypto.groupStore.getGroupStatus(streamId)).toEqual('GROUP_PENDING_CREATE')
    })

    it('handleInitializedGroup gets group from pending state into active state', async () => {
        const crypto = await initializeCrypto(userAddress, deviceKey)

        const groupInfoWithExternalKey = await crypto.createGroup(streamId)
        expect(groupInfoWithExternalKey).toBeDefined()
        expect(crypto.groupStore.getGroupStatus(streamId)).toEqual('GROUP_PENDING_CREATE')

        const groupStatus = await crypto.handleInitializeGroup(
            streamId,
            userAddress,
            deviceKey,
            groupInfoWithExternalKey,
        )
        expect(groupStatus).toEqual('GROUP_ACTIVE')
        expect(crypto.groupStore.getGroupStatus(streamId)).toEqual('GROUP_ACTIVE')
    })

    it('handleInitializedGroup gets group from pending state into missing state', async () => {
        const crypto = await initializeCrypto(userAddress, deviceKey)
        await crypto.createGroup(streamId)
        expect(crypto.groupStore.getGroupStatus(streamId)).toEqual('GROUP_PENDING_CREATE')

        const anotherUser = 'another user'
        const anotherDeviceKey = textEncoder.encode('another deviceKey')

        const groupStatus = await crypto.handleInitializeGroup(
            streamId,
            anotherUser,
            anotherDeviceKey,
            new Uint8Array(),
        )

        expect(groupStatus).toEqual('GROUP_MISSING')
        expect(crypto.groupStore.getGroupStatus(streamId)).toEqual('GROUP_MISSING')
    })
})
