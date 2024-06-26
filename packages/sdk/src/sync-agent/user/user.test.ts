/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/**
 * @group with-entitilements
 */

import { dlogger } from '@river-build/dlog'
import { Store } from '../../store/store'
import { makeRiverConfig } from '../../riverConfig'
import { genShortId } from '../../id'
import { Wallet, providers } from 'ethers'
import { StreamNodeUrls } from '../river-connection/models/streamNodeUrls'
import { RiverConnection } from '../river-connection/riverConnection'
import { LocalhostWeb3Provider, RiverRegistry, SpaceDapp } from '@river-build/web3'
import { User } from './user'
import { UserMemberships } from './models/userMemberships'
import { makeUserContextFromWallet } from '../../util.test'
import { makeClientParams } from '../utils/syncAgentUtils.test'

const logger = dlogger('csb:test:user')

describe('User.test.ts', () => {
    logger.log('start')
    const rootWallet = Wallet.createRandom()
    const userId = rootWallet.address
    const riverConfig = makeRiverConfig()
    const store = new Store(genShortId(), 1, [StreamNodeUrls, UserMemberships, User])
    store.newTransactionGroup('init')
    const river = riverConfig.river
    const riverProvider = new providers.StaticJsonRpcProvider(river.rpcUrl)
    const base = riverConfig.base
    const baseProvider = new providers.StaticJsonRpcProvider(base.rpcUrl)
    const web3Provider = new LocalhostWeb3Provider(riverConfig.base.rpcUrl, rootWallet)
    const riverRegistryDapp = new RiverRegistry(river.chainConfig, riverProvider)
    const spaceDapp = new SpaceDapp(base.chainConfig, baseProvider)

    test('User initializes', async () => {
        await web3Provider.fundWallet()
        const context = await makeUserContextFromWallet(rootWallet)
        const clientParams = makeClientParams({ context, riverConfig }, spaceDapp)
        const riverConnection = new RiverConnection(store, riverRegistryDapp, clientParams)
        const user = new User(userId, store, riverConnection, spaceDapp)
        expect(user.data.id).toBe(userId)
        expect(user.data.initialized).toBe(false)
        expect(user.streams.memberships.data.initialized).toBe(false)
        //expect(user.streams.inbox.data.initialized).toBe(false)
        //expect(user.streams.deviceKeys.data.initialized).toBe(false)
        //expect(user.streams.settings.data.initialized).toBe(false)

        await store.commitTransaction()
        expect(user.data.id).toBe(userId)
        expect(user.data.initialized).toBe(false)
        expect(user.streams.memberships.data.initialized).toBe(false)
        //expect(user.streams.inbox.data.initialized).toBe(false)
        //expect(user.streams.deviceKeys.data.initialized).toBe(false)
        //expect(user.streams.settings.data.initialized).toBe(false)

        const { spaceId } = await user.createSpace({ spaceName: 'bobs-space' }, web3Provider.signer)
        logger.log('created spaceId', spaceId)

        expect(user.data.initialized).toBe(true)
        expect(user.streams.memberships.data.initialized).toBe(true)
        //expect(user.streams.inbox.data.initialized).toBe(false)
        //expect(user.streams.deviceKeys.data.initialized).toBe(false)
        //expect(user.streams.settings.data.initialized).toBe(false)
    })
    test('User loads from db', async () => {
        store.newTransactionGroup('init2')
        const context = await makeUserContextFromWallet(rootWallet)
        const clientParams = makeClientParams({ context, riverConfig }, spaceDapp)
        const riverConnection = new RiverConnection(store, riverRegistryDapp, clientParams)
        const user = new User(userId, store, riverConnection, spaceDapp)
        expect(user.value.status).toBe('loading')

        await store.commitTransaction()
        expect(user.value.status).toBe('loaded')
        expect(user.data.initialized).toBe(true)
        expect(user.streams.memberships.data.initialized).toBe(true)
    })
})
