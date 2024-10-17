/* eslint-disable @typescript-eslint/no-namespace */

import type { TABLE_NAME } from './db'
import type { Identifiable, Store } from '../store/store'
import type { RiverConnection } from './riverConnection'
import { PersistedObservable } from '../observable/persistedObservable'
import type { ClientEvents } from '../client'
import { objectKeys } from '../utils'

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
        tableName: TABLE_NAME
        onLoaded?: (data: T) => void
        onUpdate?: (data: T) => void
        onDestroy?: (data: T) => void
    }

    /**
     * @category Model
     * Defines a interaction model for Syncable data types.
     * Those models are used to interact with the River protocol.
     */
    export type Syncable = {
        onStreamInitialized: (streamId: string) => void
    } & {
        [key in keyof FormatClientEvents]?: (...args: Parameters<FormatClientEvents[key]>) => void
    }

    type FormatClientEvents = {
        [Event in keyof ClientEvents as `on${Capitalize<Event>}`]: (
            ...args: Parameters<ClientEvents[Event]>
        ) => void
    }

    // const formatClientEventKey = (key: keyof ClientEvents): keyof FormatClientEvents =>
    //     `on${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof FormatClientEvents

    const revertClientEventKeyFormat = (key: keyof FormatClientEvents): keyof ClientEvents => {
        const withoutOn = key.slice(2)
        const lowercased = withoutOn.charAt(0).toLowerCase() + withoutOn.slice(1)
        return lowercased as keyof ClientEvents
    }

    type ModelCtx<T extends Identifiable> = {
        store: Store
        riverConnection: RiverConnection
        observable: PersistedObservable<T>
    }
    /**
     * @category Model
     * A Persistable model, that is storable and syncable.
     * Usually you will want to use this model, to interact with the River protocol and store into a persistent storage.
     * You can also define actions, that can be used to interact with the model and the ecosystem.
     */
    export type Persistent<
        T extends Identifiable,
        Actions = Record<string, never>,
    > = Actions extends Record<string, never>
        ? {
              loadPriority: LoadPriority
              storable: (ctx: ModelCtx<T>) => Storable<T>
              syncable: (ctx: ModelCtx<T>) => Syncable
              dependencies?: Persistent<Identifiable, unknown>[]
          }
        : {
              loadPriority: LoadPriority
              storable: (ctx: ModelCtx<T>) => Storable<T>
              syncable: (ctx: ModelCtx<T>) => Syncable
              actions: (ctx: ModelCtx<T>) => Actions
              dependencies?: ReturnType<typeof persistent>[]
          }

    /**
     * @category Model
     * Creates a persistable model, that is [Storable] and [Syncable].
     * You can also define actions, that can be used to interact with the model and the ecosystem.
     */
    export const persistent =
        <T extends { id: string; streamId: string }, Actions = Record<string, never>>(
            initialData: T,
            // TODO: think about making this a function, so we can pass the persisted observable (?)
            // we could also pass the initial data to the model, performing mutations + notifying the view?
            model: Persistent<T, Actions>,
        ) =>
        // run function - should be called in a load transaction  TODO: (?)
        (store: Store, riverConnection: RiverConnection) => {
            const ctx = {
                store,
                riverConnection,
                observable: new PersistedObservable(initialData, store, model.loadPriority),
            }
            const modelSyncable = model.syncable(ctx)
            const modelStorable = model.storable(ctx)
            // load the data from the store to the observable (TODO:)
            // call the onInitialize method of the model
            // attach the observable to the model
            // pass the actions to the model

            // TODO: where should we call this?
            const onLoadFromStore = () => {
                modelStorable.onLoaded(initialData)
                riverConnection.registerView((client) => {
                    if (
                        client.streams.has(ctx.observable.data.id) &&
                        client.streams.get(ctx.observable.data.id)?.view.isInitialized
                    ) {
                        modelSyncable.onStreamInitialized(ctx.observable.data.streamId)
                    }
                    for (const key of objectKeys(modelSyncable)) {
                        const clientKey = revertClientEventKeyFormat(key)
                        const clientFn = modelSyncable[key]
                        if (clientFn) {
                            client.on(clientKey, clientFn)
                        }
                    }
                    return () => {
                        for (const key of objectKeys(model.syncable)) {
                            const clientKey = revertClientEventKeyFormat(key)
                            const clientFn = modelSyncable[key]
                            if (clientFn) {
                                client.off(clientKey, clientFn)
                            }
                        }
                    }
                })
            }

            if ('actions' in model) {
                const actions = model.actions(ctx)
                return { ...ctx.observable.value, ...actions }
            }
            return ctx.observable.value
        }

    // /**
    //  * @category Model
    //  * Creates a storable model, that is [Storable].
    //  * You can pass actions to the model, that can be used to interact.
    //  */
    // export const storable = <T extends { id: string }>(data: T, model: Storable<T>) =>
    //     pipe(
    //         data,
    //         model.onInitialize,
    //         () => Observable.persisted(data, model),
    //         () => model,
    //     )

    // /**
    //  * @category Model
    //  * Creates a syncable model, that is [Syncable].
    //  * You can pass actions to the model, that can be used to interact.
    //  */
    // export const syncable = <T>(streamId: string, model: Syncable<T>) =>
    //     pipe(streamId, model.onStreamInitialized, () => model)
}
