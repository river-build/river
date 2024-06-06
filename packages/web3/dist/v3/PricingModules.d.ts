import { ethers } from 'ethers';
import { BaseChainConfig } from '../IStaticContractsInfo';
import { PricingModuleStruct } from '../ContractTypes';
export declare class PricingModules {
    private readonly pricingShim;
    constructor(config: BaseChainConfig, provider: ethers.providers.Provider | undefined);
    parseError(error: unknown): Error;
    listPricingModules(): Promise<PricingModuleStruct[]>;
    addPricingModule(moduleAddress: string, signer: ethers.Signer): Promise<void>;
    removePricingModule(moduleAddress: string, signer: ethers.Signer): Promise<void>;
    isPricingModule(moduleAddress: string): Promise<boolean>;
}
//# sourceMappingURL=PricingModules.d.ts.map