'use client'
import type { SyncAgent } from '@river-build/sdk'
import { SyncContext } from './SyncContext'

type SyncProviderProps = {
    syncAgent: SyncAgent
    children?: React.ReactNode
}

export const SyncContextProvider = (props: SyncProviderProps) => {
    const { syncAgent, children } = props
    return <SyncContext.Provider value={syncAgent}>{children}</SyncContext.Provider>
}
