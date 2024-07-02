'use client'

import { useContext, useMemo } from 'react'
import { useCurrentSpaceId } from './useSpace'
import { ChannelContext } from './internals/ChannelContext'
import { useSyncAgent } from './useSyncAgent'
import { useObservable } from './useObservable'

/**
 *  Views a channel by its channelId and spaceId.
 */
export const useChannel = (channelId: string, spaceId: string) => {
    const sync = useSyncAgent()
    const channel = useMemo(
        () => sync.spaces.getSpace(spaceId).getChannel(channelId),
        [sync.spaces, spaceId, channelId],
    )
    return useObservable(channel)
}

/**
 * Returns the current channelId, set by the <ChannelProvider /> component.
 */
// Maybe this should be moved to the internals folder?
export const useCurrentChannelId = () => {
    const channel = useContext(ChannelContext)
    if (!channel) {
        throw new Error('No channel set, use <ChannelProvider channelId={channelId} /> to set one')
    }
    if (!channel.channelId) {
        throw new Error('channelId is undefined, please check your <ChannelProvider /> usage')
    }

    return channel.channelId
}

export const useCurrentChannel = () => {
    const spaceId = useCurrentSpaceId()
    const channelId = useCurrentChannelId()
    return useChannel(spaceId, channelId)
}
