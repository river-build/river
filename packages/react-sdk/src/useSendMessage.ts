'use client'

import type { Channel } from '@river-build/sdk'
import { useMemo } from 'react'
import { useCurrentChannelId } from './useChannel'
import { useCurrentSpaceId } from './useSpace'
import { type ActionConfig, useAction } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

export const useSendMessage = (config: ActionConfig<Channel['sendMessage']> = {}) => {
    const spaceId = useCurrentSpaceId()
    const channelId = useCurrentChannelId()
    const sync = useSyncAgent()
    const channel = useMemo(
        () => sync.spaces.getSpace(spaceId).getChannel(channelId),
        [sync.spaces, spaceId, channelId],
    )
    const { action: sendMessage, ...rest } = useAction(channel, 'sendMessage', config)

    return {
        sendMessage,
        ...rest,
    }
}
