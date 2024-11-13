'use client'

import type { Gdms } from '@river-build/sdk'
import { type ActionConfig, useAction } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

export const useLeaveGdm = (config?: ActionConfig<Gdms['leaveGdm']>) => {
    const sync = useSyncAgent()
    const { action: leaveGdm, ...rest } = useAction(sync.gdms, 'leaveGdm', config)

    return {
        leaveGdm,
        ...rest,
    }
}
