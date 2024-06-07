import { ISpaceOwner as LocalhostContract, ISpaceOwnerBase as LocalhostISpaceOwnerBase, ISpaceOwnerInterface as LocalhostInterface } from '@river-build/generated/dev/typings/ISpaceOwner';
import { ISpaceOwner as BaseSepoliaContract, ISpaceOwnerInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/ISpaceOwner';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export type { LocalhostISpaceOwnerBase as ISpaceOwnerBase };
export declare class ISpaceOwnerShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=ISpaceOwnerShim.d.ts.map