'use client'

import { useContext, useMemo } from 'react'
import { useSyncAgent } from './useSyncAgent'
import { SpaceContext } from './internals/SpaceContext'
import { useObservable } from './useObservable'

export const useSpace = (spaceId: string) => {
    const sync = useSyncAgent()
    const observable = useMemo(() => sync.spaces.getSpace(spaceId), [sync, spaceId])
    return useObservable(observable)
}

// Maybe this should be moved to the internals folder?
export const useCurrentSpaceId = () => {
    const space = useContext(SpaceContext)
    if (!space) {
        throw new Error('No space set, use <SpaceProvider spaceId={spaceId} /> to set one')
    }
    if (!space.spaceId) {
        throw new Error('spaceId is undefined, please check your <SpaceProvider /> usage')
    }

    return space.spaceId
}

export const useCurrentSpace = () => {
    const spaceId = useCurrentSpaceId()
    return useSpace(spaceId)
}
