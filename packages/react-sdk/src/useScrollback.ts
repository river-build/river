'use client'

import type { MessageTimeline } from '@river-build/sdk'
import { useMemo } from 'react'
import { type ActionConfig, useAction } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

// This hook isnt following the convention, but lets see how it goes
type ScrollbackProps =
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

export const useScrollback = (
    props: ScrollbackProps,
    config?: ActionConfig<MessageTimeline['scrollback']>,
) => {
    const sync = useSyncAgent()
    const namespace = useMemo(() => {
        if (props.type === 'gdm') {
            return sync.gdms.getGdm(props.streamId).timeline
        } else if (props.type === 'channel') {
            return sync.spaces.getSpace(props.spaceId).getChannel(props.channelId).timeline
        }
        if (props.type === 'dm') {
            return sync.dms.getDm(props.streamId).timeline
        }
        throw new Error('Invalid props')
    }, [props, sync.dms, sync.gdms, sync.spaces])
    const { action: scrollback, ...rest } = useAction(namespace, 'scrollback', config)

    return {
        scrollback,
        ...rest,
    }
}
