'use client'
import { SyncAgent } from '@river-build/sdk'
import { createContext } from 'react'

export const SyncContext = createContext<SyncAgent | undefined>(undefined)
