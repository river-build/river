import { Model } from '../model'
import { Effect as E } from 'effect'

type ChannelDb = {
    id: string
    name: string
    description?: string
    // TODO: handle connections/relations
    // I would like to declare that members <> MemberModel
    // kinda like model dependencies?
}

/**
 * @category Model
 * A Channel model, that is storable and syncable.
 */
type ChannelModel = Model.Persistent<
    ChannelDb,
    { sendMessage: (message: string) => E.Effect<void, never, never> }
>

const mkChannelModel = (data: ChannelDb): ChannelModel => {
    return Model.persistent(data, {
        storable: {
            loadPriority: Model.LoadPriority.high,
            tableName: 'channel',
            onInitialize: (data) => E.succeed(data),
            onLoaded: (data) => E.succeed(data),
            onUpdate: (data) => E.succeed(data),
        },
        syncable: {
            onStreamInitialized: (streamId) => E.succeed(void streamId),
        },
        actions: {
            sendMessage: (message) => E.succeed(void message),
        },
    })
}

const channel = mkChannelModel({ id: '72', name: 'general' })
channel.actions.sendMessage('Hello, world!')
