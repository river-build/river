import { BigNumber, BigNumberish, ethers } from 'ethers';
import { BasicRoleInfo, Permission, Address } from './ContractTypes';
import { BaseChainConfig } from './IStaticContractsInfo';
import { ISpaceDapp } from './ISpaceDapp';
import { IArchitectBase as ISpaceArchitectBaseV3, IMembershipBase as IMembershipBaseV3 } from './v3';
export declare function mintMockNFT(provider: ethers.providers.Provider, config: BaseChainConfig, fromWallet: ethers.Wallet, toAddress: string): Promise<ethers.ContractTransaction>;
export declare function balanceOfMockNFT(config: BaseChainConfig, provider: ethers.providers.Provider, address: Address): Promise<BigNumber>;
export declare function getTestGatingNftAddress(_chainId: number): Promise<`0x${string}`>;
export declare function getFilteredRolesFromSpace(spaceDapp: ISpaceDapp, spaceNetworkId: string): Promise<BasicRoleInfo[]>;
export declare function isRoleIdInArray(roleIds: BigNumber[] | readonly bigint[], roleId: BigNumberish | bigint): boolean;
type CreateMembershipStructArgs = {
    name: string;
    permissions: Permission[];
    requirements: ISpaceArchitectBaseV3.MembershipRequirementsStruct;
} & Omit<IMembershipBaseV3.MembershipStruct, 'symbol' | 'price' | 'maxSupply' | 'duration' | 'currency' | 'feeRecipient' | 'freeAllocation' | 'pricingModule'>;
export declare function createMembershipStruct(args: CreateMembershipStructArgs): ISpaceArchitectBaseV3.MembershipStruct;
export {};
//# sourceMappingURL=ContractHelpers.d.ts.map