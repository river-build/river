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

/**
 * Serializes an EncryptionResult object into a single Uint8Array
 * @param result - The EncryptionResult object to serialize
 * @returns The serialized Uint8Array
 */
export function serializeAes256GcmEncryptionResult(result: Aes256GcmEncryptionResult): Uint8Array {
    const ivLength = result.iv.length
    const encryptedDataLength = result.encryptedData.length
    const authTagLength = result.authTag.length

    const totalLength = 4 + ivLength + 4 + encryptedDataLength + 4 + authTagLength
    const buffer = new Uint8Array(totalLength)

    let offset = 0

    buffer.set(new Uint8Array(new Uint32Array([ivLength]).buffer), offset)
    offset += 4
    buffer.set(result.iv, offset)
    offset += ivLength

    buffer.set(new Uint8Array(new Uint32Array([encryptedDataLength]).buffer), offset)
    offset += 4
    buffer.set(result.encryptedData, offset)
    offset += encryptedDataLength

    buffer.set(new Uint8Array(new Uint32Array([authTagLength]).buffer), offset)
    offset += 4
    buffer.set(result.authTag, offset)

    return buffer
}

/**
 * Deserializes a Uint8Array into an EncryptionResult object
 * @param buffer - The Uint8Array to deserialize
 * @returns The deserialized EncryptionResult object
 */
export function deserializeAes256GcmEncryptionResult(
    buffer: Uint8Array,
): Aes256GcmEncryptionResult {
    let offset = 0

    const ivLength = new Uint32Array(buffer.slice(offset, offset + 4).buffer)[0]
    offset += 4
    const iv = new Uint8Array(buffer.slice(offset, offset + ivLength))
    offset += ivLength

    const encryptedDataLength = new Uint32Array(buffer.slice(offset, offset + 4).buffer)[0]
    offset += 4
    const encryptedData = new Uint8Array(buffer.slice(offset, offset + encryptedDataLength))
    offset += encryptedDataLength

    const authTagLength = new Uint32Array(buffer.slice(offset, offset + 4).buffer)[0]
    offset += 4
    const authTag = new Uint8Array(buffer.slice(offset, offset + authTagLength))

    return {
        iv,
        encryptedData,
        authTag,
    }
}

export function base64EncodeKey(key: Uint8Array): string {
    return Buffer.from(key).toString('base64')
}

export function base64DecodeKey(key: string): Uint8Array {
    return new Uint8Array(Buffer.from(key, 'base64'))
}
