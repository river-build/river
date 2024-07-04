'use client'

import type { Channel } from '@river-build/sdk'
import { useCallback, useState } from 'react'
import { useCurrentChannelId } from './useChannel'
import { useCurrentSpaceId } from './useSpace'
import { type ActionConfig } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

// TODO: boilerplate that should be reduced with useAction internal hook.
/// see: https://github.com/river-build/river/pull/326#discussion_r1663381191
export const useSendMessage = (config: ActionConfig = {}) => {
    const spaceId = useCurrentSpaceId()
    const channelId = useCurrentChannelId()

    const sync = useSyncAgent()
    const [status, setStatus] = useState<'loading' | 'error' | 'success' | 'idle'>('idle')
    const [data, setData] = useState<Awaited<ReturnType<Channel['sendMessage']>>>()
    const [error, setError] = useState<Error | undefined>()

    const action: Channel['sendMessage'] = useCallback(
        async (...args) => {
            setStatus('loading')
            try {
                const data = await sync.spaces
                    .getSpace(spaceId)
                    .getChannel(channelId)
                    .sendMessage(...args)
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
        [channelId, config, spaceId, sync.spaces],
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
