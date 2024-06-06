import { BaseChainConfig, RiverChainConfig } from '@river-build/web3';
export declare function makeRiverChainConfig(environmentId?: string): {
    rpcUrl: string;
    chainConfig: RiverChainConfig;
};
export declare function makeBaseChainConfig(environmentId?: string): {
    rpcUrl: string;
    chainConfig: BaseChainConfig;
};
export type RiverConfig = ReturnType<typeof makeRiverConfig>;
export declare function makeRiverConfig(): {
    environmentId: string;
    base: {
        rpcUrl: string;
        chainConfig: BaseChainConfig;
    };
    river: {
        rpcUrl: string;
        chainConfig: RiverChainConfig;
    };
};
//# sourceMappingURL=riverConfig.d.ts.map