'use client'
import { useContext } from 'react'
import { SyncContext } from './SyncContext'

export const useSyncAgent = () => {
    const sync = useContext(SyncContext)

    if (!sync) {
        throw new Error('No SyncAgent set, use SyncContextProvider to set one')
    }

    return sync
}
