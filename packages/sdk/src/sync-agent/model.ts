/* eslint-disable @typescript-eslint/no-namespace */

import type { TABLE_NAME } from './db'
import type { Identifiable, Store } from '../store/store'
import type { RiverConnection } from './riverConnection'
import { PersistedObservable } from '../observable/persistedObservable'
import type { ClientEvents } from '../client'
import { objectKeys } from '../utils'
import type { SpaceDapp } from '@river-build/web3'

export namespace Model {
    /**
     * @category Model
     * A Persistable model, that is storable and syncable.
     * - Can be used to interact with the River protocol and store into a persistent storage.
     * - Can also define actions, that can be used to interact with the model and the ecosystem.
     * You can create a persistent model from a recipe, by using the `fromRecipe` function.
     */
    export type Persistent<T extends Identifiable, Actions = Record<string, never>> = {
        dbConfig: DbConfig
        storable: Storable<T>
        syncable: Syncable
        actions: Actions
        state: PersistedObservable<T> // ? thinking about this
        //   dependencies?: Persistent<unknown, undefined>[]
    }

    /**
     * @category Model
     * Defines a interaction model for Storable data types.
     */
    export type Storable<T> = {
        onLoaded?: (data: T) => void
        onUpdate?: (data: T) => void
        onDestroy?: (data: T) => void
    }

    /**
     * @category Model
     * Defines the configuration for a database table.
     * - loadPriority: The priority of the table when loading from the database.
     * - tableName: The name of the table in the database.
     */
    export type DbConfig = {
        loadPriority: LoadPriority
        tableName: TABLE_NAME
    }

    export enum LoadPriority {
        high = 'high',
        low = 'low',
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

    // This type helper adds the `on` prefix to the client events
    // - eg: `onStreamInitialized` instead of `streamInitialized`
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

    /**
     * @category Model
     * Creates a persistable model from a recipe.
     */
    export const fromRecipe =
        <T extends { id: string; streamId: string }, Actions = Record<string, never>>(
            recipe: Recipe.Persistent<T, Actions>,
            dbConfig: DbConfig,
        ) =>
        (ctx: Recipe.Ctx<T>): Model.Persistent<T, Actions> => ({
            dbConfig,
            storable: recipe.storable(ctx),
            syncable: recipe.syncable(ctx),
            actions: recipe.actions(ctx),
            state: ctx.observable,
        })

    export const run = <
        T extends { id: string; streamId: string },
        Actions = Record<string, never>,
    >(
        model: Model.Persistent<T, Actions>,
        store: Store,
        riverConnection: RiverConnection,
    ) => {
        // load the data from the store to the observable (TODO:)
        // TODO: where should we call this?
        const onLoadFromStore = () => {
            model.storable.onLoaded?.(model.state.data)
            riverConnection.registerView((client) => {
                if (
                    client.streams.has(model.state.data.id) &&
                    client.streams.get(model.state.data.id)?.view.isInitialized
                ) {
                    model.syncable.onStreamInitialized(model.state.data.streamId)
                }
                for (const key of objectKeys(model.syncable)) {
                    const clientKey = revertClientEventKeyFormat(key)
                    const clientFn = model.syncable[key]
                    if (clientFn) {
                        client.on(clientKey, clientFn)
                    }
                }
                return () => {
                    for (const key of objectKeys(model.syncable)) {
                        const clientKey = revertClientEventKeyFormat(key)
                        const clientFn = model.syncable[key]
                        if (clientFn) {
                            client.off(clientKey, clientFn)
                        }
                    }
                }
            })
            // TODO: think about what this should return.
            return { ...model.state.data, ...model.actions }
        }
    }
    /**
     * @category Recipe
     * We have a Recipe, which holds a model context for each section of the model.
     * - storable: defines how to load the data from the store to the observable
     * - syncable: defines how to sync the data with the river protocol
     * - actions: defines the actions that can be performed on the model
     *
     * We can compose recipes into a single recipe, by composing their recipes.
     * We can turn a recipe into a model, using the `Model.fromRecipe` function.
     * - It will unwrap the context callback functions, and return a function (ctx) => Model.Persistent<T, Actions>.
     */
    export namespace Recipe {
        export type Ctx<T extends Identifiable> = {
            store: Store
            riverConnection: RiverConnection
            observable: PersistedObservable<T>
            spaceDapp: SpaceDapp // ?
        }

        // TODO: maybe we want to refine context for each section?
        export type Persistent<T extends Identifiable, Actions = Record<string, never>> = {
            name: string
            storable: (ctx: Ctx<T>) => Storable<T>
            syncable: (ctx: Ctx<T>) => Syncable
            actions: (ctx: Ctx<T>) => Actions
            dependencies?: ReturnType<typeof mkPersistent>[]
        }

        /**
         * @category Recipe
         * Composes two model recipes into a single model recipe.
         * - This is useful for creating more complex models from simpler ones.
         * - The composed model will have the data of both models.
         * - The composed model will have the actions of both models.
         * - Storable and Syncable functions will be run in the order they are composed.
         * // TODO: maybe the data should compose in a ['model_name']: data structure?
         * // So we dont need to deal with conflicts in keys & confusing names
         */
        export declare function compose<
            A_data extends Identifiable,
            B_data extends Identifiable,
            A_actions extends Record<string, unknown>,
            B_actions extends Record<string, unknown>,
        >(
            model_A: Recipe.Persistent<A_data, A_actions>,
            model_B: Recipe.Persistent<B_data, B_actions>,
        ): Recipe.Persistent<A_data & B_data, A_actions & B_actions>

        /**
         * @category Recipe
         * Creates a persistent model from a recipe.
         */
        export declare const mkPersistent: <
            T extends Identifiable,
            Actions extends Record<string, unknown>,
        >(
            model: Recipe.Persistent<T, Actions>,
        ) => Recipe.Persistent<T, Actions>

        export declare const empty: <
            T extends Identifiable,
            Actions extends Record<string, unknown>,
        >() => Recipe.Persistent<T, Actions>
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
