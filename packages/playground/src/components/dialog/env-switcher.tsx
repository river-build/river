import {
    useAccount,
    useDisconnect,
    useSendTransaction,
    useSwitchNetwork,
    useWaitForTransaction,
} from 'wagmi'

import { base, baseSepolia, foundry } from 'viem/chains'
import { useRiverConnection } from '@river-build/react-sdk'
import { makeRiverConfig } from '@river-build/sdk'
import { privateKeyToAccount } from 'viem/accounts'
import { parseEther } from 'viem'
import { useState } from 'react'
import { deleteAuth, storeAuth } from '@/utils/persist-auth'
import { useEthersSigner } from '@/utils/viem-to-ethers'
import { Button } from '../ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

const environments = [
    { id: 'gamma', name: 'Gamma', chainId: baseSepolia.id },
    { id: 'omega', name: 'Omega', chainId: base.id },
    { id: 'local_multi', name: 'Local Multi', chainId: foundry.id },
] as const

export type Env = (typeof environments)[number]

type RiverEnvSwitcherProps = {
    currentEnv: Env['id']
    setEnv: (envId: Env['id']) => void
}

export const RiverEnvSwitcher = (props: RiverEnvSwitcherProps) => {
    const { currentEnv, setEnv } = props
    const { connect, connectWithToken, disconnect, isConnected } = useRiverConnection()
    const { switchNetwork } = useSwitchNetwork()
    const { disconnect: disconnectWallet } = useDisconnect()
    const signer = useEthersSigner()
    const [authToken, setAuthToken] = useState('')

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    {isConnected ? 'Switch environment or disconnect' : `Connect to River`}
                </Button>
            </DialogTrigger>
            <DialogContent className="gap-6">
                <DialogHeader>
                    <DialogTitle>
                        {isConnected ? 'Switch environment' : 'Connect to River'}
                    </DialogTitle>
                    <DialogDescription>
                        {isConnected
                            ? 'Select the environment you want to switch to. You can also disconnect.'
                            : 'Select the environment you want to connect to.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="auth-token">Auth Token</Label>
                        <Input
                            id="auth-token"
                            placeholder="Paste your auth token here"
                            value={authToken}
                            onChange={(e) => setAuthToken(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Select an environment</span>
                        {environments.map(({ id, name, chainId }) => (
                            <DialogClose asChild key={id}>
                                <Button
                                    variant="outline"
                                    disabled={currentEnv === id && isConnected}
                                    onClick={async () => {
                                        if (!signer) {
                                            console.log('No signer')
                                            return
                                        }
                                        switchNetwork?.(chainId)
                                        setEnv(id)
                                        const riverConfig = makeRiverConfig(id)
                                        if (authToken) {
                                            await connectWithToken(authToken, {
                                                riverConfig,
                                            }).then((sync) => {
                                                if (sync?.config.context) {
                                                    storeAuth(sync?.config.context, riverConfig)
                                                }
                                            })
                                        } else {
                                            await connect(signer, {
                                                riverConfig,
                                            }).then((sync) => {
                                                if (sync?.config.context) {
                                                    storeAuth(sync?.config.context, riverConfig)
                                                }
                                            })
                                        }
                                    }}
                                >
                                    {name} {isConnected && currentEnv === id && '(connected)'}
                                </Button>
                            </DialogClose>
                        ))}
                        {currentEnv === 'local_multi' && <FundWallet />}
                    </div>
                    {isConnected && (
                        <Button
                            className="w-full"
                            variant="destructive"
                            onClick={() => {
                                disconnect()
                                disconnectWallet()
                                deleteAuth()
                            }}
                        >
                            Disconnect
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Anvil default funded address with balance
const AnvilAccount = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
)

const FundWallet = () => {
    const { address } = useAccount()

    const { sendTransaction, data: tx, isLoading } = useSendTransaction()
    const { isSuccess, isLoading: isTxPending } = useWaitForTransaction({ hash: tx?.hash })

    return (
        <>
            <Button
                variant="outline"
                disabled={isLoading || isTxPending}
                onClick={() =>
                    sendTransaction({
                        account: AnvilAccount,
                        chainId: foundry.id,
                        value: parseEther('0.1'),
                        to: address as `0x${string}`,
                    })
                }
            >
                Fund Local Wallet {isSuccess && '✅'} {(isLoading || isTxPending) && '⏳'}
            </Button>
        </>
    )
}
