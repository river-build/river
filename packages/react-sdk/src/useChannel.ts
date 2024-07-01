'use client'

import { useContext, useMemo } from 'react'
import { useCurrentSpaceId, useSpace } from './useSpace'
import { ChannelContext } from './internals/ChannelContext'

/**
 *  Views a channel by its channelId and spaceId.
 */
export const useChannel = (channelId: string, spaceId: string) => {
    const space = useSpace(spaceId)
    const channel = useMemo(() => space.getChannel(channelId), [space, channelId])
    return channel
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

    // TODO: return the Channel object or the ChannelModel object?
    return useChannel(spaceId, channelId)
}
