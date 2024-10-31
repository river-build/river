import type { Member } from '@river-build/sdk'
import { useMemo } from 'react'
import { useMember } from './useMember'
import type { ObservableConfig } from './useObservable'
import { useSyncAgent } from './useSyncAgent'
import { getRoom } from './utils'

export const useRoomMember = (
    props: { streamId: string; userId: string },
    config?: ObservableConfig.FromObservable<Member>,
) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => getRoom(sync, props.streamId).members.get(props.userId),
        [sync, props],
    )
    return useMember(member, config)
}
