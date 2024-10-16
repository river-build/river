/* eslint-disable @typescript-eslint/no-unused-vars */
import { Context, Data, Effect as E, Option as O, pipe } from 'effect'
import { NoSuchElementException } from 'effect/Cause'
import type { Model } from './model'
import Dexie from 'dexie'

const TABLES = ['user', 'space', 'channel'] as const
export type TABLE_NAME = (typeof TABLES)[number]

type DbShape = {
    get: <T>(
        tableName: TABLE_NAME,
        key: string,
    ) => E.Effect<T, DbGetFail | NoSuchElementException, never>
    set: <T>(tableName: TABLE_NAME, key: string, value: T) => E.Effect<void, DbSetFail, never>
}

export class DbGetFail extends Data.TaggedError('DbGetFail')<{
    tableName: TABLE_NAME
    key: string
}> {}

export class DbSetFail extends Data.TaggedError('DbSetFail')<{
    tableName: TABLE_NAME
    key: string
    value: unknown
}> {}

export class Db extends Context.Tag('Db')<Db, DbShape>() {}

// TODO: batch with bulkGet/bulkPut
const DexieDb = (db: Dexie) => {
    return {
        get: <T>(tableName: TABLE_NAME, key: string) =>
            pipe(
                E.tryPromise({
                    try: () => db.table<T, string>(tableName).get(key),
                    catch: () => new DbGetFail({ tableName, key }),
                }),
                E.flatMap(O.fromNullable),
            ),
        set: <T>(tableName: TABLE_NAME, key: string, value: T) =>
            pipe(
                E.tryPromise({
                    try: () => db.table<T, string>(tableName).put(value, key),
                    catch: () => new DbSetFail({ tableName, key, value }),
                }),
            ),
    } satisfies DbShape
}

export const make = (name: string, version: number, models: Model.Storable<unknown>[]) => {
    const schema: Record<string, string> = {}
    const db = new Dexie(name)
    db.version(version).stores(schema)
    for (const model of models) {
        schema[model.tableName] = 'id'
    }
    return DexieDb(db)
}
