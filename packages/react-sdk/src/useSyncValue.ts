'use client'
import type { Observable, SyncAgent } from '@river-build/sdk'
import { useObservable } from './useObservable'
import { useSyncAgent } from './useSyncAgent'

export const useSyncValue = <T>(fn: (sync: SyncAgent) => Observable<T>) => {
    const syncAgent = useSyncAgent()
    return useObservable(fn(syncAgent))
}
