import { useCurrentChannel } from '@river-build/react-sdk'
import { Block } from '../ui/block'
import { SendMessage } from './timeline'

export const ChannelTimeline = () => {
    const { data: channel } = useCurrentChannel()
    return (
        <Block title={channel.metadata?.name}>
            <SendMessage />
        </Block>
    )
}
