// import { newMockEvent } from "matchstick-as"
// import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
// import {
//   Architect__ProxyInitializerSet,
//   Initialized,
//   InterfaceAdded,
//   InterfaceRemoved,
//   OwnershipTransferred,
//   Paused,
//   PermissionsAddedToChannelRole,
//   PermissionsRemovedFromChannelRole,
//   PermissionsUpdatedForChannelRole,
//   PricingModuleAdded,
//   PricingModuleRemoved,
//   PricingModuleUpdated,
//   RoleCreated,
//   RoleRemoved,
//   RoleUpdated,
//   SpaceCreated,
//   Unpaused
// } from "../generated/Architect/Architect"

// export function createArchitect__ProxyInitializerSetEvent(
//   proxyInitializer: Address
// ): Architect__ProxyInitializerSet {
//   let architectProxyInitializerSetEvent =
//     changetype<Architect__ProxyInitializerSet>(newMockEvent())

//   architectProxyInitializerSetEvent.parameters = new Array()

//   architectProxyInitializerSetEvent.parameters.push(
//     new ethereum.EventParam(
//       "proxyInitializer",
//       ethereum.Value.fromAddress(proxyInitializer)
//     )
//   )

//   return architectProxyInitializerSetEvent
// }

// export function createInitializedEvent(version: BigInt): Initialized {
//   let initializedEvent = changetype<Initialized>(newMockEvent())

//   initializedEvent.parameters = new Array()

//   initializedEvent.parameters.push(
//     new ethereum.EventParam(
//       "version",
//       ethereum.Value.fromUnsignedBigInt(version)
//     )
//   )

//   return initializedEvent
// }

// export function createInterfaceAddedEvent(interfaceId: Bytes): InterfaceAdded {
//   let interfaceAddedEvent = changetype<InterfaceAdded>(newMockEvent())

//   interfaceAddedEvent.parameters = new Array()

//   interfaceAddedEvent.parameters.push(
//     new ethereum.EventParam(
//       "interfaceId",
//       ethereum.Value.fromFixedBytes(interfaceId)
//     )
//   )

//   return interfaceAddedEvent
// }

// export function createInterfaceRemovedEvent(
//   interfaceId: Bytes
// ): InterfaceRemoved {
//   let interfaceRemovedEvent = changetype<InterfaceRemoved>(newMockEvent())

//   interfaceRemovedEvent.parameters = new Array()

//   interfaceRemovedEvent.parameters.push(
//     new ethereum.EventParam(
//       "interfaceId",
//       ethereum.Value.fromFixedBytes(interfaceId)
//     )
//   )

//   return interfaceRemovedEvent
// }

// export function createOwnershipTransferredEvent(
//   previousOwner: Address,
//   newOwner: Address
// ): OwnershipTransferred {
//   let ownershipTransferredEvent =
//     changetype<OwnershipTransferred>(newMockEvent())

//   ownershipTransferredEvent.parameters = new Array()

//   ownershipTransferredEvent.parameters.push(
//     new ethereum.EventParam(
//       "previousOwner",
//       ethereum.Value.fromAddress(previousOwner)
//     )
//   )
//   ownershipTransferredEvent.parameters.push(
//     new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
//   )

//   return ownershipTransferredEvent
// }

// export function createPausedEvent(account: Address): Paused {
//   let pausedEvent = changetype<Paused>(newMockEvent())

//   pausedEvent.parameters = new Array()

//   pausedEvent.parameters.push(
//     new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
//   )

//   return pausedEvent
// }

// export function createPermissionsAddedToChannelRoleEvent(
//   updater: Address,
//   roleId: BigInt,
//   channelId: Bytes
// ): PermissionsAddedToChannelRole {
//   let permissionsAddedToChannelRoleEvent =
//     changetype<PermissionsAddedToChannelRole>(newMockEvent())

//   permissionsAddedToChannelRoleEvent.parameters = new Array()

//   permissionsAddedToChannelRoleEvent.parameters.push(
//     new ethereum.EventParam("updater", ethereum.Value.fromAddress(updater))
//   )
//   permissionsAddedToChannelRoleEvent.parameters.push(
//     new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
//   )
//   permissionsAddedToChannelRoleEvent.parameters.push(
//     new ethereum.EventParam(
//       "channelId",
//       ethereum.Value.fromFixedBytes(channelId)
//     )
//   )

//   return permissionsAddedToChannelRoleEvent
// }

// export function createPermissionsRemovedFromChannelRoleEvent(
//   updater: Address,
//   roleId: BigInt,
//   channelId: Bytes
// ): PermissionsRemovedFromChannelRole {
//   let permissionsRemovedFromChannelRoleEvent =
//     changetype<PermissionsRemovedFromChannelRole>(newMockEvent())

//   permissionsRemovedFromChannelRoleEvent.parameters = new Array()

//   permissionsRemovedFromChannelRoleEvent.parameters.push(
//     new ethereum.EventParam("updater", ethereum.Value.fromAddress(updater))
//   )
//   permissionsRemovedFromChannelRoleEvent.parameters.push(
//     new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
//   )
//   permissionsRemovedFromChannelRoleEvent.parameters.push(
//     new ethereum.EventParam(
//       "channelId",
//       ethereum.Value.fromFixedBytes(channelId)
//     )
//   )

//   return permissionsRemovedFromChannelRoleEvent
// }

// export function createPermissionsUpdatedForChannelRoleEvent(
//   updater: Address,
//   roleId: BigInt,
//   channelId: Bytes
// ): PermissionsUpdatedForChannelRole {
//   let permissionsUpdatedForChannelRoleEvent =
//     changetype<PermissionsUpdatedForChannelRole>(newMockEvent())

//   permissionsUpdatedForChannelRoleEvent.parameters = new Array()

//   permissionsUpdatedForChannelRoleEvent.parameters.push(
//     new ethereum.EventParam("updater", ethereum.Value.fromAddress(updater))
//   )
//   permissionsUpdatedForChannelRoleEvent.parameters.push(
//     new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
//   )
//   permissionsUpdatedForChannelRoleEvent.parameters.push(
//     new ethereum.EventParam(
//       "channelId",
//       ethereum.Value.fromFixedBytes(channelId)
//     )
//   )

//   return permissionsUpdatedForChannelRoleEvent
// }

// export function createPricingModuleAddedEvent(
//   module: Address
// ): PricingModuleAdded {
//   let pricingModuleAddedEvent = changetype<PricingModuleAdded>(newMockEvent())

//   pricingModuleAddedEvent.parameters = new Array()

//   pricingModuleAddedEvent.parameters.push(
//     new ethereum.EventParam("module", ethereum.Value.fromAddress(module))
//   )

//   return pricingModuleAddedEvent
// }

// export function createPricingModuleRemovedEvent(
//   module: Address
// ): PricingModuleRemoved {
//   let pricingModuleRemovedEvent =
//     changetype<PricingModuleRemoved>(newMockEvent())

//   pricingModuleRemovedEvent.parameters = new Array()

//   pricingModuleRemovedEvent.parameters.push(
//     new ethereum.EventParam("module", ethereum.Value.fromAddress(module))
//   )

//   return pricingModuleRemovedEvent
// }

// export function createPricingModuleUpdatedEvent(
//   module: Address
// ): PricingModuleUpdated {
//   let pricingModuleUpdatedEvent =
//     changetype<PricingModuleUpdated>(newMockEvent())

//   pricingModuleUpdatedEvent.parameters = new Array()

//   pricingModuleUpdatedEvent.parameters.push(
//     new ethereum.EventParam("module", ethereum.Value.fromAddress(module))
//   )

//   return pricingModuleUpdatedEvent
// }

// export function createRoleCreatedEvent(
//   creator: Address,
//   roleId: BigInt
// ): RoleCreated {
//   let roleCreatedEvent = changetype<RoleCreated>(newMockEvent())

//   roleCreatedEvent.parameters = new Array()

//   roleCreatedEvent.parameters.push(
//     new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
//   )
//   roleCreatedEvent.parameters.push(
//     new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
//   )

//   return roleCreatedEvent
// }

// export function createRoleRemovedEvent(
//   remover: Address,
//   roleId: BigInt
// ): RoleRemoved {
//   let roleRemovedEvent = changetype<RoleRemoved>(newMockEvent())

//   roleRemovedEvent.parameters = new Array()

//   roleRemovedEvent.parameters.push(
//     new ethereum.EventParam("remover", ethereum.Value.fromAddress(remover))
//   )
//   roleRemovedEvent.parameters.push(
//     new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
//   )

//   return roleRemovedEvent
// }

// export function createRoleUpdatedEvent(
//   updater: Address,
//   roleId: BigInt
// ): RoleUpdated {
//   let roleUpdatedEvent = changetype<RoleUpdated>(newMockEvent())

//   roleUpdatedEvent.parameters = new Array()

//   roleUpdatedEvent.parameters.push(
//     new ethereum.EventParam("updater", ethereum.Value.fromAddress(updater))
//   )
//   roleUpdatedEvent.parameters.push(
//     new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
//   )

//   return roleUpdatedEvent
// }

// export function createSpaceCreatedEvent(
//   owner: Address,
//   tokenId: BigInt,
//   space: Address
// ): SpaceCreated {
//   let spaceCreatedEvent = changetype<SpaceCreated>(newMockEvent())

//   spaceCreatedEvent.parameters = new Array()

//   spaceCreatedEvent.parameters.push(
//     new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
//   )
//   spaceCreatedEvent.parameters.push(
//     new ethereum.EventParam(
//       "tokenId",
//       ethereum.Value.fromUnsignedBigInt(tokenId)
//     )
//   )
//   spaceCreatedEvent.parameters.push(
//     new ethereum.EventParam("space", ethereum.Value.fromAddress(space))
//   )

//   return spaceCreatedEvent
// }

// export function createUnpausedEvent(account: Address): Unpaused {
//   let unpausedEvent = changetype<Unpaused>(newMockEvent())

//   unpausedEvent.parameters = new Array()

//   unpausedEvent.parameters.push(
//     new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
//   )

//   return unpausedEvent
// }
