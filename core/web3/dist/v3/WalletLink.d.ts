import { ContractTransaction, ethers } from 'ethers';
import { BaseChainConfig } from '../IStaticContractsInfo';
import { Address } from '../ContractTypes';
export declare class WalletLink {
    private readonly walletLinkShim;
    address: Address;
    constructor(config: BaseChainConfig, provider: ethers.providers.Provider | undefined);
    private assertNotAlreadyLinked;
    private assertAlreadyLinked;
    private generateRootKeySignatureForWallet;
    private generateWalletSignatureForRootKey;
    private generateLinkCallerData;
    private generateLinkWalletData;
    /**
     * Link a wallet to the root key with the wallet as the caller
     * @param rootKey
     * @param wallet
     */
    linkCallerToRootKey(rootKey: ethers.Signer, wallet: ethers.Signer): Promise<ContractTransaction>;
    /**
     * Link a wallet to the root key with the root key as the caller
     *
     * @param wallet
     * @param rootKey
     * @returns
     */
    linkWalletToRootKey(rootKey: ethers.Signer, wallet: ethers.Signer): Promise<ContractTransaction>;
    encodeLinkCallerToRootKey(rootKey: ethers.Signer, wallet: Address): Promise<string>;
    encodeLinkWalletToRootKey(rootKey: ethers.Signer, wallet: ethers.Signer): Promise<string>;
    parseError(error: any): Error;
    getLinkedWallets(rootKey: string): Promise<string[]>;
    getRootKeyForWallet(wallet: string): Promise<string>;
    checkIfLinked(rootKey: ethers.Signer, wallet: string): Promise<boolean>;
    private generateRemoveLinkData;
    removeLink(rootKey: ethers.Signer, walletAddress: string): Promise<ContractTransaction>;
    encodeRemoveLink(rootKey: ethers.Signer, walletAddress: string): Promise<string>;
    getInterface(): import("@river-build/generated/dev/typings/IWalletLink").IWalletLinkInterface | import("@river-build/generated/v3/typings/IWalletLink").IWalletLinkInterface;
}
//# sourceMappingURL=WalletLink.d.ts.map