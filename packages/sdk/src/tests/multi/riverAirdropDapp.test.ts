/**
 * @group with-entitlements
 */

import { dlog } from '@river-build/dlog'
import { makeRiverConfig } from '../../riverConfig'
import { LocalhostWeb3Provider, RiverAirdropDapp } from '@river-build/web3'
import { ethers } from 'ethers'

const log = dlog('csb:test:spaceDapp')

describe('spaceDappTests', () => {
    test('spaceDapp URI', async () => {
        log('spaceDapp URI')
        const wallet = ethers.Wallet.createRandom()
        const config = makeRiverConfig()
        const baseProvider = new LocalhostWeb3Provider(config.base.rpcUrl, wallet)
        await baseProvider.fundWallet()
        const riverAirdropDapp = new RiverAirdropDapp(config.base.chainConfig, baseProvider)

        const currentStreak = await riverAirdropDapp.getCurrentStreak(wallet.address)
        log('currentStreak', currentStreak.toString())
        expect(currentStreak.eq(0)).toBe(true)

        const lastCheckIn = await riverAirdropDapp.getLastCheckIn(wallet.address)
        log('lastCheckIn', lastCheckIn.toString())
        expect(lastCheckIn.eq(0)).toBe(true)

        const tx = await riverAirdropDapp.checkIn(baseProvider.signer)
        if (!tx) {
            throw new Error('Check in transaction failed')
        }
        const receipt = await tx.wait()
        log('receipt', receipt)

        const newCurrentStreak = await riverAirdropDapp.getCurrentStreak(wallet.address)
        log('newCurrentStreak', newCurrentStreak.toString())
        expect(newCurrentStreak.eq(1)).toBe(true)

        const newLastCheckIn = await riverAirdropDapp.getLastCheckIn(wallet.address)
        log('newLastCheckIn', newLastCheckIn.toString())
        expect(newLastCheckIn.gt(0)).toBe(true)

        const balance = await riverAirdropDapp.balanceOf(wallet.address)
        log('balance', balance.toString())
        expect(balance.gt(0)).toBe(true)
    })
})
