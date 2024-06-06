import { BasicRoleInfo, ChannelDetails, ChannelMetadata, Permission, PricingModuleStruct, RoleDetails } from '../ContractTypes';
import { BytesLike, ContractReceipt, ContractTransaction, ethers } from 'ethers';
import { CreateSpaceParams, ISpaceDapp, TransactionOpts, UpdateChannelParams, UpdateRoleParams } from '../ISpaceDapp';
import { IRolesBase } from './IRolesShim';
import { Space } from './Space';
import { SpaceRegistrar } from './SpaceRegistrar';
import { BaseChainConfig } from '../IStaticContractsInfo';
import { WalletLink } from './WalletLink';
import { SpaceInfo } from '../types';
import { IRuleEntitlement } from './index';
import { PricingModules } from './PricingModules';
import { IPrepayShim } from './IPrepayShim';
export declare class SpaceDapp implements ISpaceDapp {
    readonly config: BaseChainConfig;
    readonly provider: ethers.providers.Provider;
    readonly spaceRegistrar: SpaceRegistrar;
    readonly pricingModules: PricingModules;
    readonly walletLink: WalletLink;
    readonly prepay: IPrepayShim;
    constructor(config: BaseChainConfig, provider: ethers.providers.Provider);
    addRoleToChannel(spaceId: string, channelNetworkId: string, roleId: number, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    banWalletAddress(spaceId: string, walletAddress: string, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    unbanWalletAddress(spaceId: string, walletAddress: string, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    walletAddressIsBanned(spaceId: string, walletAddress: string): Promise<boolean>;
    bannedWalletAddresses(spaceId: string): Promise<string[]>;
    createSpace(params: CreateSpaceParams, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    createChannel(spaceId: string, channelName: string, channelNetworkId: string, roleIds: number[], signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    createRole(spaceId: string, roleName: string, permissions: Permission[], users: string[], ruleData: IRuleEntitlement.RuleDataStruct, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    deleteRole(spaceId: string, roleId: number, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    getChannels(spaceId: string): Promise<ChannelMetadata[]>;
    getChannelDetails(spaceId: string, channelNetworkId: string): Promise<ChannelDetails | null>;
    getPermissionsByRoleId(spaceId: string, roleId: number): Promise<Permission[]>;
    getRole(spaceId: string, roleId: number): Promise<RoleDetails | null>;
    getRoles(spaceId: string): Promise<BasicRoleInfo[]>;
    getSpaceInfo(spaceId: string): Promise<SpaceInfo | undefined>;
    updateSpaceName(spaceId: string, name: string, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    private getEntitlementsForPermission;
    /**
     * Checks if user has a wallet entitled to join a space based on the minter role rule entitlements
     */
    getEntitledWalletForJoiningSpace(spaceId: string, rootKey: string, supportedXChainRpcUrls: string[]): Promise<string | undefined>;
    isEntitledToSpace(spaceId: string, user: string, permission: Permission): Promise<boolean>;
    isEntitledToChannel(spaceId: string, channelNetworkId: string, user: string, permission: Permission): Promise<boolean>;
    parseSpaceFactoryError(error: unknown): Error;
    parseSpaceError(spaceId: string, error: unknown): Error;
    /**
     * Attempts to parse an error against all contracts
     * If you're error is not showing any data with this call, make sure the contract is listed either in parseSpaceError or nonSpaceContracts
     * @param args
     * @returns
     */
    parseAllContractErrors(args: {
        spaceId?: string;
        error: unknown;
    }): Error;
    parsePrepayError(error: unknown): Error;
    parseSpaceLogs(spaceId: string, logs: ethers.providers.Log[]): Promise<(ethers.utils.LogDescription | undefined)[]>;
    updateChannel(params: UpdateChannelParams, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    encodedUpdateChannelData(space: Space, params: UpdateChannelParams): Promise<BytesLike[]>;
    updateRole(params: UpdateRoleParams, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    setSpaceAccess(spaceId: string, disabled: boolean, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    /**
     *
     * @param spaceId
     * @param priceInWei
     * @param signer
     */
    setMembershipPrice(spaceId: string, priceInWei: ethers.BigNumberish, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    setMembershipPricingModule(spaceId: string, pricingModule: string, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    setMembershipLimit(spaceId: string, limit: number, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    setMembershipFreeAllocation(spaceId: string, freeAllocation: number, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    prepayMembership(spaceId: string, supply: number, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    getPrepaidMembershipSupply(spaceId: string): Promise<ethers.BigNumber>;
    setChannelAccess(spaceId: string, channelNetworkId: string, disabled: boolean, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<ContractTransaction>;
    getSpaceMembershipTokenAddress(spaceId: string): Promise<string>;
    joinSpace(spaceId: string, recipient: string, signer: ethers.Signer, txnOpts?: TransactionOpts): Promise<{
        issued: true;
        tokenId: string;
    } | {
        issued: false;
        tokenId: undefined;
    }>;
    hasSpaceMembership(spaceId: string, address: string): Promise<boolean>;
    getMembershipSupply(spaceId: string): Promise<{
        totalSupply: number;
    }>;
    getMembershipInfo(spaceId: string): Promise<{
        price: ethers.BigNumber;
        maxSupply: number;
        currency: string;
        feeRecipient: string;
        duration: number;
        totalSupply: number;
        pricingModule: string;
    }>;
    getWalletLink(): WalletLink;
    getSpace(spaceId: string): Space | undefined;
    listPricingModules(): Promise<PricingModuleStruct[]>;
    private encodeUpdateChannelRoles;
    private encodeAddRolesToChannel;
    private encodeRemoveRolesFromChannel;
    createUpdatedEntitlements(space: Space, params: UpdateRoleParams): Promise<IRolesBase.CreateEntitlementStruct[]>;
    getSpaceAddress(receipt: ContractReceipt): string | undefined;
    listenForMembershipEvent(spaceId: string, receiver: string, abortController?: AbortController): Promise<{
        issued: true;
        tokenId: string;
        error?: Error | undefined;
    } | {
        issued: false;
        tokenId: undefined;
        error?: Error | undefined;
    }>;
}
//# sourceMappingURL=SpaceDapp.d.ts.map