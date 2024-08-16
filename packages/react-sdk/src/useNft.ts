import type { Member } from '@river-build/sdk'
import { useObservable } from './useObservable'
import { useAction } from './internals/useAction'

export const useNft = (member: Member) => {
    const { data, ...rest } = useObservable(member?.observables.nft)
    return {
        ...data,
        ...rest,
    }
}

export const useSetNft = (member: Member | undefined) => {
    const { action, ...rest } = useAction(member, 'setNft')
    return { setNft: action, ...rest }
}
