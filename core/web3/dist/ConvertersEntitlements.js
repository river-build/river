import { ethers } from 'ethers';
import { decodeAbiParameters, parseAbiParameters } from 'viem';
import { encodeEntitlementData } from './entitlement';
const UserAddressesEncoding = 'address[]';
export function decodeRuleData(encodedData) {
    const decodedData = decodeAbiParameters(parseAbiParameters([UserAddressesEncoding]), encodedData);
    let u = [];
    if (decodedData.length) {
        // decoded value is in element 0 of the array
        u = decodedData[0].slice();
    }
    return u;
}
export function encodeUsers(users) {
    const abiCoder = ethers.utils.defaultAbiCoder;
    const encodedData = abiCoder.encode([UserAddressesEncoding], [users]);
    return encodedData;
}
export function decodeUsers(encodedData) {
    const abiCoder = ethers.utils.defaultAbiCoder;
    const decodedData = abiCoder.decode([UserAddressesEncoding], encodedData);
    let u = [];
    if (decodedData.length) {
        // decoded value is in element 0 of the array
        u = decodedData[0];
    }
    return u;
}
export function createUserEntitlementStruct(moduleAddress, users) {
    const data = encodeUsers(users);
    return {
        module: moduleAddress,
        data,
    };
}
export function createRuleEntitlementStruct(moduleAddress, ruleData) {
    const encoded = encodeEntitlementData(ruleData);
    return {
        module: moduleAddress,
        data: encoded,
    };
}
//# sourceMappingURL=ConvertersEntitlements.js.map