import { keccak256 } from 'ethereum-cryptography/keccak';
import { bin_toHexString, isJest, isNodeEnv } from '@river-build/dlog';
import { isBrowser, isNode } from 'browser-or-node';
export function unsafeProp(prop) {
    return prop === '__proto__' || prop === 'prototype' || prop === 'constructor';
}
export function safeSet(obj, prop, value) {
    if (unsafeProp(prop)) {
        throw new Error('Trying to modify prototype or constructor');
    }
    obj[prop] = value;
}
export function promiseTry(fn) {
    return Promise.resolve(fn());
}
export function hashString(string) {
    const encoded = new TextEncoder().encode(string);
    const buffer = keccak256(encoded);
    return bin_toHexString(buffer);
}
export function usernameChecksum(username, streamId) {
    return hashString(`${username.toLowerCase()}:${streamId}`);
}
export function isIConnectError(obj) {
    return obj !== null && typeof obj === 'object' && 'code' in obj && typeof obj.code === 'number';
}
export function isTestEnv() {
    return Boolean(process.env.JEST_WORKER_ID);
}
export class MockEntitlementsDelegate {
    async isEntitled(_spaceId, _channelId, _user, _permission) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return true;
    }
}
export function removeCommon(x, y) {
    const result = [];
    let i = 0;
    let j = 0;
    while (i < x.length && j < y.length) {
        if (x[i] < y[j]) {
            result.push(x[i]);
            i++;
        }
        else if (x[i] > y[j]) {
            j++;
        }
        else {
            i++;
            j++;
        }
    }
    // Append remaining elements from x
    if (i < x.length) {
        result.push(...x.slice(i));
    }
    return result;
}
export function getEnvVar(key, defaultValue = '') {
    if (isNode || isJest()) {
        return process.env[key] ?? defaultValue;
    }
    if (isBrowser) {
        if (localStorage != undefined) {
            return localStorage.getItem(key) ?? defaultValue;
        }
    }
    return defaultValue;
}
export function isMobileSafari() {
    if (isNodeEnv()) {
        return false;
    }
    if (!navigator || !navigator.userAgent) {
        return false;
    }
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
export function isBaseUrlIncluded(baseUrls, fullUrl) {
    const urlObj = new URL(fullUrl);
    const fullUrlBase = `${urlObj.protocol}//${urlObj.host}`;
    return baseUrls.some((baseUrl) => fullUrlBase === baseUrl.trim());
}
//# sourceMappingURL=utils.js.map