'use client'

import { useEffect, useMemo, useState } from 'react'
import { Observable, PersistedModel, SpaceModel } from '@river-build/sdk'
import { useSyncAgent } from './useSyncAgent'

export const useSpace = (spaceId: string): PersistedModel<SpaceModel> => {
    const sync = useSyncAgent()
    console.log('useSpace', spaceId)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_value, setValue] = useState<PersistedModel<SpaceModel>>(
        sync.spaces.getSpace(spaceId).value,
    )

    useEffect(() => {
        const subFn = (space: PersistedModel<SpaceModel>) => {
            setValue(space)
        }
        const sub = sync.spaces.getSpace(spaceId).subscribe(subFn)
        return () => sub.unsubscribe(subFn)
    }, [spaceId, sync.spaces])

    return sync.spaces.getSpace(spaceId).value
}
