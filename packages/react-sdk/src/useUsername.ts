import type { Member } from '@river-build/sdk'
import { useObservable } from './useObservable'
import { useAction } from './internals/useAction'

export const useUsername = (member: Member) => {
    const { data, ...rest } = useObservable(member?.observables.username)
    return {
        ...data,
        ...rest,
    }
}

export const useSetUsername = (member: Member | undefined) => {
    const { action: setUsername, ...rest } = useAction(member, 'setUsername')
    return { setUsername, ...rest }
}
