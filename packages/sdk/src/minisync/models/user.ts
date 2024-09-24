/* eslint-disable @typescript-eslint/no-unused-vars */
import { Model } from '../model'
import { Effect as E } from 'effect'

type User = {
    id: number
    username: string
}

type UserSpecificInstructions = {
    onUsernameChange: (username: string) => E.Effect<void, never, never>
}

/**
 * @category Model
 * A User model, that is storable and syncable.
 */
type UserModel = Model.Persistent<User> & UserSpecificInstructions

const mkUserModel = (data: User): UserModel => {
    return Model.persistent(data, {
        loadPriority: Model.LoadPriority.high,
        onUsernameChange: (username) => E.succeed(void username),
        onStreamInitialized: (streamId) => E.succeed(void streamId),
        onInitialize: (data) => E.succeed(data),
        onLoaded: (data) => E.succeed(data),
        onUpdate: (data) => E.succeed(data),
    })
}
