'use client'

import { useCallback, useState } from 'react'
import type { Spaces } from '@river-build/sdk'
import { useSyncAgent } from './useSyncAgent'

export const useCreateSpace = () => {
    const sync = useSyncAgent()
    const [isLoading, setIsLoading] = useState(false)

    const createSpace: Spaces['createSpace'] = useCallback(
        async (config, signer) => {
            setIsLoading(true)
            return sync.spaces.createSpace(config, signer).finally(() => setIsLoading(false))
        },
        [sync],
    )
    return { createSpace, isLoading }
}
