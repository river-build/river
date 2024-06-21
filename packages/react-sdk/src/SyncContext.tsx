'use client'
import { SyncAgent } from '@river-build/sdk'
import { createContext } from 'react'

export const SyncContext = createContext<SyncAgent | undefined>(undefined)

type SyncProviderProps = {
    syncAgent: SyncAgent
    children?: React.ReactNode
}

export const SyncContextProvider = (props: SyncProviderProps) => {
    const { syncAgent, children } = props
    return <SyncContext.Provider value={syncAgent}>{children}</SyncContext.Provider>
}
