import { IMembershipBase as LocalhostIMembershipBase, IArchitect as LocalhostContract, IArchitectBase as LocalhostISpaceArchitectBase, IArchitectInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IArchitect';
import { IArchitect as BaseSepoliaContract, IArchitectInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/IArchitect';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export type { LocalhostIMembershipBase as IMembershipBase };
export type { LocalhostISpaceArchitectBase as IArchitectBase };
export declare class ISpaceArchitectShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=ISpaceArchitectShim.d.ts.map