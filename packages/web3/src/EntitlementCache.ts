import TTLCache from '@isaacs/ttlcache'

export interface Keyable {
    toKey(): string
}

export type CacheResult<V> = {
    value: V
    cacheHit: boolean
}

export class EntitlementCache<K extends Keyable, V> {
    private readonly negativeCache: TTLCache<string, V>
    private readonly positiveCache: TTLCache<string, V>

    constructor(options?: {
        positiveCacheTTLSeconds: number
        negativeCacheTTLSeconds: number
        positiveCacheSize?: number
        negativeCacheSize?: number
    }) {
        const positiveCacheTTLSeconds = options?.positiveCacheTTLSeconds ?? 15 * 60
        const negativeCacheTTLSeconds = options?.negativeCacheTTLSeconds ?? 2
        const positiveCacheSize = options?.positiveCacheSize ?? 10000
        const negativeCacheSize = options?.negativeCacheSize ?? 10000

        this.negativeCache = new TTLCache({
            ttl: negativeCacheTTLSeconds * 1000,
            max: negativeCacheSize,
        })
        this.positiveCache = new TTLCache({
            ttl: positiveCacheTTLSeconds * 1000,
            max: positiveCacheSize,
        })
    }

    async executeUsingCache(
        keyable: Keyable,
        onCacheMiss: (k: Keyable) => Promise<V>,
    ): Promise<CacheResult<V>> {
        const key = keyable.toKey()
        const negativeCacheResult = this.negativeCache.get(key)
        if (negativeCacheResult !== undefined) {
            return { value: negativeCacheResult, cacheHit: true }
        }

        const positiveCacheResult = this.positiveCache.get(key)
        if (positiveCacheResult !== undefined) {
            return { value: positiveCacheResult, cacheHit: true }
        }

        const value = await onCacheMiss(keyable)
        if (!!value == false) {
            this.negativeCache.set(key, value)
        } else {
            this.positiveCache.set(key, value)
        }

        return { value, cacheHit: false }
    }
}
