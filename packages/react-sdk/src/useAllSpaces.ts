import { useRiver } from './useRiver'

export const useAllSpaces = () => {
    const { data, ...rest } = useRiver((s) => s.spaces)
    return { spaceIds: data.spaceIds, ...rest }
}
