import { useAccount, useConnect } from 'wagmi'
import { makeRiverConfig } from '@river-build/sdk'
import { useConnectRiver, useConnection, useSyncValue } from '@river-build/react-sdk'
import { Button } from '@/components/ui/button'
import { useEthersSigner } from '@/utils/viem-to-ethers'

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
    const { connect, connectors, error, isLoading, pendingConnector } = useConnect()

    return (
        <>
            {connectors.map((connector) => (
                <Button
                    disabled={!connector.ready}
                    key={connector.id}
                    onClick={() => connect({ connector })}
                >
                    {activeConnector?.id === connector.id
                        ? `Connected - ${connector.name}`
                        : connector.name}
                    {isLoading && pendingConnector?.id === connector.id && ' (connecting)'}
                </Button>
            ))}
            {error && <div>{error.message}</div>}
        </>
    )
}

const riverConfig = makeRiverConfig('gamma')

const ConnectRiver = () => {
    const signer = useEthersSigner()
    const { connect, disconnect, isConnecting } = useConnectRiver()
    const { isConnected } = useConnection()

    return (
        <>
            <div>
                <Button
                    onClick={() => {
                        if (isConnected) {
                            disconnect()
                        } else {
                            if (signer) {
                                connect(signer, { riverConfig })
                            }
                        }
                    }}
                >
                    {isConnected ? 'Disconnect' : isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
            </div>
            {isConnected ? (
                <>
                    <h2 className="text-lg font-semibold">Connected to Sync Agent</h2>
                    <ConnectedContent />
                </>
            ) : (
                <h2 className="text-lg font-semibold">Not Connected</h2>
            )}
        </>
    )
}

const ConnectedContent = () => {
    const { data: nodeUrls } = useSyncValue((s) => s.riverConnection.nodeUrls)
    return <span>{JSON.stringify(nodeUrls)}</span>
}
