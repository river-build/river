import { getWeb3Deployment, getWeb3Deployments, } from '@river-build/web3';
import { isDefined } from './check';
import { check } from '@river-build/dlog';
function getEnvironmentId() {
    return process.env.RIVER_ENV || 'local_single';
}
function getBaseRpcUrlForChain(chainId) {
    if (process.env.BASE_CHAIN_RPC_URL) {
        return process.env.BASE_CHAIN_RPC_URL;
    }
    switch (chainId) {
        case 31337:
            return 'http://localhost:8545';
        case 84532:
            return 'https://sepolia.base.org';
        default:
            throw new Error(`No preset RPC url for base chainId ${chainId}`);
    }
}
function getRiverRpcUrlForChain(chainId) {
    if (process.env.RIVER_CHAIN_RPC_URL) {
        return process.env.RIVER_CHAIN_RPC_URL;
    }
    switch (chainId) {
        case 31338:
            return 'http://localhost:8546';
        case 6524490:
            return 'https://devnet.rpc.river.build';
        default:
            throw new Error(`No preset RPC url for river chainId ${chainId}`);
    }
}
function makeWeb3Deployment(environmentId) {
    if (getWeb3Deployments().includes(environmentId)) {
        return getWeb3Deployment(environmentId);
    }
    // Fallback to env vars
    check(isDefined(process.env.BASE_CHAIN_ID), 'BASE_CHAIN_ID is not defined');
    check(isDefined(process.env.BASE_CHAIN_RPC_URL), 'BASE_CHAIN_RPC_URL is not defined');
    check(isDefined(process.env.SPACE_FACTORY_ADDRESS), 'SPACE_FACTORY_ADDRESS is not defined');
    check(isDefined(process.env.SPACE_OWNER_ADDRESS), 'SPACE_OWNER_ADDRESS is not defined');
    check(isDefined(process.env.RIVER_CHAIN_ID), 'RIVER_CHAIN_ID is not defined');
    check(isDefined(process.env.RIVER_CHAIN_RPC_URL), 'RIVER_CHAIN_RPC_URL is not defined');
    check(isDefined(process.env.RIVER_REGISTRY_ADDRESS), 'RIVER_REGISTRY_ADDRESS is not defined');
    return {
        base: {
            chainId: parseInt(process.env.BASE_CHAIN_ID),
            contractVersion: (process.env.CONTRACT_VERSION ?? 'dev'),
            addresses: {
                spaceFactory: process.env.SPACE_FACTORY_ADDRESS,
                spaceOwner: process.env.SPACE_OWNER_ADDRESS,
                mockNFT: process.env.MOCK_NFT_ADDRESS,
                member: process.env.MEMBER_ADDRESS,
            },
        },
        river: {
            chainId: parseInt(process.env.RIVER_CHAIN_ID),
            contractVersion: (process.env.CONTRACT_VERSION ?? 'dev'),
            addresses: {
                riverRegistry: process.env.RIVER_REGISTRY_ADDRESS,
            },
        },
    };
}
export function makeRiverChainConfig(environmentId) {
    const env = makeWeb3Deployment(environmentId ?? getEnvironmentId());
    return {
        rpcUrl: getRiverRpcUrlForChain(env.river.chainId),
        chainConfig: env.river,
    };
}
export function makeBaseChainConfig(environmentId) {
    const env = makeWeb3Deployment(environmentId ?? getEnvironmentId());
    return {
        rpcUrl: getBaseRpcUrlForChain(env.base.chainId),
        chainConfig: env.base,
    };
}
export function makeRiverConfig() {
    const environmentId = getEnvironmentId();
    const config = {
        environmentId,
        base: makeBaseChainConfig(environmentId),
        river: makeRiverChainConfig(environmentId),
    };
    return config;
}
//# sourceMappingURL=riverConfig.js.map