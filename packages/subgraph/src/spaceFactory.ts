import { SpaceCreated as SpaceCreatedEvent } from '../generated/Architect/Architect'
import { SpaceCreated, Space } from '../generated/schema'
import {
    Role as RoleTemplate,
    Channels as ChannelsTemplate,
    Entitlements as EntitlementsTemplate,
} from '../generated/templates' // Import the Space template

export function handleCreateSpace(event: SpaceCreatedEvent): void {
    let spaceId = event.params.space.toHex() // Use Space contract address as ID

    // Ensure the Space entity exists
    let space = Space.load(spaceId)
    if (!space) {
        space = new Space(spaceId)
        space.owner = event.params.owner
        space.tokenId = event.params.tokenId
        space.space = event.params.space
        space.save()
    }

    // Create a SpaceCreated entity for tracking
    let spaceCreated = new SpaceCreated(spaceId)
    spaceCreated.owner = event.params.owner
    spaceCreated.tokenId = event.params.tokenId
    spaceCreated.space = space.id
    spaceCreated.save()

    // ✅ Ensure every new Space contract is tracked dynamically
    RoleTemplate.create(event.params.space)
    ChannelsTemplate.create(event.params.space)
    EntitlementsTemplate.create(event.params.space)
}
