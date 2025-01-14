import * as crypto from 'crypto'

// Function to encrypt a message
export function encryptAESCBC(plainText: string, key: string): { ciphertext: string; iv: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
        'aes-256-cbc', // use cbc because it doesn't require a nonce
        Buffer.from(key, 'hex'),
        iv,
    )
    let encrypted = cipher.update(plainText, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return { ciphertext: encrypted, iv: iv.toString('hex') }
}

export function decryptAESCBC(encryptedText: string, key: string, iv: string): string {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc', // use cbc because it doesn't require a nonce
        Buffer.from(key, 'hex'),
        Buffer.from(iv, 'hex'),
    )
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

// not actually async, just wrapped in a promise
export async function encryptAESCBCAsync(
    plainText: string,
    key: string,
): Promise<{ ciphertext: string; iv: string }> {
    return new Promise((resolve, reject) => {
        try {
            const encrypted = encryptAESCBC(plainText, key)
            resolve(encrypted)
        } catch (error) {
            reject(error)
        }
    })
}

// not actually async, just wrapped in a promise
export async function decryptAESCBCAsync(
    encryptedText: string,
    key: string,
    iv: string,
): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const decrypted = decryptAESCBC(encryptedText, key, iv)
            resolve(decrypted)
        } catch (error) {
            reject(error)
        }
    })
}

export function generateAESKey(): { key: string } {
    const key = crypto.randomBytes(32).toString('hex') // AES-256 requires a 32-byte key
    return { key }
}

export function generateAESKeyAsync(): Promise<{ key: string }> {
    return new Promise((resolve, reject) => {
        try {
            const { key } = generateAESKey()
            resolve({ key })
        } catch (error) {
            reject(error)
        }
    })
}
