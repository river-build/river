'use client'
import { Identifiable, Observable, PersistedObservable, SyncAgent } from '@river-build/sdk'
import { type ObservableConfig, useObservable } from './useObservable'
import { useSyncAgent } from './useSyncAgent'

type SyncSelector = SyncAgent['observables']

export function useRiver<T extends Identifiable>(
    selector: (sync: SyncSelector) => PersistedObservable<T>,
    config?: ObservableConfig<T>,
): ReturnType<typeof useObservable<T>>
export function useRiver<T>(
    selector: (sync: SyncSelector) => Observable<T>,
    config?: ObservableConfig<T>,
): ReturnType<typeof useObservable<T & Identifiable>>
export function useRiver<T>(
    selector: (sync: SyncSelector) => Observable<T> | PersistedObservable<T & Identifiable>,
    config?: ObservableConfig<T>,
) {
    const syncAgent = useSyncAgent()
    const observable = selector(syncAgent.observables)

    if (observable instanceof PersistedObservable) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useObservable(observable as PersistedObservable<T & Identifiable>, config)
    } else {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useObservable(observable as Observable<T>, config)
    }
}
