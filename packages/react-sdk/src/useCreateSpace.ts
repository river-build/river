'use client'

import { type ActionConfig, useAction } from './internals/useAction'

export const useCreateSpace = (config: ActionConfig = {}) => {
    const { action, ...rest } = useAction((sync) => sync.spaces.createSpace, config)
    return { createSpace: action, ...rest }
}
