'use client'
import type { SignerContext, SyncAgent } from '@river-build/sdk'
import { RiverContext } from './RiverContext'

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
