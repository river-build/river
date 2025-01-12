import * as crypto from 'crypto'

// Function to encrypt a message
export function encryptAESCBC(plainText: string, key: string, iv: string): string {
    const cipher = crypto.createCipheriv(
        'aes-256-cbc', // use cbc because it doesn't require a nonce
        Buffer.from(key, 'hex'),
        Buffer.from(iv, 'hex'),
    )
    let encrypted = cipher.update(plainText, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
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
    iv: string,
): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const encrypted = encryptAESCBC(plainText, key, iv)
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

export function generateAESKey(): { key: string; iv: string } {
    const key = crypto.randomBytes(32).toString('hex') // AES-256 requires a 32-byte key
    const iv = crypto.randomBytes(16).toString('hex') // Initialization vector (16 bytes)
    return { key, iv }
}

export function generateAESKeyAsync(): Promise<{ key: string; iv: string }> {
    return new Promise((resolve, reject) => {
        try {
            const { key, iv } = generateAESKey()
            resolve({ key, iv })
        } catch (error) {
            reject(error)
        }
    })
}
