import { Model } from '../model'
import type { TimelineEvent } from './timeline/timelineEvent'

type TimelineDb = {
    id: string
    streamId: string
    events: TimelineEvent[]
}

export const TimelineModel = (streamId: string, events: TimelineEvent[]) => {
    return Model.persistent<TimelineDb>(
        {
            id: streamId,
            streamId,
            events,
        },
        {
            loadPriority: Model.LoadPriority.low,
            storable: () => ({
                tableName: 'timeline',
            }),
            syncable: ({ observable, riverConnection }) => ({
                onStreamInitialized: (streamId: string) => {},
                onStreamNewUserJoined: (streamId: string) => {},
                onStreamUserLeft: (streamId: string, userId: string) => {},
            }),
        },
    )
}
