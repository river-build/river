import type { SyncAgentConfig } from '@river-build/sdk'
import { useCallback, useMemo, useState } from 'react'
import type { ethers } from 'ethers'
import { connectRiverWithToken, signAndConnect } from './connectRiver'
import { useRiverSync } from './internals/useRiverSync'

export const useRiverConnection = () => {
    const [isConnecting, setConnecting] = useState(false)
    const river = useRiverSync()

    const connect = useCallback(
        async (signer: ethers.Signer, config: Omit<SyncAgentConfig, 'context'>) => {
            if (river?.syncAgent) {
                return
            }

            setConnecting(true)
            return signAndConnect(signer, config)
                .then((syncAgent) => {
                    river?.setSyncAgent(syncAgent)
                    return syncAgent
                })
                .finally(() => setConnecting(false))
        },
        [river],
    )

    const connectWithToken = useCallback(
        async (authToken: string, config: Omit<SyncAgentConfig, 'context'>) => {
            if (river?.syncAgent) {
                return
            }
            setConnecting(true)
            return connectRiverWithToken(authToken, config)
                .then((syncAgent) => {
                    river?.setSyncAgent(syncAgent)
                    return syncAgent
                })
                .finally(() => setConnecting(false))
        },
        [river],
    )

    const disconnect = useCallback(() => river?.setSyncAgent(undefined), [river])

    const isConnected = useMemo(() => !!river?.syncAgent, [river])

    return { connect, connectWithToken, disconnect, isConnecting, isConnected }
}
