/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NoSuchElementException } from 'effect/Cause'
import { Db, type DbGetFail, type DbSetFail, type TABLE_NAME } from './db'
import {
    Effect as E,
    SynchronizedRef,
    Scope,
    pipe,
    Queue,
    HashMap,
    Data,
    Context,
    Ref,
} from 'effect'
import { Model } from './model'

interface StoreShape {
    // TODO: index this T type somehow with the Model.Storable type
    load: <T>(
        tableName: TABLE_NAME,
        key: string,
        loadPriority: Model.LoadPriority,
    ) => E.Effect<T, DbGetFail | NoSuchElementException, never>
    save: <T>(tableName: TABLE_NAME, key: string, value: T) => E.Effect<void, DbSetFail, never>
    // We dont need withTransaction, we could require Scope to be passed to the store, and commit the transaction in the Scope.
    withTransaction: <R, E, A>(fn: (store: Store) => E.Effect<R, E, A>) => E.Effect<R, E, A>
}

class AlreadyLoadedError extends Data.TaggedError('AlreadyLoadedError')<{
    tableName: TABLE_NAME
    id: string
}> {}

// TODO: Resource implementation to Store (adquire = createTxGroup, use = runInTxGroup, release = commitTxGroup)
export class Store extends Context.Tag('Store')<Store, StoreShape>() {}

export type TxBundle = {
    name: string
    isWrite: boolean
    tableNames: string[]
    ops: ((typeof Db)['Service']['get'] | (typeof Db)['Service']['set'])[]
}
// TODO: a good class here pls
export class TxGroup extends Context.Tag('TxGroup')<
    TxGroup,
    Ref.Ref<{
        name: string
        bundles: {
            [Model.LoadPriority.high]: TxBundle
            [Model.LoadPriority.low]: TxBundle
        }
    }>
>() {}

const adquire = E.gen(function* () {
    const txGroupRef = yield* TxGroup
    return E.provideService(make, TxGroup, txGroupRef)
})

const release = E.gen(function* () {
    const txGroupRef = yield* TxGroup
})

const make = E.gen(function* () {
    const txGroupRef = yield* TxGroup
    return {
        load: <T>(tableName: TABLE_NAME, key: string) =>
            // In theory, this should add the load operation into a transaction group, and execute it when the transaction group is committed.
            E.gen(function* () {
                const db = yield* Db
                return db.get<T>(tableName, key)
            }),
        save: <T>(tableName: TABLE_NAME, key: string, value: T) =>
            // In theory, this should add the save operation into a transaction group, and execute it when the transaction group is committed.
            E.gen(function* () {
                const db = yield* Db
                return db.set(tableName, key, value)
            }),
    }
})
