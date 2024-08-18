import type { Member, Myself } from '@river-build/sdk'
import { useObservable } from './useObservable'
import { useAction } from './internals/useAction'

export const useNft = (member: Member) => {
    const { data, ...rest } = useObservable(member?.observables.nft)
    return {
        ...data,
        ...rest,
    }
}

export const useSetNft = (member: Myself) => {
    const { action, ...rest } = useAction(member, 'setNft')
    return { setNft: action, ...rest }
}
