// This function is a helper for encrypting and decrypting public content.
// The same IV and key are generated from the seed phrase each time.
// Not intended for protecting sensitive data, but rather for obfuscating content.
export async function deriveKeyAndIV(
    seedPhrase: string,
): Promise<{ key: CryptoKey; iv: Uint8Array }> {
    const encoder = new TextEncoder()

    // Convert seed phrase to ArrayBuffer
    const seedBuffer = encoder.encode(seedPhrase)

    // Derive a secret key using PBKDF2
    const salt = await generateFixedSalt(seedPhrase)
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        seedBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey'],
    )

    const secretKey = await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt'],
    )

    // Derive a fixed IV (e.g., first 12 bytes of SHA-256 hash of the seed phrase)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', seedBuffer)
    const iv = new Uint8Array(hashBuffer).slice(0, 12)

    return { key: secretKey, iv: iv }
}

export async function encryptAesGcm(
    plaintext: string,
    key: CryptoKey,
    iv: Uint8Array,
): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        data,
    )

    return encrypted
}

export async function decryptAesGcm(
    encrypted: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array,
): Promise<string> {
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        encrypted,
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
}

async function generateFixedSalt(seedPhrase: string): Promise<Uint8Array> {
    const encoder = new TextEncoder()
    const seedBuffer = encoder.encode(seedPhrase)

    // Generate a fixed salt (e.g., SHA-256 hash of the seed phrase)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', seedBuffer)
    return new Uint8Array(hashBuffer).slice(0, 16) // Use the first 16 bytes as the salt
}
