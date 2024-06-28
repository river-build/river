/**
 * @group main
 */

import { EntitlementCache, Keyable } from '../src/EntitlementsCache'

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

        const { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe(true)
        expect(cacheHit).toBe(false)

        setTimeout(async () => {
            var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
            expect(value).toBe(true)
            expect(cacheHit).toBe(false)
        }, 1000)
    })

    test('negative cache values expire after ttl', async () => {
        const cache = new EntitlementCache<Key, Boolean>({
            positiveCacheTTLSeconds: 1,
            negativeCacheTTLSeconds: 10,
        })

        const onMiss = (key: Keyable): Promise<Boolean> => {
            return Promise.resolve(false)
        }

        const { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
        expect(value).toBe(false)
        expect(cacheHit).toBe(false)

        setTimeout(async () => {
            var { value, cacheHit } = await cache.executeUsingCache(new Key('key'), onMiss)
            expect(value).toBe(false)
            expect(cacheHit).toBe(false)
        }, 1000)
    })
})
