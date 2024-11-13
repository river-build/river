/**
 * @group main
 */

import { MlsCrypto } from './mls'

async function initializeCrypto(
    userAddress: Uint8Array,
    deviceKey: Uint8Array,
): Promise<MlsCrypto> {
    const crypto = new MlsCrypto(userAddress, deviceKey)
    await crypto.initialize()
    return crypto
}

async function initializeOtherGroup(
    userAddress: Uint8Array,
    deviceKey: Uint8Array,
    streamId: string,
): Promise<Uint8Array> {
    const crypto = new MlsCrypto(userAddress, deviceKey)
    await crypto.initialize()
    const groupInfoWithExternalKey = await crypto.createGroup(streamId)
    const groupStatus = await crypto.handleInitializeGroup(
        streamId,
        userAddress,
        deviceKey,
        groupInfoWithExternalKey,
    )
    expect(groupStatus).toEqual('GROUP_ACTIVE')
    return groupInfoWithExternalKey
}

describe('CreateGroup', () => {
    const streamId = 'stream'
    const textEncoder = new TextEncoder()
    const userAddress = textEncoder.encode('userAddress')
    const deviceKey = textEncoder.encode('deviceKey')
    const otherAddress = textEncoder.encode('other user')
    const otherDeviceKey = textEncoder.encode('other deviceKey')

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

        const groupStatus = await crypto.handleInitializeGroup(
            streamId,
            otherAddress,
            otherDeviceKey,
            new Uint8Array(),
        )

        expect(groupStatus).toEqual('GROUP_MISSING')
        expect(crypto.groupStore.getGroupStatus(streamId)).toEqual('GROUP_MISSING')
    })

    it('handleExternalJoin gets group from pending state into active state', async () => {
        const groupInfoWithExternalKey = await initializeOtherGroup(
            otherAddress,
            otherDeviceKey,
            streamId,
        )

        const crypto = await initializeCrypto(userAddress, deviceKey)
        const { groupInfo, commit } = await crypto.externalJoin(streamId, groupInfoWithExternalKey)
        expect(crypto.groupStore.getGroupStatus(streamId)).toEqual('GROUP_PENDING_JOIN')
        await crypto.handleExternalJoin(streamId, userAddress, deviceKey, commit, groupInfo, 0n)
        expect(crypto.groupStore.getGroupStatus(streamId)).toEqual('GROUP_ACTIVE')
    })

    it('awaitGroupActive should block', async () => {
        const crypto = await initializeCrypto(userAddress, deviceKey)
        const a = crypto.awaitGroupActive(streamId)
        void a.then((_x) => {
            throw new Error('should not resolve')
        })
        await new Promise((resolve) => setTimeout(resolve, 500))
        const b = crypto.awaitGroupActive(streamId)
        expect(a).toEqual(b)
    })

    it('awaitGroupActive should block until group is active via creation', async () => {
        const crypto = await initializeCrypto(userAddress, deviceKey)
        const awaiting = crypto.awaitGroupActive(streamId)

        const groupInfoWithExternalKey = await crypto.createGroup(streamId)
        await crypto.handleInitializeGroup(
            streamId,
            userAddress,
            deviceKey,
            groupInfoWithExternalKey,
        )

        await expect(awaiting).toResolve()
    })

    it('awaitGroupActive should block until group is active via external join', async () => {
        const groupInfoWithExternalKey = await initializeOtherGroup(
            otherAddress,
            otherDeviceKey,
            streamId,
        )

        const crypto = await initializeCrypto(userAddress, deviceKey)
        const awaiting = crypto.awaitGroupActive(streamId)
        const { groupInfo, commit } = await crypto.externalJoin(streamId, groupInfoWithExternalKey)
        await crypto.handleExternalJoin(streamId, userAddress, deviceKey, commit, groupInfo, 0n)
        await expect(awaiting).toResolve()
    })
})
