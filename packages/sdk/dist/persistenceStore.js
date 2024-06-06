import { PersistedMiniblock, PersistedSyncedStream } from '@river-build/proto';
import Dexie from 'dexie';
import { persistedSyncedStreamToParsedSyncedStream, persistedMiniblockToParsedMiniblock, parsedMiniblockToPersistedMiniblock, } from './streamUtils';
import { dlog, dlogError } from '@river-build/dlog';
import { isDefined } from './check';
const DEFAULT_RETRY_COUNT = 2;
const log = dlog('csb:persistence');
const logError = dlogError('csb:persistence');
async function fnReadRetryer(fn, retries) {
    let lastErr;
    let retryCounter = retries;
    while (retryCounter > 0) {
        try {
            if (retryCounter < retries) {
                log('retrying...', `${retryCounter}/${retries} retries left`);
                retryCounter--;
                // wait a bit before retrying
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return await fn();
        }
        catch (err) {
            lastErr = err;
            const e = err;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            switch (e.name) {
                case 'AbortError':
                    // catch and retry on abort errors
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    if (e.inner) {
                        log('AbortError reason:', 
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        e.inner, `${retryCounter}/${retries} retries left`);
                    }
                    else {
                        log(
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        'AbortError message:' + e.message, `${retryCounter}/${retries} retries left`);
                    }
                    break;
                default:
                    // don't retry for unknown errors
                    logError('Unhandled error:', err);
                    throw lastErr;
            }
        }
    }
    // if we're out of retries, throw the last error
    throw lastErr;
}
export class PersistenceStore extends Dexie {
    cleartexts;
    syncedStreams;
    miniblocks;
    constructor(databaseName) {
        super(databaseName);
        this.version(1).stores({
            cleartexts: 'eventId',
            syncedStreams: 'streamId',
            miniblocks: '[streamId+miniblockNum]',
        });
        this.requestPersistentStorage();
        this.logPersistenceStats();
    }
    async saveCleartext(eventId, cleartext) {
        await this.cleartexts.put({ eventId, cleartext });
    }
    async getCleartext(eventId) {
        const record = await this.cleartexts.get(eventId);
        return record?.cleartext;
    }
    async getCleartexts(eventIds) {
        return fnReadRetryer(async () => {
            const records = await this.cleartexts.bulkGet(eventIds);
            return records.length === 0
                ? undefined
                : records.reduce((acc, record) => {
                    if (record !== undefined) {
                        acc[record.eventId] = record.cleartext;
                    }
                    return acc;
                }, {});
        }, DEFAULT_RETRY_COUNT);
    }
    async getSyncedStream(streamId) {
        const record = await this.syncedStreams.get(streamId);
        if (!record) {
            return undefined;
        }
        const cachedSyncedStream = PersistedSyncedStream.fromBinary(record.data);
        return persistedSyncedStreamToParsedSyncedStream(cachedSyncedStream);
    }
    async saveSyncedStream(streamId, syncedStream) {
        log('saving synced stream', streamId);
        await this.syncedStreams.put({
            streamId,
            data: syncedStream.toBinary(),
        });
    }
    async saveMiniblock(streamId, miniblock) {
        log('saving miniblock', streamId);
        const cachedMiniblock = parsedMiniblockToPersistedMiniblock(miniblock);
        await this.miniblocks.put({
            streamId: streamId,
            miniblockNum: miniblock.header.miniblockNum.toString(),
            data: cachedMiniblock.toBinary(),
        });
    }
    async saveMiniblocks(streamId, miniblocks) {
        await this.miniblocks.bulkPut(miniblocks.map((mb) => {
            return {
                streamId: streamId,
                miniblockNum: mb.header.miniblockNum.toString(),
                data: parsedMiniblockToPersistedMiniblock(mb).toBinary(),
            };
        }));
    }
    async getMiniblock(streamId, miniblockNum) {
        const record = await this.miniblocks.get([streamId, miniblockNum.toString()]);
        if (!record) {
            return undefined;
        }
        const cachedMiniblock = PersistedMiniblock.fromBinary(record.data);
        return persistedMiniblockToParsedMiniblock(cachedMiniblock);
    }
    async getMiniblocks(streamId, rangeStart, rangeEnd) {
        const ids = [];
        for (let i = rangeStart; i <= rangeEnd; i++) {
            ids.push([streamId, i.toString()]);
        }
        const records = await this.miniblocks.bulkGet(ids);
        // All or nothing
        const miniblocks = records
            .map((record) => {
            if (!record) {
                return undefined;
            }
            const cachedMiniblock = PersistedMiniblock.fromBinary(record.data);
            return persistedMiniblockToParsedMiniblock(cachedMiniblock);
        })
            .filter(isDefined);
        return miniblocks.length === ids.length ? miniblocks : [];
    }
    requestPersistentStorage() {
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage
                .persist()
                .then((persisted) => {
                log('Persisted storage granted: ', persisted);
            })
                .catch((e) => {
                log("Couldn't get persistent storage: ", e);
            });
        }
        else {
            log('navigator.storage unavailable');
        }
    }
    logPersistenceStats() {
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage
                .estimate()
                .then((estimate) => {
                const usage = ((estimate.usage ?? 0) / 1024 / 1024).toFixed(1);
                const quota = ((estimate.quota ?? 0) / 1024 / 1024).toFixed(1);
                log(`Using ${usage} out of ${quota} MB.`);
            })
                .catch((e) => {
                log("Couldn't get storage estimate: ", e);
            });
        }
        else {
            log('navigator.storage unavailable');
        }
    }
}
//Linting below is disable as this is a stub class which is used for testing and just follows the interface
export class StubPersistenceStore {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    async saveCleartext(eventId, cleartext) {
        return Promise.resolve();
    }
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getCleartext(eventId) {
        return Promise.resolve(undefined);
    }
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getCleartexts(eventIds) {
        return Promise.resolve(undefined);
    }
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getSyncedStream(streamId) {
        return Promise.resolve(undefined);
    }
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    async saveSyncedStream(streamId, syncedStream) {
        return Promise.resolve();
    }
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    async saveMiniblock(streamId, miniblock) {
        return Promise.resolve();
    }
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    async saveMiniblocks(streamId, miniblocks) {
        return Promise.resolve();
    }
    /* eslint-disable @typescript-eslint/no-unused-vars */
    async getMiniblock(streamId, miniblockNum) {
        return Promise.resolve(undefined);
    }
    async getMiniblocks(streamId, rangeStart, rangeEnd) {
        return Promise.resolve([]);
    }
}
//# sourceMappingURL=persistenceStore.js.map