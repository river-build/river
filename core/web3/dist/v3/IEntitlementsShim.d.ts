import { IEntitlementsManager as LocalhostContract, IEntitlementsManagerBase as LocalhostIEntitlementsBase, IEntitlementsManagerInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IEntitlementsManager';
import { IEntitlementsManager as BaseSepoliaContract, IEntitlementsManagerInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/IEntitlementsManager';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export type { LocalhostIEntitlementsBase as IEntitlementsBase };
export declare class IEntitlementsShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=IEntitlementsShim.d.ts.map