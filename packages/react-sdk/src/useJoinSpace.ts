'use client'

import type { Space } from '@river-build/sdk'
import { useCallback, useState } from 'react'
import { type ActionConfig } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

export const useJoinSpace = (config: ActionConfig<Space['join']> = {}) => {
    const sync = useSyncAgent()

    const [status, setStatus] = useState<'loading' | 'error' | 'success' | 'idle'>('idle')
    const [error, setError] = useState<Error | undefined>()

    // TODO: keep an eye on this -- lets see if other hooks will require a similar approach
    // We dont have a Spaces.joinById method, so we need to get the space and then use Space.join method
    // Unfortunately, this isnt possible with the current useAction(namespace, method) approach
    const action = useCallback(
        async (spaceId: string, ...args: Parameters<Space['join']>) => {
            setStatus('loading')
            try {
                const data = await sync.spaces.getSpace(spaceId).join(...args)
                setStatus('success')
                return data
            } catch (error: unknown) {
                setStatus('error')
                if (error instanceof Error) {
                    setError(error)
                    config.onError?.(error)
                }
                throw error
            } finally {
                setStatus('idle')
            }
        },
        [config, sync.spaces],
    )

    return {
        joinSpace: action,
        error,
        isPending: status === 'loading',
        isSuccess: status === 'success',
        isError: status === 'error',
    }
}
