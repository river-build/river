import { ethers } from 'ethers';
/**
 * SignerContext is a context used for signing events.
 *
 * Two different scenarios are supported:
 *
 * 1. Signing is delegeted from the user key to the device key, and events are signed with device key.
 *    In this case, `signerPrivateKey` should return a device private key, and `delegateSig` should be
 *    a signature of the device public key by the user private key.
 *
 * 2. Events are signed with the user key. In this case, `signerPrivateKey` should return a user private key.
 *    `delegateSig` should be undefined.
 *
 * In both scenarios `creatorAddress` should be set to the user address derived from the user public key.
 *
 * @param signerPrivateKey - a function that returns a private key to sign events
 * @param creatorAddress - a creator, i.e. user address derived from the user public key
 * @param delegateSig - an optional delegate signature
 */
export interface SignerContext {
    signerPrivateKey: () => string;
    creatorAddress: Uint8Array;
    delegateSig?: Uint8Array;
    delegateExpiryEpochMs?: bigint;
}
export declare const checkDelegateSig: (params: {
    delegatePubKey: Uint8Array | string;
    creatorAddress: Uint8Array | string;
    delegateSig: Uint8Array;
    expiryEpochMs: bigint;
}) => void;
export declare function makeSignerContext(primaryWallet: ethers.Signer, delegateWallet: ethers.Wallet, inExpiryEpochMs?: bigint | {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}): Promise<SignerContext>;
//# sourceMappingURL=signerContext.d.ts.map