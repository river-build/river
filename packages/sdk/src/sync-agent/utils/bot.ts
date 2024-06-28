import { RiverConfig, makeRiverConfig } from '../../riverConfig'
import { ethers } from 'ethers'
import { LocalhostWeb3Provider } from '@river-build/web3'
import { makeSignerContext } from '../../signerContext'
import { SyncAgent } from '../syncAgent'

export class Bot {
    riverConfig: RiverConfig
    rootWallet: ethers.Wallet
    delegateWallet: ethers.Wallet
    web3Provider: LocalhostWeb3Provider

    constructor(rootWallet?: ethers.Wallet, riverConfig?: RiverConfig) {
        this.riverConfig = riverConfig || makeRiverConfig()
        this.rootWallet = rootWallet || ethers.Wallet.createRandom()
        this.delegateWallet = ethers.Wallet.createRandom()
        this.web3Provider = new LocalhostWeb3Provider(this.riverConfig.base.rpcUrl, this.rootWallet)
    }

    get userId() {
        return this.rootWallet.address
    }

    get signer(): ethers.Signer {
        return this.web3Provider.signer
    }

    async makeSyncAgent() {
        await this.web3Provider.fundWallet()
        const signerContext = await makeSignerContext(this.rootWallet, this.delegateWallet, {
            days: 1,
        })
        const syncAgent = new SyncAgent({ context: signerContext, riverConfig: this.riverConfig })
        return syncAgent
    }
}
