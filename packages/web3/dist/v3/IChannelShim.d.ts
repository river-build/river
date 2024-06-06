import { IChannel as LocalhostContract, IChannelBase as LocalhostIChannelBase, IChannelInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IChannel';
import { IChannel as BaseSepoliaContract, IChannelInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/IChannel';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export type { LocalhostIChannelBase as IChannelBase };
export declare class IChannelShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=IChannelShim.d.ts.map