import {
    Address,
    BaseChainConfig,
    RiverChainConfig,
    Web3Deployment,
    getWeb3Deployment,
    getWeb3Deployments,
} from '@river-build/web3'
import { isDefined } from './check'
import { check } from '@river-build/dlog'

function getEnvironmentId(): string {
    if (typeof process === 'object') {
        return process.env.RIVER_ENV || 'local_multi'
    }
    return 'local_multi'
}

// Test flag to toggle usage of legacy spaces
export function useLegacySpaces(): boolean {
    if (typeof process === 'object') {
        return process.env.USE_LEGACY_SPACES === 'true'
    }
    return true
}

function getBaseRpcUrlForChain(chainId: number): string {
    if (typeof process === 'object') {
        if (process.env.BASE_CHAIN_RPC_URL) {
            return process.env.BASE_CHAIN_RPC_URL
        }
    }
    switch (chainId) {
        case 31337:
            return 'http://localhost:8545'
        case 84532:
            return 'https://sepolia.base.org'
        case 8453:
            return 'https://mainnet.base.org'
        default:
            throw new Error(`No preset RPC url for base chainId ${chainId}`)
    }
}

function getRiverRpcUrlForChain(chainId: number): string {
    if (typeof process === 'object') {
        if (process.env.RIVER_CHAIN_RPC_URL) {
            return process.env.RIVER_CHAIN_RPC_URL
        }
    }
    switch (chainId) {
        case 31338:
            return 'http://localhost:8546'
        case 6524490:
            return 'https://devnet.rpc.river.build'
        case 550:
            return 'https://mainnet.rpc.river.build'
        default:
            throw new Error(`No preset RPC url for river chainId ${chainId}`)
    }
}

function makeWeb3Deployment(environmentId: string): Web3Deployment {
    if (getWeb3Deployments().includes(environmentId)) {
        return getWeb3Deployment(environmentId)
    }
    if (!isDefined(process.env.BASE_CHAIN_ID)) {
        throw new Error(
            `Attempted to make local deployment ${environmentId}, which was not found in packages/generated/config/deployments.json AND individual chain ids and addresses were not defined in the process.env. Try configuring a local environment or updating the process.env`,
        )
    }
    // Fallback to env vars
    check(isDefined(process.env.BASE_CHAIN_ID), 'BASE_CHAIN_ID is not defined')
    check(isDefined(process.env.BASE_CHAIN_RPC_URL), 'BASE_CHAIN_RPC_URL is not defined')
    check(isDefined(process.env.BASE_REGISTRY_ADDRESS), 'BASE_REGISTRY_ADDRESS is not defined')
    check(isDefined(process.env.SPACE_FACTORY_ADDRESS), 'SPACE_FACTORY_ADDRESS is not defined')
    check(isDefined(process.env.SPACE_OWNER_ADDRESS), 'SPACE_OWNER_ADDRESS is not defined')
    check(isDefined(process.env.RIVER_CHAIN_ID), 'RIVER_CHAIN_ID is not defined')
    check(isDefined(process.env.RIVER_CHAIN_RPC_URL), 'RIVER_CHAIN_RPC_URL is not defined')
    check(isDefined(process.env.RIVER_REGISTRY_ADDRESS), 'RIVER_REGISTRY_ADDRESS is not defined')

    return {
        base: {
            chainId: parseInt(process.env.BASE_CHAIN_ID!),
            addresses: {
                baseRegistry: process.env.BASE_REGISTRY_ADDRESS! as Address,
                spaceFactory: process.env.SPACE_FACTORY_ADDRESS! as Address,
                spaceOwner: process.env.SPACE_OWNER_ADDRESS! as Address,
                mockNFT: process.env.MOCK_NFT_ADDRESS as Address | undefined,
                member: process.env.MEMBER_ADDRESS as Address | undefined,
            },
        } satisfies BaseChainConfig,
        river: {
            chainId: parseInt(process.env.RIVER_CHAIN_ID!),
            addresses: {
                riverRegistry: process.env.RIVER_REGISTRY_ADDRESS! as Address,
            },
        } satisfies RiverChainConfig,
    }
}

export function makeRiverChainConfig(environmentId?: string) {
    const env = makeWeb3Deployment(environmentId ?? getEnvironmentId())
    return {
        rpcUrl: getRiverRpcUrlForChain(env.river.chainId),
        chainConfig: env.river,
    }
}

export function makeBaseChainConfig(environmentId?: string) {
    const env = makeWeb3Deployment(environmentId ?? getEnvironmentId())
    return {
        rpcUrl: getBaseRpcUrlForChain(env.base.chainId),
        chainConfig: env.base,
    }
}

export type RiverConfig = ReturnType<typeof makeRiverConfig>

export function makeRiverConfig(inEnvironmentId?: string) {
    const environmentId = inEnvironmentId ?? getEnvironmentId()
    const config = {
        environmentId,
        base: makeBaseChainConfig(environmentId),
        river: makeRiverChainConfig(environmentId),
    }
    return config
}
