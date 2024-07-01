'use client'

import { useRiver } from './useRiver'

/*
 * Returns a list with all space ids.
 */
export const useSpaceList = () => {
    const { data, ...rest } = useRiver((s) => s.spaces)
    return { spaceIds: data.spaceIds, ...rest }
}
