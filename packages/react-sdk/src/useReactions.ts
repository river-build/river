import { useMemo } from 'react'
import type { ReactionsMap } from '@river-build/sdk'
import { useSyncAgent } from './useSyncAgent'
import { type ObservableConfig, useObservable } from './useObservable'

export const useReactions = (
    spaceId: string,
    channelId: string,
    config?: ObservableConfig.FromData<ReactionsMap>,
) => {
    const sync = useSyncAgent()
    const channel = useMemo(
        () => sync.spaces.getSpace(spaceId).getChannel(channelId),
        [sync.spaces, spaceId, channelId],
    )
    return useObservable(channel.timeline.reactions, config)
}
