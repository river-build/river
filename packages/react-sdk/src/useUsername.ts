import { useMemo } from 'react'
import { useSyncAgent } from './useSyncAgent'
import { useObservable } from './useObservable'
import { useAction } from './internals/useAction'

export const useUsername = (spaceId: string, userId: string) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.getMember(userId),
        [sync, spaceId, userId],
    )
    const { data, ...rest } = useObservable(member?.observables.username)
    return {
        ...data,
        ...rest,
    }
}

export const useSetUsername = (spaceId: string) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.getMember(sync.userId),
        [sync, spaceId],
    )
    const { action: setUsername, ...rest } = useAction(member, 'setUsername')
    return { setUsername, ...rest }
}
