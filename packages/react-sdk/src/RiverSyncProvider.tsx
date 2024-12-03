'use client'
import type { SyncAgent } from '@river-build/sdk'
import { useEffect, useState } from 'react'
import { RiverSyncContext } from './internals/RiverSyncContext'

/**
 * Provides the sync agent to all hooks usage that interacts with the River network.
 *
 * - If you want to interact with the sync agent directly, you can use the `useSyncAgent` hook.
 * - If you want to interact with the River network using hooks provided by this SDK, you should wrap your App with this provider.
 *
 * You can pass an initial sync agent instance to the provider.
 * This can be useful for persisting authentication.
 *
 * @param props - The props for the provider
 * @returns The provider
 */
export const RiverSyncProvider = (props: {
    /** A initial sync agent instance. Useful for persisting authentication. */
    syncAgent?: SyncAgent
    config?: {
        /** A callback function that is called when the bearer token expires. */
        onTokenExpired?: () => void
    }
    children?: React.ReactNode
}) => {
    const [syncAgent, setSyncAgent] = useState(() => props.syncAgent)

    useEffect(() => {
        setSyncAgent(props.syncAgent)
    }, [props.syncAgent])

    useEffect(() => {
        if (syncAgent) {
            syncAgent.start()
        }
        return () => {
            if (syncAgent) {
                syncAgent.stop()
            }
        }
    }, [syncAgent])

    return (
        <RiverSyncContext.Provider
            value={{
                config: props.config,
                syncAgent,
                setSyncAgent,
            }}
        >
            {props.children}
        </RiverSyncContext.Provider>
    )
}
