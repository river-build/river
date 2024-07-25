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

// Helper function to produce enough key material
function getExtendedKeyMaterial(seedBuffer: Uint8Array, length: number): Uint8Array {
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

// Derive key and IV from seed phrase
export function deriveKeyAndIV(seedPhrase: string): { key: Uint8Array; iv: Uint8Array } {
    const encoder = new TextEncoder()
    const seedBuffer = encoder.encode(seedPhrase)

    const keyMaterial = getExtendedKeyMaterial(seedBuffer, 32 + 12) // 32 bytes for key, 12 bytes for IV

    if (keyMaterial.length < 32 + 12) {
        throw new Error(
            'Key material is too short. Ensure the digest function produces enough bytes.',
        )
    }

    const key = keyMaterial.slice(0, 32) // AES-256 key
    const iv = keyMaterial.slice(32, 32 + 12) // AES-GCM IV

    return { key, iv }
}

// Encrypt function
export async function encryptAesGcm(
    data: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        try {
            if (key.length !== 32) {
                throw new Error('Invalid key length. AES-256-GCM requires a 32-byte key.')
            }

            if (iv.length !== 12) {
                throw new Error('Invalid IV length. AES-256-GCM requires a 12-byte IV.')
            }

            const cipher = crypto.createCipheriv(
                'aes-256-gcm',
                uint8ArrayToBuffer(key),
                uint8ArrayToBuffer(iv),
            )
            const encrypted = Buffer.concat([
                cipher.update(uint8ArrayToBuffer(data)),
                cipher.final(),
            ])

            // Ensure authentication tag is included
            const authTag = cipher.getAuthTag()
            const encryptedWithTag = Buffer.concat([encrypted, authTag])

            resolve(bufferToUint8Array(encryptedWithTag))
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
            if (key.length !== 32) {
                throw new Error('Invalid key length. AES-256-GCM requires a 32-byte key.')
            }

            if (iv.length !== 12) {
                throw new Error('Invalid IV length. AES-256-GCM requires a 12-byte IV.')
            }

            const encryptedBuffer = uint8ArrayToBuffer(encrypted)
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
            resolve(bufferToUint8Array(decrypted))
        } catch (err) {
            reject(err)
        }
    })
}
