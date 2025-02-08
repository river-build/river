import { RoleCreated } from '../generated/templates/Space/Roles'
import { Role, Space } from '../generated/schema'
import { loadSpace } from './utils'

export function handleRoleCreated(event: RoleCreated): void {
    let spaceId = event.address.toHex()
    let space = Space.load(spaceId)
    if (!space) return

    // ✅ Ensure role IDs are unique across different spaces
    let roleId = spaceId + '-' + event.params.roleId.toString() // Unique ID per space
    let role = new Role(roleId)

    role.creator = event.params.creator
    role.roleId = event.params.roleId
    role.space = space.id // Correctly link to the space

    role.save()
}
