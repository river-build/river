'use client'

import { AuthStatus } from '@river-build/sdk'
import { useRiver } from './useRiver'

export const useRiverAuthStatus = () => {
    const { data: status } = useRiver((s) => s.userAuthStatus)
    return {
        status,
        isNone: status === AuthStatus.None,
        isEvaluatingCredentials: status === AuthStatus.EvaluatingCredentials,
        isCredentialed: status === AuthStatus.Credentialed,
        isConnectedToRiver: status === AuthStatus.ConnectedToRiver,
        isDisconnected: status === AuthStatus.Disconnected,
    }
}
