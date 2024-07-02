'use client'

import { useCurrentChannelId } from './useChannel'
import { useCurrentSpaceId } from './useSpace'
import { type ActionConfig, useAction } from './internals/useAction'

export const useSendMessage = (config: ActionConfig = {}) => {
    const spaceId = useCurrentSpaceId()
    const channelId = useCurrentChannelId()

    const { action, ...rest } = useAction(
        (sync) => sync.spaces.getSpace(spaceId).getChannel(channelId).sendMessage,
        config,
    )

    return { sendMessage: action, ...rest }
}
