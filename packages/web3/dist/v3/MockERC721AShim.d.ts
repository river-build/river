import { MockERC721A as LocalhostContract, MockERC721AInterface as LocalhostInterface } from '@river-build/generated/dev/typings/MockERC721A';
import { MockERC721A as BaseSepoliaContract, MockERC721AInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/MockERC721A';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class MockERC721AShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=MockERC721AShim.d.ts.map