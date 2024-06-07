import { ethers } from 'ethers';
/**
 * Generates a range of wallets from a seed phrase using ethers HDNode.
 * @param seedPhrase The mnemonic seed phrase.
 * @param start The starting index of the wallet range.
 * @param end The ending index of the wallet range.
 * @returns An array of wallet objects with public and private keys.
 */
export declare function generateWalletsFromSeed(seedPhrase: string, start: number, end: number): ethers.Wallet[];
//# sourceMappingURL=wallets.d.ts.map