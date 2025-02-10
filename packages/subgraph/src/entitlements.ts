import { EntitlementModuleAdded } from '../generated/templates/Entitlements/EntitlementsManager'
import { Entitlement, Space } from '../generated/schema'

export function handleEntitlementModuleAdded(event: EntitlementModuleAdded): void {
    let spaceId = event.address.toHex()
    let space = Space.load(spaceId)
    if (!space) return

    let entitlementId = event.params.entitlement.toHex() // Unique ID for entitlement module
    let entitlement = new Entitlement(entitlementId)

    entitlement.module = event.params.entitlement // Address of the entitlement module
    entitlement.creator = event.params.caller // Entity that added the module
    entitlement.space = space.id // Correctly link to Space

    entitlement.save()
}
