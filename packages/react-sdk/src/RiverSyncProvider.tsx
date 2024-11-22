'use client'
import type { SyncAgent } from '@river-build/sdk'
import { useEffect, useState } from 'react'
import { RiverSyncContext } from './internals/RiverSyncContext'

/**
 * A provider for the RiverSyncContext
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
