import { MembershipFacet as LocalhostContract, MembershipFacetInterface as LocalhostInterface } from '@river-build/generated/dev/typings/MembershipFacet';
import { MembershipFacet as BaseSepoliaContract, MembershipFacetInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/MembershipFacet';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class IMembershipShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
    hasMembership(wallet: string): Promise<boolean>;
    listenForMembershipToken(receiver: string, providedAbortController?: AbortController): Promise<{
        issued: true;
        tokenId: string;
    } | {
        issued: false;
        tokenId: undefined;
    }>;
}
//# sourceMappingURL=IMembershipShim.d.ts.map