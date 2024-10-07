/* eslint-disable @typescript-eslint/no-namespace */
import type { TODO } from './utils'
import { Effect as E, pipe, SubscriptionRef } from 'effect'

import type { TABLE_NAME } from './db'
import { Store } from './store'

export namespace Model {
    export enum LoadPriority {
        high = 'high',
        low = 'low',
    }
    /**
     * @category Model
     * Defines a interaction model for Storable data types.
     */
    export type Storable<T> = {
        loadPriority: LoadPriority
        tableName: TABLE_NAME
        onInitialize: (data: T) => E.Effect<void, never, never>
        onLoaded: (data: T) => E.Effect<void, never, never>
        onUpdate: (data: T) => E.Effect<void, never, never>
        onDestroy?: (data: T) => E.Effect<void, never, never>
    }

    /**
     * @category Model
     * Defines a interaction model for Syncable data types.
     * Those models are used to interact with the River protocol.
     */
    export type Syncable<T> = {
        onStreamInitialized: (streamId: string) => E.Effect<void, never, never>
        onClientChange?: (
            client: TODO<'River Client'>,
            data: T,
        ) => E.Effect<void, never, TODO<'Pass a River TxClient'>>
    }

    /**
     * @category Model
     * A Persistable model, that is storable and syncable.
     * Usually you will want to use this model, to interact with the River protocol and store into a persistent storage.
     */
    export type Persistent<T> = Storable<T> & Syncable<T>

    /**
     * @category Model
     * Creates a persistable model, that is [Storable] and [Syncable].
     * You can pass specific options to the model, that can be used to interact with the River protocol.
     */
    export const persistent = <T extends { id: string }, Specific = unknown>(
        data: T,
        model: Persistent<T> & Specific,
    ) =>
        pipe(
            data,
            model.onInitialize,
            () => Observable.persisted(data, model),
            () => model,
        )

    /**
     * @category Model
     * Creates a storable model, that is [Storable].
     * You can pass specific options to the model, that can be used to interact with the River protocol.
     */
    export const storable = <T extends { id: string }, Specific = unknown>(
        data: T,
        model: Storable<T> & Specific,
    ) =>
        pipe(
            data,
            model.onInitialize,
            () => Observable.persisted(data, model),
            () => model,
        )

    /**
     * @category Model
     * Creates a syncable model, that is [Syncable].
     * You can pass specific options to the model, that can be used to interact with the River protocol.
     */
    export const syncable = <T, Specific = unknown>(
        streamId: string,
        model: Syncable<T> & Specific,
    ) => pipe(streamId, model.onStreamInitialized, () => model)
}

namespace Observable {
    // We can model Observable as a SubscriptionRef
    // SubscriptionRef maps well to useSyncExternalStore in React too
    type Observable<A> = SubscriptionRef.SubscriptionRef<A>

    type PersistedData<T> =
        | { status: 'loading'; data: T }
        | { status: 'loaded'; data: T }
        | { status: 'error'; data: T; error: Error }
    export type Persisted<A extends { id: string }> = Observable<PersistedData<A>>

    // TODO: add finalizers: onComplete, onError
    export const persisted = <A extends { id: string }>(initialData: A, model: Model.Storable<A>) =>
        E.gen(function* () {
            const ref = yield* SubscriptionRef.make<PersistedData<A>>({
                status: 'loading',
                data: initialData,
            })

            return {
                update: (data: A) =>
                    E.gen(function* () {
                        yield* SubscriptionRef.update(ref, (model) => ({ ...model, data }))
                    }),
                load: () =>
                    E.gen(function* () {
                        yield* SubscriptionRef.update(
                            ref,
                            (model) =>
                                ({
                                    ...model,
                                    status: 'loading',
                                } as const),
                        )
                        const store = yield* Store
                        store.load(model.tableName, initialData.id, model.loadPriority)
                    }),
            }
        })
}
