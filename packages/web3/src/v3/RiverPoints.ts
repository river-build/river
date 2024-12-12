import { BigNumber, ethers } from 'ethers'
import { BaseChainConfig } from '../IStaticContractsInfo'
import { IRiverPointsShim } from './IRiverPointsShim'
import { IERC721AShim } from './IERC721AShim'

export class RiverPoints {
    private readonly riverPoints: IRiverPointsShim
    private readonly erc721Shim: IERC721AShim

    constructor(config: BaseChainConfig, provider: ethers.providers.Provider | undefined) {
        if (!config.addresses.riverPointsFacet) {
            throw new Error('River points facet address is not set')
        }
        this.riverPoints = new IRiverPointsShim(config.addresses.riverPointsFacet, provider)
        this.erc721Shim = new IERC721AShim(config.addresses.riverPointsFacet, provider)
    }

    public async getCurrentStreak(walletAddress: string): Promise<BigNumber> {
        return this.riverPoints.read.getCurrentStreak(walletAddress)
    }

    public async getLastCheckIn(walletAddress: string): Promise<BigNumber> {
        return this.riverPoints.read.getLastCheckIn(walletAddress)
    }

    public async checkIn(signer: ethers.Signer) {
        return this.riverPoints.write(signer).checkIn()
    }

    public async balanceOf(walletAddress: string) {
        return this.erc721Shim.read.balanceOf(walletAddress)
    }
}
