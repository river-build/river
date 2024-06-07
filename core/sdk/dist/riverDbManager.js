import { CryptoStore } from '@river-build/encryption';
export class RiverDbManager {
    static getCryptoDb(userId, dbName) {
        return new CryptoStore(dbName ?? `database-${userId}`, userId);
    }
}
//# sourceMappingURL=riverDbManager.js.map