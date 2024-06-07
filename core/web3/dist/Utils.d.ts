import { ethers } from 'ethers';
import { PublicClient } from 'viem';
import { PricingModuleStruct } from './ContractTypes';
import { ISpaceDapp } from './ISpaceDapp';
export declare const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export declare const EVERYONE_ADDRESS = "0x0000000000000000000000000000000000000001";
export declare const MOCK_ADDRESS = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
export declare function isEthersProvider(provider: ethers.providers.Provider | PublicClient): provider is ethers.providers.Provider;
export declare function isPublicClient(provider: ethers.providers.Provider | PublicClient): provider is PublicClient;
export declare function SpaceAddressFromSpaceId(spaceId: string): string;
/**
 * Use this function in the default case of a exhaustive switch statement to ensure that all cases are handled.
 * Always throws JSON RPC error.
 * @param value Switch value
 * @param message Error message
 * @param code JSON RPC error code
 * @param data Optional data to include in the error
 */
export declare function checkNever(value: never, message?: string): never;
export declare const TIERED_PRICING_ORACLE = "TieredLogPricingOracle";
export declare const FIXED_PRICING = "FixedPricing";
export declare const getDynamicPricingModule: (spaceDapp: ISpaceDapp | undefined) => Promise<import("@river-build/generated/dev/typings/IPricingModules").IPricingModulesBase.PricingModuleStruct>;
export declare const getFixedPricingModule: (spaceDapp: ISpaceDapp | undefined) => Promise<import("@river-build/generated/dev/typings/IPricingModules").IPricingModulesBase.PricingModuleStruct>;
export declare const findDynamicPricingModule: (pricingModules: PricingModuleStruct[]) => import("@river-build/generated/dev/typings/IPricingModules").IPricingModulesBase.PricingModuleStruct | undefined;
export declare const findFixedPricingModule: (pricingModules: PricingModuleStruct[]) => import("@river-build/generated/dev/typings/IPricingModules").IPricingModulesBase.PricingModuleStruct | undefined;
//# sourceMappingURL=Utils.d.ts.map