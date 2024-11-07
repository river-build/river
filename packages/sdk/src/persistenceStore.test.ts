/**
 * @group main
 */

import { genId } from './id'
import { PersistenceStore } from './persistenceStore'

describe.concurrent('persistenceStoreTests', () => {
    let store!: PersistenceStore
    beforeEach(() => {
        store = new PersistenceStore(genId())
    })
    it('cleartextIsStored', async () => {
        const cleartext = 'decrypted event cleartext goes here'
        const eventId = genId()
        await expect(store.saveCleartext(eventId, cleartext)).resolves.not.toThrow()
        const cacheHit = await store.getCleartext(eventId)
        expect(cacheHit).toBe(cleartext)
    })

    it('returnsUndefinedForMissingCleartext', async () => {
        const cacheMiss = await store.getCleartext(genId())
        expect(cacheMiss).toBeUndefined()
    })
})
