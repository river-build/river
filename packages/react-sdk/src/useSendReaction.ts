'use client'

import type { Channel } from '@river-build/sdk'
import { useMemo } from 'react'
import { type ActionConfig, useAction } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

// This hook isnt following the convention, but lets see how it goes
type SendReactionProps =
    | {
          type: 'gdm'
          streamId: string
      }
    | {
          type: 'channel'
          spaceId: string
          channelId: string
      }
    | {
          type: 'dm'
          streamId: string
      }

export const useSendReaction = (
    props: SendReactionProps,
    config?: ActionConfig<Channel['sendReaction']>,
) => {
    const sync = useSyncAgent()
    const namespace = useMemo(() => {
        if (props.type === 'gdm') {
            return sync.gdms.getGdm(props.streamId)
        } else if (props.type === 'channel') {
            return sync.spaces.getSpace(props.spaceId).getChannel(props.channelId)
        }
        if (props.type === 'dm') {
            return sync.dms.getDm(props.streamId)
        }
        throw new Error('Invalid props')
    }, [props, sync.dms, sync.gdms, sync.spaces])
    const { action: sendReaction, ...rest } = useAction(namespace, 'sendReaction', config)

    return {
        sendReaction,
        ...rest,
    }
}
