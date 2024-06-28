/**
 * @group main
 */

import { EntitlementCache, Keyable } from '../src/EntitlementCache'

class Key implements Keyable {
    private readonly key: string
    toKey(): string {
        return this.key
    }
    constructor(key: string) {
        this.key = key
    }
}

describe('EntitlementsCacheTests', () => {
    test('caches repeat positive keys', async () => {
        const cache = new EntitlementCache<Key, Boolean>({
            positiveCacheTTLSeconds: 10,
            negativeCacheTTLSeconds: 10,
        })

        const onMiss = (key: Keyable): Promise<Boolean> => {
            return Promise.resolve(true)
        }

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe(true)
        expect(cacheHit).toBe(false)

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe(true)
        expect(cacheHit).toBe(true)
    })

    test('caches repeat negative keys', async () => {
        const cache = new EntitlementCache<Key, Boolean>({
            positiveCacheTTLSeconds: 10,
            negativeCacheTTLSeconds: 10,
        })

        const onMiss = (key: Keyable): Promise<Boolean> => {
            return Promise.resolve(false)
        }

        var { value: value, cacheHit: cacheHit } = await cache.executeUsingCache(
            new Key('key'),
            onMiss,
        )
        expect(value).toBe(false)
        expect(cacheHit).toBe(false)

        var { value: value, cacheHit: cacheHit } = await cache.executeUsingCache(
            new Key('key'),
            onMiss,
        )
        expect(value).toBe(false)
        expect(cacheHit).toBe(true)
    })

    test('caches non-boolean truthy keys', async () => {
        const cache = new EntitlementCache<Key, string>({
            positiveCacheTTLSeconds: 10,
            negativeCacheTTLSeconds: 10,
        })

        const onMiss = (key: Keyable): Promise<string> => {
            return Promise.resolve('value')
        }

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe('value')
        expect(cacheHit).toBe(false)

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe('value')
        expect(cacheHit).toBe(true)
    })

    test('caches non-boolean falsy keys', async () => {
        const cache = new EntitlementCache<Key, string>({
            positiveCacheTTLSeconds: 10,
            negativeCacheTTLSeconds: 10,
        })

        const onMiss = (key: Keyable): Promise<string> => {
            return Promise.resolve('')
        }

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe('')
        expect(cacheHit).toBe(false)

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe('')
        expect(cacheHit).toBe(true)
    })

    test('positive cache values expire after ttl', async () => {
        const cache = new EntitlementCache<Key, Boolean>({
            positiveCacheTTLSeconds: 1,
            negativeCacheTTLSeconds: 10,
        })

        const onMiss = (key: Keyable): Promise<Boolean> => {
            return Promise.resolve(true)
        }

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe(true)
        expect(cacheHit).toBe(false)

        // Wait 5 seconds for the positive auth cache to expire
        await new Promise((f) => setTimeout(f, 5000))

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe(true)
        expect(cacheHit).toBe(false)
    })

    test('negative cache values expire after ttl', async () => {
        const cache = new EntitlementCache<Key, Boolean>({
            positiveCacheTTLSeconds: 10,
            negativeCacheTTLSeconds: 1,
        })

        const onMiss = (key: Keyable): Promise<Boolean> => {
            return Promise.resolve(false)
        }

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe(false)
        expect(cacheHit).toBe(false)

        // Wait 5 seconds for the positive auth cache to expire
        await new Promise((f) => setTimeout(f, 1000))

        var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe(false)
        expect(cacheHit).toBe(false)
    })
})
