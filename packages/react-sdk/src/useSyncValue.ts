'use client'
import type { Observable, SyncAgent } from '@river-build/sdk'
import { useObservable } from './useObservable'
import { useSyncAgent } from './useSyncAgent'

// TODO: maybe we should call this useRiver?
export const useSyncValue = <T>(fn: (sync: SyncAgent) => Observable<T>) => {
    const syncAgent = useSyncAgent()
    return useObservable(syncAgent ? fn(syncAgent) : undefined)
}
