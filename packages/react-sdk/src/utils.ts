import {
    type Channel,
    type Dm,
    type Gdm,
    type PersistedModel,
    Space,
    type SyncAgent,
    isChannelStreamId,
    isDMChannelStreamId,
    isGDMChannelStreamId,
    isSpaceStreamId,
    spaceIdFromChannelId,
} from '@river-build/sdk'

export const isPersistedModel = <T>(value: T | PersistedModel<T>): value is PersistedModel<T> => {
    if (typeof value !== 'object') {
        return false
    }
    if (value === null) {
        return false
    }
    return 'status' in value && 'data' in value
}

export const getRoom = (sync: SyncAgent, streamId: string): Gdm | Channel | Dm | Space => {
    if (isChannelStreamId(streamId)) {
        return sync.spaces.getSpace(spaceIdFromChannelId(streamId)).getChannel(streamId)
    }
    if (isGDMChannelStreamId(streamId)) {
        return sync.gdms.getGdm(streamId)
    }
    if (isDMChannelStreamId(streamId)) {
        return sync.dms.getDm(streamId)
    }
    if (isSpaceStreamId(streamId)) {
        return sync.spaces.getSpace(streamId)
    }
    throw new Error('Invalid room type')
}
