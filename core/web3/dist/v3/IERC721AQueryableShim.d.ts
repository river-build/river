import { IERC721AQueryable as LocalhostContract, IERC721AQueryableInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IERC721AQueryable';
import { IERC721AQueryable as BaseSepoliaContract, IERC721AQueryableInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/IERC721AQueryable';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class IERC721AQueryableShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=IERC721AQueryableShim.d.ts.map