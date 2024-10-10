import { SpaceAddressFromSpaceId } from '../Utils'
import { BaseChainConfig } from '../IStaticContractsInfo'
import { ISpaceArchitectShim } from './ISpaceArchitectShim'
import { ILegacySpaceArchitectShim } from './ILegacySpaceArchitectShim'

import { Space } from './Space'
import { ethers } from 'ethers'

interface SpaceRecord {
    space: Space | undefined
    timeout: NodeJS.Timeout | undefined
}

interface SpaceMap {
    [spaceId: string]: SpaceRecord
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
        const spaceRecordTTL = 1000 * 5
        const spaceRecord = this.spaces[spaceId] || this.createSpace(spaceId)
        clearTimeout(spaceRecord.timeout)
        spaceRecord.timeout = setTimeout(() => {
            delete this.spaces[spaceId]
        }, spaceRecordTTL)
        this.spaces[spaceId] = spaceRecord
        return spaceRecord.space
    }

    private createSpace(spaceId: string): SpaceRecord {
        const spaceAddress = SpaceAddressFromSpaceId(spaceId)
        if (!spaceAddress || spaceAddress === ethers.constants.AddressZero) {
            return { space: undefined, timeout: undefined } // space is not found
        }
        return {
            space: new Space(spaceAddress, spaceId, this.config, this.provider),
            timeout: undefined,
        }
    }
}
