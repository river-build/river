import { useRiver, useRiverConnection } from '@river-build/react-sdk'
import { Block } from '../ui/block'

export const ConnectionBlock = () => {
    const { isConnected } = useRiverConnection()
    const { data: nodeUrls } = useRiver((s) => s.riverStreamNodeUrls)

    return (
        <Block title={`Sync Connection ${isConnected ? '✅' : '❌'}`} className="rounded-lg">
            <Block variant="secondary">
                <pre className="overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(nodeUrls, null, 2)}
                </pre>
            </Block>
        </Block>
    )
}
