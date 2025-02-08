import {
  Architect__ProxyInitializerSet as Architect__ProxyInitializerSetEvent,
  Initialized as InitializedEvent,
  InterfaceAdded as InterfaceAddedEvent,
  InterfaceRemoved as InterfaceRemovedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  PermissionsAddedToChannelRole as PermissionsAddedToChannelRoleEvent,
  PermissionsRemovedFromChannelRole as PermissionsRemovedFromChannelRoleEvent,
  PermissionsUpdatedForChannelRole as PermissionsUpdatedForChannelRoleEvent,
  PricingModuleAdded as PricingModuleAddedEvent,
  PricingModuleRemoved as PricingModuleRemovedEvent,
  PricingModuleUpdated as PricingModuleUpdatedEvent,
  RoleCreated as RoleCreatedEvent,
  RoleRemoved as RoleRemovedEvent,
  RoleUpdated as RoleUpdatedEvent,
  SpaceCreated as SpaceCreatedEvent,
  Unpaused as UnpausedEvent
} from "../generated/Architect/Architect"
import {
  Architect__ProxyInitializerSet,
  Initialized,
  InterfaceAdded,
  InterfaceRemoved,
  OwnershipTransferred,
  Paused,
  PermissionsAddedToChannelRole,
  PermissionsRemovedFromChannelRole,
  PermissionsUpdatedForChannelRole,
  PricingModuleAdded,
  PricingModuleRemoved,
  PricingModuleUpdated,
  RoleCreated,
  RoleRemoved,
  RoleUpdated,
  SpaceCreated,
  Unpaused
} from "../generated/schema"

export function handleArchitect__ProxyInitializerSet(
  event: Architect__ProxyInitializerSetEvent
): void {
  let entity = new Architect__ProxyInitializerSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.proxyInitializer = event.params.proxyInitializer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInterfaceAdded(event: InterfaceAddedEvent): void {
  let entity = new InterfaceAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.interfaceId = event.params.interfaceId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInterfaceRemoved(event: InterfaceRemovedEvent): void {
  let entity = new InterfaceRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.interfaceId = event.params.interfaceId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePermissionsAddedToChannelRole(
  event: PermissionsAddedToChannelRoleEvent
): void {
  let entity = new PermissionsAddedToChannelRole(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.updater = event.params.updater
  entity.roleId = event.params.roleId
  entity.channelId = event.params.channelId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePermissionsRemovedFromChannelRole(
  event: PermissionsRemovedFromChannelRoleEvent
): void {
  let entity = new PermissionsRemovedFromChannelRole(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.updater = event.params.updater
  entity.roleId = event.params.roleId
  entity.channelId = event.params.channelId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePermissionsUpdatedForChannelRole(
  event: PermissionsUpdatedForChannelRoleEvent
): void {
  let entity = new PermissionsUpdatedForChannelRole(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.updater = event.params.updater
  entity.roleId = event.params.roleId
  entity.channelId = event.params.channelId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePricingModuleAdded(event: PricingModuleAddedEvent): void {
  let entity = new PricingModuleAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.module = event.params.module

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePricingModuleRemoved(
  event: PricingModuleRemovedEvent
): void {
  let entity = new PricingModuleRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.module = event.params.module

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePricingModuleUpdated(
  event: PricingModuleUpdatedEvent
): void {
  let entity = new PricingModuleUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.module = event.params.module

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleCreated(event: RoleCreatedEvent): void {
  let entity = new RoleCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.creator = event.params.creator
  entity.roleId = event.params.roleId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRemoved(event: RoleRemovedEvent): void {
  let entity = new RoleRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.remover = event.params.remover
  entity.roleId = event.params.roleId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleUpdated(event: RoleUpdatedEvent): void {
  let entity = new RoleUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.updater = event.params.updater
  entity.roleId = event.params.roleId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSpaceCreated(event: SpaceCreatedEvent): void {
  let entity = new SpaceCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.tokenId = event.params.tokenId
  entity.space = event.params.space

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
