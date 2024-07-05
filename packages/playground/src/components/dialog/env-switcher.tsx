import { useDisconnect, useSwitchChain } from 'wagmi'
import { base, baseSepolia, foundry } from 'viem/chains'
import { useRiverConnection } from '@river-build/react-sdk'
import { makeRiverConfig } from '@river-build/sdk'
import { config } from '@/config/wagmi'
import { getEthersSigner } from '@/utils/viem-to-ethers'
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

const environments = [
    { id: 'gamma', name: 'Gamma', chainId: baseSepolia.id },
    { id: 'omega', name: 'Omega', chainId: base.id },
    { id: 'local_single', name: 'Local Single', chainId: foundry.id },
] as const

export type Env = (typeof environments)[number]

type RiverEnvSwitcherProps = {
    currentEnv: Env['id']
    setEnv: (envId: Env['id']) => void
}
export const RiverEnvSwitcher = (props: RiverEnvSwitcherProps) => {
    const { currentEnv, setEnv } = props
    const { switchChain } = useSwitchChain({ config })

    const { connect, disconnect, isConnected } = useRiverConnection()
    const { disconnect: disconnectWallet } = useDisconnect()

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    {isConnected ? 'Switch environment or disconnect' : `Connect to River`}
                </Button>
            </DialogTrigger>
            <DialogContent>
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
                <div className="flex flex-col gap-2">
                    {environments.map(({ id, name, chainId }) => (
                        <DialogClose asChild key={id}>
                            <Button
                                variant="outline"
                                disabled={currentEnv === id && isConnected}
                                onClick={async () => {
                                    switchChain({ chainId })
                                    setEnv(id)

                                    const signer = await getEthersSigner(config)
                                    await connect(signer, { riverConfig: makeRiverConfig(id) })
                                }}
                            >
                                {name} {isConnected && currentEnv === id && '(connected)'}
                            </Button>
                        </DialogClose>
                    ))}
                    {isConnected && (
                        <Button
                            variant="destructive"
                            onClick={() => {
                                disconnect()
                                disconnectWallet()
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
