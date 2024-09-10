/**
 * @group main
 */

import { Account } from '@matrix-org/olm'
import { CryptoStore } from '../cryptoStore'
import { EncryptionDelegate } from '../encryptionDelegate'
import { EncryptionDevice } from '../encryptionDevice'
import { UserDevice } from '../olmLib'
import { nanoid } from 'nanoid'

describe('ClientStoreTests', () => {
    let store: CryptoStore
    beforeEach(() => {
        const name = nanoid()
        const userId = nanoid()
        store = new CryptoStore(name, userId)
    })

    test('Add devices to store', async () => {
        const userId = nanoid()
        const userDevice: UserDevice = {
            deviceKey: nanoid(),
            fallbackKey: nanoid(),
        }
        await store.saveUserDevices(userId, [userDevice])
    })

    test('Fetch devices from store', async () => {
        const userId = nanoid()
        const devices = [...Array(10).keys()].map(() => {
            const userDevice: UserDevice = {
                deviceKey: nanoid(),
                fallbackKey: nanoid(),
            }
            return userDevice
        })

        await store.saveUserDevices(userId, devices)

        const fetchedDevices = await store.getUserDevices(userId)
        expect(fetchedDevices.length).toEqual(10)
        expect(fetchedDevices.sort((a, b) => a.deviceKey.localeCompare(b.deviceKey))).toEqual(
            devices.sort((a, b) => a.deviceKey.localeCompare(b.deviceKey)),
        )
    })

    test('Expired devices are not fetched', async () => {
        const userId = nanoid()
        const userDevice: UserDevice = {
            deviceKey: nanoid(),
            fallbackKey: nanoid(),
        }
        const expirationMs = 500
        await store.saveUserDevices(userId, [userDevice], expirationMs)

        const devicesBeforeTimeout = await store.getUserDevices(userId)
        expect(devicesBeforeTimeout.length).toEqual(1)

        await new Promise((resolve) => setTimeout(resolve, expirationMs + 100))
        const devicesAfterTimeout = await store.getUserDevices(userId)
        expect(devicesAfterTimeout.length).toEqual(0)
    })

    test('Adding the same device id twice updates the expiration time', async () => {
        const userId = nanoid()
        const userDevice: UserDevice = {
            deviceKey: nanoid(),
            fallbackKey: nanoid(),
        }
        const expirationMs = 500
        await store.saveUserDevices(userId, [userDevice], expirationMs)
        await new Promise((resolve) => setTimeout(resolve, expirationMs / 2))
        await store.saveUserDevices(userId, [userDevice], expirationMs * 2)

        const deviceCountAfterTwoSaves = await store.deviceRecordCount()
        expect(deviceCountAfterTwoSaves).toEqual(1)

        await new Promise((resolve) => setTimeout(resolve, expirationMs + 100))
        const devicesAfterTimeout = await store.getUserDevices(userId)
        expect(devicesAfterTimeout.length).toEqual(1)
        expect(devicesAfterTimeout[0].deviceKey).toEqual(userDevice.deviceKey)
    })

    // This test is slightly articifical, but the idea is to make sure
    // that expired devices are always purged on init to make sure that the DB
    // doesn't just keep growing. We still need to remember to call initialize()
    test('Expired devices are purged on init', async () => {
        const userId = nanoid()
        const userDevice: UserDevice = {
            deviceKey: nanoid(),
            fallbackKey: nanoid(),
        }
        const expirationMs = 500
        await store.saveUserDevices(userId, [userDevice], expirationMs)

        const countBeforeTimeout = await store.deviceRecordCount()
        expect(countBeforeTimeout).toEqual(1)
        await new Promise((resolve) => setTimeout(resolve, expirationMs + 100))
        const countAfterTimeout = await store.deviceRecordCount()
        expect(countAfterTimeout).toEqual(1)

        await store.initialize()
        const countAfterInitialize = await store.deviceRecordCount()
        expect(countAfterInitialize).toEqual(0)
    })
})

describe('EncryptionDevice import/export', () => {
    const userId = nanoid()

    let store: CryptoStore
    let device: EncryptionDevice
    let delegate: EncryptionDelegate

    beforeEach(async () => {
        store = new CryptoStore('test', userId)
        await store.initialize()
        delegate = new EncryptionDelegate()
        device = new EncryptionDevice(delegate, store)
        await device.init()
    })

    test('Export and import device state', async () => {
        // Generate some initial state
        const initialCurve25519Key = device.deviceCurve25519Key

        // Export the device state
        const exportedDevice = await device.exportDevice()

        // Create a new device and import the state
        const newDevice = new EncryptionDevice(delegate, store)
        await newDevice.init({ fromExportedDevice: exportedDevice })

        // Check that the imported state matches the original
        expect(newDevice.deviceCurve25519Key).toEqual(initialCurve25519Key)
        expect(newDevice.pickleKey).toEqual(device.pickleKey)
        expect(newDevice.fallbackKey).toEqual(device.fallbackKey)
    })

    test('initialize e2ekeys', async () => {
        // this is roughly what i guessed would've been the error...
        // i don't think the error is in here
        for (let i = 0; i < 10000; i++) {
            const account = delegate.createAccount()
            account.create()
            const keys = JSON.parse(account.identity_keys())
            account.generate_fallback_key()
            const keys2 = JSON.parse(account.identity_keys())
            expect(keys).toEqual(keys2)
        }
    })

    test('encrypt many many messages', async () => {
        const encryptionDevice = new EncryptionDevice(delegate, store)
        await encryptionDevice.init()

        for (let i = 0; i < 1000; i++) {
            const anotherDevice = new EncryptionDevice(delegate, store)
            await anotherDevice.init()
            const ciphertext = await encryptionDevice.encryptUsingFallbackKey(
                anotherDevice.deviceCurve25519Key!,
                anotherDevice.fallbackKey.key,
                'hello',
            )
            const plaintext = await anotherDevice.decryptMessage(
                ciphertext.body,
                encryptionDevice.deviceCurve25519Key!,
            )

            expect(plaintext).toEqual('hello')
        }
    })

    test('decrypt many many messages', async () => {
        const encryptionDevice = new EncryptionDevice(delegate, store)
        await encryptionDevice.init()

        for (let i = 0; i < 1000; i++) {
            const anotherDevice = new EncryptionDevice(delegate, store)
            await anotherDevice.init()
            const ciphertext = await anotherDevice.encryptUsingFallbackKey(
                encryptionDevice.deviceCurve25519Key!,
                encryptionDevice.fallbackKey.key,
                'hello',
            )
            const plaintext = await encryptionDevice.decryptMessage(
                ciphertext.body,
                anotherDevice.deviceCurve25519Key!,
            )

            expect(plaintext).toEqual('hello')
        }
    })
})
