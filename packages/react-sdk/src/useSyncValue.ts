'use client'
import type { Identifiable, PersistedObservable, SyncAgent } from '@river-build/sdk'
import { useObservable } from './useObservable'
import { useSyncAgent } from './useSyncAgent'

// TODO: maybe we should call this useRiver?
export function useSyncValue<T extends Identifiable>(
    fn: (sync: SyncAgent) => PersistedObservable<T>,
) {
    const syncAgent = useSyncAgent()
    return useObservable(syncAgent ? fn(syncAgent) : undefined)
}
