import { useCallback, useState } from 'react'
import type { SyncAgent } from '@river-build/sdk'
import { useSyncAgent } from '../useSyncAgent'

export type ActionConfig = {
    onError?: (err: Error) => void
    // onSucess?: (data: T) => void
}

type MultipleParams<T> = T extends unknown[] ? T : [T]

export const useAction = <Data, Params>(
    fn: (sync: SyncAgent) => (...args: MultipleParams<Params>) => Promise<Data>,
    config: ActionConfig = {},
) => {
    const [status, setStatus] = useState<'loading' | 'error' | 'success' | 'idle'>('idle')
    const [error, setError] = useState<Error | undefined>()
    const [data, setData] = useState<Data | undefined>()

    const sync = useSyncAgent()

    const action = useCallback(
        async (...args: MultipleParams<Params>) => {
            setStatus('loading')
            try {
                const data = await fn(sync)(...args)
                // config.onSucess?.(result)
                setData(data)
                setStatus('success')
                return data
            } catch (error: unknown) {
                setStatus('error')
                if (error instanceof Error) {
                    setError(error)
                    config.onError?.(error)
                }
                // Let the caller handle the error
                throw error
            } finally {
                setStatus('idle')
            }
        },
        [config, fn, sync],
    )

    return {
        action,
        data,
        error,
        isPending: status === 'loading',
        isSuccess: status === 'success',
        isError: status === 'error',
    }
}
