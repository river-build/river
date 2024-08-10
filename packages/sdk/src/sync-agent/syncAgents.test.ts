/**
 * @group with-entitilements
 */
import { dlogger } from '@river-build/dlog'
import { SyncAgent } from './syncAgent'
import { Bot } from './utils/bot'
import { waitFor } from '../util.test'

const logger = dlogger('csb:test:syncAgents')

describe('syncAgents.test.ts', () => {
    logger.log('start')
    const bobUser = new Bot()
    const aliceUser = new Bot()
    let bob: SyncAgent
    let alice: SyncAgent

    beforeEach(async () => {
        await bobUser.fundWallet()
        await aliceUser.fundWallet()
        bob = await bobUser.makeSyncAgent()
        alice = await aliceUser.makeSyncAgent()
    })

    afterEach(async () => {
        await bob.stop()
        await alice.stop()
    })

    test('syncAgents', async () => {
        await Promise.all([bob.start(), alice.start()])

        const { spaceId } = await bob.spaces.createSpace({ spaceName: 'BlastOff' }, bobUser.signer)
        expect(bob.user.memberships.isJoined(spaceId)).toBe(true)

        await alice.spaces.getSpace(spaceId).join(aliceUser.signer)
        expect(alice.user.memberships.isJoined(spaceId)).toBe(true)
    })

    test('syncAgents load async', async () => {
        await bob.start()

        const { spaceId } = await bob.spaces.createSpace(
            { spaceName: 'OuterSpace' },
            bobUser.signer,
        )
        expect(bob.user.memberships.isJoined(spaceId)).toBe(true)

        // queue up a join, then start the client (wow!)
        const alicePromise = alice.spaces.getSpace(spaceId).join(aliceUser.signer)
        await alice.start()
        await alicePromise
        expect(alice.user.memberships.isJoined(spaceId)).toBe(true)
    })

    test('syncAgents send a message', async () => {
        await Promise.all([bob.start(), alice.start()])
        await waitFor(() => bob.spaces.value.status === 'loaded')
        expect(bob.spaces.data.spaceIds.length).toBeGreaterThan(0)
        const spaceId = bob.spaces.data.spaceIds[0]
        expect(alice.user.memberships.isJoined(spaceId)).toBe(true) // alice joined above
        const space = bob.spaces.getSpace(spaceId)
        const channel = space.getDefaultChannel()
        await channel.sendMessage('Hello, World!')
        expect(channel.timeline.events.value.find((e) => e.text === 'Hello, World!')).toBeDefined()

        // sleep for a bit, then check if alice got the message
        const aliceChannel = alice.spaces.getSpace(spaceId).getChannel(channel.data.id)
        logger.log(aliceChannel.timeline.events.value)
        await waitFor(
            () =>
                expect(
                    aliceChannel.timeline.events.value.find((e) => e.text === 'Hello, World!'),
                ).toBeDefined(),
            { timeoutMS: 10000 },
        )
    })

    test('syncAgent read and update displayName', async () => {
        await Promise.all([bob.start(), alice.start()])
        await waitFor(() => bob.spaces.value.status === 'loaded')
        expect(bob.spaces.data.spaceIds.length).toBeGreaterThan(0)
        const spaceId = bob.spaces.data.spaceIds[0]
        expect(alice.user.memberships.isJoined(spaceId)).toBe(true) // alice joined above
        const space = bob.spaces.getSpace(spaceId)

        const member = space.members.getMember(bob.userId)
        expect(member?.displayName).toBe('')
        await member?.setDisplayName('Bob')
        expect(space.members.getMember(bob.userId)?.displayName).toBe('Bob')

        await waitFor(
            () => {
                const aliceSpace = alice.spaces.getSpace(spaceId)
                const bobDisplayName = aliceSpace.members.getMember(bob.userId)?.displayName
                expect(bobDisplayName).toBe('Bob')
            },
            { timeoutMS: 10000 },
        )
    })

    test('syncAgent read and update username', async () => {
        await Promise.all([bob.start(), alice.start()])
        await waitFor(() => bob.spaces.value.status === 'loaded')
        expect(bob.spaces.data.spaceIds.length).toBeGreaterThan(0)
        const spaceId = bob.spaces.data.spaceIds[0]
        expect(alice.user.memberships.isJoined(spaceId)).toBe(true) // alice joined above
        const space = bob.spaces.getSpace(spaceId)

        const member = space.members.getMember(bob.userId)
        expect(member?.username).toBe('')
        await member?.setUsername('bob')
        expect(space.members.getMember(bob.userId)?.username).toBe('bob')

        await waitFor(
            () => {
                const aliceSpace = alice.spaces.getSpace(spaceId)
                const bobUsername = aliceSpace.members.getMember(bob.userId)?.username
                expect(aliceSpace.members.isUsernameAvailable('bob')).toBe(false)
                expect(bobUsername).toBe('bob')
            },
            { timeoutMS: 10000 },
        )
    })

    test('syncAgent read and update ensAddress', async () => {
        await Promise.all([bob.start(), alice.start()])
        await waitFor(() => bob.spaces.value.status === 'loaded')
        expect(bob.spaces.data.spaceIds.length).toBeGreaterThan(0)
        const spaceId = bob.spaces.data.spaceIds[0]
        expect(alice.user.memberships.isJoined(spaceId)).toBe(true) // alice joined above
        const space = bob.spaces.getSpace(spaceId)

        const member = space.members.getMember(bob.userId)
        expect(member?.ensAddress).toBe(undefined)
        await member?.setEnsAddress('0xbB29f0d47678BBc844f3B87F527aBBbab258F051')
        expect(space.members.getMember(bob.userId)?.ensAddress).toBe(
            '0xbB29f0d47678BBc844f3B87F527aBBbab258F051',
        )

        await waitFor(
            () => {
                const aliceSpace = alice.spaces.getSpace(spaceId)
                const bobEnsAddress = aliceSpace.members.getMember(bob.userId)?.ensAddress
                expect(bobEnsAddress).toBe('0xbB29f0d47678BBc844f3B87F527aBBbab258F051')
            },
            { timeoutMS: 10000 },
        )
    })

    test('syncAgent read and update nft', async () => {
        await Promise.all([bob.start(), alice.start()])
        await waitFor(() => bob.spaces.value.status === 'loaded')
        expect(bob.spaces.data.spaceIds.length).toBeGreaterThan(0)
        const spaceId = bob.spaces.data.spaceIds[0]
        expect(alice.user.memberships.isJoined(spaceId)).toBe(true) // alice joined above
        const space = bob.spaces.getSpace(spaceId)

        const member = space.members.getMember(bob.userId)
        expect(member?.nft).toBe(undefined)
        const miladyNft = {
            tokenId: '1043',
            contractAddress: '0x5af0d9827e0c53e4799bb226655a1de152a425a5',
            chainId: 1,
        }
        await member?.setNft(miladyNft)
        expect(space.members.getMember(bob.userId)?.nft).toBe(miladyNft)
        await waitFor(
            () => {
                const aliceSpace = alice.spaces.getSpace(spaceId)
                const bobNft = aliceSpace.members.getMember(bob.userId)?.nft
                expect(bobNft).toBe(miladyNft)
            },
            { timeoutMS: 10000 },
        )
    })
})
