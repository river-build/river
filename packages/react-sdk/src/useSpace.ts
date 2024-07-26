'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Observable, PersistedModel, SpaceModel } from '@river-build/sdk'
import { useSyncAgent } from './useSyncAgent'

export const useSpace = (spaceId: string): PersistedModel<SpaceModel> => {
    const sync = useSyncAgent()
    const space = sync.spaces.getSpace(spaceId)
    const f = useSyncExternalStore(
        (subscriber: () => void) => {
            return space.subscribe(subscriber)
        },
        () => space.value,
    )
    return f
}
