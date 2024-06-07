import { ethers } from 'ethers';
import { IWalletLinkShim } from './WalletLinkShim';
import { arrayify } from 'ethers/lib/utils';
import { WalletAlreadyLinkedError, WalletNotLinkedError } from '../error-types';
export class WalletLink {
    walletLinkShim;
    address;
    constructor(config, provider) {
        this.walletLinkShim = new IWalletLinkShim(config.addresses.spaceFactory, config.contractVersion, provider);
        this.address = config.addresses.spaceFactory;
    }
    async assertNotAlreadyLinked(rootKey, wallet) {
        const rootKeyAddress = await rootKey.getAddress();
        const walletAddress = typeof wallet === 'string' ? wallet : await wallet.getAddress();
        const isLinkedAlready = await this.walletLinkShim.read.checkIfLinked(rootKeyAddress, walletAddress);
        if (isLinkedAlready) {
            throw new WalletAlreadyLinkedError();
        }
        return { rootKeyAddress, walletAddress };
    }
    async assertAlreadyLinked(rootKey, walletAddress) {
        const rootKeyAddress = await rootKey.getAddress();
        const isLinkedAlready = await this.walletLinkShim.read.checkIfLinked(rootKeyAddress, walletAddress);
        if (!isLinkedAlready) {
            throw new WalletNotLinkedError();
        }
        return { rootKeyAddress, walletAddress };
    }
    generateRootKeySignatureForWallet({ rootKey, walletAddress, rootKeyNonce, }) {
        return rootKey.signMessage(packAddressWithNonce(walletAddress, rootKeyNonce));
    }
    generateWalletSignatureForRootKey({ wallet, rootKeyAddress, rootKeyNonce, }) {
        return wallet.signMessage(packAddressWithNonce(rootKeyAddress, rootKeyNonce));
    }
    async generateLinkCallerData(rootKey, wallet) {
        const { rootKeyAddress, walletAddress } = await this.assertNotAlreadyLinked(rootKey, wallet);
        const nonce = await this.walletLinkShim.read.getLatestNonceForRootKey(rootKeyAddress);
        const rootKeySignature = await rootKey.signMessage(packAddressWithNonce(walletAddress, nonce));
        const rootKeyData = {
            addr: rootKeyAddress,
            signature: rootKeySignature,
        };
        return { rootKeyData, nonce };
    }
    async generateLinkWalletData(rootKey, wallet) {
        const { rootKeyAddress, walletAddress } = await this.assertNotAlreadyLinked(rootKey, wallet);
        const nonce = await this.walletLinkShim.read.getLatestNonceForRootKey(rootKeyAddress);
        // sign root key with new wallet address
        const rootKeySignature = await this.generateRootKeySignatureForWallet({
            rootKey,
            walletAddress,
            rootKeyNonce: nonce,
        });
        // sign new wallet with root key address
        const walletSignature = await this.generateWalletSignatureForRootKey({
            wallet,
            rootKeyAddress,
            rootKeyNonce: nonce,
        });
        const rootKeyData = {
            addr: rootKeyAddress,
            signature: rootKeySignature,
        };
        const walletData = {
            addr: walletAddress,
            signature: walletSignature,
        };
        return { rootKeyData, walletData, nonce };
    }
    /**
     * Link a wallet to the root key with the wallet as the caller
     * @param rootKey
     * @param wallet
     */
    async linkCallerToRootKey(rootKey, wallet) {
        const { rootKeyData, nonce } = await this.generateLinkCallerData(rootKey, wallet);
        // msg.sender = new wallet
        return this.walletLinkShim.write(wallet).linkCallerToRootKey(rootKeyData, nonce);
    }
    /**
     * Link a wallet to the root key with the root key as the caller
     *
     * @param wallet
     * @param rootKey
     * @returns
     */
    async linkWalletToRootKey(rootKey, wallet) {
        const { walletData, rootKeyData, nonce } = await this.generateLinkWalletData(rootKey, wallet);
        // msg.sender = root key
        return this.walletLinkShim
            .write(rootKey)
            .linkWalletToRootKey(walletData, rootKeyData, nonce);
    }
    async encodeLinkCallerToRootKey(rootKey, wallet) {
        const { rootKeyData, nonce } = await this.generateLinkCallerData(rootKey, wallet);
        return this.walletLinkShim.interface.encodeFunctionData('linkCallerToRootKey', [
            rootKeyData,
            nonce,
        ]);
    }
    async encodeLinkWalletToRootKey(rootKey, wallet) {
        const { walletData, rootKeyData, nonce } = await this.generateLinkWalletData(rootKey, wallet);
        return this.walletLinkShim.interface.encodeFunctionData('linkWalletToRootKey', [
            walletData,
            rootKeyData,
            nonce,
        ]);
    }
    parseError(error) {
        return this.walletLinkShim.parseError(error);
    }
    async getLinkedWallets(rootKey) {
        return this.walletLinkShim.read.getWalletsByRootKey(rootKey);
    }
    getRootKeyForWallet(wallet) {
        return this.walletLinkShim.read.getRootKeyForWallet(wallet);
    }
    async checkIfLinked(rootKey, wallet) {
        const rootKeyAddress = await rootKey.getAddress();
        return this.walletLinkShim.read.checkIfLinked(rootKeyAddress, wallet);
    }
    async generateRemoveLinkData(rootKey, walletAddress) {
        const { rootKeyAddress } = await this.assertAlreadyLinked(rootKey, walletAddress);
        const nonce = await this.walletLinkShim.read.getLatestNonceForRootKey(rootKeyAddress);
        const rootKeySignature = await rootKey.signMessage(packAddressWithNonce(walletAddress, nonce));
        return { rootKeyAddress, rootKeySignature, nonce };
    }
    async removeLink(rootKey, walletAddress) {
        const { rootKeyAddress, rootKeySignature, nonce } = await this.generateRemoveLinkData(rootKey, walletAddress);
        return await this.walletLinkShim.write(rootKey).removeLink(walletAddress, {
            addr: rootKeyAddress,
            signature: rootKeySignature,
        }, nonce);
    }
    async encodeRemoveLink(rootKey, walletAddress) {
        const { rootKeyAddress, rootKeySignature, nonce } = await this.generateRemoveLinkData(rootKey, walletAddress);
        return this.walletLinkShim.interface.encodeFunctionData('removeLink', [
            walletAddress,
            {
                addr: rootKeyAddress,
                signature: rootKeySignature,
            },
            nonce,
        ]);
    }
    getInterface() {
        return this.walletLinkShim.interface;
    }
}
function packAddressWithNonce(address, nonce) {
    const abi = ethers.utils.defaultAbiCoder;
    const packed = abi.encode(['address', 'uint256'], [address, nonce.toNumber()]);
    const hash = ethers.utils.keccak256(packed);
    return arrayify(hash);
}
//# sourceMappingURL=WalletLink.js.map