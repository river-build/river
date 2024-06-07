import { IMulticall as LocalhostContract, IMulticallInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IMulticall';
import { IMulticall as BaseSepoliaContract, IMulticallInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/IMulticall';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class IMulticallShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=IMulticallShim.d.ts.map