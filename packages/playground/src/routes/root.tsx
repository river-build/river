import { useAccount, useConnect } from 'wagmi'
import { makeRiverConfig } from '@river-build/sdk'
import { SpaceProvider, useRiverConnection } from '@river-build/react-sdk'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getEthersSigner } from '@/utils/viem-to-ethers'
import { UserAuthStatusBlock } from '@/components/blocks/auth-block'
import { ConnectionBlock } from '@/components/blocks/connection-block'
import { SpacesBlock } from '@/components/blocks/spaces'
import { config } from '@/config/wagmi'

export const ConnectRoute = () => {
    const { isConnected } = useAccount()

    return (
        <div className="flex flex-col gap-6">
            {isConnected ? <ConnectRiver /> : <ChainConnectButton />}
        </div>
    )
}

const ChainConnectButton = () => {
    const { connector: activeConnector } = useAccount()
    const { connectors, connect, error, isPending } = useConnect()

    return (
        <div>
            {connectors.map((connector) => (
                <Button
                    disabled={!connector.ready}
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                >
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

const riverConfig = makeRiverConfig('gamma')

const ConnectRiver = () => {
    const { connect, disconnect, isConnecting, isConnected } = useRiverConnection()

    return (
        <>
            <div>
                <Button
                    onClick={async () => {
                        if (isConnected) {
                            disconnect()
                        } else {
                            const signer = await getEthersSigner(config)
                            connect(signer, { riverConfig })
                        }
                    }}
                >
                    {isConnected ? 'Disconnect' : isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
            </div>
            {isConnected && (
                <>
                    <h2 className="text-lg font-semibold">Connected to Sync Agent</h2>
                    <ConnectedContent />
                </>
            )}
        </>
    )
}

const ConnectedContent = () => {
    const [currentSpaceId, setCurrentSpaceId] = useState<string>()
    // const [currentChannelId, setCurrentChannelId] = useState<string>()

    return (
        <div className="grid grid-cols-4 gap-4">
            <ConnectionBlock />
            <UserAuthStatusBlock />
            <SpaceProvider spaceId={currentSpaceId}>
                <SpacesBlock setCurrentSpaceId={setCurrentSpaceId} />
            </SpaceProvider>
        </div>
    )
}
