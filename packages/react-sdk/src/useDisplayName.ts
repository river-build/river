import type { Member, Myself } from '@river-build/sdk'
import { useObservable } from './useObservable'
import { useAction } from './internals/useAction'

export const useDisplayName = (member: Member) => {
    const { data, ...rest } = useObservable(member?.observables.displayName)
    return {
        ...data,
        ...rest,
    }
}

export const useSetDisplayName = (member: Myself) => {
    const { action, ...rest } = useAction(member, 'setDisplayName')
    return { setDisplayName: action, ...rest }
}
