import { CryptoStore } from '@river-build/encryption'
import { MlsCryptoStore } from './mls/mlsCryptoStore'

export class RiverDbManager {
    public static getCryptoDb(userId: string, dbName?: string): CryptoStore {
        return new CryptoStore(dbName ?? `database-${userId}`, userId)
    }

    static getMlsCryptoDb(userId: string, dbName: string): MlsCryptoStore {
        return new MlsCryptoStore(dbName ?? `database-${userId}`, userId)
    }
}
