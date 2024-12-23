/**
 * @group main
 */

import { beforeEach, describe, it } from 'vitest'
import { DexieGroupStateStorage, InMemoryGroupStateStorage } from '../../mls/groupStateStorage'
import { randomBytes } from 'ethers/lib/utils'

const encoder = new TextEncoder()

describe('inMemory', () => {
    let storage: InMemoryGroupStateStorage
    const groupId = encoder.encode('group-id')
    const data = encoder.encode('data')
    const epochId = 1n
    const epochData = encoder.encode('epoch-data')

    beforeEach(() => {
        storage = new InMemoryGroupStateStorage()
    })

    it('shouldStartEmpty', async () => {
        await expect(storage.state(groupId)).resolves.toBeUndefined()
        await expect(storage.epoch(groupId, epochId)).resolves.toBeUndefined()
        await expect(storage.maxEpochId(groupId)).resolves.toBeUndefined()
    })

    it('shouldBePossibleToAddGroup', async () => {
        await storage.write(groupId, data, [], [])

        await expect(storage.state(groupId)).resolves.toStrictEqual(data)
    })

    it('shouldBePossibleToAddEpoch', async () => {
        await storage.write(groupId, data, [{ id: epochId, data: epochData }], [])

        await expect(storage.epoch(groupId, epochId)).resolves.toStrictEqual(epochData)
        await expect(storage.epoch(groupId, 2n)).resolves.toBeUndefined()
    })

    it('shouldBePossibleToUpdateEpoch', async () => {
        await storage.write(groupId, data, [{ id: epochId, data: epochData }], [])
        const epochData2 = encoder.encode('epoch-data-2')
        await storage.write(groupId, data, [], [{ id: epochId, data: epochData2 }])

        await expect(storage.epoch(groupId, epochId)).resolves.toStrictEqual(epochData2)
    })

    it('shouldBePossibleToGetMaxEpoch', async () => {
        await expect(storage.maxEpochId(groupId)).resolves.toBeUndefined()
        await storage.write(groupId, data, [{ id: epochId, data: epochData }], [])
        await expect(storage.maxEpochId(groupId)).resolves.toBe(epochId)
        await storage.write(groupId, data, [{ id: epochId + 1n, data: epochData }], [])
        await expect(storage.maxEpochId(groupId)).resolves.toBe(epochId + 1n)
    })

    it('shouldTrimOldEpochs', async () => {
        await storage.write(groupId, data, [{ id: 1n, data: epochData }], [])
        await storage.write(groupId, data, [{ id: 2n, data: epochData }], [])
        await storage.write(groupId, data, [{ id: 3n, data: epochData }], [])
        await storage.write(groupId, data, [{ id: 4n, data: epochData }], [])

        await expect(storage.epoch(groupId, 1n)).resolves.toBeUndefined()
        await expect(storage.epoch(groupId, 2n)).resolves.toStrictEqual(epochData)
    })
})

describe('dexie', () => {
    let storage: DexieGroupStateStorage
    const groupId = encoder.encode('group-id')
    const data = encoder.encode('data')
    const epochId = 1n
    const epochData = encoder.encode('epoch-data')

    beforeEach(() => {
        const randomDeviceKey = randomBytes(16)
        storage = new DexieGroupStateStorage(randomDeviceKey)
    })

    it('shouldStartEmpty', async () => {
        await expect(storage.state(groupId)).resolves.toBeUndefined()
        await expect(storage.epoch(groupId, epochId)).resolves.toBeUndefined()
        await expect(storage.maxEpochId(groupId)).resolves.toBeUndefined()
    })

    it('shouldBePossibleToAddGroup', async () => {
        await storage.write(groupId, data, [], [])

        await expect(storage.state(groupId)).resolves.toStrictEqual(data)
    })

    it('shouldBePossibleToAddEpoch', async () => {
        await storage.write(groupId, data, [{ id: epochId, data: epochData }], [])

        await expect(storage.epoch(groupId, epochId)).resolves.toStrictEqual(epochData)
        await expect(storage.epoch(groupId, 2n)).resolves.toBeUndefined()
    })

    it('shouldBePossibleToUpdateEpoch', async () => {
        await storage.write(groupId, data, [{ id: epochId, data: epochData }], [])
        const epochData2 = encoder.encode('epoch-data-2')
        await storage.write(groupId, data, [], [{ id: epochId, data: epochData2 }])

        await expect(storage.epoch(groupId, epochId)).resolves.toStrictEqual(epochData2)
    })

    it('shouldBePossibleToGetMaxEpoch', async () => {
        await expect(storage.maxEpochId(groupId)).resolves.toBeUndefined()
        await storage.write(groupId, data, [{ id: epochId, data: epochData }], [])
        await expect(storage.maxEpochId(groupId)).resolves.toBe(epochId)
        await storage.write(groupId, data, [{ id: epochId + 1n, data: epochData }], [])
        await expect(storage.maxEpochId(groupId)).resolves.toBe(epochId + 1n)
    })

    it('shouldTrimOldEpochs', async () => {
        await storage.write(groupId, data, [{ id: 1n, data: epochData }], [])
        await storage.write(groupId, data, [{ id: 2n, data: epochData }], [])
        await storage.write(groupId, data, [{ id: 3n, data: epochData }], [])
        await storage.write(groupId, data, [{ id: 4n, data: epochData }], [])

        await expect(storage.epoch(groupId, 1n)).resolves.toBeUndefined()
        await expect(storage.epoch(groupId, 2n)).resolves.toStrictEqual(epochData)
    })
})
