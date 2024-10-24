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

export const useReactions = (
    props: UseReactionsProps,
    config?: ObservableConfig.FromData<ReactionsMap>,
) => {
    const sync = useSyncAgent()
    const room = useMemo(() => {
        if (props.type === 'gdm') {
            return sync.gdms.getGdm(props.streamId)
        }
        return sync.spaces.getSpace(props.spaceId).getChannel(props.channelId)
    }, [props, sync.gdms, sync.spaces])

    return useObservable(room.timeline.reactions, config)
}
