'use client'

import type { Spaces } from '@river-build/sdk'
import { type ActionConfig, useAction } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

export const useLeaveSpace = (config?: ActionConfig<Spaces['leaveSpace']>) => {
    const sync = useSyncAgent()
    const { action: leaveSpace, ...rest } = useAction(sync.spaces, 'leaveSpace', config)

    return {
        leaveSpace,
        ...rest,
    }
}
