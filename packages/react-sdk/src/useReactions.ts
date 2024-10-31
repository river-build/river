import { useMemo } from 'react'
import type { ReactionsMap } from '@river-build/sdk'
import { useSyncAgent } from './useSyncAgent'
import { type ObservableConfig, useObservable } from './useObservable'

// This hook isnt following the convention, but lets see how it goes
type UseReactionsProps =
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

export const useReactions = (
    props: UseReactionsProps,
    config?: ObservableConfig.FromData<ReactionsMap>,
) => {
    const sync = useSyncAgent()
    const room = useMemo(() => {
        if (props.type === 'gdm') {
            return sync.gdms.getGdm(props.streamId)
        }
        if (props.type === 'channel') {
            return sync.spaces.getSpace(props.spaceId).getChannel(props.channelId)
        }
        if (props.type === 'dm') {
            return sync.dms.getDm(props.streamId)
        }
        throw new Error('Invalid props')
    }, [props, sync.dms, sync.gdms, sync.spaces])

    return useObservable(room.timeline.reactions, config)
}
