import { protoBase64 } from '@bufbuild/protobuf';
import { bytesToHex, bytesToUtf8, equalsBytes, hexToBytes, utf8ToBytes, } from 'ethereum-cryptography/utils';
export function bin_fromBase64(base64String) {
    return protoBase64.dec(base64String);
}
export function bin_toBase64(uint8Array) {
    return protoBase64.enc(uint8Array);
}
export function bin_fromHexString(hexString) {
    return hexToBytes(hexString);
}
export function bin_toHexString(uint8Array) {
    return bytesToHex(uint8Array);
}
export function bin_fromString(str) {
    return utf8ToBytes(str);
}
export function bin_toString(buf) {
    return bytesToUtf8(buf);
}
export function shortenHexString(s) {
    if (s.startsWith('0x')) {
        return s.length > 12 ? s.slice(0, 6) + '..' + s.slice(-4) : s;
    }
    else {
        return s.length > 10 ? s.slice(0, 4) + '..' + s.slice(-4) : s;
    }
}
export function isHexString(value) {
    if (value.length === 0 || (value.length & 1) !== 0) {
        return false;
    }
    return /^(0x)?[0-9a-fA-F]+$/.test(value);
}
export function bin_equal(a, b) {
    if ((a === undefined || a === null || a.length === 0) &&
        (b === undefined || b === null || b.length === 0)) {
        return true;
    }
    else if (a === undefined || a === null || b === undefined || b === null) {
        return false;
    }
    return equalsBytes(a, b);
}
//# sourceMappingURL=binary.js.map