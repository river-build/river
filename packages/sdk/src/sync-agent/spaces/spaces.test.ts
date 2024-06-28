/**
 * @group with-entitilements
 */
import { dlogger } from '@river-build/dlog'
import { TestUser } from '../utils/testUser.test'
import { waitFor } from '../../util.test'

const logger = dlogger('csb:test:spaces')

describe('spaces.test.ts', () => {
    logger.log('start')
    const testUser = new TestUser()

    test('create/leave/join space', async () => {
        const syncAgent = await testUser.makeSyncAgent()
        await syncAgent.start()
        expect(syncAgent.spaces.value.status).not.toBe('loading')
        const { spaceId, defaultChannelId } = await syncAgent.user.createSpace(
            { spaceName: 'BlastOff' },
            testUser.signer,
        )
        expect(syncAgent.spaces.data.spaceIds.length).toBe(1)
        expect(syncAgent.spaces.data.spaceIds[0]).toBe(spaceId)
        expect(syncAgent.spaces.getSpace(spaceId)).toBeDefined()
        const space = syncAgent.spaces.getSpace(spaceId)!
        await waitFor(() => expect(space.value.status).not.toBe('loading'))
        await waitFor(() => expect(space.data.channelIds.length).toBe(1))
        expect(space.data.channelIds[0]).toBe(defaultChannelId)
        expect(space.getChannel(defaultChannelId)).toBeDefined()

        await syncAgent.stop()
    })
})
