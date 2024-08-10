import Redis from 'ioredis'

export interface IStorage {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
    remove(key: string): Promise<void>
    close(): Promise<void>
}

export class RedisStorage implements IStorage {
    private client: Redis

    constructor(uri: string) {
        const url = new URL(uri)
        const host = `${url.protocol}//${url.hostname}`
        const port = parseInt(url.port)
        const opts = host.includes('localhost') ? { port } : { host, port }
        this.client = new Redis(opts)
    }

    async get(key: string): Promise<string | null> {
        const r = await this.client.get(key)
        return r
    }

    async set(key: string, value: string): Promise<void> {
        await this.client.set(key, value)
    }

    async remove(key: string): Promise<void> {
        await this.client.del(key)
    }

    async close() {
        await this.client.quit()
    }
}
