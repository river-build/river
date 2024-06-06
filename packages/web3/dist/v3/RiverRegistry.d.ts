import { NodeStructOutput } from '@river-build/generated/dev/typings/INodeRegistry';
import { RiverChainConfig } from '../IStaticContractsInfo';
import { IRiverRegistryShim } from './IRiverRegistryShim';
import { ethers } from 'ethers';
interface IRiverRegistry {
    [nodeAddress: string]: NodeStructOutput;
}
interface NodeUrls {
    url: string;
}
export declare class RiverRegistry {
    readonly config: RiverChainConfig;
    readonly provider: ethers.providers.Provider;
    readonly riverRegistry: IRiverRegistryShim;
    readonly registry: IRiverRegistry;
    constructor(config: RiverChainConfig, provider: ethers.providers.Provider);
    getAllNodes(nodeStatus?: number): Promise<IRiverRegistry | undefined>;
    getAllNodeUrls(nodeStatus?: number): Promise<NodeUrls[] | undefined>;
    getOperationalNodeUrls(): Promise<string>;
}
export {};
//# sourceMappingURL=RiverRegistry.d.ts.map