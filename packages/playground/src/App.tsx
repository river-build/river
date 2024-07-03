import { RouterProvider } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'

import { RiverSyncProvider } from '@river-build/react-sdk'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import { config } from './config/wagmi'

function App() {
    const [queryClient] = useState(() => new QueryClient())
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RiverSyncProvider>
                    <RouterProvider router={router} />
                </RiverSyncProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}

export default App
