import { useMemo } from 'react'
import type { Dm } from '@river-build/sdk'
import { useSyncAgent } from './useSyncAgent'
import { type ObservableConfig, useObservable } from './useObservable'

/**
 * Hook to get the data of a DM.
 * You can use this hook to get DM metadata and if the user has joined the DM.
 * @param streamId - The id of the DM to get the data of.
 * @param config - Configuration options for the observable.
 * @returns The DmModel of the DM.
 */
export const useDm = (streamId: string, config?: ObservableConfig.FromObservable<Dm>) => {
    const sync = useSyncAgent()
    const dm = useMemo(() => sync.dms.getDm(streamId), [streamId, sync])
    return useObservable(dm, config)
}
