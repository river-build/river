'use client'

import type { Spaces } from '@river-build/sdk'
import { useCallback, useState } from 'react'
import { type ActionConfig } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

// TODO: boilerplate that should be reduced with useAction internal hook.
/// see: https://github.com/river-build/river/pull/326#discussion_r1663381191
export const useCreateSpace = (config: ActionConfig = {}) => {
    const sync = useSyncAgent()
    const [status, setStatus] = useState<'loading' | 'error' | 'success' | 'idle'>('idle')
    const [data, setData] = useState<Awaited<ReturnType<Spaces['createSpace']>>>()
    const [error, setError] = useState<Error | undefined>()

    const action: Spaces['createSpace'] = useCallback(
        async (...args) => {
            setStatus('loading')
            try {
                const data = await sync.spaces.createSpace(...args)
                setData(data)
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
        createSpace: action,
        status,
        isPending: status === 'loading',
        isError: status === 'error',
        isLoaded: status === 'success',
        error,
        data,
    }
}
