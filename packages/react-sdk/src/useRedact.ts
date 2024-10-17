'use client'

import type { Channel } from '@river-build/sdk'
import { useMemo } from 'react'
import { type ActionConfig, useAction } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

// TODO: make this a hook that takes a roomId (any channel, dm/gdm etc)
export const useRedact = (
    spaceId: string,
    channelId: string,
    config?: ActionConfig<Channel['redactEvent']>,
) => {
    const sync = useSyncAgent()
    const room = useMemo(
        () => sync.spaces.getSpace(spaceId).getChannel(channelId),
        [sync.spaces, spaceId, channelId],
    )
    const { action: redactEvent, ...rest } = useAction(room, 'redactEvent', config)

    return {
        redactEvent,
        ...rest,
    }
}
