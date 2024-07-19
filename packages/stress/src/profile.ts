import 'fake-indexeddb/auto' // used to mock indexdb in dexie, don't remove
import { Analytics, Bot, makeRiverConfig } from '@river-build/sdk'
import { check, dlogger } from '@river-build/dlog'
import { makeStressClient } from './utils/stressClient'
import { isSet } from './utils/expect'

check(isSet(process.env.RIVER_ENV), 'process.env.RIVER_ENV')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = dlogger('stress:index')
const config = makeRiverConfig(process.env.RIVER_ENV)

async function createSpace() {
    const bob = await makeStressClient(config, 0)
    await bob.fundWallet()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const m0 = Analytics.measure('createSpace')
    const { spaceId, defaultChannelId } = await bob.createSpace("bob's space")
    m0()

    const alice = await makeStressClient(config, 1)
    await alice.fundWallet()
    const m1 = Analytics.measure('joinSpace')
    await alice.joinSpace(spaceId)
    m1()

    // const billB = new Bot(undefined, config)
    // await billB.fundWallet()
    // const bill = await billB.makeSyncAgent()
    // await bill.start()
    // const m2 = Analytics.measure('createSpaceBill')
    // const { spaceId: spaceId2 } = await bill.spaces.createSpace(
    //     { spaceName: "bill's space" },
    //     billB.signer,
    // )
    // m2()

    // const jillB = new Bot(undefined, config)
    // await jillB.fundWallet()
    // const jill = await jillB.makeSyncAgent()
    // await jill.start()

    // const m3 = Analytics.measure('joinSpaceJill')
    // await jill.spaces.getSpace(spaceId).join(jillB.signer)
    // m3()
}

const m2 = Analytics.measure('total')
await createSpace()
m2()

process.exit(0)
