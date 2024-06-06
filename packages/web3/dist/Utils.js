import { ethers } from 'ethers';
export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const EVERYONE_ADDRESS = '0x0000000000000000000000000000000000000001';
export const MOCK_ADDRESS = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
export function isEthersProvider(provider) {
    return (typeof provider === 'object' &&
        provider !== null &&
        'getNetwork' in provider &&
        typeof provider.getNetwork === 'function');
}
export function isPublicClient(provider) {
    return (typeof provider === 'object' &&
        provider !== null &&
        'getNetwork' in provider &&
        typeof provider.getNetwork !== 'function');
}
// River space stream ids are 64 characters long, and start with '10'
// incidentally this should also work if you just pass the space contract address with 0x prefix
export function SpaceAddressFromSpaceId(spaceId) {
    return ethers.utils.getAddress(spaceId.slice(2, 42));
}
/**
 * Use this function in the default case of a exhaustive switch statement to ensure that all cases are handled.
 * Always throws JSON RPC error.
 * @param value Switch value
 * @param message Error message
 * @param code JSON RPC error code
 * @param data Optional data to include in the error
 */
export function checkNever(value, message) {
    throw new Error(message ?? `Unhandled switch value ${value}`);
}
export const TIERED_PRICING_ORACLE = 'TieredLogPricingOracle';
export const FIXED_PRICING = 'FixedPricing';
export const getDynamicPricingModule = async (spaceDapp) => {
    if (!spaceDapp) {
        throw new Error('getDynamicPricingModule: No spaceDapp');
    }
    const pricingModules = await spaceDapp.listPricingModules();
    const dynamicPricingModule = findDynamicPricingModule(pricingModules);
    if (!dynamicPricingModule) {
        throw new Error('getDynamicPricingModule: no dynamicPricingModule');
    }
    return dynamicPricingModule;
};
export const getFixedPricingModule = async (spaceDapp) => {
    if (!spaceDapp) {
        throw new Error('getFixedPricingModule: No spaceDapp');
    }
    const pricingModules = await spaceDapp.listPricingModules();
    const fixedPricingModule = findFixedPricingModule(pricingModules);
    if (!fixedPricingModule) {
        throw new Error('getFixedPricingModule: no fixedPricingModule');
    }
    return fixedPricingModule;
};
export const findDynamicPricingModule = (pricingModules) => pricingModules.find((module) => module.name === TIERED_PRICING_ORACLE);
export const findFixedPricingModule = (pricingModules) => pricingModules.find((module) => module.name === FIXED_PRICING);
export function parseChannelMetadataJSON(metadataStr) {
    try {
        const result = JSON.parse(metadataStr);
        if (typeof result === 'object' &&
            result !== null &&
            'name' in result &&
            'description' in result) {
            return result;
        }
    }
    catch (error) {
        /* empty */
    }
    return {
        name: metadataStr,
        description: '',
    };
}
//# sourceMappingURL=Utils.js.map