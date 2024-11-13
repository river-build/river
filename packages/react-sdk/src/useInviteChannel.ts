'use client'

import type { Channel } from '@river-build/sdk'
import { useMemo } from 'react'
import { type ActionConfig, useAction } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

export const useInviteChannel = (
    spaceId: string,
    channelId: string,
    config?: ActionConfig<Channel['invite']>,
) => {
    const sync = useSyncAgent()
    const channel = useMemo(
        () => sync.spaces.getSpace(spaceId).getChannel(channelId),
        [sync.spaces, spaceId, channelId],
    )
    const { action: inviteToChannel, ...rest } = useAction(channel, 'invite', config)
    return {
        /**
         * Invites a user to the channel.
         * @param userId - The River `userId` to invite.
         * @returns A promise that resolves to the result of the invite operation.
         */
        inviteToChannel,
        ...rest,
    }
}
