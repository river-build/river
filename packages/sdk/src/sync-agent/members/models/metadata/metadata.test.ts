/**
 * @group with-entitilements
 */
import { SyncAgent } from '../../../syncAgent'
import { Bot } from '../../../utils/bot'
import type { Space } from '../../../spaces/models/space'

describe('metadata.test.ts', () => {
    let bob: SyncAgent
    let space: Space
    beforeAll(async () => {
        const bobUser = new Bot()
        await bobUser.fundWallet()
        bob = await bobUser.makeSyncAgent()
        await bob.start()
        const { spaceId } = await bob.spaces.createSpace(
            {
                spaceName: 'test metadata',
            },
            bobUser.signer,
        )
        space = bob.spaces.getSpace(spaceId)
    })

    test('update username', async () => {
        const userIds = space.members.data.userIds
        expect(userIds).toContain(bob.userId)
        const metadata = space.members.getMember(bob.userId)
        expect(metadata).toBeDefined()
        await metadata?.setUsername('bob123')
        expect(metadata?.username).toBe('bob123')
    })
    test('update displayname', async () => {
        const metadata = space.members.getMember(bob.userId)
        expect(metadata?.displayName).toBe(undefined)
        await metadata?.setDisplayName('Bob')
        expect(metadata?.displayName).toBe('Bob')
    })
    test('update ensAddress', async () => {
        const metadata = space.members.getMember(bob.userId)
        expect(metadata?.ensAddress).toBe(undefined)
        await metadata?.setEnsAddress('0xbB29f0d47678BBc844f3B87F527aBBbab258F051')
        expect(metadata?.ensAddress).toBe('0xbB29f0d47678BBc844f3B87F527aBBbab258F051')
    })
    test('update nft', async () => {
        const metadata = space.members.getMember(bob.userId)
        expect(metadata?.nft).toBe(undefined)
        const miladyNft = {
            tokenId: '1043',
            contractAddress: '0x5af0d9827e0c53e4799bb226655a1de152a425a5',
            chainId: 1,
        }
        await metadata?.setNft(miladyNft)
        expect(space.members.getMember(bob.userId)?.nft).toStrictEqual(miladyNft)
    })
})
