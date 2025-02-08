import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Architect__ProxyInitializerSet } from "../generated/schema"
import { Architect__ProxyInitializerSet as Architect__ProxyInitializerSetEvent } from "../generated/Architect/Architect"
import { handleArchitect__ProxyInitializerSet } from "../src/architect"
import { createArchitect__ProxyInitializerSetEvent } from "./architect-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let proxyInitializer = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newArchitect__ProxyInitializerSetEvent =
      createArchitect__ProxyInitializerSetEvent(proxyInitializer)
    handleArchitect__ProxyInitializerSet(newArchitect__ProxyInitializerSetEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Architect__ProxyInitializerSet created and stored", () => {
    assert.entityCount("Architect__ProxyInitializerSet", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "Architect__ProxyInitializerSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "proxyInitializer",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
