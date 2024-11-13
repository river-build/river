'use client'

import type { Space } from '@river-build/sdk'
import { useMemo } from 'react'
import { type ActionConfig, useAction } from './internals/useAction'
import { useSyncAgent } from './useSyncAgent'

export const useLeaveChannel = (spaceId: string, config?: ActionConfig<Space['leaveChannel']>) => {
    const sync = useSyncAgent()
    const space = useMemo(() => sync.spaces.getSpace(spaceId), [spaceId, sync])
    const { action: leaveChannel, ...rest } = useAction(space, 'leaveChannel', config)

    return {
        leaveChannel,
        ...rest,
    }
}
