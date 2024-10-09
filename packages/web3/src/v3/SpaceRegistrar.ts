import { SpaceAddressFromSpaceId } from '../Utils'
import { BaseChainConfig } from '../IStaticContractsInfo'
import { ISpaceArchitectShim } from './ISpaceArchitectShim'
import { ILegacySpaceArchitectShim } from './ILegacySpaceArchitectShim'

import { Space } from './Space'
import { ethers } from 'ethers'

interface SpaceMap {
    [spaceId: string]: { space: Space | undefined; lastSeen: number }
}

/**
 * A class to manage the creation of space stubs
 * converts a space network id to space address and
 * creates a space object with relevant addresses and data
 */
export class SpaceRegistrar {
    public readonly config: BaseChainConfig
    private readonly provider: ethers.providers.Provider
    private readonly spaceArchitect: ISpaceArchitectShim
    private readonly legacySpaceArchitect: ILegacySpaceArchitectShim
    private readonly spaces: SpaceMap = {}

    constructor(config: BaseChainConfig, provider: ethers.providers.Provider) {
        this.config = config
        this.provider = provider
        this.spaceArchitect = new ISpaceArchitectShim(config.addresses.spaceFactory, provider)
        this.legacySpaceArchitect = new ILegacySpaceArchitectShim(
            config.addresses.spaceFactory,
            provider,
        )
    }

    public get SpaceArchitect(): ISpaceArchitectShim {
        return this.spaceArchitect
    }

    public get LegacySpaceArchitect(): ILegacySpaceArchitectShim {
        return this.legacySpaceArchitect
    }

    public getSpace(spaceId: string): Space | undefined {
        // aellis 10/2024 we don't really need to cache spaces, but they instantiate a lot of objects
        // for the contracts and it's worth not wasting memory if we need to access the same space multiple times
        // this code is also used on the server so we don't want to cache spaces for too long
        const space = this.spaces[spaceId]?.space || this.createSpace(spaceId)
        this.pruneSpaces()
        this.spaces[spaceId] = { lastSeen: new Date().getTime(), space }
        return space
    }

    private pruneSpaces(): void {
        // clear out spaces that haven't been seen in 5 seconds
        const fiveSecondsAgo = new Date().getTime() - 1000 * 5
        for (const spaceId in this.spaces) {
            if (this.spaces[spaceId].lastSeen < fiveSecondsAgo) {
                delete this.spaces[spaceId]
            }
        }
    }

    private createSpace(spaceId: string): Space | undefined {
        const spaceAddress = SpaceAddressFromSpaceId(spaceId)
        if (!spaceAddress || spaceAddress === ethers.constants.AddressZero) {
            return undefined // space is not found
        }
        return new Space(spaceAddress, spaceId, this.config, this.provider)
    }
}
