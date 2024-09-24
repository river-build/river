/* eslint-disable @typescript-eslint/no-unused-vars */
import { Context, Effect as E, Option as O, pipe } from 'effect'
import type { NoSuchElementException } from 'effect/Cause'

type DbShape = {
    get: <T>(key: string) => E.Effect<T, NoSuchElementException, never>
    set: <T>(key: string, value: T) => E.Effect<void, never, never>
}

class Db extends Context.Tag('Db')<Db, DbShape>() {}

const inMemoryDb = () => {
    const db: Record<string, unknown> = {}
    return {
        get: <T>(key: string) =>
            pipe(
                O.fromNullable(db?.[key]),
                E.flatMap((x) => E.succeed(x as T)),
            ),
        set: <T>(key: string, value: T) => {
            db[key] = value
            return E.succeed(void value)
        },
    } satisfies DbShape
}
