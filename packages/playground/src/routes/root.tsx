import { useAccount, useConnect } from 'wagmi'
import { useRiverConnection } from '@river-build/react-sdk'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserAuthStatusBlock } from '@/components/blocks/auth-block'
import { ConnectionBlock } from '@/components/blocks/connection-block'
import { SpacesBlock } from '@/components/blocks/spaces'
import { type Env, RiverEnvSwitcher } from '@/components/dialog/env-switcher'
import { TimelineBlock } from '@/components/blocks/timeline'
import { ChannelsBlock } from '@/components/blocks/channels'
import { ChannelProvider } from '@/hooks/current-channel'
import { SpaceProvider } from '@/hooks/current-space'

export const ConnectRoute = () => {
    const { isConnected: isWalletConnected } = useAccount()

    return (
        <div className="flex flex-col gap-6">
            {isWalletConnected ? <ConnectRiver /> : <ChainConnectButton />}
        </div>
    )
}

const ChainConnectButton = () => {
    const { connector: activeConnector } = useAccount()
    const { connectors, connect, error, isPending } = useConnect()

    return (
        <div>
            {connectors.map((connector) => (
                <Button key={connector.uid} onClick={() => connect({ connector })}>
                    {activeConnector?.id === connector.id
                        ? `Connected - ${connector.name}`
                        : connector.name}
                    {isPending && ' (connecting)'}
                </Button>
            ))}
            {error && <div>{error.message}</div>}
        </div>
    )
}

const ConnectRiver = () => {
    const [envId, setEnv] = useState<Env['id']>('gamma')
    const { isConnected } = useRiverConnection()

    return (
        <>
            {isConnected ? (
                <>
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold">Connected to Sync Agent</h2>
                        <RiverEnvSwitcher currentEnv={envId} setEnv={setEnv} />
                    </div>
                    <ConnectedContent />
                </>
            ) : (
                <div className="max-w-lg">
                    <RiverEnvSwitcher currentEnv={envId} setEnv={setEnv} />
                </div>
            )}
        </>
    )
}

const ConnectedContent = () => {
    const [currentSpaceId, setCurrentSpaceId] = useState<string>()
    const [currentChannelId, setCurrentChannelId] = useState<string>()

    return (
        <div className="grid grid-cols-4 gap-4">
            <ConnectionBlock />
            <UserAuthStatusBlock />
            <SpacesBlock setCurrentSpaceId={setCurrentSpaceId} />
            <SpaceProvider spaceId={currentSpaceId}>
                <ChannelsBlock setCurrentChannelId={setCurrentChannelId} />
                <ChannelProvider channelId={currentChannelId}>
                    <TimelineBlock />
                </ChannelProvider>
            </SpaceProvider>
        </div>
    )
}
