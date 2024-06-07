import { IWalletLink as LocalhostContract, IWalletLinkInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IWalletLink';
import { IWalletLink as BaseSepoliaContract, IWalletLinkInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/IWalletLink';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class IWalletLinkShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=WalletLinkShim.d.ts.map