/**
 * @group with-entitilements
 */
import { Bot } from '../utils/bot'
import { waitFor } from '../../util.test'
import type { SyncAgent } from '../syncAgent'
import type { Space } from '../spaces/models/space'

describe('members.test.ts', () => {
    const testUser = new Bot()
    let syncAgent: SyncAgent
    let space: Space
    beforeAll(async () => {
        await testUser.fundWallet()
        syncAgent = await testUser.makeSyncAgent()
        await syncAgent.start()
        const { spaceId } = await syncAgent.spaces.createSpace(
            { spaceName: 'Blast Off' },
            testUser.signer,
        )

        space = syncAgent.spaces.getSpace(spaceId)!
    })

    afterAll(async () => {
        await syncAgent.stop()
    })

    test('member should be defined in a new space', async () => {
        expect(syncAgent.spaces.value.status).not.toBe('loading')
        await waitFor(() => expect(space.value.status).not.toBe('loading'))
        await waitFor(() => expect(space.data.channelIds.length).toBe(1))

        const members = space.members.data
        expect(members.userIds.length).toBe(1)
        expect(members.userIds[0]).toBe(testUser.userId)
    })
})
