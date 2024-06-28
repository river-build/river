/**
 * @group with-entitilements
 */
import { dlogger } from '@river-build/dlog'
import { SyncAgent } from './syncAgent'
import { TestUser } from './utils/testUser.test'

const logger = dlogger('csb:test:syncAgents')

describe('syncAgents.test.ts', () => {
    logger.log('start')
    let bobUser: TestUser
    let aliceUser: TestUser
    let bob: SyncAgent
    let alice: SyncAgent

    beforeEach(async () => {
        bobUser = new TestUser()
        aliceUser = new TestUser()
        bob = await bobUser.makeSyncAgent()
        alice = await aliceUser.makeSyncAgent()
    })

    afterEach(async () => {
        await bob.stop()
        await alice.stop()
    })

    test('syncAgents', async () => {
        await Promise.all([bob.start(), alice.start()])

        const { spaceId } = await bob.user.createSpace({ spaceName: 'BlastOff' }, bobUser.signer)
        expect(bob.user.streams.memberships.isJoined(spaceId)).toBe(true)

        await alice.user.joinSpace(spaceId, aliceUser.signer)
        expect(alice.user.streams.memberships.isJoined(spaceId)).toBe(true)
    })
})
