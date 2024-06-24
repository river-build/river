import type { AgentConfig } from '@river-build/sdk'
import { useCallback, useState } from 'react'
import type { ethers } from 'ethers'
import { connectRiver } from './connectRiver'
import { useRiverSync } from './internals/useRiverSync'

export const useConnectRiver = () => {
    const [isConnecting, setConnecting] = useState(false)
    const river = useRiverSync()

    const connect = useCallback(
        async (signer: ethers.Signer, config: Omit<AgentConfig, 'context'>) => {
            if (river?.syncAgent) {
                return
            }

            setConnecting(true)
            return connectRiver(signer, config)
                .then((syncAgent) => river?.setSyncAgent(syncAgent))
                .finally(() => setConnecting(false))
        },
        [river],
    )

    const disconnect = useCallback(() => river?.setSyncAgent(undefined), [river])

    return { connect, disconnect, isConnecting }
}
