import Dexie from 'dexie';
const DEFAULT_USER_DEVICE_EXPIRATION_TIME_MS = 15 * 60 * 1000; // 15 minutes todo increase to like 10 days or something https://github.com/HereNotThere/harmony/pull/4222#issuecomment-1822935596
export class CryptoStore extends Dexie {
    account;
    outboundGroupSessions;
    inboundGroupSessions;
    devices;
    userId;
    constructor(databaseName, userId) {
        super(databaseName);
        this.userId = userId;
        this.version(6).stores({
            account: 'id',
            inboundGroupSessions: '[streamId+sessionId]',
            outboundGroupSessions: 'streamId',
            devices: '[userId+deviceKey],expirationTimestamp',
        });
    }
    async initialize() {
        await this.devices.where('expirationTimestamp').below(Date.now()).delete();
    }
    deleteAllData() {
        throw new Error('Method not implemented.');
    }
    async deleteInboundGroupSessions(streamId, sessionId) {
        await this.inboundGroupSessions.where({ streamId, sessionId }).delete();
    }
    async deleteAccount(userId) {
        await this.account.where({ id: userId }).delete();
    }
    async getAccount() {
        const account = await this.account.get({ id: this.userId });
        if (!account) {
            throw new Error('account not found');
        }
        return account.accountPickle;
    }
    async storeAccount(accountPickle) {
        await this.account.put({ id: this.userId, accountPickle });
    }
    async storeEndToEndOutboundGroupSession(sessionId, sessionData, streamId) {
        await this.outboundGroupSessions.put({ sessionId, session: sessionData, streamId });
    }
    async getEndToEndOutboundGroupSession(streamId) {
        const session = await this.outboundGroupSessions.get({ streamId });
        if (!session) {
            throw new Error('session not found');
        }
        return session.session;
    }
    async getEndToEndInboundGroupSession(streamId, sessionId) {
        return await this.inboundGroupSessions.get({ sessionId, streamId });
    }
    async storeEndToEndInboundGroupSession(streamId, sessionId, sessionData) {
        await this.inboundGroupSessions.put({ streamId, sessionId, ...sessionData });
    }
    async getInboundGroupSessionIds(streamId) {
        const sessions = await this.inboundGroupSessions.where({ streamId }).toArray();
        return sessions.map((s) => s.sessionId);
    }
    async withAccountTx(fn) {
        return await this.transaction('rw', this.account, fn);
    }
    async withGroupSessions(fn) {
        return await this.transaction('rw', this.outboundGroupSessions, this.inboundGroupSessions, fn);
    }
    /**
     * Only used for testing
     * @returns total number of devices in the store
     */
    async deviceRecordCount() {
        return await this.devices.count();
    }
    /**
     * Store a list of devices for a given userId
     * @param userId string
     * @param devices UserDeviceInfo[]
     * @param expirationMs Expiration time in milliseconds
     */
    async saveUserDevices(userId, devices, expirationMs = DEFAULT_USER_DEVICE_EXPIRATION_TIME_MS) {
        const expirationTimestamp = Date.now() + expirationMs;
        for (const device of devices) {
            await this.devices.put({ userId, expirationTimestamp, ...device });
        }
    }
    /**
     * Get all stored devices for a given userId
     * @param userId string
     * @returns UserDevice[], a list of devices
     */
    async getUserDevices(userId) {
        const expirationTimestamp = Date.now();
        return (await this.devices
            .where('userId')
            .equals(userId)
            .and((record) => record.expirationTimestamp > expirationTimestamp)
            .toArray()).map((record) => ({
            deviceKey: record.deviceKey,
            fallbackKey: record.fallbackKey,
        }));
    }
}
//# sourceMappingURL=cryptoStore.js.map