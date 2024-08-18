import type { Member, Myself } from '@river-build/sdk'
import { useObservable } from './useObservable'
import { useAction } from './internals/useAction'

export const useEnsAddress = (member: Member) => {
    const { data, ...rest } = useObservable(member?.observables.ensAddress)
    return {
        ...data,
        ...rest,
    }
}

export const useSetEnsAddress = (member: Myself) => {
    const { action, ...rest } = useAction(member, 'setEnsAddress')
    return { setEnsAddress: action, ...rest }
}
