import { utils } from 'ethers';
import { nanoid, customAlphabet } from 'nanoid';
import { bin_fromHexString, bin_toHexString, check } from '@river-build/dlog';
import { hashString } from './utils';
export const STREAM_ID_BYTES_LENGTH = 32;
export const STREAM_ID_STRING_LENGTH = STREAM_ID_BYTES_LENGTH * 2;
export const userIdFromAddress = (address) => utils.getAddress(bin_toHexString(address));
// Assuming `userId` is an Ethereum address in string format
export const addressFromUserId = (userId) => {
    // Validate and normalize the address to ensure it's properly checksummed.
    const normalizedAddress = utils.getAddress(userId);
    // Remove the '0x' prefix and convert the hex string to a Uint8Array
    const addressAsBytes = utils.arrayify(normalizedAddress);
    return addressAsBytes;
};
export const streamIdToBytes = (streamId) => bin_fromHexString(streamId);
export const streamIdFromBytes = (bytes) => bin_toHexString(bytes);
export const streamIdAsString = (streamId) => typeof streamId === 'string' ? streamId : streamIdFromBytes(streamId);
export const streamIdAsBytes = (streamId) => typeof streamId === 'string' ? streamIdToBytes(streamId) : streamId;
// User id is an Ethereum address.
// In string form it is 42 characters long, should start with 0x and TODO: have ERC-55 checksum.
// In binary form it is 20 bytes long.
export const isUserId = (userId) => {
    if (userId instanceof Uint8Array) {
        return userId.length === 20;
    }
    else if (typeof userId === 'string') {
        return utils.isAddress(userId);
    }
    return false;
};
// reason about data in logs, tests, etc.
export var StreamPrefix;
(function (StreamPrefix) {
    StreamPrefix["Channel"] = "20";
    StreamPrefix["DM"] = "88";
    StreamPrefix["GDM"] = "77";
    StreamPrefix["Media"] = "ff";
    StreamPrefix["Space"] = "10";
    StreamPrefix["User"] = "a8";
    StreamPrefix["UserDevice"] = "ad";
    StreamPrefix["UserInbox"] = "a1";
    StreamPrefix["UserSettings"] = "a5";
})(StreamPrefix || (StreamPrefix = {}));
const allowedStreamPrefixesVar = Object.values(StreamPrefix);
export const allowedStreamPrefixes = () => allowedStreamPrefixesVar;
const expectedIdentityLenByPrefix = {
    [StreamPrefix.User]: 40,
    [StreamPrefix.UserDevice]: 40,
    [StreamPrefix.UserSettings]: 40,
    [StreamPrefix.UserInbox]: 40,
    [StreamPrefix.Space]: 40,
    [StreamPrefix.Channel]: 62,
    [StreamPrefix.Media]: 62,
    [StreamPrefix.DM]: 62,
    [StreamPrefix.GDM]: 62,
};
export const makeStreamId = (prefix, identity) => {
    identity = identity.toLowerCase();
    if (identity.startsWith('0x')) {
        identity = identity.slice(2);
    }
    check(areValidStreamIdParts(prefix, identity), 'Invalid stream id parts: ' + prefix + ' ' + identity);
    return (prefix + identity).padEnd(STREAM_ID_STRING_LENGTH, '0');
};
export const makeUserStreamId = (userId) => {
    check(isUserId(userId), 'Invalid user id: ' + userId.toString());
    return makeStreamId(StreamPrefix.User, userId instanceof Uint8Array ? userIdFromAddress(userId) : userId);
};
export const makeUserSettingsStreamId = (userId) => {
    check(isUserId(userId), 'Invalid user id: ' + userId.toString());
    return makeStreamId(StreamPrefix.UserSettings, userId instanceof Uint8Array ? userIdFromAddress(userId) : userId);
};
export const makeUserDeviceKeyStreamId = (userId) => {
    check(isUserId(userId), 'Invalid user id: ' + userId.toString());
    return makeStreamId(StreamPrefix.UserDevice, userId instanceof Uint8Array ? userIdFromAddress(userId) : userId);
};
export const makeUserInboxStreamId = (userId) => {
    check(isUserId(userId), 'Invalid user id: ' + userId.toString());
    return makeStreamId(StreamPrefix.UserInbox, userId instanceof Uint8Array ? userIdFromAddress(userId) : userId);
};
export const makeSpaceStreamId = (spaceContractAddress) => makeStreamId(StreamPrefix.Space, spaceContractAddress);
export const makeUniqueChannelStreamId = (spaceId) => {
    // check the prefix
    // replace the first byte with the channel type
    // copy the 20 bytes of the spaceId address
    // fill the rest with random bytes
    return makeStreamId(StreamPrefix.Channel, spaceId.slice(2, 42) + genId(22));
};
export const makeDefaultChannelStreamId = (spaceContractAddressOrId) => {
    if (spaceContractAddressOrId.startsWith(StreamPrefix.Space)) {
        return StreamPrefix.Channel + spaceContractAddressOrId.slice(2);
    }
    // matches code in the smart contract
    return makeStreamId(StreamPrefix.Channel, spaceContractAddressOrId + '0'.repeat(22));
};
export const isDefaultChannelId = (streamId) => {
    const prefix = streamId.slice(0, 2);
    if (prefix !== StreamPrefix.Channel) {
        return false;
    }
    return streamId.endsWith('0'.repeat(22));
};
export const makeUniqueGDMChannelStreamId = () => makeStreamId(StreamPrefix.GDM, genId());
export const makeUniqueMediaStreamId = () => makeStreamId(StreamPrefix.Media, genId());
export const makeDMStreamId = (userIdA, userIdB) => {
    const concatenated = [userIdA, userIdB]
        .map((id) => id.toLowerCase())
        .sort()
        .join('-');
    const hashed = hashString(concatenated);
    return makeStreamId(StreamPrefix.DM, hashed.slice(0, 62));
};
export const isUserStreamId = (streamId) => streamIdAsString(streamId).startsWith(StreamPrefix.User);
export const isSpaceStreamId = (streamId) => streamIdAsString(streamId).startsWith(StreamPrefix.Space);
export const isChannelStreamId = (streamId) => streamIdAsString(streamId).startsWith(StreamPrefix.Channel);
export const isDMChannelStreamId = (streamId) => streamIdAsString(streamId).startsWith(StreamPrefix.DM);
export const isUserDeviceStreamId = (streamId) => streamIdAsString(streamId).startsWith(StreamPrefix.UserDevice);
export const isUserSettingsStreamId = (streamId) => streamIdAsString(streamId).startsWith(StreamPrefix.UserSettings);
export const isMediaStreamId = (streamId) => streamIdAsString(streamId).startsWith(StreamPrefix.Media);
export const isGDMChannelStreamId = (streamId) => streamIdAsString(streamId).startsWith(StreamPrefix.GDM);
export const isUserInboxStreamId = (streamId) => streamIdAsString(streamId).startsWith(StreamPrefix.UserInbox);
export const getUserAddressFromStreamId = (streamId) => {
    const prefix = streamId.slice(0, 2);
    if (prefix !== StreamPrefix.User &&
        prefix !== StreamPrefix.UserDevice &&
        prefix !== StreamPrefix.UserSettings &&
        prefix !== StreamPrefix.UserInbox) {
        throw new Error('Invalid stream id: ' + streamId);
    }
    if (streamId.length != STREAM_ID_STRING_LENGTH || !isLowercaseHex(streamId)) {
        throw new Error('Invalid stream id format: ' + streamId);
    }
    const addressPart = streamId.slice(2, 42);
    const paddingPart = streamId.slice(42);
    if (paddingPart !== '0'.repeat(22)) {
        throw new Error('Invalid stream id padding: ' + streamId);
    }
    return addressFromUserId('0x' + addressPart);
};
export const getUserIdFromStreamId = (streamId) => {
    return userIdFromAddress(getUserAddressFromStreamId(streamId));
};
const areValidStreamIdParts = (prefix, identity) => {
    if (!allowedStreamPrefixesVar.includes(prefix)) {
        return false;
    }
    if (!/^[0-9a-f]*$/.test(identity)) {
        return false;
    }
    if (identity.length != expectedIdentityLenByPrefix[prefix]) {
        // if we're not at expected length, we should have padding
        if (identity.length != 62) {
            return false;
        }
        for (let i = expectedIdentityLenByPrefix[prefix]; i < identity.length; i++) {
            if (identity[i] !== '0') {
                return false;
            }
        }
    }
    return true;
};
export const isValidStreamId = (streamId) => {
    return areValidStreamIdParts(streamId.slice(0, 2), streamId.slice(2));
};
export const checkStreamId = (streamId) => {
    check(isValidStreamId(streamId), 'Invalid stream id: ' + streamId);
};
const hexNanoId = customAlphabet('0123456789abcdef', 62);
export const genId = (size) => {
    return hexNanoId(size);
};
export const genShortId = () => {
    return nanoid(12);
};
export const genLocalId = () => {
    return '~' + nanoid(11);
};
export const genIdBlob = () => bin_fromHexString(hexNanoId(32));
export const isLowercaseHex = (input) => /^[0-9a-f]*$/.test(input);
//# sourceMappingURL=id.js.map