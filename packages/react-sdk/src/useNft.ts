import { useMemo } from 'react'
import { useSyncAgent } from './useSyncAgent'
import { useObservable } from './useObservable'
import { useAction } from './internals/useAction'

export const useNft = (spaceId: string, userId: string) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.getMember(userId),
        [sync, spaceId, userId],
    )
    const { data, ...rest } = useObservable(member?.observables.nft)
    return {
        ...data,
        ...rest,
    }
}

export const useSetNft = (spaceId: string) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.getMember(sync.userId),
        [sync, spaceId],
    )
    const { action: setNft, ...rest } = useAction(member, 'setNft')
    return { setNft, ...rest }
}
