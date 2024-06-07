import { Address } from './ContractTypes';
export declare enum ContractVersion {
    v3 = "v3",
    dev = "dev"
}
export interface BaseChainConfig {
    chainId: number;
    contractVersion: ContractVersion;
    addresses: {
        spaceFactory: Address;
        spaceOwner: Address;
        mockNFT?: Address;
        member?: Address;
    };
}
export interface RiverChainConfig {
    chainId: number;
    contractVersion: ContractVersion;
    addresses: {
        riverRegistry: Address;
    };
}
export interface Web3Deployment {
    base: BaseChainConfig;
    river: RiverChainConfig;
}
export declare function getWeb3Deployment(riverEnv: string): Web3Deployment;
export declare function getWeb3Deployments(): string[];
//# sourceMappingURL=IStaticContractsInfo.d.ts.map