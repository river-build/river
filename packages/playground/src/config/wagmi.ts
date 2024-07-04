import { http } from 'viem'
import { base, baseSepolia, foundry } from 'viem/chains'
import { createConfig } from 'wagmi'

/// If you're using Foundry, run yarn anvil to get the test accounts private keys.
/// This way you can interact with the foundry chain.
export const config = createConfig({
    chains: [base, baseSepolia, foundry],
    transports: {
        [foundry.id]: http(),
        [base.id]: http(),
        [baseSepolia.id]: http(),
    },
})
