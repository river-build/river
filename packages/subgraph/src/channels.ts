import { ChannelCreated } from '../generated/templates/Channels/Channels'
import { Channel, Space } from '../generated/schema'

export function handleChannelCreated(event: ChannelCreated): void {
    let spaceId = event.address.toHex()
    let space = Space.load(spaceId)
    if (!space) return

    let channelId = event.params.channelId // Keep as Bytes (no .toHex())
    let channel = new Channel(channelId.toHex()) // Ensure unique channel ID

    channel.space = space.id // Link to the space
    channel.channelId = channelId // Store as Bytes

    channel.save()
}
