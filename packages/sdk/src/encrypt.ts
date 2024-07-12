import * as crypto from 'crypto'

export interface Aes256GcmEncryptionResult {
    iv: Uint8Array
    encryptedData: Uint8Array
    authTag: Uint8Array
}

export function aes256GcmEncrypt(data: Uint8Array, key: Uint8Array): Aes256GcmEncryptionResult {
    const iv = crypto.randomBytes(12) // AES-GCM requires a 12-byte IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    const encrypted = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()])
    const authTag = cipher.getAuthTag()

    return {
        iv: new Uint8Array(iv),
        encryptedData: new Uint8Array(encrypted),
        authTag: new Uint8Array(authTag),
    }
}

export function aes256GcmDecrypt(
    encryptedData: Aes256GcmEncryptionResult,
    key: Uint8Array,
): Uint8Array {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encryptedData.iv))
    decipher.setAuthTag(Buffer.from(encryptedData.authTag))

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData.encryptedData)),
        decipher.final(),
    ])
    return new Uint8Array(decrypted)
}

export function base64EncodeKey(key: Uint8Array): string {
    return Buffer.from(key).toString('base64')
}

export function base64DecodeKey(key: string): Uint8Array {
    return new Uint8Array(Buffer.from(key, 'base64'))
}
