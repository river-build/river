import { useRiver } from './useRiver'

export const useUserSpaces = () => {
    const { data, ...rest } = useRiver((s) => s.spaces, {
        onUpdate: (data) => {
            console.log('spaces updated', data)
        },
    })
    return { spaceIds: data.spaceIds, ...rest }
}
