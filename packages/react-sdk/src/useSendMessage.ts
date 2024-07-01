'use client'

import { useCallback, useState } from 'react'
import { useCurrentChannel } from './useChannel'

export const useSendMessage = () => {
    const channel = useCurrentChannel()
    const [isSending, setSending] = useState(false)
    const send = useCallback(
        async (message: string) => {
            setSending(true)
            return channel.sendMessage(message).finally(() => setSending(false))
        },
        [channel],
    )

    return { send, isSending }
}
