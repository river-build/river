import { useMemo } from 'react'
import { useSyncAgent } from './useSyncAgent'
import { useObservable } from './useObservable'
import { useAction } from './internals/useAction'

export const useDisplayName = (spaceId: string, userId: string) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.getMember(userId),
        [sync, spaceId, userId],
    )
    const { data, ...rest } = useObservable(member?.observables.displayName)
    return {
        ...data,
        ...rest,
    }
}

export const useSetDisplayName = (spaceId: string) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.getMember(sync.userId),
        [sync, spaceId],
    )
    const { action: setDisplayName, ...rest } = useAction(member, 'setDisplayName')
    return { setDisplayName, ...rest }
}
