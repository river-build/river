'use client'
import { SignerContext, SyncAgent } from '@river-build/sdk'
import { createContext } from 'react'

type RiverContext = {
    signerContext: SignerContext
    syncAgent: SyncAgent
}

export const RiverContext = createContext<RiverContext | undefined>(undefined)

type RiverProviderProps = {
    signerContext: SignerContext
    syncAgent: SyncAgent
    children?: React.ReactNode
}

export const RiverProvider = (props: RiverProviderProps) => {
    const { signerContext, syncAgent, children } = props
    return (
        <RiverContext.Provider value={{ signerContext, syncAgent }}>
            {children}
        </RiverContext.Provider>
    )
}
