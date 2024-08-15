import { useMemo } from 'react'
import { useSyncAgent } from './useSyncAgent'
import { useObservable } from './useObservable'
import { useAction } from './internals/useAction'

export const useEnsAddress = (spaceId: string, userId: string) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.getMember(userId),
        [sync, spaceId, userId],
    )
    const { data, ...rest } = useObservable(member?.observables.ensAddress)
    return {
        ...data,
        ...rest,
    }
}

export const useSetEnsAddress = (spaceId: string) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.getMember(sync.userId),
        [sync, spaceId],
    )
    const { action: setEnsAddress, ...rest } = useAction(member, 'setEnsAddress')
    return { setEnsAddress, ...rest }
}
