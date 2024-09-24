/* eslint-disable @typescript-eslint/no-namespace */
import type { TODO } from './utils'
import { Effect as E, pipe } from 'effect'

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
     */
    export const persistent = <T, Specific = unknown>(data: T, model: Persistent<T> & Specific) =>
        pipe(data, model.onInitialize, () => model)

    /**
     * @category Model
     * Creates a storable model, that is [Storable].
     */
    export const storable = <T, Specific = unknown>(data: T, model: Storable<T> & Specific) =>
        pipe(data, model.onInitialize, () => model)

    /**
     * @category Model
     * Creates a syncable model, that is [Syncable].
     */
    export const syncable = <T, Specific = unknown>(
        streamId: string,
        model: Syncable<T> & Specific,
    ) => pipe(streamId, model.onStreamInitialized, () => model)
}
