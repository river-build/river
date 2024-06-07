import { AccountRecord, GroupSessionRecord, UserDeviceRecord } from './storeTypes';
import Dexie, { Table } from 'dexie';
import { InboundGroupSessionData } from './encryptionDevice';
import { UserDevice } from './olmLib';
export declare class CryptoStore extends Dexie {
    account: Table<AccountRecord>;
    outboundGroupSessions: Table<GroupSessionRecord>;
    inboundGroupSessions: Table<InboundGroupSessionData & {
        streamId: string;
        sessionId: string;
    }>;
    devices: Table<UserDeviceRecord>;
    userId: string;
    constructor(databaseName: string, userId: string);
    initialize(): Promise<void>;
    deleteAllData(): void;
    deleteInboundGroupSessions(streamId: string, sessionId: string): Promise<void>;
    deleteAccount(userId: string): Promise<void>;
    getAccount(): Promise<string>;
    storeAccount(accountPickle: string): Promise<void>;
    storeEndToEndOutboundGroupSession(sessionId: string, sessionData: string, streamId: string): Promise<void>;
    getEndToEndOutboundGroupSession(streamId: string): Promise<string>;
    getEndToEndInboundGroupSession(streamId: string, sessionId: string): Promise<InboundGroupSessionData | undefined>;
    storeEndToEndInboundGroupSession(streamId: string, sessionId: string, sessionData: InboundGroupSessionData): Promise<void>;
    getInboundGroupSessionIds(streamId: string): Promise<string[]>;
    withAccountTx<T>(fn: () => Promise<T>): Promise<T>;
    withGroupSessions<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Only used for testing
     * @returns total number of devices in the store
     */
    deviceRecordCount(): Promise<number>;
    /**
     * Store a list of devices for a given userId
     * @param userId string
     * @param devices UserDeviceInfo[]
     * @param expirationMs Expiration time in milliseconds
     */
    saveUserDevices(userId: string, devices: UserDevice[], expirationMs?: number): Promise<void>;
    /**
     * Get all stored devices for a given userId
     * @param userId string
     * @returns UserDevice[], a list of devices
     */
    getUserDevices(userId: string): Promise<UserDevice[]>;
}
//# sourceMappingURL=cryptoStore.d.ts.map