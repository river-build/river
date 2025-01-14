import EntitlementCheckerAbi from '@river-build/generated/dev/abis/IEntitlementChecker.abi'

import { getContract } from 'viem'
import { base } from 'viem/chains'
import { createPublicClient, http } from 'viem'
 
export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

const contract = getContract({
    address: '0x7c0422b31401C936172C897802CF0373B35B7698',
    abi: EntitlementCheckerAbi,
    // 1a. Insert a single client
    client: publicClient,
    // 1b. Or public and/or wallet clients
  })