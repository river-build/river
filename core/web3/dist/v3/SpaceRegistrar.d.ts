import { BaseChainConfig } from '../IStaticContractsInfo';
import { ISpaceArchitectShim } from './ISpaceArchitectShim';
import { Space } from './Space';
import { ethers } from 'ethers';
/**
 * A class to manage the creation of space stubs
 * converts a space network id to space address and
 * creates a space object with relevant addresses and data
 */
export declare class SpaceRegistrar {
    readonly config: BaseChainConfig;
    private readonly provider;
    private readonly spaceArchitect;
    private readonly spaceOwnerAddress;
    private readonly spaces;
    constructor(config: BaseChainConfig, provider: ethers.providers.Provider | undefined);
    get SpaceArchitect(): ISpaceArchitectShim;
    getSpace(spaceId: string): Space | undefined;
}
//# sourceMappingURL=SpaceRegistrar.d.ts.map