import { INodeRegistry as DevContract, INodeRegistryInterface as DevInterface } from '@river-build/generated/dev/typings/INodeRegistry';
import { INodeRegistry as V3Contract, INodeRegistryInterface as V3Interface } from '@river-build/generated/v3/typings/INodeRegistry';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class IRiverRegistryShim extends BaseContractShim<DevContract, DevInterface, V3Contract, V3Interface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=IRiverRegistryShim.d.ts.map