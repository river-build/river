import { check, dlog } from '@river-build/dlog'
import Dexie from 'dexie'

const log = dlog('csb:dataStore')

export enum LoadPriority {
    high = 'high',
    low = 'low',
}

export interface Identifiable {
    id: string
}

class TransactionBundler {
    constructor(public name: string) {}
    isWrite = false
    tableNames: string[] = []
    dbOps: (() => Promise<void>)[] = []
    effects: (() => void)[] = []
    onCommitted: (() => Promise<void>)[] = []
}

class TransactionGroup implements Record<LoadPriority, TransactionBundler> {
    name: string
    high: TransactionBundler
    low: TransactionBundler
    constructor(name: string) {
        this.name = name
        this.high = new TransactionBundler('high')
        this.low = new TransactionBundler('low')
    }
    get bundles() {
        return [this.high, this.low]
    }
    get hasOps() {
        return this.bundles.some((b) => b.dbOps.length > 0)
    }
}

function makeSchema(classes: any[]) {
    const schema: { [tableName: string]: string | null } = {}
    for (const cls of classes) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        check(cls.tableName !== undefined, 'missing tableName, decorate with @persistedObservable')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        check(schema[cls.tableName] === undefined, `duplicate table name: ${cls.tableName}`)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        schema[cls.tableName] = 'id'
    }
    return schema
}

export class Store {
    private db: Dexie
    private transactionGroup?: TransactionGroup
    private isLoadedMap: Record<string, Set<string>> = {}

    constructor(name: string, version: number, classes: any[]) {
        const schema = makeSchema(classes)
        log('new Store', name, version, schema)
        this.db = new Dexie(name)
        this.db.version(version).stores(schema)
    }

    private checkTableName(tableName: string) {
        check(this.db._dbSchema[tableName] !== undefined, `table "${tableName}" not registered`)
    }

    newTransactionGroup(name: string) {
        // log(`newTransactionGroup "${name}"`)
        check(
            this.transactionGroup === undefined,
            `transaction already in progress named: ${this.transactionGroup?.name}`,
        )
        this.transactionGroup = new TransactionGroup(name)
    }

    async commitTransaction() {
        const time = Date.now()
        check(this.transactionGroup !== undefined, 'transaction not started')
        // save off the group
        const tGroup = this.transactionGroup
        // clear before await so that any new ops are queued
        this.transactionGroup = undefined
        // if no ops, return
        if (!tGroup.hasOps) {
            // log(`commitTransaction "${tGroup.name}" skipped (empty)`)
            return
        }
        log(
            `commitTransaction "${tGroup.name}"`,
            'tables:',
            tGroup.bundles.map((b) => ({ [b.name]: b.tableNames })),
        )
        // iterate over InitialLoadPriority values
        for (const bundle of tGroup.bundles) {
            if (bundle.tableNames.length === 0) {
                continue
            }
            const mode = bundle.isWrite ? 'rw!' : 'r!'
            await this.db.transaction(mode, bundle.tableNames, async () => {
                for (const fn of bundle.dbOps) {
                    await fn()
                }
            })
            if (bundle.effects.length > 0 || bundle.onCommitted.length > 0) {
                this.newTransactionGroup(`${tGroup.name}>effects_${bundle.name}`)
                bundle.effects.forEach((fn) => fn())
                await Promise.all(bundle.onCommitted.map((fn) => fn()))
                await this.commitTransaction()
            }
        }
        log(`commitTransaction "${tGroup.name}" done`, 'elapsedMs:', Date.now() - time)
    }

    withTransaction<T>(name: string, fn: () => T): T {
        if (this.transactionGroup !== undefined) {
            return fn()
        } else {
            this.newTransactionGroup(name)
            const result = fn()
            this.commitTransaction().catch((e) => {
                log(`uncaught commitTransaction error in groun ${name}`, e)
                throw e
            })
            return result
        }
    }

    load<T extends Identifiable>(
        tableName: string,
        id: string,
        loadPriority: LoadPriority,
        onLoad: (data?: T) => void,
        onError: (e: Error) => void,
        onCommitted: () => Promise<void>,
    ) {
        log('+enqueue load', tableName, id, loadPriority)
        this.checkTableName(tableName)
        check(this.transactionGroup !== undefined, 'transaction not started')
        if (this.isLoaded(tableName, id)) {
            log(`model already loaded table: ${tableName} id: ${id}`)
            return
        }
        this.setIsLoaded(tableName, id)
        const bundler = this.transactionGroup[loadPriority]
        bundler.tableNames.push(tableName)
        const dbOp = async () => {
            try {
                const data = await this.db.table<T, string>(tableName).get(id)
                bundler.effects.push(() => onLoad(data))
            } catch (e) {
                bundler.effects.push(() => onError(e as Error))
            }
        }
        bundler.dbOps.push(dbOp)
        bundler.onCommitted.push(onCommitted)
    }

    save<T extends Identifiable>(
        tableName: string,
        data: T,
        onSaved: () => void,
        onError: (e: Error) => void,
        onCommitted: () => Promise<void>,
    ) {
        log('+enqueue save', tableName, data.id)
        this.checkTableName(tableName)
        check(this.transactionGroup !== undefined, 'transaction not started')
        const bundler = this.transactionGroup.low
        bundler.tableNames.push(tableName)
        bundler.isWrite = true
        const dbOp = async () => {
            try {
                const id = await this.db.table<T, string>(tableName).put(data)
                check(id === data.id, 'id mismatch???')
                bundler.effects.push(() => onSaved())
            } catch (e) {
                bundler.effects.push(() => onError(e as Error))
            }
        }
        bundler.dbOps.push(dbOp)
        bundler.onCommitted.push(onCommitted)
    }

    private isLoaded(tableName: string, id: string): boolean {
        return this.isLoadedMap[tableName]?.has(id) ?? false
    }

    private setIsLoaded(tableName: string, id: string) {
        if (this.isLoadedMap[tableName] === undefined) {
            this.isLoadedMap[tableName] = new Set<string>()
        }
        this.isLoadedMap[tableName].add(id)
    }
}
