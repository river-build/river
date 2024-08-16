'use client'

import { useMemo } from 'react'
import type { ChannelModel } from '@river-build/sdk'
import { useSyncAgent } from './useSyncAgent'
import { type PersistedObservableConfig, useObservable } from './useObservable'

/**
 *  Views a channel by its channelId and spaceId.
 */
export const useChannel = (
    spaceId: string,
    channelId: string,
    config?: PersistedObservableConfig<ChannelModel>,
) => {
    const sync = useSyncAgent()
    const channel = useMemo(
        () => sync.spaces.getSpace(spaceId).getChannel(channelId),
        [sync.spaces, spaceId, channelId],
    )
    return useObservable(channel, config)
}
