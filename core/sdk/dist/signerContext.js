import { ecrecover, fromRpcSig, hashPersonalMessage } from '@ethereumjs/util';
import { bin_equal, bin_fromHexString, bin_toHexString, check } from '@river-build/dlog';
import { publicKeyToAddress, publicKeyToUint8Array, riverDelegateHashSrc } from './sign';
import { Err } from '@river-build/proto';
export const checkDelegateSig = (params) => {
    const { delegateSig, expiryEpochMs } = params;
    const delegatePubKey = typeof params.delegatePubKey === 'string'
        ? publicKeyToUint8Array(params.delegatePubKey)
        : params.delegatePubKey;
    const creatorAddress = typeof params.creatorAddress === 'string'
        ? publicKeyToUint8Array(params.creatorAddress)
        : params.creatorAddress;
    const hashSource = riverDelegateHashSrc(delegatePubKey, expiryEpochMs);
    const hash = hashPersonalMessage(Buffer.from(hashSource));
    const { v, r, s } = fromRpcSig('0x' + bin_toHexString(delegateSig));
    const recoveredCreatorPubKey = ecrecover(hash, v, r, s);
    const recoveredCreatorAddress = Uint8Array.from(publicKeyToAddress(recoveredCreatorPubKey));
    check(bin_equal(recoveredCreatorAddress, creatorAddress), 'delegateSig does not match creatorAddress', Err.BAD_DELEGATE_SIG);
};
async function makeRiverDelegateSig(primaryWallet, devicePubKey, expiryEpochMs) {
    if (typeof devicePubKey === 'string') {
        devicePubKey = publicKeyToUint8Array(devicePubKey);
    }
    check(devicePubKey.length === 65, 'Bad public key', Err.BAD_PUBLIC_KEY);
    const hashSrc = riverDelegateHashSrc(devicePubKey, expiryEpochMs);
    const delegateSig = bin_fromHexString(await primaryWallet.signMessage(hashSrc));
    return delegateSig;
}
export async function makeSignerContext(primaryWallet, delegateWallet, inExpiryEpochMs) {
    const expiryEpochMs = inExpiryEpochMs ?? 0n; // todo make expiry required param once implemented down stream HNT-5213
    const delegateExpiryEpochMs = typeof expiryEpochMs === 'bigint' ? expiryEpochMs : makeExpiryEpochMs(expiryEpochMs);
    const delegateSig = await makeRiverDelegateSig(primaryWallet, delegateWallet.publicKey, delegateExpiryEpochMs);
    const creatorAddress = await primaryWallet.getAddress();
    return {
        signerPrivateKey: () => delegateWallet.privateKey.slice(2),
        creatorAddress: bin_fromHexString(creatorAddress),
        delegateSig,
        delegateExpiryEpochMs,
    };
}
function makeExpiryEpochMs({ days, hours, minutes, seconds, }) {
    const MS_PER_SECOND = 1000;
    const MS_PER_MINUTE = MS_PER_SECOND * 60;
    const MS_PER_HOUR = MS_PER_MINUTE * 60;
    const MS_PER_DAY = MS_PER_HOUR * 24;
    let delta = 0;
    if (days) {
        delta += MS_PER_DAY * days;
    }
    if (hours) {
        delta += MS_PER_HOUR * hours;
    }
    if (minutes) {
        delta += MS_PER_MINUTE * minutes;
    }
    if (seconds) {
        delta += MS_PER_SECOND * seconds;
    }
    check(delta != 0, 'Bad expiration, no values were set');
    return BigInt(Date.now() + delta);
}
//# sourceMappingURL=signerContext.js.map