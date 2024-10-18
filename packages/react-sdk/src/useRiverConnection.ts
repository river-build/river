import type { SyncAgentConfig } from '@river-build/sdk'
import { useCallback, useMemo, useState } from 'react'
import type { ethers } from 'ethers'
import { connectRiverWithBearerToken, signAndConnect } from './connectRiver'
import { useRiverSync } from './internals/useRiverSync'

type RiverConnectConfig = Omit<SyncAgentConfig, 'context' | 'onTokenExpired'>
export const useRiverConnection = () => {
    const [isConnecting, setConnecting] = useState(false)
    const river = useRiverSync()

    const connect = useCallback(
        async (signer: ethers.Signer, config: RiverConnectConfig) => {
            if (river?.syncAgent) {
                return
            }
            const mergedConfig = {
                ...config,
                ...river?.config,
                onTokenExpired: () => {
                    river?.config?.onTokenExpired?.()
                    river?.setSyncAgent(undefined)
                },
            }
            setConnecting(true)
            return signAndConnect(signer, mergedConfig)
                .then((syncAgent) => {
                    river?.setSyncAgent(syncAgent)
                    return syncAgent
                })
                .finally(() => setConnecting(false))
        },
        [river],
    )

    const connectUsingBearerToken = useCallback(
        async (bearerToken: string, config: RiverConnectConfig) => {
            if (river?.syncAgent) {
                return
            }
            const mergedConfig = {
                ...config,
                ...river?.config,
                onTokenExpired: () => {
                    river?.config?.onTokenExpired?.()
                    river?.setSyncAgent(undefined)
                },
            }
            setConnecting(true)
            return connectRiverWithBearerToken(bearerToken, mergedConfig)
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

    return {
        connect,
        connectUsingBearerToken,
        disconnect,
        isConnecting,
        isConnected,
        env: river?.syncAgent?.config.riverConfig.environmentId,
    }
}
