// This function is a helper for encrypting and decrypting public content.
// The same IV and key are generated from the seed phrase each time.
// Not intended for protecting sensitive data, but rather for obfuscating content.

import crypto from 'crypto'

// Utility functions
function bufferToUint8Array(buffer: Buffer): Uint8Array {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

function uint8ArrayToBuffer(uint8Array: Uint8Array): Buffer {
    return Buffer.from(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength)
}

// Generate fixed salt
async function generateFixedSalt(seedPhrase: string): Promise<Uint8Array> {
    const encoder = new TextEncoder()
    const seedBuffer = encoder.encode(seedPhrase)

    const hashBuffer = await digest('SHA-256', seedBuffer)
    return new Uint8Array(hashBuffer).slice(0, 16) // Use the first 16 bytes as the salt
}

// Derive key and IV
export async function deriveKeyAndIV(
    seedPhrase: string,
): Promise<{ key: Uint8Array; iv: Uint8Array }> {
    const encoder = new TextEncoder()
    const seedBuffer = encoder.encode(seedPhrase)

    const salt = await generateFixedSalt(seedPhrase)
    const keyMaterialBuffer = await pbkdf2(seedBuffer, salt, 100000, 44) // Derive 44 bytes of key material

    if (keyMaterialBuffer.length < 44) {
        throw new Error(
            'Key material is too short. Ensure the digest function produces enough bytes.',
        )
    }

    const key = keyMaterialBuffer.slice(0, 32) // AES-256 key
    const iv = keyMaterialBuffer.slice(32, 44) // Next 12 bytes as IV

    if (iv.length !== 12) throw new Error('Derived IV is not 12 bytes long.')
    return { key, iv }
}

// PBKDF2 function
async function pbkdf2(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(
            uint8ArrayToBuffer(password),
            uint8ArrayToBuffer(salt),
            iterations,
            keyLength,
            'sha256',
            (err, derivedKey) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(bufferToUint8Array(derivedKey))
                }
            },
        )
    })
}

// Encrypt function
export async function encryptAesGcm(
    data: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        try {
            const cipher = crypto.createCipheriv(
                'aes-256-gcm',
                uint8ArrayToBuffer(key),
                uint8ArrayToBuffer(iv),
            )
            const encrypted = Buffer.concat([
                cipher.update(uint8ArrayToBuffer(data)),
                cipher.final(),
            ])
            resolve(bufferToUint8Array(encrypted))
        } catch (err) {
            reject(err)
        }
    })
}

// Decrypt function
export async function decryptAesGcm(
    encrypted: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                uint8ArrayToBuffer(key),
                uint8ArrayToBuffer(iv),
            )
            const decrypted = Buffer.concat([
                decipher.update(uint8ArrayToBuffer(encrypted)),
                decipher.final(),
            ])
            resolve(bufferToUint8Array(decrypted))
        } catch (err) {
            reject(err)
        }
    })
}

// Digest function
async function digest(algorithm: string, data: Uint8Array): Promise<Buffer> {
    return new Promise((resolve) => {
        const hash = crypto.createHash(algorithm)
        hash.update(uint8ArrayToBuffer(data))
        resolve(hash.digest())
    })
}
