import 'fake-indexeddb/auto'
import { dlog } from '@river-build/dlog'
import { Wallet } from 'ethers' // used to mock indexdb in dexie, don't remove

const baseLogger = dlog('foo')

const log = {
    info: baseLogger.extend('info'),
    debug: baseLogger.extend('debug'),
    error: baseLogger.extend('error'),
}

const mnemonic = 'test test test test test test test test test test test junk'

function createTestRiverWallet(index: number) {
    const derivationPath = `m/44'/60'/0'/0/${index}`
    return Wallet.fromMnemonic(mnemonic, derivationPath)
}

const run = async () => {
    Array.from({ length: 10 }).forEach((_, i) => {
        const wallet = createTestRiverWallet(i)

        console.log('wallet', i)
        console.log('address', wallet.address)
        console.log('privateKey', wallet.privateKey)
    })
    process.exit(0)
}

run().catch((e) => {
    log.error('unhandled error:', e)
    process.exit(1)
})
