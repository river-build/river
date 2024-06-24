'use client'
import { SignerContext, SyncAgent } from '@river-build/sdk'
import { createContext } from 'react'

type RiverContext = {
    signerContext: SignerContext
    syncAgent: SyncAgent
}

export const RiverContext = createContext<RiverContext | undefined>(undefined)
