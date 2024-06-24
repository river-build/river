import { useRiverSync } from './internals/useRiverSync'

export const useConnection = () => {
    const river = useRiverSync()
    // TODO: check the case that there's a sync agent but it's disconnected by any reason
    return { isConnected: !!river?.syncAgent }
}
