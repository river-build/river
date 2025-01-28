/**
 * @group main
 */

import { EpochEncryption } from '../../../mls/epochEncryption'

describe('epochEncryptionTests', () => {
    const encoder = new TextEncoder()
    const secret = encoder.encode('secret')
    const crypto = new EpochEncryption()

    it('canDeriveKeys', async () => {
        const { publicKey, secretKey } = await crypto.deriveKeys(secret)
        expect(publicKey).toBeDefined()
        expect(publicKey.length).toBeGreaterThan(0)
        expect(secretKey).toBeDefined()
        expect(secretKey.length).toBeGreaterThan(0)
    })

    it('canSeal', async () => {
        const keys = await crypto.deriveKeys(secret)
        const plaintext = encoder.encode('plaintext')
        const ciphertext = await crypto.seal(keys, plaintext)
        expect(ciphertext).toBeDefined()
        expect(ciphertext.length).toBeGreaterThan(0)
    })

    it('canUnseal', async () => {
        const keys = await crypto.deriveKeys(secret)
        const plaintext = encoder.encode('plaintext')
        const ciphertext = await crypto.seal(keys, plaintext)
        const unsealed = await crypto.open(keys, ciphertext)
        expect(unsealed).toBeDefined()
        expect(unsealed.length).toBeGreaterThan(0)
        expect(unsealed).toStrictEqual(plaintext)
    })

    it('throwsOnBadCiphertext', async () => {
        const keys = await crypto.deriveKeys(secret)
        const plaintext = encoder.encode('plaintext')
        const ciphertext = await crypto.seal(keys, plaintext)
        const badCiphertext = new Uint8Array(ciphertext)
        badCiphertext[0] = badCiphertext[0] ^ 0xff
        await expect(crypto.open(keys, badCiphertext)).rejects.toThrow()
    })

    it('throwsOnBadKeys', async () => {
        const keys = await crypto.deriveKeys(secret)
        const plaintext = encoder.encode('plaintext')
        const ciphertext = await crypto.seal(keys, plaintext)
        const badKeys = {
            publicKey: new Uint8Array(keys.publicKey),
            secretKey: new Uint8Array(keys.secretKey),
        }
        badKeys.publicKey[0] = badKeys.publicKey[0] ^ 0xff
        await expect(crypto.open(badKeys, ciphertext)).rejects.toThrow()
    })
})
