import { SpaceDapp } from './v3'
import { ISpaceDapp } from './ISpaceDapp'
import { ethers } from 'ethers'
import { BaseChainConfig } from './IStaticContractsInfo'

export function createSpaceDapp(
    provider: ethers.providers.Provider,
    config: BaseChainConfig,
): ISpaceDapp {
    if (provider === undefined) {
        throw new Error('createSpaceDapp() Provider is undefined')
    }
    // For RPC providers that pool for events, we need to set the polling interval to a lower value
    // so that we don't miss events that may be emitted in between polling intervals. The Ethers
    // default is 4000ms, which is based on the assumption of 12s mainnet blocktimes.
    if ('pollingInterval' in provider && typeof provider.pollingInterval === 'number') {
        provider.pollingInterval = 250
    }
    return new SpaceDapp(config, provider)
}
