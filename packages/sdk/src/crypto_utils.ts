// This function is a helper for encrypting and decrypting public content.
// The same IV and key are generated from the seed phrase each time.
// Not intended for protecting sensitive data, but rather for obfuscating content.

import crypto from 'crypto'

function bufferToUint8Array(buffer: Buffer): Uint8Array {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

function uint8ArrayToBuffer(uint8Array: Uint8Array): Buffer {
    return Buffer.from(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength)
}

async function getExtendedKeyMaterial(seedBuffer: Uint8Array, length: number): Promise<Uint8Array> {
    const hash = crypto.createHash('sha256')
    hash.update(uint8ArrayToBuffer(seedBuffer))
    let keyMaterial = bufferToUint8Array(hash.digest())

    while (keyMaterial.length < length) {
        const newHash = crypto.createHash('sha256')
        newHash.update(uint8ArrayToBuffer(keyMaterial))
        keyMaterial = new Uint8Array([...keyMaterial, ...bufferToUint8Array(newHash.digest())])
    }

    return keyMaterial.slice(0, length)
}

export async function deriveKeyAndIV(
    keyPhrase: string | Uint8Array,
): Promise<{ key: Uint8Array; iv: Uint8Array }> {
    let keyBuffer: Uint8Array

    if (typeof keyPhrase === 'string') {
        const encoder = new TextEncoder()
        keyBuffer = encoder.encode(keyPhrase)
    } else {
        keyBuffer = keyPhrase
    }

    const keyMaterial = await getExtendedKeyMaterial(keyBuffer, 32 + 12) // 32 bytes for key, 12 bytes for IV

    const key = keyMaterial.slice(0, 32) // AES-256 key
    const iv = keyMaterial.slice(32, 32 + 12) // AES-GCM IV

    return { key, iv }
}

export async function encryptAesGcm(
    data: Uint8Array,
    key?: Uint8Array,
    iv?: Uint8Array,
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; secretKey: Uint8Array }> {
    if (!data || data.length === 0) {
        throw new Error('Cannot encrypt undefined or empty data')
    }

    if (!key) {
        key = crypto.randomBytes(32)
    } else if (key.length !== 32) {
        throw new Error('Invalid key length. AES-256-GCM requires a 32-byte key.')
    }

    if (!iv) {
        iv = crypto.randomBytes(12)
    } else if (iv.length !== 12) {
        throw new Error('Invalid IV length. AES-256-GCM requires a 12-byte IV.')
    }

    const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        uint8ArrayToBuffer(key),
        uint8ArrayToBuffer(iv),
    )
    const encrypted = Buffer.concat([cipher.update(uint8ArrayToBuffer(data)), cipher.final()])
    const authTag = cipher.getAuthTag()
    const ciphertext = Buffer.concat([encrypted, authTag])

    return { ciphertext: bufferToUint8Array(ciphertext), iv, secretKey: key }
}

export async function decryptAesGcm(
    data: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array,
): Promise<Uint8Array> {
    if (key.length !== 32) {
        throw new Error('Invalid key length. AES-256-GCM requires a 32-byte key.')
    }

    if (iv.length !== 12) {
        throw new Error('Invalid IV length. AES-256-GCM requires a 12-byte IV.')
    }

    const encryptedBuffer = uint8ArrayToBuffer(data)
    const authTag = uint8ArrayToBuffer(encryptedBuffer.slice(encryptedBuffer.length - 16))
    const encryptedContent = uint8ArrayToBuffer(
        encryptedBuffer.slice(0, encryptedBuffer.length - 16),
    )

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        uint8ArrayToBuffer(key),
        uint8ArrayToBuffer(iv),
    )
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(encryptedContent), decipher.final()])
    return bufferToUint8Array(decrypted)
}
