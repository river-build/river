import { Model } from '../model'
import { Effect as E } from 'effect'

type UserDb = {
    id: string
    username: string
}

/**
 * @category Model
 * A User model, that is storable and syncable.
 */
type UserModel = Model.Persistent<
    UserDb,
    { setUsername: (username: string) => E.Effect<void, never, never> }
>

const mkUserModel = (data: UserDb): UserModel => {
    return Model.persistent(data, {
        storable: {
            loadPriority: Model.LoadPriority.high,
            tableName: 'user',
            onInitialize: (data) => E.succeed(data),
            onLoaded: (data) => E.succeed(data),
            onUpdate: (data) => E.succeed(data),
        },
        syncable: {
            onStreamInitialized: (streamId) => E.succeed(void streamId),
        },
        actions: {
            setUsername: (username) => E.succeed(username),
        },
    })
}

const user = mkUserModel({ id: '72', username: 'John' })
user.actions.setUsername('Jane')
